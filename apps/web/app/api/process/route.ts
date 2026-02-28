import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, jobs } from "@/lib/db";
import { AuditLogger } from "@/lib/audit";
import { requireAuth } from "@/lib/auth";
import { getMistralApiKey } from "@/lib/mistral-config";
import { Mistral } from "@mistralai/mistralai";
import { eq } from "drizzle-orm";

const processSchema = z.object({
  jobId: z.string().uuid(),
  taskType: z.enum(["summarize", "classify", "extract-actions"]),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { jobId, taskType } = processSchema.parse(body);

    // Get user's Mistral API key
    const mistralApiKey = await getMistralApiKey(auth.user.id);
    if (!mistralApiKey) {
      return NextResponse.json(
        { error: "Mistral API key not configured. Please set it in Settings." },
        { status: 400 }
      );
    }

    const mistral = new Mistral({ apiKey: mistralApiKey });

    // Get job
    const jobResults = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    const job = jobResults[0];

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
    await auditLogger.log(jobId, "PROCESSING_STARTED", { taskType });

    // Process based on task type
    let result: unknown;
    let modelUsed = "mistral-large-latest";
    const redactedText = job.redactedText;

    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;

    switch (taskType) {
      case "summarize": {
        const response = await mistral.chat.complete({
          model: modelUsed,
          messages: [{ role: "user", content: `Summarize the following text in 2-3 sentences:\n\n${redactedText}` }],
        });
        result = response.choices[0]?.message?.content || "";
        // Extract token usage from response
        if (response.usage) {
          totalTokens = response.usage.totalTokens || 0;
          promptTokens = response.usage.promptTokens || 0;
          completionTokens = response.usage.completionTokens || 0;
        }
        break;
      }
      case "classify": {
        const response = await mistral.chat.complete({
          model: modelUsed,
          messages: [{ role: "user", content: `Classify the following text. Return JSON with "category" (string), "sentiment" (positive/neutral/negative), and "urgency" (low/medium/high):\n\n${redactedText}` }],
          responseFormat: { type: "json_object" },
        });
        result = JSON.parse(response.choices[0]?.message?.content || "{}");
        // Extract token usage from response
        if (response.usage) {
          totalTokens = response.usage.totalTokens || 0;
          promptTokens = response.usage.promptTokens || 0;
          completionTokens = response.usage.completionTokens || 0;
        }
        break;
      }
      case "extract-actions": {
        const response = await mistral.chat.complete({
          model: modelUsed,
          messages: [{ role: "user", content: `Extract actionable items from the following text. Return as JSON with an "actions" array containing objects with "action" (string) and "priority" (high/medium/low) fields:\n\n${redactedText}` }],
          responseFormat: { type: "json_object" },
        });
        result = JSON.parse(response.choices[0]?.message?.content || "{}");
        // Extract token usage from response
        if (response.usage) {
          totalTokens = response.usage.totalTokens || 0;
          promptTokens = response.usage.promptTokens || 0;
          completionTokens = response.usage.completionTokens || 0;
        }
        break;
      }
    }

    // Create audit log for processing completion with token usage
    await auditLogger.log(jobId, "PROCESSING_COMPLETED", {
      taskType,
      modelUsed,
      success: true,
      totalTokens,
      promptTokens,
      completionTokens,
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
