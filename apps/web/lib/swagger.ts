import swaggerJsdoc from "swagger-jsdoc";

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
        url: process.env.NEXTAUTH_URL || "https://api.privygate.com",
        description: "Production API server",
      },
    ],
    components: {
      securitySchemes: {
        OAuth2: {
          type: "oauth2",
          flows: {
            authorizationCode: {
              authorizationUrl: `${process.env.NEXTAUTH_URL || "https://api.privygate.com"}/api/auth/oauth/authorize`,
              tokenUrl: `${process.env.NEXTAUTH_URL || "https://api.privygate.com"}/api/auth/oauth/token`,
              scopes: {
                read: "Read access",
                write: "Write access",
                admin: "Admin access",
              },
            },
            clientCredentials: {
              tokenUrl: `${process.env.NEXTAUTH_URL || "https://api.privygate.com"}/api/auth/oauth/token`,
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
