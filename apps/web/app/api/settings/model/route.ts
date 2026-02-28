import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { getSelectedModel, saveSelectedModel } from "@/lib/mistral-config";

const modelSchema = z.object({
  model: z.enum([
    "mistral-tiny",
    "mistral-small-latest",
    "mistral-medium-latest",
    "mistral-large-latest",
    "pixtral-large-latest",
    "open-mistral-7b",
    "open-mixtral-8x7b",
  ]),
});

/**
 * @swagger
 * /api/settings/model:
 *   get:
 *     summary: Get user's selected Mistral model
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Selected model
 *   post:
 *     summary: Save user's selected Mistral model
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
 *               - model
 *             properties:
 *               model:
 *                 type: string
 *                 enum: [mistral-tiny, mistral-small-latest, mistral-medium-latest, mistral-large-latest, pixtral-large-latest, open-mistral-7b, open-mixtral-8x7b]
 *     responses:
 *       200:
 *         description: Model saved successfully
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const model = await getSelectedModel(auth.user.id);
    return NextResponse.json({ model });
  } catch (error) {
    console.error("Error fetching selected model:", error);
    return NextResponse.json(
      { error: "Failed to fetch selected model" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { model } = modelSchema.parse(body);

    await saveSelectedModel(auth.user.id, model);
    return NextResponse.json({ success: true, model });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid model", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error saving selected model:", error);
    return NextResponse.json(
      { error: "Failed to save selected model" },
      { status: 500 }
    );
  }
}
