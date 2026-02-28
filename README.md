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

Create a `.env` file:

```bash
DATABASE_URL=
MISTRAL_API_KEY=
ENCRYPTION_SECRET=
```

## Local Development

### Prerequisites

- Node.js 20+
- MySQL 8.0+
- Mistral API key

### Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `apps/web/.env`:

Create the file `apps/web/.env` with the following content:

```bash
# Database connection string
# Format: mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
DATABASE_URL="mysql://root:yourpassword@localhost:3306/privygate"

# Mistral AI API key (get from https://console.mistral.ai/)
MISTRAL_API_KEY="your-mistral-api-key-here"

# Encryption secret (must be 32+ characters)
# Generate one with: openssl rand -base64 32
ENCRYPTION_SECRET="IxcXnMi6+8n68fuz7YmwLwovYemBW0iThvOiJyUKVbg="

# NextAuth configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

# Optional: Upstash Redis for rate limiting (production)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Optional: ChromaDB URL (defaults to http://localhost:8000)
CHROMA_URL="http://localhost:8000"
```

**Important Notes:**
- **DATABASE_URL**: Replace with your MySQL credentials. For Docker Compose, use `mysql://privygate:privygate@db:3306/privygate`
- **MISTRAL_API_KEY**: Get your API key from [Mistral Console](https://console.mistral.ai/)
- **ENCRYPTION_SECRET**: Use the generated value above, or generate a new one with `openssl rand -base64 32`. **Never change this after data is encrypted!**

3. Generate Prisma Client:
```bash
cd apps/web
npm run db:generate
```

4. Run database migrations:
```bash
npm run db:migrate
```

5. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Docker Setup

Alternatively, use Docker Compose for a complete setup with MySQL and ChromaDB:

```bash
docker-compose up -d
```

This will start:
- MySQL database
- ChromaDB vector database  
- PrivyGate application

Make sure to set required environment variables in your `.env` file:
- `MISTRAL_API_KEY`
- `ENCRYPTION_SECRET`
- `NEXTAUTH_SECRET` (generate with: `openssl rand -base64 32`)

### Enterprise Features

PrivyGate includes enterprise-ready features:

- **Rate Limiting**: API rate limiting with Upstash Redis (100 requests/hour default)
- **Authentication**: NextAuth.js with JWT sessions and user management
- **Vector Database**: ChromaDB for large file processing with automatic chunking
- **Health Checks**: `/api/health` endpoint for monitoring
- **Structured Logging**: JSON-formatted logs for production
- **File Processing**: Automatic chunking for files > 10k words
- **Compliance**: Full audit trails and RoPA exports

## Roadmap

- [x] Core PII detection engine
- [x] Pseudonymization vault
- [x] Structured output enforcement
- [x] Audit logging system
- [x] RoPA export
- [ ] PDF OCR integration
- [ ] DPIA draft generator
- [ ] Role-based access control
- [ ] Enhanced deployment configuration


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