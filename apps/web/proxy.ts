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
  // Bypass rate limiting for now - always allow requests
  // TODO: Re-enable rate limiting in production
  
  // Skip rate limiting for static files and API health checks
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api/health") ||
    request.nextUrl.pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Rate limiting is currently disabled - allow all API requests
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    // Set high limit headers for compatibility
    response.headers.set("X-RateLimit-Limit", "10000");
    response.headers.set("X-RateLimit-Remaining", "9999");
    response.headers.set("X-RateLimit-Reset", (Date.now() + 3600000).toString());
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
  ],
};
