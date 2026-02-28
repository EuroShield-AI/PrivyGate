import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db, jobs } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

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

    // Get job statistics for the user
    // Note: This is a simplified version. In production, you'd track actual token usage per API call
    const jobStats = await db
      .select({
        totalJobs: sql<number>`COUNT(*)`.as('totalJobs'),
        recentJobs: sql<number>`COUNT(CASE WHEN ${jobs.createdAt} > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END)`.as('recentJobs'),
      })
      .from(jobs)
      .where(eq(jobs.userId, auth.user.id));

    const stats = jobStats[0] || { totalJobs: 0, recentJobs: 0 };

    // For now, return estimated usage based on jobs
    // In production, you'd track actual token usage from Mistral API responses
    const estimatedTokens = stats.totalJobs * 1000; // Rough estimate: 1000 tokens per job
    const limit = 1000000; // Default limit

    return NextResponse.json({
      used: estimatedTokens,
      limit,
      model: "mistral-large-latest", // Default model
      totalJobs: stats.totalJobs,
      recentJobs: stats.recentJobs,
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage statistics" },
      { status: 500 }
    );
  }
}
