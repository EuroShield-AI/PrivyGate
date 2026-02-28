import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { PIIDetector, PseudonymizationVault } from "@/lib/privacy-engine";
import { encrypt } from "@/lib/encryption";
import { AuditLogger } from "@/lib/audit";

const redactFileSchema = z.object({
  fileId: z.string().uuid(),
  retentionMode: z.enum(["standard", "zero"]).default("standard"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId, retentionMode } = redactFileSchema.parse(body);

    if (!process.env.ENCRYPTION_SECRET) {
      return NextResponse.json(
        { error: "ENCRYPTION_SECRET not configured" },
        { status: 500 }
      );
    }

    // Get file
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (!file.extractedText) {
      return NextResponse.json(
        { error: "File has no extracted text" },
        { status: 400 }
      );
    }

    // Create job
    const job = await prisma.job.create({
      data: {
        type: "redaction",
        retentionMode,
        status: "processing",
        originalText: file.extractedText,
        fileId: file.id,
      },
    });

    // Detect PII
    const detector = new PIIDetector();
    const entities = detector.detect(file.extractedText);

    // Pseudonymize
    const vault = new PseudonymizationVault();
    const redactedText = vault.pseudonymize(file.extractedText, entities);

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
    await prisma.auditLog.create({
      data: {
        jobId: job.id,
        eventType: "REDACTION_COMPLETED",
        timestamp: new Date(),
        metadata: JSON.stringify({
          entityTypes: entities.map((e) => e.type),
          entityCount: entities.length,
          fileId: file.id,
          filename: file.originalName,
        }),
      },
    });

    // Update job status
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
      fileInfo: {
        filename: file.originalName,
        wordCount: file.extractedText.split(/\s+/).length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }

    console.error("File redaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
