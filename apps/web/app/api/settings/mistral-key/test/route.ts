import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getMistralApiKey } from "@/lib/mistral-config";
import { Mistral } from "@mistralai/mistralai";

/**
 * @swagger
 * /api/settings/mistral-key/test:
 *   post:
 *     summary: Test Mistral API key connection
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: API key is valid
 *       400:
 *         description: API key not configured or invalid
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const mistralApiKey = await getMistralApiKey(auth.user.id);
    if (!mistralApiKey) {
      return NextResponse.json(
        { error: "Mistral API key not configured" },
        { status: 400 }
      );
    }

    // Test the API key by making a simple request
    try {
      const mistral = new Mistral({ apiKey: mistralApiKey });
      const response = await mistral.chat.complete({
        model: "mistral-tiny",
        messages: [{ role: "user", content: "test" }],
        maxTokens: 1,
      });

      if (response.choices && response.choices.length > 0) {
        return NextResponse.json({
          success: true,
          message: "API key is valid and working",
        });
      } else {
        return NextResponse.json(
          { error: "Invalid API key response" },
          { status: 400 }
        );
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Failed to connect to Mistral API" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error testing Mistral API key:", error);
    return NextResponse.json(
      { error: "Failed to test API key" },
      { status: 500 }
    );
  }
}
