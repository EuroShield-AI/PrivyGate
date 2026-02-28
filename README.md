# 🛡️ PrivyGate

<div align="center">

**Privacy-by-Design AI Infrastructure for Europe**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-green)](./DEPENDENCIES.md)
[![Mistral Hackathon](https://img.shields.io/badge/Mistral%20Hackathon-2026-blue)](https://worldwide-hackathon.mistral.ai/)

*Safely adopt LLM workflows without exposing personal data or violating GDPR principles*

[Features](#-core-capabilities) • [Quick Start](#-local-development) • [Documentation](#-documentation) • [API Docs](#-api-documentation)

</div>

---

## 🏆 Built for Mistral Worldwide Hackathon

This application was built as part of the **[Mistral Worldwide Hackathon](https://worldwide-hackathon.mistral.ai/)** (February 28th - March 1st, 2026), demonstrating privacy-by-design AI infrastructure for European organizations.

**Development Approach:**
- Built using **vibe coding** methodology
- Developed with **Mistral Vibe** for AI-assisted development
- Showcases Mistral AI's capabilities in privacy-preserving applications

The hackathon brought together 1000+ hackers across 7 locations (Paris, London, NYC, SF, Tokyo, Singapore, Sydney, and Online) to build innovative applications using Mistral AI.

---

## 🎯 Why PrivyGate?

European teams face a major blocker when adopting AI:

> **"How can we use LLMs without exposing personal data or violating GDPR principles?"**

PrivyGate acts as a **secure privacy layer** between sensitive data and AI systems, enabling safe AI adoption while maintaining full GDPR compliance.

### Core Principles

- 🔒 **Data Minimization** - Only necessary data is processed
- 🔐 **Reversible Pseudonymization** - Personal data is tokenized before AI processing
- 📋 **Full Auditability** - Complete audit trails for compliance
- 🎛️ **Controlled Reinjection** - Selective reveal of original values
- 📄 **Compliance Documentation** - RoPA exports and DPIA support

---

## ✨ Core Capabilities

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

### 📄 File Processing
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

## 🏗️ Architecture Overview

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

This architecture ensures sensitive data is **never unnecessarily exposed** to AI systems.

---

## 📸 Screenshots

<div align="center">

### Homepage
![Homepage](./docs/screenshots/dashboard.png)
*Homepage with login options and feature overview*

### Text Processing
![Text Processing](./docs/screenshots/text-processing.png)
*PII detection and AI processing interface*

### File Processing
![File Processing](./docs/screenshots/file-processing.png)
*Document upload and processing workflow*

### GDPR Analyzer
![GDPR Analyzer](./docs/screenshots/gdpr-analyzer.png)
*Website compliance analysis tool*

### Settings
![Settings](./docs/screenshots/settings.png)
*User settings and API key management*

</div>

> **Note:** Screenshots should be added to `docs/screenshots/` directory. See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 16+** (MIT) - App Router with React Server Components
- **React 19** (MIT) - UI library
- **TypeScript** (Apache 2.0) - Type safety
- **Tailwind CSS 4** (MIT) - Utility-first styling
- **shadcn/ui** (MIT) - Accessible UI components
- **React Markdown** (MIT) - Markdown rendering

### Backend
- **Drizzle ORM** (Apache 2.0) - TypeScript ORM
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

> **All Dependencies are Open Source** - All dependencies use permissive licenses (MIT, Apache 2.0, BSD). See [DEPENDENCIES.md](./DEPENDENCIES.md) for full license verification.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+**
- **MySQL 8.0+**
- **Mistral API key** (get from [Mistral Console](https://console.mistral.ai/))

### Installation

1. **Clone the repository:**
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
# Run migration script
node scripts/add-selected-model.js

# Or use Drizzle Kit
npm run db:push
```

4. **Start development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Docker Setup

Use Docker Compose for complete setup:

```bash
docker-compose up -d
```

This starts:
- **MySQL 8.0** - Database
- **ChromaDB** - Vector database
- **PrivyGate App** - Next.js application

---

## ⚙️ Environment Variables

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

## 🧪 Testing

Run tests:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

Test coverage includes:
- ✅ PII detection (email, phone, IBAN, names)
- ✅ Pseudonymization vault
- ✅ Encryption/decryption
- ✅ Critical API endpoints

---

## 📦 Production Deployment

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

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Detailed deployment guide
- **[DEPENDENCIES.md](./DEPENDENCIES.md)** - Open-source license verification
- **[PRODUCTION.md](./PRODUCTION.md)** - Production readiness checklist
- **[MISTRAL_USAGE.md](./MISTRAL_USAGE.md)** - Mistral AI usage and models

---

## 🔌 API Documentation

Interactive API documentation available at:
- **Swagger UI**: `/api/swagger`
- **OpenAPI JSON**: `/api/docs`

All endpoints require Bearer token authentication (JWT).

---

## 🎯 Features

### User Management
- ✅ Email-based OTP authentication
- ✅ User profiles with display names
- ✅ Role-based access control (user/admin)
- ✅ Secure session management with JWT

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
- ✅ AES-256-GCM encryption for sensitive data
- ✅ User-specific encrypted API keys
- ✅ Secure password hashing (bcrypt)
- ✅ JWT-based authentication
- ✅ Rate limiting (configurable)
- ✅ Input validation with Zod schemas

### UI/UX
- ✅ Modern, flat design with dark theme
- ✅ Responsive layout with collapsible sidebar
- ✅ Drag & drop file uploads
- ✅ Real-time notifications
- ✅ API usage examples in modal dialogs
- ✅ Swagger UI for API documentation
- ✅ Markdown rendering for AI results
- ✅ Custom scrollbars for long content

---

## 🗺️ Roadmap

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

## 📄 License

**MIT License** - See [LICENSE](./LICENSE) file

All dependencies use permissive open-source licenses (MIT, Apache 2.0, BSD). See [DEPENDENCIES.md](./DEPENDENCIES.md) for full license verification.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

---

## 📞 Support

- **Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md) and [MISTRAL_USAGE.md](./MISTRAL_USAGE.md)
- **API Docs**: `/api/swagger`
- **Issues**: GitHub/GitLab Issues

---

<div align="center">

**Built with ❤️ for European privacy compliance**

**🏆 Mistral Worldwide Hackathon 2026 Entry**

Built using [Mistral Vibe](https://worldwide-hackathon.mistral.ai/) for AI-assisted development

[⬆ Back to Top](#-privygate)

</div>
