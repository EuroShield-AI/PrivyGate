import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, jobs, detectedEntities } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { EntityType } from "@/lib/privacy-engine";
import { AuditLogger } from "@/lib/audit";
import { eq } from "drizzle-orm";

const revealSchema = z.object({
  jobId: z.string().uuid(),
  allowedTypes: z.array(z.enum(["EMAIL", "PHONE", "NAME", "ADDRESS", "IBAN", "IDENTIFIER"])).optional(),
  text: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, allowedTypes, text } = revealSchema.parse(body);

    if (!process.env.ENCRYPTION_SECRET) {
      return NextResponse.json(
        { error: "ENCRYPTION_SECRET not configured" },
        { status: 500 }
      );
    }

    // Get job
    const jobResults = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    const job = jobResults[0];

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get entities
    const entitiesResult = await db.select()
      .from(detectedEntities)
      .where(eq(detectedEntities.jobId, jobId));

    // Create token map from entities
    const tokenMap = new Map<string, string>();
    const encryptionSecret = process.env.ENCRYPTION_SECRET;

    for (const entity of entitiesResult) {
      if (!allowedTypes || allowedTypes.includes(entity.entityType as EntityType)) {
        try {
          const original = decrypt(entity.originalEncrypted, encryptionSecret);
          tokenMap.set(entity.token, original);
        } catch (error) {
          console.error(`Failed to decrypt entity ${entity.id}:`, error);
        }
      }
    }

    // Replace tokens with originals
    let revealedText = text;
    for (const [token, original] of tokenMap.entries()) {
      revealedText = revealedText.replace(new RegExp(token, "g"), original);
    }

    // Create audit log
    const auditLogger = new AuditLogger();
    await auditLogger.log(jobId, "REVEAL_REQUESTED", {
      allowedTypes: allowedTypes || "all",
      revealedCount: tokenMap.size,
    });

    return NextResponse.json({
      jobId,
      revealedText,
      revealedEntities: Array.from(tokenMap.keys()),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Reveal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
