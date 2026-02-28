import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeWebsite } from "@/lib/gdpr-analyzer";
import { requireAuth } from "@/lib/auth";
import { getMistralApiKey } from "@/lib/mistral-config";

const analyzeSchema = z.object({
  url: z.string().url(),
});

/**
 * @swagger
 * /api/gdpr/analyze:
 *   post:
 *     summary: Analyze website for GDPR compliance with AI enhancement
 *     tags: [GDPR Analyzer]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: GDPR analysis report with AI insights
 *       400:
 *         description: Invalid URL
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Analysis failed
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { url } = analyzeSchema.parse(body);

    // Get user's Mistral API key for AI analysis
    const mistralApiKey = await getMistralApiKey(auth.user.id);

    const report = await analyzeWebsite(url, mistralApiKey || undefined);

    return NextResponse.json(report);
  } catch (error) {
    console.error("GDPR analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
