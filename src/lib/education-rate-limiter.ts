/**
 * Simple in-memory sliding-window rate limiter for Education API routes.
 *
 * Uses a Map keyed by `${userId}:${action}` (or IP fallback).
 * Automatically evicts expired buckets to avoid unbounded memory growth.
 *
 * Usage:
 *   const allowed = checkRateLimit('create-order', userId, 5, 60_000)
 *   if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

interface Bucket {
  timestamps: number[]
  lastCleaned: number
}

const store = new Map<string, Bucket>()

// Evict stale buckets every 5 minutes to prevent memory leaks
const EVICT_INTERVAL_MS = 5 * 60 * 1000
let lastEviction = Date.now()

function maybeEvict(windowMs: number) {
  const now = Date.now()
  if (now - lastEviction < EVICT_INTERVAL_MS) return
  lastEviction = now
  for (const [key, bucket] of store.entries()) {
    const cutoff = now - windowMs
    if (bucket.timestamps.length === 0 || bucket.timestamps[bucket.timestamps.length - 1] < cutoff) {
      store.delete(key)
    }
  }
}

/**
 * Returns true if the request is ALLOWED, false if rate-limited.
 *
 * @param action      A string identifying the throttled action (e.g. 'create-order')
 * @param identity    User ID or IP address — used as the rate-limit bucket key
 * @param maxRequests Max number of requests allowed within the window
 * @param windowMs    Sliding window duration in milliseconds (default: 60 000 ms = 1 min)
 */
export function checkRateLimit(
  action: string,
  identity: string,
  maxRequests: number,
  windowMs: number = 60_000
): boolean {
  maybeEvict(windowMs)

  const key = `${action}:${identity}`
  const now = Date.now()
  const cutoff = now - windowMs

  let bucket = store.get(key)
  if (!bucket) {
    bucket = { timestamps: [], lastCleaned: now }
    store.set(key, bucket)
  }

  // Slide the window: remove timestamps older than the cutoff
  bucket.timestamps = bucket.timestamps.filter(t => t > cutoff)

  if (bucket.timestamps.length >= maxRequests) {
    return false // rate-limited
  }

  bucket.timestamps.push(now)
  return true // allowed
}

/**
 * Extracts a stable identity string from a Next.js request.
 * Prefers userId; falls back to IP headers.
 */
export function getRateLimitIdentity(
  request: Request,
  userId?: string
): string {
  if (userId) return userId
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}
