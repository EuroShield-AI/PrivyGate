import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { PIIDetector, PseudonymizationVault } from "@/lib/privacy-engine";
import { encrypt } from "@/lib/encryption";
import { AuditLogger } from "@/lib/audit";

const redactSchema = z.object({
  text: z.string().min(1),
  retentionMode: z.enum(["standard", "zero"]).default("standard"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, retentionMode } = redactSchema.parse(body);

    if (!process.env.ENCRYPTION_SECRET) {
      return NextResponse.json(
        { error: "ENCRYPTION_SECRET not configured" },
        { status: 500 }
      );
    }

    // Create job
    const job = await prisma.job.create({
      data: {
        type: "redaction",
        retentionMode,
        status: "processing",
        originalText: text,
      },
    });

    // Detect PII
    const detector = new PIIDetector();
    const entities = detector.detect(text);

    // Pseudonymize
    const vault = new PseudonymizationVault();
    const redactedText = vault.pseudonymize(text, entities);

    // Store entities in database
    const encryptionSecret = process.env.ENCRYPTION_SECRET;
    for (const entity of entities) {
      const token = vault.getToken(entity.value);
      if (token) {
        await prisma.detectedEntity.create({
          data: {
            jobId: job.id,
            entityType: entity.type,
            token,
            originalEncrypted: encrypt(entity.value, encryptionSecret),
            confidence: entity.confidence,
            startIndex: entity.startIndex,
            endIndex: entity.endIndex,
          },
        });
      }
    }

    // Create audit log
    const auditLogger = new AuditLogger();
    const auditRecord = auditLogger.createAuditRecord({
      jobId: job.id,
      eventType: "REDACTION_COMPLETED",
      metadata: {
        entityTypes: entities.map((e) => e.type),
        entityCount: entities.length,
      },
    });

    await prisma.auditLog.create({
      data: {
        jobId: auditRecord.jobId,
        eventType: auditRecord.eventType,
        timestamp: auditRecord.timestamp,
        metadata: JSON.stringify(auditRecord.metadata),
      },
    });

    // Update job status with redacted text
    await prisma.job.update({
      where: { id: job.id },
      data: { 
        status: "completed",
        redactedText,
      },
    });

    return NextResponse.json({
      jobId: job.id,
      redactedText,
      entities: entities.map((e) => ({
        type: e.type,
        token: vault.getToken(e.value),
        confidence: e.confidence,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Redaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
