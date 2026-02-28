import { NextRequest, NextResponse } from "next/server";
import { db, auditLogs } from "@/lib/db";
import { AuditLogger } from "@/lib/audit";
import { eq, desc, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get("jobId");

    let auditLogsResult;
    if (jobId) {
      auditLogsResult = await db.select()
        .from(auditLogs)
        .where(eq(auditLogs.jobId, jobId))
        .orderBy(asc(auditLogs.timestamp));
    } else {
      auditLogsResult = await db.select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.timestamp))
        .limit(1000);
    }

    const records = auditLogsResult.map((log) => ({
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
