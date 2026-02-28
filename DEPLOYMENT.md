# PrivyGate Deployment Guide

## Production Deployment

### Prerequisites

- Node.js 20+ or Docker
- MySQL 8.0+
- ChromaDB (optional, for large file processing)
- Upstash Redis (optional, for rate limiting)

### Environment Variables

Required variables for production:

```bash
# Database
DATABASE_URL="mysql://user:password@host:3306/privygate"

# Mistral AI
MISTRAL_API_KEY="your-mistral-api-key"

# Encryption (CRITICAL: Never change after data is encrypted)
ENCRYPTION_SECRET="your-32-character-secret"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-nextauth-secret"

# Optional: Rate Limiting
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# Optional: Vector Database
CHROMA_URL="http://chromadb:8000"
```

### Docker Deployment

1. Clone the repository:
```bash
git clone <repository-url>
cd PrivyGate
```

2. Create `.env` file with production values

3. Build and start:
```bash
docker-compose up -d
```

4. Run migrations:
```bash
docker-compose exec app npx prisma migrate deploy
```

### Manual Deployment

1. Install dependencies:
```bash
npm install
cd apps/web
npm install
```

2. Build the application:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

### Health Checks

Monitor application health:
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-28T...",
  "services": {
    "database": "connected",
    "vectorDb": "configured"
  }
}
```

### Scaling Considerations

- **Database**: Use connection pooling for MySQL
- **Vector DB**: ChromaDB can be scaled horizontally
- **File Storage**: Consider S3-compatible storage for uploads
- **Rate Limiting**: Use Upstash Redis for distributed rate limiting
- **Monitoring**: Integrate with monitoring services (Datadog, New Relic, etc.)

### Security Checklist

- [ ] Use strong `ENCRYPTION_SECRET` (32+ characters)
- [ ] Enable HTTPS/TLS
- [ ] Set secure `NEXTAUTH_SECRET`
- [ ] Configure CORS properly
- [ ] Use environment-specific database credentials
- [ ] Enable database SSL connections
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Enable audit logging
- [ ] Configure backup strategy

### Backup Strategy

1. **Database**: Regular MySQL backups
2. **Files**: Backup uploads directory
3. **Vector DB**: ChromaDB persistence volume
4. **Encryption Keys**: Secure backup of `ENCRYPTION_SECRET`

### Monitoring

- Health check endpoint: `/api/health`
- Application logs: JSON-structured logs
- Database metrics: Monitor connection pool
- API metrics: Track rate limit usage

### Troubleshooting

**Database connection issues:**
- Verify `DATABASE_URL` format
- Check network connectivity
- Verify database credentials

**Vector DB not working:**
- Check ChromaDB is running
- Verify `CHROMA_URL` is correct
- Check ChromaDB logs

**Rate limiting not working:**
- Verify Upstash Redis credentials
- Check Redis connectivity
- Falls back to in-memory if Redis unavailable
