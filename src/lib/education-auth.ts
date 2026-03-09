import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'

// Lazy singleton for auth validation — reuses the service-role client
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type AuthSuccess = { user: User; error: null }
type AuthFailure = { user: null; error: NextResponse }

/**
 * Validates authentication for education API routes.
 * Supports two strategies (in order):
 *   1. `Authorization: Bearer <token>` header (for programmatic/external callers)
 *   2. Supabase session cookie (for browser fetch calls from the same origin)
 *
 * Returns `{ user }` on success or `{ error: NextResponse(401) }` on failure.
 *
 * Usage in a route handler:
 *   const auth = await requireEducationAuth(request)
 *   if (auth.error) return auth.error
 *   const userId = auth.user.id
 */
export async function requireEducationAuth(
  request: NextRequest
): Promise<AuthSuccess | AuthFailure> {
  // Strategy 1: Bearer token header
  const authHeader =
    request.headers.get('Authorization') || request.headers.get('authorization')

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = decodeURIComponent(authHeader.replace('Bearer ', '').trim())
    const { data: { user }, error } = await getAdminClient().auth.getUser(token)

    if (!error && user) {
      return { user, error: null }
    }
  }

  // Strategy 2: Cookie-based session (browser fetch from same origin)
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // Read-only in API routes — cookies are managed by middleware
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (!error && user) {
      return { user, error: null }
    }
  } catch {
    // Cookie parsing failed — fall through to 401
  }

  return {
    user: null,
    error: NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
}

/**
 * Checks whether the authenticated user holds the admin role.
 * Queries the `users` table for `is_admin` or `role = 'admin'`.
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  const { data } = await getAdminClient()
    .from('users')
    .select('is_admin, role')
    .eq('id', userId)
    .single()

  return !!(data?.is_admin || (data as { role?: string } | null)?.role === 'admin')
}
