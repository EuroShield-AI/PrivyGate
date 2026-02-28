import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    const auditLogs = await prisma.auditLog.findMany({
      where: { jobId },
      orderBy: { timestamp: "asc" },
    });

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        detectedEntities: true,
      },
    });

    return NextResponse.json({
      jobId,
      job: job
        ? {
            id: job.id,
            type: job.type,
            status: job.status,
            retentionMode: job.retentionMode,
            createdAt: job.createdAt,
            entityCount: job.detectedEntities.length,
          }
        : null,
      auditLogs: auditLogs.map((log) => ({
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
