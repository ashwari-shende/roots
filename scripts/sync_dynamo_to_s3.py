#!/usr/bin/env python3
"""
sync_dynamo_to_s3.py

Reads story records from partner's DynamoDB table, formats each as a .txt file,
uploads them to the roots-stories-archive S3 bucket, then triggers a Bedrock
Knowledge Base ingestion job so the chatbot can find the new stories.

Usage:
    python3 sync_dynamo_to_s3.py             # full run
    python3 sync_dynamo_to_s3.py --dry-run   # preview output, no uploads
    python3 sync_dynamo_to_s3.py --no-sync   # upload but skip KB ingestion

Requires:
    pip install boto3
    AWS credentials configured (env vars, ~/.aws/credentials, or instance role)
"""

import argparse
import re
import sys
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError

# ────────────────────────────────────────────────────────────────────
# CONFIG — confirm these with partner before running
# ────────────────────────────────────────────────────────────────────
TABLE_NAME    = "roots-stories"
TABLE_REGION  = "us-east-1"

S3_BUCKET     = "roots-stories-archive"
S3_PREFIX     = ""                      # e.g. "stories/" if you want a subfolder

KB_ID         = "VBOYBDAIY7"
DATA_SOURCE_ID = "SLXRXVOU1Z"                     # TODO: fill in. Get it with:
                                        #   aws bedrock-agent list-data-sources \
                                        #     --knowledge-base-id VBOYBDAIY7

# Attribute names on each DynamoDB item — match partner's schema
ATTR_ID            = "storyId"
ATTR_NAME          = "name"
ATTR_YEAR          = "year"
ATTR_LOCATION      = "location"
ATTR_THEME         = "theme"
ATTR_SUMMARY       = "summary"
ATTR_PREVIEW_QUOTE = "previewQuote"
ATTR_TRANSCRIPT    = "transcript"       # set to None if partner only stores summary
# ────────────────────────────────────────────────────────────────────


def slugify(text: str) -> str:
    """Make a safe filename from a name."""
    text = (text or "story").lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "story"


def stringify(value) -> str:
    """DynamoDB Numbers come back as Decimal; coerce to clean strings."""
    if value is None:
        return ""
    if isinstance(value, Decimal):
        return str(int(value)) if value == value.to_integral_value() else str(value)
    return str(value).strip()


def format_story(item: dict) -> tuple[str, str]:
    """Return (s3_key, content) for a DynamoDB item, formatted as natural prose
    so RAG chunking produces readable, self-contained passages."""
    name     = stringify(item.get(ATTR_NAME)) or "Unknown"
    year     = stringify(item.get(ATTR_YEAR))
    location = stringify(item.get(ATTR_LOCATION))
    theme    = stringify(item.get(ATTR_THEME))
    summary  = stringify(item.get(ATTR_SUMMARY))
    quote    = stringify(item.get(ATTR_PREVIEW_QUOTE))
    transcript = stringify(item.get(ATTR_TRANSCRIPT)) if ATTR_TRANSCRIPT else ""

    lines: list[str] = []

    lead = f"This is the story of {name}"
    if year:
        lead += f", from {year}"
    if location:
        lead += f", set in {location}"
    lines.append(lead + ".")

    if theme:
        lines.append(f"Themes: {theme}.")

    if summary:
        lines.append("")
        lines.append(summary)

    if transcript and transcript != summary:
        lines.append("")
        lines.append("Full account:")
        lines.append(transcript)

    if quote:
        lines.append("")
        lines.append(f'A memorable moment: "{quote}"')

    content = "\n".join(lines) + "\n"
    key = f"{S3_PREFIX}{slugify(name)}.txt"
    return key, content


def scan_table(table) -> list[dict]:
    """Paginated scan — DynamoDB caps each response at 1 MB."""
    items, kwargs = [], {}
    while True:
        resp = table.scan(**kwargs)
        items.extend(resp.get("Items", []))
        if "LastEvaluatedKey" not in resp:
            return items
        kwargs["ExclusiveStartKey"] = resp["LastEvaluatedKey"]


def trigger_kb_ingestion(bedrock_agent) -> str:
    if not DATA_SOURCE_ID:
        print("⚠  DATA_SOURCE_ID is not set — skipping KB ingestion.")
        print(f"   Find it:  aws bedrock-agent list-data-sources --knowledge-base-id {KB_ID}")
        return ""
    resp = bedrock_agent.start_ingestion_job(
        knowledgeBaseId=KB_ID,
        dataSourceId=DATA_SOURCE_ID,
    )
    job_id = resp["ingestionJob"]["ingestionJobId"]
    print(f"✓  Started KB ingestion job: {job_id}")
    return job_id


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true",
                        help="preview output, no S3 uploads or KB sync")
    parser.add_argument("--no-sync", action="store_true",
                        help="upload to S3 but don't trigger KB ingestion")
    args = parser.parse_args()

    dynamodb      = boto3.resource("dynamodb", region_name=TABLE_REGION)
    s3            = boto3.client("s3")
    bedrock_agent = boto3.client("bedrock-agent", region_name="us-east-1")

    print(f"Scanning {TABLE_NAME} ({TABLE_REGION})…")
    try:
        items = scan_table(dynamodb.Table(TABLE_NAME))
    except ClientError as e:
        print(f"✗  DynamoDB error: {e}")
        sys.exit(1)
    print(f"   Found {len(items)} items.\n")

    if not items:
        print("Nothing to sync.")
        return

    uploaded = 0
    for item in items:
        try:
            key, content = format_story(item)
        except Exception as e:
            print(f"✗  Failed to format item {item.get(ATTR_ID, '?')}: {e}")
            continue

        print(f"  → {key}  ({len(content)} bytes)")

        if args.dry_run:
            print("    [dry-run] preview:")
            for line in content.splitlines()[:8]:
                print(f"    | {line}")
            if len(content.splitlines()) > 8:
                print("    | …")
            continue

        try:
            s3.put_object(
                Bucket=S3_BUCKET,
                Key=key,
                Body=content.encode("utf-8"),
                ContentType="text/plain; charset=utf-8",
            )
            uploaded += 1
        except ClientError as e:
            print(f"    ✗  S3 upload failed: {e}")

    if args.dry_run:
        print("\n[dry-run] no uploads, no sync. Done.")
        return

    print(f"\n✓  Uploaded {uploaded}/{len(items)} stories to s3://{S3_BUCKET}/")

    if args.no_sync:
        print("Skipping KB ingestion (--no-sync).")
        return

    trigger_kb_ingestion(bedrock_agent)
    if DATA_SOURCE_ID:
        print("\nIngestion runs async. Check status with:")
        print(f"  aws bedrock-agent list-ingestion-jobs \\")
        print(f"    --knowledge-base-id {KB_ID} \\")
        print(f"    --data-source-id {DATA_SOURCE_ID}")


if __name__ == "__main__":
    main()
