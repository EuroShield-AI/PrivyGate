import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuditLogger } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get("jobId");

    let auditLogs;
    if (jobId) {
      auditLogs = await prisma.auditLog.findMany({
        where: { jobId },
        orderBy: { timestamp: "asc" },
      });
    } else {
      auditLogs = await prisma.auditLog.findMany({
        orderBy: { timestamp: "asc" },
        take: 1000, // Limit for performance
      });
    }

    const records = auditLogs.map((log) => ({
      id: log.id,
      jobId: log.jobId,
      eventType: log.eventType,
      timestamp: log.timestamp,
      metadata: JSON.parse(log.metadata),
    }));

    const auditLogger = new AuditLogger();
    const csv = auditLogger.formatForRoPA(records);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="ropa-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("RoPA export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
