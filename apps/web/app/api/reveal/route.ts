import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { EntityType } from "@/lib/privacy-engine";
import { AuditLogger } from "@/lib/audit";

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

    // Get job and entities
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        detectedEntities: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Create token map from entities
    const tokenMap = new Map<string, string>();
    const encryptionSecret = process.env.ENCRYPTION_SECRET;

    for (const entity of job.detectedEntities) {
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
    await prisma.auditLog.create({
      data: {
        jobId,
        eventType: "REVEAL_REQUESTED",
        timestamp: new Date(),
        metadata: JSON.stringify({
          allowedTypes: allowedTypes || "all",
          revealedCount: tokenMap.size,
        }),
      },
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
