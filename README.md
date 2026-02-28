# PrivyGate
### Privacy-by-Design AI Infrastructure for Europe

PrivyGate is a GDPR-first AI privacy gateway that enables European organizations to safely adopt LLM workflows.

It detects and pseudonymizes personal data before sending content to Mistral models, enforces structured outputs, and generates audit-ready compliance logs — ensuring AI innovation without compromising data protection.

---

## Why PrivyGate?

European teams face a major blocker when adopting AI:

> "How can we use LLMs without exposing personal data or violating GDPR principles?"

PrivyGate acts as a secure privacy layer between sensitive data and AI systems.

It enforces:
- Data minimization
- Pseudonymization
- Auditability
- Controlled reinjection
- Compliance documentation support

---

## Core Capabilities

### PII Detection
Detects personal data such as:
- Names
- Emails
- Phone numbers
- Addresses
- IBANs
- Identifiers

Combines rule-based detection with optional LLM-assisted classification.

---

### Reversible Pseudonymization
Replaces sensitive values with tokens (e.g., `PERSON_1`, `EMAIL_1`) before LLM processing.

Original values are stored securely in an encrypted vault and never exposed unless explicitly allowed.

---

### Safe LLM Processing
Processes only redacted data using Mistral models:
- Structured JSON outputs (schema enforced)
- Summarization
- Classification
- Action extraction
- DPIA draft generation

---

### PDF & Document Support
- PDF ingestion
- OCR via Mistral
- Structured extraction
- PII detection on extracted content

---

### Audit & Compliance Support
Generates:
- Processing logs
- RoPA-ready exports
- DPIA draft scaffolds
- Risk classification summaries

---

### API-First Design
PrivyGate exposes endpoints for integration:

- `POST /api/redact`
- `POST /api/process`
- `POST /api/reveal`
- `GET /api/audit/:jobId`
- `GET /api/export/ropa`

Designed for ERP, CRM, helpdesk, and internal tooling integration.

---

## Architecture Overview

1. Input (text or PDF)
2. OCR (if applicable)
3. PII detection
4. Reversible pseudonymization
5. LLM processing on redacted content
6. Optional controlled reinjection
7. Audit log generation
8. Compliance export

This architecture ensures sensitive data is never unnecessarily exposed.

---

## Tech Stack

- **Next.js 16+** (App Router)
- **TypeScript**
- **Tailwind CSS + shadcn/ui**
- **Prisma ORM**
- **MySQL**
- **Zod validation**
- **Mistral SDK**
- **Docker-ready**

---

## Powered By Mistral

PrivyGate leverages:

- Mistral Large (structured outputs)
- Ministral (classification tasks)
- Mistral OCR (PDF ingestion)
- JSON Schema enforced responses
- Mistral Vibe for agentic development

---

## Privacy Principles

PrivyGate is built around:

- Data minimization
- Purpose limitation
- Controlled processing
- Encryption at rest
- Configurable retention policies
- Zero-retention mode (optional)

This project does not replace legal advice but supports operational compliance workflows.

---

## Project Structure

```bash
apps/
  web/

packages/
  core/
  privacy-engine/
  audit/

prisma/
docs/
```


## Environment Variables

Create a .env file:

DATABASE_URL=
MISTRAL_API_KEY=
ENCRYPTION_SECRET=

## Local Development

Install dependencies:
npm install

Run development server:
npm run dev

Run Prisma migrations:
npx prisma migrate dev

## Roadmap

- [ ] Core PII detection engine
- [ ] Pseudonymization vault
- [ ] Structured output enforcement
- [ ] PDF OCR integration
- [ ] Audit logging system
- [ ] RoPA export
- [ ] DPIA draft generator
- [ ] Role-based access control
- [ ] Deployment configuration


## Hackathon Goal

PrivyGate aims to demonstrate that AI adoption in Europe can be:

- Secure
- Transparent
- Auditable
- Compliant-by-design
- Technically elegant


## License

MIT License

Built with love