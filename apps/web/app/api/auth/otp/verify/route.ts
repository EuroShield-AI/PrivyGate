import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOTP } from "@/lib/otp";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { sign } from "next-auth/jwt";

const verifyOTPSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

/**
 * @swagger
 * /api/auth/otp/verify:
 *   post:
 *     summary: Verify OTP and get JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *                 length: 6
 *     responses:
 *       200:
 *         description: OTP verified, returns JWT token
 *       400:
 *         description: Invalid OTP
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = verifyOTPSchema.parse(body);

    const isValid = await verifyOTP(email, code);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Get user
    const userResults = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = userResults[0];

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Generate JWT token
    const token = await sign(
      {
        id: user.id,
        email: user.email,
        role: user.role || "user",
      },
      process.env.NEXTAUTH_SECRET!,
      {
        expiresIn: "30d",
      }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
