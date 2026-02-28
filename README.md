# PrivyGate
### Privacy-by-Design AI Infrastructure for Europe

PrivyGate is a GDPR-first AI privacy gateway that enables European organizations to safely adopt LLM workflows.

It detects and pseudonymizes personal data before sending content to Mistral AI models, enforces structured outputs, and generates audit-ready compliance logs — ensuring AI innovation without compromising data protection.

---

## Why PrivyGate?

European teams face a major blocker when adopting AI:

> "How can we use LLMs without exposing personal data or violating GDPR principles?"

PrivyGate acts as a secure privacy layer between sensitive data and AI systems.

It enforces:
- **Data minimization** - Only necessary data is processed
- **Reversible pseudonymization** - Personal data is tokenized before AI processing
- **Full auditability** - Complete audit trails for compliance
- **Controlled reinjection** - Selective reveal of original values
- **Compliance documentation** - RoPA exports and DPIA support

---

## Core Capabilities

### 🔍 PII Detection
Detects personal data using:
- **Rule-based detection** - Regex patterns for emails, phones, IBANs, addresses
- **AI-powered detection** - Optional Mistral AI for enhanced accuracy
- **Multiple entity types**: Names, Emails, Phone numbers, Addresses, IBANs, Identifiers

### 🔐 Reversible Pseudonymization
- Replaces sensitive values with tokens (e.g., `EMAIL_1`, `PHONE_2`)
- Original values stored in encrypted vault
- Never exposed unless explicitly allowed
- AES-256-GCM encryption at rest

### 🤖 Safe LLM Processing
Processes only redacted data using Mistral AI:
- **Text summarization** - Generate concise summaries
- **Classification** - Categorize content with sentiment analysis
- **Action extraction** - Extract actionable items
- **Structured JSON outputs** - Schema-enforced responses
- **Model selection** - Choose from 12+ Mistral models

### 📄 PDF & Document Support
- PDF text extraction via `pdf2json`
- DOCX parsing via `mammoth`
- Automatic chunking for large files (>10k words)
- Vector database integration (ChromaDB) for semantic search
- PII detection on extracted content

### 🌐 GDPR Website Analyzer
- Automated website scanning for GDPR compliance
- Cookie detection and consent mechanism analysis
- Privacy policy verification
- AI-powered compliance scoring
- Real-time status updates during scanning

### 📊 Audit & Compliance Support
- Complete audit trails for all operations
- RoPA-ready CSV exports
- Processing logs with token usage tracking
- User-specific API key management
- Encrypted storage of sensitive credentials

### 🔌 API-First Design
RESTful API with OpenAPI/Swagger documentation:
- `POST /api/redact` - Detect and redact PII
- `POST /api/process` - Process redacted text with AI
- `POST /api/reveal` - Selectively reveal original values
- `GET /api/audit/:jobId` - Retrieve audit logs
- `GET /api/export/ropa` - Export RoPA-compatible CSV
- `POST /api/upload` - Upload and extract text from files
- `POST /api/gdpr/analyze` - Analyze website for GDPR compliance

Designed for ERP, CRM, helpdesk, and internal tooling integration.

---

## Architecture Overview

```
Input (text/PDF/DOCX)
  ↓
Text Extraction (if file)
  ↓
PII Detection (Regex + Optional AI)
  ↓
Reversible Pseudonymization
  ↓
LLM Processing (Mistral AI - user-selected model)
  ↓
Optional Controlled Reinjection
  ↓
Audit Log Generation
  ↓
Compliance Export (RoPA, DPIA)
```

This architecture ensures sensitive data is never unnecessarily exposed to AI systems.

---

## Tech Stack

### Frontend
- **Next.js 16+** (MIT) - App Router with React Server Components
- **React 19** (MIT) - UI library
- **TypeScript** (Apache 2.0) - Type safety
- **Tailwind CSS 4** (MIT) - Utility-first styling
- **shadcn/ui** (MIT) - Accessible UI components
- **React Markdown** (MIT) - Markdown rendering

### Backend
- **Drizzle ORM** (Apache 2.0) - TypeScript ORM (replaced Prisma)
- **MySQL 8.0+** - Database
- **Zod** (MIT) - Schema validation
- **jsonwebtoken** (MIT) - JWT authentication
- **bcryptjs** (MIT) - Password hashing

### AI & Processing
- **Mistral AI SDK** (Apache 2.0) - LLM integration
- **ChromaDB** (Apache 2.0) - Vector database
- **Puppeteer** (Apache 2.0) - Web scraping for GDPR analysis
- **pdf2json** (MIT) - PDF parsing
- **mammoth** (Apache 2.0) - DOCX parsing
- **cheerio** (MIT) - HTML parsing

### Infrastructure
- **Docker** - Containerization
- **Upstash Redis** (Apache 2.0) - Rate limiting (optional)
- **Nodemailer** (MIT) - Email OTP delivery

### All Dependencies are Open Source
All dependencies use permissive licenses (MIT, Apache 2.0, BSD). See [DEPENDENCIES.md](./DEPENDENCIES.md) for full license verification.

---

## Features

### User Management
- Email-based OTP authentication
- User profiles with display names
- Role-based access control (user/admin)
- Secure session management with JWT

### Model Selection
Choose from 12+ Mistral AI models:
- **Mistral Large 3** (`mistral-large-2512`) - Default, best quality
- **Mistral Medium 3.1** (`mistral-medium-3101`)
- **Mistral Small 3.2** (`mistral-small-3201`)
- **Ministral 3** (14B, 8B, 3B variants)
- **Magistral** (Medium, Small) - Reasoning models
- **Devstral 2** - Code agents
- **Codestral** - Code completion
- **Pixtral Large** - Multimodal (image + text)
- Legacy models for backward compatibility

### Security
- AES-256-GCM encryption for sensitive data
- User-specific encrypted API keys
- Secure password hashing (bcrypt)
- JWT-based authentication
- Rate limiting (configurable)
- Input validation with Zod schemas

### UI/UX
- Modern, flat design with Material-inspired components
- Responsive layout with collapsible sidebar
- Drag & drop file uploads
- Real-time notifications
- API usage examples in modal dialogs
- Swagger UI for API documentation
- Markdown rendering for AI results
- Custom scrollbars for long content

---

## Project Structure

```
PrivyGate/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/                # App Router pages
│       │   ├── api/            # API routes
│       │   ├── dashboard/     # Dashboard pages
│       │   └── home/           # Homepage
│       ├── components/        # React components
│       ├── db/                 # Drizzle ORM schema
│       ├── lib/                # Core libraries
│       │   ├── privacy-engine.ts
│       │   ├── encryption.ts
│       │   ├── audit.ts
│       │   ├── ai-detector.ts
│       │   └── ...
│       ├── __tests__/          # Test files
│       └── scripts/            # Utility scripts
├── packages/                   # Shared packages (future)
├── docker-compose.yml          # Docker setup
├── Dockerfile                  # Production build
└── README.md                   # This file
```

---

## Environment Variables

Create `apps/web/.env`:

```bash
# Database connection
DATABASE_URL="mysql://user:password@host:port/database"

# Mistral AI (user-provided keys stored encrypted in DB)
# Optional: Can be set per-user in Settings
MISTRAL_API_KEY=""

# Encryption secret (32+ characters, NEVER change after data is encrypted)
ENCRYPTION_SECRET="generate-with-openssl-rand-base64-32"

# NextAuth configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Email configuration (for OTP)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user@example.com"
SMTP_PASSWORD="password"
SMTP_FROM="noreply@privygate.com"

# Optional: Upstash Redis for rate limiting
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Optional: ChromaDB URL
CHROMA_URL="http://localhost:8000"
```

**Security Notes:**
- Generate `ENCRYPTION_SECRET` with: `openssl rand -base64 32`
- Generate `NEXTAUTH_SECRET` with: `openssl rand -base64 32`
- **Never change `ENCRYPTION_SECRET` after data is encrypted!**
- User Mistral API keys are stored encrypted in the database

---

## Local Development

### Prerequisites

- **Node.js 20+**
- **MySQL 8.0+**
- **Mistral API key** (get from [Mistral Console](https://console.mistral.ai/))

### Setup

1. **Clone and install:**
```bash
git clone <repository-url>
cd PrivyGate
npm install
```

2. **Set up environment variables:**
```bash
cd apps/web
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up database:**
```bash
# Run migration script to add selectedModel column
node scripts/add-selected-model.js

# Or use Drizzle Kit
npm run db:push
```

4. **Start development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Testing

Run tests:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

Test coverage includes:
- PII detection (email, phone, IBAN, names)
- Pseudonymization vault
- Encryption/decryption
- Critical API endpoints

---

## Docker Setup

Use Docker Compose for complete setup:

```bash
docker-compose up -d
```

This starts:
- **MySQL 8.0** - Database
- **ChromaDB** - Vector database
- **PrivyGate App** - Next.js application

Make sure to set required environment variables in `.env`:
- `MISTRAL_API_KEY` (optional - can be set per-user)
- `ENCRYPTION_SECRET`
- `NEXTAUTH_SECRET`
- `SMTP_*` (for email OTP)

---

## Production Deployment

### Build

```bash
npm run build
```

### Start

```bash
npm start
```

### Environment Checklist

- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Use strong `ENCRYPTION_SECRET` (never change after first use)
- [ ] Configure production database with SSL
- [ ] Set up SMTP for email delivery
- [ ] Configure rate limiting (Upstash Redis recommended)
- [ ] Enable HTTPS/TLS
- [ ] Set secure CORS policies
- [ ] Configure backup strategy
- [ ] Set up monitoring and health checks

### Health Checks

- **Health endpoint**: `GET /api/health`
- **API documentation**: `/api/swagger`
- **Database**: Automatic connection pooling
- **Vector DB**: ChromaDB health check

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide.

---

## API Documentation

Interactive API documentation available at:
- **Swagger UI**: `/api/swagger`
- **OpenAPI JSON**: `/api/docs`

All endpoints require Bearer token authentication (JWT).

---

## Enterprise Features

- ✅ **Rate Limiting** - Configurable API rate limits
- ✅ **Authentication** - JWT-based with OTP login
- ✅ **Vector Database** - ChromaDB for large file processing
- ✅ **Health Checks** - `/api/health` endpoint
- ✅ **Structured Logging** - JSON-formatted logs
- ✅ **File Processing** - Automatic chunking for large files
- ✅ **Compliance** - Full audit trails and RoPA exports
- ✅ **User Management** - Profiles, roles, API key management
- ✅ **Model Selection** - 12+ Mistral models available
- ✅ **GDPR Analyzer** - Automated website compliance scanning

---

## Roadmap

- [x] Core PII detection engine
- [x] Pseudonymization vault
- [x] Structured output enforcement
- [x] Audit logging system
- [x] RoPA export
- [x] PDF/DOCX support
- [x] Vector database integration
- [x] GDPR website analyzer
- [x] User authentication & management
- [x] Model selection
- [ ] DPIA draft generator
- [ ] Enhanced role-based access control
- [ ] Batch processing API
- [ ] Webhook support

---

## License

**MIT License** - See [LICENSE](./LICENSE) file

All dependencies use permissive open-source licenses (MIT, Apache 2.0, BSD). See [DEPENDENCIES.md](./DEPENDENCIES.md) for full license verification.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

---

## Support

- **Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md) and [MISTRAL_USAGE.md](./MISTRAL_USAGE.md)
- **API Docs**: `/api/swagger`
- **Issues**: GitHub Issues

---

Built with ❤️ for European privacy compliance
