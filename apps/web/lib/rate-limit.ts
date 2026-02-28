import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// For development, use in-memory rate limiting if Redis is not configured
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 h"), // 100 requests per hour
    analytics: true,
  });
} else {
  // In-memory fallback for development
  const memory = new Map<string, { count: number; reset: number }>();
  
  ratelimit = {
    limit: async (identifier: string) => {
      const now = Date.now();
      const window = 60 * 60 * 1000; // 1 hour
      const key = identifier;
      
      const record = memory.get(key);
      if (!record || now > record.reset) {
        memory.set(key, { count: 1, reset: now + window });
        return { success: true, limit: 100, remaining: 99, reset: now + window };
      }
      
      if (record.count >= 100) {
        return { success: false, limit: 100, remaining: 0, reset: record.reset };
      }
      
      record.count++;
      return { success: true, limit: 100, remaining: 100 - record.count, reset: record.reset };
    },
  } as Ratelimit;
}

export async function checkRateLimit(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  if (!ratelimit) {
    return { success: true, limit: 100, remaining: 99, reset: Date.now() + 3600000 };
  }
  return ratelimit.limit(identifier);
}
