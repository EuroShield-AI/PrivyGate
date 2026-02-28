# Dependencies & Open Source Compliance

## License Policy

All dependencies must use permissive open-source licenses (MIT, Apache 2.0, BSD). This project avoids GPL/AGPL dependencies to ensure commercial flexibility.

## Core Dependencies

### Frontend & UI
- **Next.js 16+** (MIT) - React framework
- **React 19** (MIT) - UI library
- **Tailwind CSS 4** (MIT) - Utility-first CSS
- **shadcn/ui** (MIT) - UI component library
- **lucide-react** (ISC) - Icon library
- **react-markdown** (MIT) - Markdown rendering
- **remark-gfm** (MIT) - GitHub Flavored Markdown

### Backend & API
- **Drizzle ORM** (Apache 2.0) - TypeScript ORM
- **mysql2** (MIT) - MySQL driver
- **Zod** (MIT) - Schema validation
- **jsonwebtoken** (MIT) - JWT handling
- **bcryptjs** (MIT) - Password hashing
- **nodemailer** (MIT) - Email sending

### AI & Processing
- **@mistralai/mistralai** (Apache 2.0) - Mistral AI SDK
- **chromadb** (Apache 2.0) - Vector database client
- **puppeteer** (Apache 2.0) - Web scraping
- **cheerio** (MIT) - HTML parsing
- **mammoth** (Apache 2.0) - DOCX parsing
- **pdf2json** (MIT) - PDF parsing

### Development Tools
- **TypeScript** (Apache 2.0) - Type safety
- **ESLint** (MIT) - Linting
- **Jest** (MIT) - Testing framework
- **@testing-library/react** (MIT) - React testing utilities

### Infrastructure
- **@upstash/ratelimit** (Apache 2.0) - Rate limiting
- **@upstash/redis** (MIT) - Redis client

## Removed Dependencies

- **Prisma** - Replaced with Drizzle ORM (Apache 2.0)
- **@auth/prisma-adapter** - No longer needed after Drizzle migration

## License Verification

All dependencies have been verified to use permissive licenses compatible with MIT License:
- MIT License: Most permissive, allows commercial use
- Apache 2.0: Permissive, requires attribution
- ISC: Equivalent to MIT
- BSD: Permissive, compatible

## Production Considerations

- All dependencies are actively maintained
- No known security vulnerabilities in core dependencies
- Regular updates recommended via `npm audit`
- Docker images use official base images
