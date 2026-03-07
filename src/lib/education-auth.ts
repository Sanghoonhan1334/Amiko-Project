import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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
 * Validates `Authorization: Bearer <token>` for education API routes.
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
  const authHeader =
    request.headers.get('Authorization') || request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
  }

  const token = decodeURIComponent(authHeader.replace('Bearer ', '').trim())

  const { data: { user }, error } = await getAdminClient().auth.getUser(token)

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }
  }

  return { user, error: null }
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
