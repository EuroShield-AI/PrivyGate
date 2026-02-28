import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  summarizeText,
  extractActions,
  classifyText,
} from "@/lib/mistral";
import { AuditLogger } from "@/lib/audit";

const processSchema = z.object({
  jobId: z.string().uuid(),
  taskType: z.enum(["summarize", "classify", "extract-actions"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, taskType } = processSchema.parse(body);

    // Get job and redacted text
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        detectedEntities: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!job.redactedText) {
      return NextResponse.json(
        { error: "Job has no redacted text. Please run redaction first." },
        { status: 400 }
      );
    }

    // Create audit log for processing start
    const auditLogger = new AuditLogger();
    await prisma.auditLog.create({
      data: {
        jobId,
        eventType: "PROCESSING_STARTED",
        timestamp: new Date(),
        metadata: JSON.stringify({ taskType }),
      },
    });

    // Process based on task type
    let result: unknown;
    let modelUsed = "mistral-large-latest";

    const redactedText = job.redactedText;

    switch (taskType) {
      case "summarize":
        result = await summarizeText(redactedText);
        break;
      case "classify":
        result = await classifyText(redactedText);
        break;
      case "extract-actions":
        result = await extractActions(redactedText);
        break;
    }

    // Create audit log for processing completion
    await prisma.auditLog.create({
      data: {
        jobId,
        eventType: "PROCESSING_COMPLETED",
        timestamp: new Date(),
        metadata: JSON.stringify({
          taskType,
          modelUsed,
          success: true,
        }),
      },
    });

    return NextResponse.json({
      jobId,
      taskType,
      result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
