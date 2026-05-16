# Roots
*Where family stories become community memory*

---

## The Problem
Elders die with stories no one recorded. Neighborhoods change and forget what they were. Local history disappears because the everyday people who lived it left nothing behind.

## What It Does
Roots is a voice-first platform where families record personal stories that become a searchable, shared community archive — powered by Amazon Bedrock.

Record a voice memo. Bedrock transcribes, translates, and extracts the people, places, and moments inside it. Ask the archive a question. Hear the answer in the words of the people who lived it.

---

## AWS Services

| Service | Purpose |
|---|---|
| **Amazon Bedrock** | Story extraction, RAG chatbot, guided recording agent, guardrails |
| **AWS Lambda** | Serverless processing pipeline |
| **API Gateway** | Frontend ↔ backend |
| **Amazon S3** | Audio, photo, document storage |
| **Amazon Transcribe** | Voice → text |
| **Amazon Translate** | Multilingual support |
| **Amazon DynamoDB** | Story metadata and privacy settings |
| **Amazon OpenSearch** | Vector store for Bedrock Knowledge Base |

---

## Architecture
Upload → API Gateway → Lambda → Transcribe → Translate
↓
Bedrock (Claude + Titan)
↓
DynamoDB + OpenSearch (RAG)
↓
Community Chatbot

---

## Privacy
Every story defaults to **Private**. Contributors choose: `Private → Family → Community`. Bedrock Guardrails enforce access at every layer.

---

## Why We Built This
Built with gratitude — for grandmothers whose stories are still living in them, and neighborhoods that remember what they were.
