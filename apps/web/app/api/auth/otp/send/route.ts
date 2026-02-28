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
    
    // Always try to send email (works with localhost postfix)
    try {
      await sendOTPEmail(email, code);
      return NextResponse.json({ 
        message: "OTP sent successfully to your email",
        success: true,
      });
    } catch (error) {
      console.error("Email send error:", error);
      // Fallback: return code in response for development/testing
      return NextResponse.json({ 
        message: "OTP generated (email sending failed, check postfix configuration)",
        code: code, // Include code for testing
        success: false,
        error: "Email sending failed, but OTP is available for testing",
      });
    }
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
