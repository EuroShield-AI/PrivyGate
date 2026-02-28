import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, users } from "@/lib/db";
import { hash } from "bcryptjs";
import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = registerSchema.parse(body);

    // Check if user exists
    const existingUsers = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create user
    const userId = uuidv4();
    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      name: name || null,
      role: "user",
    });

    logger.info("User registered", { userId, email });

    return NextResponse.json({
      user: {
        id: userId,
        email,
        name: name || null,
        role: "user",
      },
      message: "User created successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }

    logger.error("Registration error", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
