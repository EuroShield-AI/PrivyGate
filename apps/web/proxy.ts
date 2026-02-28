import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Use dynamic imports for edge runtime compatibility
async function checkRateLimit(identifier: string) {
  try {
    const { checkRateLimit: check } = await import("./lib/rate-limit");
    return check(identifier);
  } catch (error) {
    // Fallback if rate limiting fails
    return { success: true, limit: 100, remaining: 99, reset: Date.now() + 3600000 };
  }
}

async function logWarning(message: string, metadata?: Record<string, unknown>) {
  try {
    const { logger } = await import("./lib/logger");
    logger.warn(message, metadata);
  } catch (error) {
    console.warn(message, metadata);
  }
}

export async function proxy(request: NextRequest) {
  // Skip rate limiting for static files and API health checks
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api/health") ||
    request.nextUrl.pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Rate limit API endpoints
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const identifier = request.ip || request.headers.get("x-forwarded-for") || "anonymous";
    
    try {
      const { success, remaining, reset } = await checkRateLimit(identifier);
      
      const response = success
        ? NextResponse.next()
        : NextResponse.json(
            { error: "Rate limit exceeded" },
            { status: 429 }
          );

      // Add rate limit headers
      response.headers.set("X-RateLimit-Limit", "100");
      response.headers.set("X-RateLimit-Remaining", remaining.toString());
      response.headers.set("X-RateLimit-Reset", reset.toString());

      if (!success) {
        await logWarning("Rate limit exceeded", {
          identifier,
          path: request.nextUrl.pathname,
        });
      }

      return response;
    } catch (error) {
      console.error("Rate limit check failed", error);
      // Allow request if rate limiting fails
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
  ],
};
