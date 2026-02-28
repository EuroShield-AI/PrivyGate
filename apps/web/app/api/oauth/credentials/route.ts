import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

const createCredentialSchema = z.object({
  name: z.string().min(1),
  userId: z.string().uuid(),
});

/**
 * @swagger
 * /api/oauth/credentials:
 *   post:
 *     summary: Create OAuth credentials
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - userId
 *             properties:
 *               name:
 *                 type: string
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: OAuth credentials created
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, userId } = createCredentialSchema.parse(body);

    // Verify user exists
    const userResults = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResults.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Generate client ID and secret
    const clientId = uuidv4();
    const clientSecret = crypto.randomBytes(32).toString("hex");

    // In production, store these in a database table
    // For now, return them (user should save securely)
    return NextResponse.json({
      clientId,
      clientSecret,
      name,
      createdAt: new Date().toISOString(),
      warning: "Save these credentials securely. The secret will not be shown again.",
    });
  } catch (error) {
    console.error("OAuth credential creation error:", error);
    return NextResponse.json(
      { error: "Failed to create credentials" },
      { status: 500 }
    );
  }
}
