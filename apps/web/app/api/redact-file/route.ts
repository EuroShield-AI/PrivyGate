import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, files, jobs, detectedEntities } from "@/lib/db";
import { PIIDetector, PseudonymizationVault } from "@/lib/privacy-engine";
import { AIPIIDetector } from "@/lib/ai-detector";
import { encrypt } from "@/lib/encryption";
import { AuditLogger } from "@/lib/audit";
import { requireAuth } from "@/lib/auth";
import { getMistralApiKey } from "@/lib/mistral-config";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const redactFileSchema = z.object({
  fileId: z.string().uuid(),
  retentionMode: z.enum(["standard", "zero"]).default("standard"),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { fileId, retentionMode } = redactFileSchema.parse(body);

    if (!process.env.ENCRYPTION_SECRET) {
      return NextResponse.json(
        { error: "ENCRYPTION_SECRET not configured" },
        { status: 500 }
      );
    }

    // Get file
    const fileResults = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
    const file = fileResults[0];

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
    const jobId = uuidv4();
    await db.insert(jobs).values({
      id: jobId,
      type: "redaction",
      retentionMode: retentionMode || "standard",
      status: "processing",
      originalText: file.extractedText,
      fileId: file.id,
    });

    // Get user's Mistral API key for AI detection
    const mistralApiKey = await getMistralApiKey(auth.user.id);
    
    // Detect PII using AI if API key is available, otherwise fallback to regex
    let entities;
    if (mistralApiKey) {
      try {
        const aiDetector = new AIPIIDetector(mistralApiKey);
        entities = await aiDetector.detect(file.extractedText);
        
        // If AI detection finds nothing or fails, fallback to regex
        if (entities.length === 0) {
          const regexDetector = new PIIDetector();
          entities = regexDetector.detect(file.extractedText);
        }
      } catch (error) {
        console.error("AI detection failed, falling back to regex:", error);
        // Fallback to regex detection
        const regexDetector = new PIIDetector();
        entities = regexDetector.detect(file.extractedText);
      }
    } else {
      // Use regex detection if no API key
      const regexDetector = new PIIDetector();
      entities = regexDetector.detect(file.extractedText);
    }

    // Pseudonymize
    const vault = new PseudonymizationVault();
    const redactedText = vault.pseudonymize(file.extractedText, entities);

    // Store entities in database
    const encryptionSecret = process.env.ENCRYPTION_SECRET;
    const entityInserts = entities.map((entity) => {
      const token = vault.getToken(entity.value) || vault.generateToken(entity.type);
      if (!vault.getToken(entity.value)) {
        vault.addMapping(entity.value, token);
      }
      return {
        id: uuidv4(),
        jobId,
        entityType: entity.type,
        token: token,
        originalEncrypted: encrypt(entity.value, encryptionSecret),
        confidence: entity.confidence.toString(),
        startIndex: entity.startIndex,
        endIndex: entity.endIndex,
      };
    });

    if (entityInserts.length > 0) {
      await db.insert(detectedEntities).values(entityInserts);
    }

    // Update job status
    await db.update(jobs)
      .set({ status: "completed", redactedText })
      .where(eq(jobs.id, jobId));

    // Create audit log
    const auditLogger = new AuditLogger();
    await auditLogger.log(jobId, "REDACTION_COMPLETED", {
      entityTypes: entities.map((e) => e.type),
      entityCount: entities.length,
      fileId: file.id,
      filename: file.originalName,
      detectionMethod: mistralApiKey ? "ai" : "regex",
    });

    return NextResponse.json({
      jobId,
      redactedText,
      entities: entities.map((e) => ({
        type: e.type,
        token: vault.getToken(e.value) || '',
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
