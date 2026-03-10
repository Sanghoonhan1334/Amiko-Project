/**
 * Simple in-memory sliding-window rate limiter.
 * Works per-IP per endpoint. Resets on server restart (stateless deployments
 * should use Redis/Upstash instead, but this prevents the most common abuse).
 */

interface RateLimitEntry {
  count: number
  windowStart: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > 15 * 60 * 1000) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  /** Remaining requests in the current window */
  remaining: number
  /** Seconds until the window resets */
  retryAfter: number
}

/**
 * Check rate limit for a given key (e.g. `signin:1.2.3.4`).
 * @param key     Unique key combining endpoint + IP
 * @param options Limit configuration
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now - entry.windowStart >= options.windowMs) {
    // Start a new window
    store.set(key, { count: 1, windowStart: now })
    return { success: true, remaining: options.limit - 1, retryAfter: 0 }
  }

  if (entry.count >= options.limit) {
    const retryAfter = Math.ceil((options.windowMs - (now - entry.windowStart)) / 1000)
    return { success: false, remaining: 0, retryAfter }
  }

  entry.count += 1
  return { success: true, remaining: options.limit - entry.count, retryAfter: 0 }
}

/**
 * Extract the real client IP from a Next.js request, respecting common
 * reverse-proxy headers (Vercel, Cloudflare, etc.).
 */
export function getClientIp(request: Request): string {
  const headers = request.headers as Headers
  return (
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  )
}
