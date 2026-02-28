import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db, jobs, auditLogs } from "@/lib/db";
import { eq, sql, and, gte } from "drizzle-orm";

/**
 * @swagger
 * /api/settings/usage:
 *   get:
 *     summary: Get user's token usage and model information
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Usage statistics
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Get user's jobs to find related audit logs
    const userJobs = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.userId, auth.user.id));

    const jobIds = userJobs.map(j => j.id);

    // Get actual token usage from audit logs
    let totalTokens = 0;
    let recentTokens = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (jobIds.length > 0) {
      // Get all audit logs and filter in JavaScript for simplicity
      const allAuditLogs = await db
        .select()
        .from(auditLogs)
        .where(sql`${auditLogs.jobId} IS NOT NULL`);

      // Filter and sum tokens
      for (const log of allAuditLogs) {
        // Check if this log belongs to one of the user's jobs
        if (!log.jobId || !jobIds.includes(log.jobId)) {
          continue;
        }

        try {
          const metadata = JSON.parse(log.metadata as string);
          const tokens = metadata.totalTokens || 0;
          if (typeof tokens === 'number' && tokens > 0) {
            totalTokens += tokens;
            
            // Check if within last 30 days
            if (new Date(log.timestamp) >= thirtyDaysAgo) {
              recentTokens += tokens;
            }
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    // Get job statistics
    const jobStats = await db
      .select({
        totalJobs: sql<number>`COUNT(*)`.as('totalJobs'),
        recentJobs: sql<number>`COUNT(CASE WHEN ${jobs.createdAt} > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END)`.as('recentJobs'),
      })
      .from(jobs)
      .where(eq(jobs.userId, auth.user.id));

    const stats = jobStats[0] || { totalJobs: 0, recentJobs: 0 };

    const limit = 1000000; // Default limit
    const model = "mistral-large-latest"; // Default model

    return NextResponse.json({
      used: totalTokens,
      limit,
      model,
      totalJobs: stats.totalJobs,
      recentJobs: stats.recentJobs,
      totalTokensUsed: totalTokens, // Alias for clarity
      tokenLimit: limit,
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage statistics" },
      { status: 500 }
    );
  }
}
