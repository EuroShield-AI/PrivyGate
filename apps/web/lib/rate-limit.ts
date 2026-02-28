// Dynamic imports for edge runtime compatibility
let Ratelimit: any;
let Redis: any;

// For development, use in-memory rate limiting if Redis is not configured
let ratelimit: any = null;

// Initialize rate limiter
async function initializeRateLimit() {
  if (ratelimit) return ratelimit;

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Ratelimit: RL } = await import("@upstash/ratelimit");
      const { Redis: R } = await import("@upstash/redis");
      
      const redis = new R({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      ratelimit = new RL({
        redis,
        limiter: RL.slidingWindow(100, "1 h"), // 100 requests per hour
        analytics: true,
      });
      return ratelimit;
    } catch (error) {
      console.warn("Failed to initialize Upstash rate limiting, using in-memory fallback:", error);
    }
  }

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
  };
  
  return ratelimit;
}

export async function checkRateLimit(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const limiter = await initializeRateLimit();
  return limiter.limit(identifier);
}
