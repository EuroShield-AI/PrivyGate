import { mysqlTable, varchar, text, datetime, int, json, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// User table
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey().default('uuid()'),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('passwordHash', { length: 255 }),
  role: varchar('role', { length: 50 }).default('user'),
  emailVerified: datetime('emailVerified'),
  image: varchar('image', { length: 500 }),
  createdAt: datetime('createdAt').default('CURRENT_TIMESTAMP'),
});

// Account table (for NextAuth)
export const accounts = mysqlTable('accounts', {
  id: varchar('id', { length: 36 }).primaryKey().default('uuid()'),
  userId: varchar('userId', { length: 36 }).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: int('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
}, (table) => ({
  userIdIdx: index('userId_idx').on(table.userId),
  providerIdx: index('provider_idx').on(table.provider, table.providerAccountId),
}));

// Session table
export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 36 }).primaryKey().default('uuid()'),
  sessionToken: varchar('sessionToken', { length: 255 }).unique().notNull(),
  userId: varchar('userId', { length: 36 }).notNull(),
  expires: datetime('expires').notNull(),
}, (table) => ({
  userIdIdx: index('userId_idx').on(table.userId),
}));

// VerificationToken table
export const verificationTokens = mysqlTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  expires: datetime('expires').notNull(),
}, (table) => ({
  tokenIdx: index('token_idx').on(table.token),
  identifierTokenIdx: index('identifier_token_idx').on(table.identifier, table.token),
}));

// Job table
export const jobs = mysqlTable('jobs', {
  id: varchar('id', { length: 36 }).primaryKey().default('uuid()'),
  type: varchar('type', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('processing'),
  retentionMode: varchar('retentionMode', { length: 50 }).default('standard'),
  originalText: text('originalText'),
  redactedText: text('redactedText'),
  fileId: varchar('fileId', { length: 36 }),
  userId: varchar('userId', { length: 36 }),
  createdAt: datetime('createdAt').default('CURRENT_TIMESTAMP'),
}, (table) => ({
  fileIdIdx: index('fileId_idx').on(table.fileId),
  userIdIdx: index('userId_idx').on(table.userId),
}));

// DetectedEntity table
export const detectedEntities = mysqlTable('detected_entities', {
  id: varchar('id', { length: 36 }).primaryKey().default('uuid()'),
  jobId: varchar('jobId', { length: 36 }).notNull(),
  entityType: varchar('entityType', { length: 50 }).notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  originalEncrypted: text('originalEncrypted').notNull(),
  confidence: varchar('confidence', { length: 20 }),
  startIndex: int('startIndex'),
  endIndex: int('endIndex'),
}, (table) => ({
  jobIdIdx: index('jobId_idx').on(table.jobId),
}));

// AuditLog table
export const auditLogs = mysqlTable('audit_logs', {
  id: varchar('id', { length: 36 }).primaryKey().default('uuid()'),
  jobId: varchar('jobId', { length: 36 }),
  eventType: varchar('eventType', { length: 100 }).notNull(),
  metadata: text('metadata').notNull(),
  timestamp: datetime('timestamp').default('CURRENT_TIMESTAMP'),
}, (table) => ({
  jobIdIdx: index('jobId_idx').on(table.jobId),
  timestampIdx: index('timestamp_idx').on(table.timestamp),
}));

// File table
export const files = mysqlTable('files', {
  id: varchar('id', { length: 36 }).primaryKey().default('uuid()'),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('originalName', { length: 255 }).notNull(),
  mimeType: varchar('mimeType', { length: 100 }).notNull(),
  size: int('size').notNull(),
  filePath: varchar('filePath', { length: 500 }).notNull(),
  extractedText: text('extractedText'),
  chunkCount: int('chunkCount').default(0),
  useVectorDB: int('useVectorDB').default(0),
  createdAt: datetime('createdAt').default('CURRENT_TIMESTAMP'),
}, (table) => ({
  createdAtIdx: index('createdAt_idx').on(table.createdAt),
}));

// VectorChunk table
export const vectorChunks = mysqlTable('vector_chunks', {
  id: varchar('id', { length: 36 }).primaryKey().default('uuid()'),
  fileId: varchar('fileId', { length: 36 }).notNull(),
  chunkIndex: int('chunkIndex').notNull(),
  content: text('content').notNull(),
  vectorId: varchar('vectorId', { length: 255 }),
  metadata: json('metadata'),
  createdAt: datetime('createdAt').default('CURRENT_TIMESTAMP'),
}, (table) => ({
  fileIdIdx: index('fileId_idx').on(table.fileId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ many }) => ({
  detectedEntities: many(detectedEntities),
  auditLogs: many(auditLogs),
}));

export const detectedEntitiesRelations = relations(detectedEntities, ({ one }) => ({
  job: one(jobs, {
    fields: [detectedEntities.jobId],
    references: [jobs.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  job: one(jobs, {
    fields: [auditLogs.jobId],
    references: [jobs.id],
  }),
}));

export const filesRelations = relations(files, ({ many }) => ({
  vectorChunks: many(vectorChunks),
}));

export const vectorChunksRelations = relations(vectorChunks, ({ one }) => ({
  file: one(files, {
    fields: [vectorChunks.fileId],
    references: [files.id],
  }),
}));
