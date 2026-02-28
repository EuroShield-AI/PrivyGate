import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

/**
 * @swagger
 * /api/settings/profile:
 *   patch:
 *     summary: Update user profile (name)
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { name } = updateProfileSchema.parse(body);

    // Update user name
    await db.update(users)
      .set({
        name: name || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, auth.user.id));

    return NextResponse.json({ 
      message: "Profile updated successfully",
      name: name || null,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/settings/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const userResults = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
      .from(users)
      .where(eq(users.id, auth.user.id))
      .limit(1);

    const user = userResults[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
