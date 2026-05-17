# Roots

**Where family stories become community memory.**

Voice-first community archive. Record a story in any language; an AWS-powered pipeline transcribes, translates, and indexes it; anyone can then ask the archive plain-language questions and get answers in the storytellers' own words.

Built in 24 hours for the AWS hackathon. Track: **Cloud for Good**.

## Team

- Ashwari Shende
- [Partner name]

## What we built

- **Browser recording** — capture audio in any language, any device with a mic
- **Automatic pipeline** — AssemblyAI transcription → Claude translation → metadata extraction → DynamoDB → Bedrock Knowledge Base
- **RAG chatbot** — ask the archive a question, get an answer with citations linking back to source stories

End-to-end latency from recording to chatbot-queryable: ~30–60 seconds.

## What we did not build

- Cognito auth (currently using scoped IAM keys via env vars — works for demo, not production-safe)
- DynamoDB Streams for fully event-driven indexing
- Map view, timeline view, privacy tiers, legacy profiles

## AWS services

8 services: Lambda, API Gateway, S3, DynamoDB, Bedrock (Claude Sonnet 4.6, Claude Haiku 4.5, Titan Embeddings v2), Bedrock Knowledge Base, OpenSearch Serverless, CloudWatch. Plus AssemblyAI (external) for transcription.

## Architecture

**Ingestion:** Audio → S3 → 4-Lambda chain (transcribe → translate → extract metadata → write to DynamoDB + upload prose to S3 + trigger KB ingestion) → Bedrock KB indexes new story.

**Chatbot:** Question → API Gateway → Lambda → Bedrock `RetrieveAndGenerate` → returns answer + citations from the KB.

See `docs/architecture.png` for the diagram.

## Repo structure

- `src/` — React + Vite frontend (Landing, Archive, Record, Chatbot pages)
- `lambda/` — Source for the 6 deployed Lambda functions
- `chatbot/` — Standalone HTML test harness (early prototype, kept for reference)
- `scripts/` — One-off seed and bridge utilities

## Running locally

Needs Node 20+ and a `.env.local` at the repo root with these values (ask a team member for the demo credentials):

```
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=...
VITE_AWS_SECRET_ACCESS_KEY=...
VITE_S3_BUCKET=...
VITE_API_URL=...
VITE_CHATBOT_API_URL=...
```

Then:

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. AWS handles everything else.

## Pre-existing code

None. All code in this repo was written during the 24-hour event window.
