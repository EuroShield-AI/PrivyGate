import { NextRequest } from "next/server";
import { verify } from "next-auth/jwt";

export async function getAuthToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

export async function verifyToken(token: string): Promise<any | null> {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("NEXTAUTH_SECRET not configured");
      return null;
    }

    // Use jsonwebtoken to verify the token
    const jwt = await import("jsonwebtoken");
    const decoded = jwt.verify(token, secret);
    return decoded as any;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<{ user: any } | { error: string; status: number }> {
  const token = await getAuthToken(request);
  
  if (!token) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await verifyToken(token);
  
  if (!user) {
    return { error: "Invalid or expired token", status: 401 };
  }

  return { user };
}
