import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, supabaseClient } from '@/lib/supabaseServer'

export interface AdminUser {
  id: string
  email: string
  role: string
  permissions: Record<string, boolean>
}

export type AdminAuthResponse =
  | { authenticated: true; user: { id: string; email: string }; admin: AdminUser; response?: never }
  | { authenticated: false; response: NextResponse; user?: never; admin?: never }

/**
 * Shared admin authentication middleware for API routes.
 * Extracts JWT from Authorization header, validates user via Supabase Auth,
 * then checks admin_users table for admin privileges.
 * 
 * Usage:
 *   const auth = await requireAdmin(request)
 *   if (!auth.authenticated) return auth.response
 *   // auth.user and auth.admin are available
 */
export async function requireAdmin(
  request: NextRequest
): Promise<AdminAuthResponse> {
  // Check Supabase is configured
  if (!supabaseServer || !supabaseClient) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      ),
    }
  }

  // Extract Bearer token
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      ),
    }
  }

  const token = authHeader.replace('Bearer ', '')

  // Validate token and get user
  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser(token)

  if (authError || !user || !user.email) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      ),
    }
  }

  // Check admin_users table
  const { data: adminData, error: adminError } = await supabaseServer
    .from('admin_users')
    .select('id, user_id, email, role, permissions, is_active')
    .eq('is_active', true)
    .or(`user_id.eq.${user.id},email.eq.${user.email.toLowerCase()}`)
    .limit(1)
    .maybeSingle()

  if (adminError) {
    // Table might not exist — fall back to users.is_admin
    const { data: userData } = await supabaseServer
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!(userData as { is_admin?: boolean } | null)?.is_admin) {
      return {
        authenticated: false,
        response: NextResponse.json(
          { success: false, error: 'Admin privileges required' },
          { status: 403 }
        ),
      }
    }

    return {
      authenticated: true,
      user: { id: user.id, email: user.email },
      admin: {
        id: user.id,
        email: user.email,
        role: 'admin',
        permissions: {},
      },
    }
  }

  if (!adminData) {
    // Also fall back to users.is_admin
    const { data: userData } = await supabaseServer
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!(userData as { is_admin?: boolean } | null)?.is_admin) {
      return {
        authenticated: false,
        response: NextResponse.json(
          { success: false, error: 'Admin privileges required' },
          { status: 403 }
        ),
      }
    }

    return {
      authenticated: true,
      user: { id: user.id, email: user.email },
      admin: {
        id: user.id,
        email: user.email,
        role: 'admin',
        permissions: {},
      },
    }
  }

  const admin = adminData as { id: string; email: string; role: string; permissions: Record<string, boolean> | null }
  return {
    authenticated: true,
    user: { id: user.id, email: user.email },
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || {},
    },
  }
}
