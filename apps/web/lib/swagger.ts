import swaggerJsdoc from "swagger-jsdoc";

// Get base URL from environment or use localhost fallback
const getBaseUrl = () => {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

const baseUrl = getBaseUrl();

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PrivyGate API",
      version: "1.0.0",
      description: "Privacy Gateway API for GDPR-compliant data processing",
      contact: {
        name: "PrivyGate Support",
        email: "support@privygate.com",
      },
    },
    servers: [
      {
        url: baseUrl,
        description: "API server",
      },
    ],
    components: {
      securitySchemes: {
        OAuth2: {
          type: "oauth2",
          flows: {
            authorizationCode: {
              authorizationUrl: `${baseUrl}/api/auth/oauth/authorize`,
              tokenUrl: `${baseUrl}/api/auth/oauth/token`,
              scopes: {
                read: "Read access",
                write: "Write access",
                admin: "Admin access",
              },
            },
            clientCredentials: {
              tokenUrl: `${baseUrl}/api/auth/oauth/token`,
              scopes: {
                read: "Read access",
                write: "Write access",
              },
            },
          },
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    tags: [
      { name: "Authentication", description: "Authentication endpoints" },
      { name: "Redaction", description: "PII detection and redaction" },
      { name: "Processing", description: "LLM processing endpoints" },
      { name: "Files", description: "File upload and processing" },
      { name: "Audit", description: "Audit log endpoints" },
      { name: "Compliance", description: "Compliance and export endpoints" },
      { name: "GDPR Analyzer", description: "Website GDPR compliance analysis" },
    ],
  },
  apis: [
    "./app/api/**/*.ts",
    "./app/api/**/route.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
