import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeWebsite } from "@/lib/gdpr-analyzer";

const analyzeSchema = z.object({
  url: z.string().url(),
});

/**
 * @swagger
 * /api/gdpr/analyze:
 *   post:
 *     summary: Analyze website for GDPR compliance
 *     tags: [GDPR Analyzer]
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
 *         description: GDPR analysis report
 *       400:
 *         description: Invalid URL
 *       500:
 *         description: Analysis failed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = analyzeSchema.parse(body);

    const report = await analyzeWebsite(url);

    return NextResponse.json(report);
  } catch (error) {
    console.error("GDPR analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
