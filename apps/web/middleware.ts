import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "./lib/rate-limit";
import { logger } from "./lib/logger";

export async function middleware(request: NextRequest) {
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
        logger.warn("Rate limit exceeded", {
          identifier,
          path: request.nextUrl.pathname,
        });
      }

      return response;
    } catch (error) {
      logger.error("Rate limit check failed", error as Error);
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
