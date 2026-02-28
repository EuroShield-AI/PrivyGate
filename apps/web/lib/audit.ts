import { z } from "zod";
import { db, auditLogs } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export const AuditEventSchema = z.object({
  jobId: z.string().uuid().nullable(),
  eventType: z.enum([
    "REDACTION_STARTED",
    "REDACTION_COMPLETED",
    "PROCESSING_STARTED",
    "PROCESSING_COMPLETED",
    "REVEAL_REQUESTED",
    "EXPORT_GENERATED",
    "FILE_UPLOADED",
  ]),
  metadata: z.record(z.unknown()).optional(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;

export interface AuditRecord {
  id: string;
  jobId: string;
  eventType: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export class AuditLogger {
  async log(jobId: string | null, eventType: string, metadata?: Record<string, unknown>): Promise<void> {
    await db.insert(auditLogs).values({
      id: uuidv4(),
      jobId: jobId || null,
      eventType,
      metadata: JSON.stringify(metadata || {}),
      timestamp: new Date(),
    });
  }

  createAuditRecord(event: AuditEvent): Omit<AuditRecord, "id"> {
    return {
      jobId: event.jobId,
      eventType: event.eventType,
      timestamp: new Date(),
      metadata: event.metadata || {},
    };
  }

  formatForRoPA(records: AuditRecord[]): string {
    const headers = [
      "Job ID",
      "Event Type",
      "Timestamp",
      "Entity Types",
      "Model Used",
      "Retention Mode",
    ];

    const rows = records.map((record) => {
      const metadata = record.metadata as Record<string, unknown>;
      return [
        record.jobId,
        record.eventType,
        record.timestamp.toISOString(),
        (metadata.entityTypes as string[])?.join(", ") || "",
        (metadata.modelUsed as string) || "",
        (metadata.retentionMode as string) || "",
      ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`);
    });

    return [headers.map((h) => `"${h}"`), ...rows]
      .map((row) => row.join(","))
      .join("\n");
  }
}
