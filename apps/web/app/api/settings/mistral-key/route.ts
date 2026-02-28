import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { saveMistralApiKey, getMistralApiKey } from "@/lib/mistral-config";

const mistralKeySchema = z.object({
  apiKey: z.string().min(1),
});

/**
 * @swagger
 * /api/settings/mistral-key:
 *   post:
 *     summary: Save Mistral API key (encrypted)
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apiKey
 *             properties:
 *               apiKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: API key saved successfully
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { apiKey } = mistralKeySchema.parse(body);

    await saveMistralApiKey(auth.user.id, apiKey);

    return NextResponse.json({ message: "Mistral API key saved successfully" });
  } catch (error) {
    console.error("Error saving Mistral API key:", error);
    return NextResponse.json(
      { error: "Failed to save API key" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/settings/mistral-key:
 *   get:
 *     summary: Get Mistral API key status
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns whether API key is configured
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const apiKey = await getMistralApiKey(auth.user.id);

    return NextResponse.json({
      configured: !!apiKey,
      // Don't return the actual key for security
    });
  } catch (error) {
    console.error("Error checking Mistral API key:", error);
    return NextResponse.json(
      { error: "Failed to check API key" },
      { status: 500 }
    );
  }
}
