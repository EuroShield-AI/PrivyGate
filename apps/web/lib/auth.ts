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
      throw new Error("NEXTAUTH_SECRET not configured");
    }

    // Simple JWT verification (decode and check expiry)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    
    // Check expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
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
