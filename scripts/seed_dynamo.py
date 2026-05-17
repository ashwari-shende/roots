#!/usr/bin/env python3
"""
seed_dynamo.py

Populate the empty `roots-stories` DynamoDB table with two realistic test
stories so we can prove the DynamoDB → S3 → Bedrock KB bridge end-to-end
before partner's recording pipeline writes real data.

Stories are different from the three seed `.txt` files already in S3 so we
can clearly see new content appear in the chatbot after running the sync.

Usage:
    python3 seed_dynamo.py
"""

import uuid
from datetime import datetime, timezone

import boto3

TABLE_NAME = "roots-stories"
REGION     = "us-east-1"

# Schema contract — share this with partner so their pipeline writes the
# same field names. Required: storyId, name, summary. Everything else
# optional but recommended.
STORIES = [
    {
        "storyId":      str(uuid.uuid4()),
        "name":         "Aisha Hassan",
        "year":         "1991",
        "location":     "Mogadishu, Somalia → Minneapolis, Minnesota",
        "theme":        "displacement, family, faith",
        "summary": (
            "Aisha was nine years old when the civil war reached her neighborhood "
            "in Mogadishu. Her family fled with three suitcases and the family "
            "Qur'an. After two years in a Kenyan refugee camp, they were resettled "
            "to Minneapolis. Her mother, who had been a schoolteacher in Somalia, "
            "took a job cleaning hotels and refused to let any of her four "
            "children skip a day of school. Aisha became a nurse. She still keeps "
            "that same Qur'an on her shelf."
        ),
        "previewQuote": "My mother said: 'They took our country, but they cannot take what is inside our heads.'",
        "transcript": (
            "I remember the sound before I remember anything else. The shelling "
            "started in the afternoon and my brother and I were on the roof "
            "watching the smoke. My mother came up and grabbed both of us by the "
            "wrist so hard it left marks. She didn't yell. She just said: pack. "
            "We had three suitcases. I packed a doll and my schoolbook. My mother "
            "packed the Qur'an my grandfather had given her, and rice, and her "
            "teaching certificate in a plastic bag.\n\n"
            "The road to Kenya took eight days. There were checkpoints. There "
            "were people on the road who had nothing — no shoes, no food. My "
            "father gave away half our rice on the second day and my mother "
            "didn't argue with him.\n\n"
            "In the camp we waited two years. I learned English from a Canadian "
            "woman who came on Saturdays with a chalkboard. When the UNHCR called "
            "my mother's name in the office, she cried for the first time since "
            "we left. We thought it was bad news. It was Minneapolis.\n\n"
            "It was so cold the first winter. My mother cleaned hotel rooms — "
            "she who had taught fifth grade for twelve years. She said to me, "
            "'They took our country, but they cannot take what is inside our "
            "heads. Read everything.' I read everything. I became a nurse. My "
            "daughter is in medical school now. The Qur'an from my grandfather "
            "is on my shelf. It has been on three continents."
        ),
        "language":   "en",
        "recordedAt": datetime.now(timezone.utc).isoformat(),
    },
    {
        "storyId":      str(uuid.uuid4()),
        "name":         "Giorgio Rinaldi",
        "year":         "1954",
        "location":     "Naples, Italy → Brooklyn, New York",
        "theme":        "immigration, food, brotherhood",
        "summary": (
            "Giorgio arrived in Brooklyn at age twelve with his older brother "
            "Salvatore and almost no English. Their father had come over two "
            "years earlier and saved up to bring them. Sal worked in a butcher "
            "shop after school; Giorgio sold ice from a wagon. They lived above "
            "a bakery on Henry Street and ate stale bread the baker gave them "
            "at closing. Years later, Giorgio opened a deli on the same block. "
            "He kept the bakery's recipe for taralli, which the old baker had "
            "written on the back of a paper bag."
        ),
        "previewQuote": "When you are twelve and you do not speak the language, you learn to read faces. I am still good at that.",
        "transcript": (
            "My father left for America in 1952. My mother had died the year "
            "before and there was nothing in Naples — no work, no food some "
            "weeks. He said he would send for us. Two years he saved. When the "
            "letter came with the tickets my brother Sal was fourteen and I was "
            "twelve.\n\n"
            "The ship was eleven days. Sal got sick and I gave him my orange. "
            "When we saw the Statue of Liberty everyone on deck stopped talking. "
            "I remember an old woman next to me crossed herself three times.\n\n"
            "Our father met us at the pier. He looked older than I remembered. "
            "He took us to a room above a bakery on Henry Street — one room, "
            "three beds, a hot plate. The baker downstairs was a man named "
            "Vincenzo from Bari. He gave us the bread that was too hard to sell. "
            "We ate it with oil and salt. To me it tasted like a feast.\n\n"
            "School was hard. When you are twelve and you do not speak the "
            "language, you learn to read faces. I am still good at that. The "
            "teacher was patient. The boys in the schoolyard were not. Sal would "
            "meet me after school and walk me home and nobody bothered me when "
            "Sal was there.\n\n"
            "Sal went into a butcher shop, I sold ice off a wagon. We gave our "
            "father every dollar. In 1968 I opened my deli on the same block. "
            "The baker Vincenzo had died by then but his daughter gave me his "
            "recipe for taralli. It was written on the back of a paper bag in "
            "pencil. I still have it. My grandson runs the deli now."
        ),
        "language":   "en",
        "recordedAt": datetime.now(timezone.utc).isoformat(),
    },
]


def main() -> None:
    dynamodb = boto3.resource("dynamodb", region_name=REGION)
    table = dynamodb.Table(TABLE_NAME)

    print(f"Seeding {len(STORIES)} stories into {TABLE_NAME} ({REGION})…\n")
    for story in STORIES:
        try:
            table.put_item(Item=story)
            print(f"  ✓ {story['name']:<20}  storyId={story['storyId']}")
        except Exception as e:
            print(f"  ✗ {story['name']:<20}  {e}")

    print("\nDone. Verify in DynamoDB console → roots-stories → Explore table items.")
    print("Next:  python3 sync_dynamo_to_s3.py --dry-run")


if __name__ == "__main__":
    main()
