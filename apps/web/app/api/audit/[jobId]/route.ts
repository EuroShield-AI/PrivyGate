import { NextRequest, NextResponse } from "next/server";
import { db, jobs, auditLogs, detectedEntities } from "@/lib/db";
import { eq, asc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    const auditLogsResult = await db.select()
      .from(auditLogs)
      .where(eq(auditLogs.jobId, jobId))
      .orderBy(asc(auditLogs.timestamp));

    const jobResults = await db.select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);
    
    const job = jobResults[0];

    const entitiesResult = job ? await db.select()
      .from(detectedEntities)
      .where(eq(detectedEntities.jobId, jobId)) : [];

    return NextResponse.json({
      jobId,
      job: job
        ? {
            id: job.id,
            type: job.type,
            status: job.status,
            retentionMode: job.retentionMode,
            createdAt: job.createdAt,
            entityCount: entitiesResult.length,
          }
        : null,
      auditLogs: auditLogsResult.map((log) => ({
        id: log.id,
        eventType: log.eventType,
        timestamp: log.timestamp,
        metadata: JSON.parse(log.metadata),
      })),
    });
  } catch (error) {
    console.error("Audit fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
