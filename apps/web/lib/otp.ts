import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

interface OTPRecord {
  email: string;
  code: string;
  expiresAt: Date;
  attempts: number;
}

// In-memory store (use Redis in production)
const otpStore = new Map<string, OTPRecord>();

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createOTP(email: string): Promise<string> {
  // Clean up expired OTPs
  const now = new Date();
  for (const [key, record] of otpStore.entries()) {
    if (record.expiresAt < now) {
      otpStore.delete(key);
    }
  }

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  otpStore.set(email, {
    email,
    code,
    expiresAt,
    attempts: 0,
  });

  return code;
}

export async function verifyOTP(email: string, code: string): Promise<boolean> {
  const record = otpStore.get(email);

  if (!record) {
    return false;
  }

  if (record.expiresAt < new Date()) {
    otpStore.delete(email);
    return false;
  }

  if (record.attempts >= 5) {
    otpStore.delete(email);
    return false;
  }

  record.attempts++;

  if (record.code !== code) {
    return false;
  }

  // OTP verified successfully
  otpStore.delete(email);
  return true;
}

export async function sendOTPEmail(email: string, code: string): Promise<void> {
  // In development, skip email sending (code is logged to console)
  if (process.env.NODE_ENV === "development") {
    console.log(`OTP for ${email}: ${code}`);
    return;
  }

  // In production, use a proper email service (SendGrid, AWS SES, etc.)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log(`OTP for ${email}: ${code} (SMTP not configured)`);
    return;
  }

  try {
    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@privygate.com",
      to: email,
      subject: "Your PrivyGate Login Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your PrivyGate Login Code</h2>
          <p>Your one-time password is:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    // Fallback: log to console
    console.log(`OTP for ${email}: ${code}`);
  }
}
