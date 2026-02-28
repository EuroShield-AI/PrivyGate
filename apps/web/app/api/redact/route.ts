import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, jobs, detectedEntities } from "@/lib/db";
import { PIIDetector, PseudonymizationVault } from "@/lib/privacy-engine";
import { encrypt } from "@/lib/encryption";
import { AuditLogger } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

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
    const jobId = uuidv4();
    await db.insert(jobs).values({
      id: jobId,
      type: "redaction",
      status: "processing",
      originalText: text,
      retentionMode: retentionMode || "standard",
    });

    // Detect and pseudonymize PII
    const detector = new PIIDetector();
    const vault = new PseudonymizationVault();
    const detected = detector.detect(text);
    const redactedText = vault.pseudonymize(text, detected);

    // Store detected entities and prepare response
    const entityInserts = detected.map((entity) => {
      const token = vault.getToken(entity.value) || vault.generateToken(entity.type);
      if (!vault.getToken(entity.value)) {
        vault.addMapping(entity.value, token);
      }
      return {
        id: uuidv4(),
        jobId,
        entityType: entity.type,
        token: token,
        originalEncrypted: encrypt(entity.value, process.env.ENCRYPTION_SECRET!),
        confidence: entity.confidence.toString(),
        startIndex: entity.startIndex,
        endIndex: entity.endIndex,
      };
    });

    if (entityInserts.length > 0) {
      await db.insert(detectedEntities).values(entityInserts);
    }

    // Update job with redacted text
    await db.update(jobs)
      .set({ redactedText })
      .where(eq(jobs.id, jobId));

    // Log audit event
    const auditLogger = new AuditLogger();
    await auditLogger.log(jobId, "REDACTION_COMPLETED", {
      entitiesDetected: detected.length,
      retentionMode,
    });

    // Prepare entities for response
    const entitiesResponse = detected.map((entity) => {
      const token = vault.getToken(entity.value);
      return {
        type: entity.type,
        token: token || '',
        confidence: entity.confidence,
      };
    });

    return NextResponse.json({
      jobId,
      redactedText,
      entities: entitiesResponse,
      entitiesDetected: detected.length,
    });
  } catch (error) {
    console.error("Redaction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
