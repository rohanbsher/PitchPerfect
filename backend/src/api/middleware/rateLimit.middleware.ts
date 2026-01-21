import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RATE_LIMITS } from '../../config/constants.js';

// In-memory rate limit store (fallback when Redis unavailable)
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

// Parse window string to milliseconds
function parseWindow(window: string): number {
  const match = window.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 60000; // Default 1 minute

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 60000;
  }
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of inMemoryStore.entries()) {
    if (value.resetAt <= now) {
      inMemoryStore.delete(key);
    }
  }
}, 60000); // Clean every minute

/**
 * Get rate limit key for a request
 */
function getRateLimitKey(request: FastifyRequest, endpoint: string): string {
  // Use userId if authenticated, otherwise use IP
  const identifier = request.userId || request.ip;
  return `ratelimit:${endpoint}:${identifier}`;
}

/**
 * Check and update rate limit
 * Returns remaining requests, or -1 if limit exceeded
 */
async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ remaining: number; resetAt: number }> {
  const now = Date.now();
  const entry = inMemoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    // First request or window expired
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    // Rate limit exceeded
    return { remaining: -1, resetAt: entry.resetAt };
  }

  // Increment count
  entry.count += 1;
  inMemoryStore.set(key, entry);
  return { remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Create rate limit middleware for a specific endpoint category
 */
export function createRateLimiter(endpoint: keyof typeof RATE_LIMITS) {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.global;
  const windowMs = parseWindow(config.window);
  const maxRequests = config.max;

  return async function rateLimitMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const key = getRateLimitKey(request, endpoint);
    const result = await checkRateLimit(key, maxRequests, windowMs);

    // Set rate limit headers
    reply.header('X-RateLimit-Limit', maxRequests);
    reply.header('X-RateLimit-Remaining', Math.max(0, result.remaining));
    reply.header('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

    if (result.remaining < 0) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      reply.header('Retry-After', retryAfter);

      reply.status(429).send({
        success: false,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
      });
    }
  };
}

/**
 * Register global rate limiting plugin
 */
export async function registerRateLimiting(app: FastifyInstance): Promise<void> {
  // Global rate limit as a fallback
  const globalConfig = RATE_LIMITS.global;
  const globalWindowMs = parseWindow(globalConfig.window);

  await app.register(import('@fastify/rate-limit'), {
    global: true,
    max: globalConfig.max,
    timeWindow: globalWindowMs,
    keyGenerator: (request: FastifyRequest) => {
      return request.userId || request.ip;
    },
    errorResponseBuilder: (_request, context) => ({
      success: false,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
      retryAfter: Math.ceil(context.ttl / 1000),
    }),
  });
}
