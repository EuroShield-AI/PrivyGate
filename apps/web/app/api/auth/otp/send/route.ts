import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOTP, sendOTPEmail } from "@/lib/otp";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

const sendOTPSchema = z.object({
  email: z.string().email(),
});

/**
 * @swagger
 * /api/auth/otp/send:
 *   post:
 *     summary: Send OTP to email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid email
 *       500:
 *         description: Failed to send OTP
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = sendOTPSchema.parse(body);

    // Check if user exists, if not create one
    const userResults = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userResults.length === 0) {
      // Auto-create user for OTP login
      const { v4: uuidv4 } = await import("uuid");
      await db.insert(users).values({
        id: uuidv4(),
        email,
        role: "user",
      });
    }

    const code = await createOTP(email);
    
    // In development, log the code. In production, send email
    if (process.env.NODE_ENV === "development") {
      console.log(`OTP for ${email}: ${code}`);
    } else {
      await sendOTPEmail(email, code);
    }

    return NextResponse.json({ 
      message: "OTP sent successfully",
      // Only include code in development
      ...(process.env.NODE_ENV === "development" && { code }),
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
