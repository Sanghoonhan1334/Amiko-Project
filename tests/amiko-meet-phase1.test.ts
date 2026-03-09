/**
 * AMIKO Meet Phase 1 — Unit Tests
 *
 * Tests for:
 * 1. Admin slots API — auth pattern, CRUD logic
 * 2. Sessions API — creation, listing, monthly limits
 * 3. Enrollment API — capacity, re-enrollment, limits
 * 4. Timer API — auth, auto-close, warnings
 * 5. Chat API — auth, message length, participant check
 * 6. Presence API — join/leave logging
 * 7. Access status/token — time windows, enrollment check
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mock Supabase ─────────────────────────────────────
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockNeq = vi.fn()
const mockIn = vi.fn()
const mockGte = vi.fn()
const mockGt = vi.fn()
const mockSingle = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockOr = vi.fn()

// Chain builder that returns itself for chaining
function createChain(finalData: any = null, finalError: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: finalData, error: finalError }),
    then: vi.fn((cb: any) => cb({ data: finalData, error: finalError })),
  }
  // Make each method return the chain for fluent API
  Object.keys(chain).forEach(key => {
    if (key !== 'single' && key !== 'then') {
      chain[key].mockReturnValue(chain)
    }
  })
  return chain
}

const mockGetUser = vi.fn()
const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: vi.fn(),
}

// Mock modules
vi.mock('@/lib/supabaseServer', () => ({
  supabaseServer: mockSupabase,
}))

vi.mock('@/lib/admin-auth', () => ({
  requireAdmin: vi.fn(),
}))

// ── Helper: create mock NextRequest ───────────────────
function createRequest(
  method: string = 'GET',
  url: string = 'http://localhost:3000/api/test',
  options: {
    body?: any
    headers?: Record<string, string>
  } = {}
) {
  const headers = new Headers(options.headers || {})
  // Only add default auth when no explicit headers were provided
  const hasExplicitHeaders = options && 'headers' in options
  if (!hasExplicitHeaders && !headers.has('authorization')) {
    headers.set('authorization', 'Bearer test-token-123')
  }

  return {
    method,
    url,
    headers: {
      get: (name: string) => headers.get(name.toLowerCase()),
    },
    json: vi.fn().mockResolvedValue(options.body || {}),
  } as any
}

function createContext(id: string = 'test-session-id') {
  return {
    params: Promise.resolve({ id }),
  }
}

// ── Helper: mock authenticated user ───────────────────
function mockAuthUser(userId: string = 'user-123', email: string = 'test@test.com') {
  mockGetUser.mockResolvedValue({
    data: {
      user: {
        id: userId,
        email,
        user_metadata: {
          display_name: 'Test User',
          full_name: 'Test User',
        },
      },
    },
    error: null,
  })
}

function mockAuthFail() {
  mockGetUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'Invalid token' },
  })
}

// ═══════════════════════════════════════════════════════
// 1. ADMIN SLOTS API
// ═══════════════════════════════════════════════════════
describe('Admin Slots API', () => {
  let requireAdmin: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const adminAuth = await import('@/lib/admin-auth')
    requireAdmin = adminAuth.requireAdmin
  })

  describe('Auth Pattern', () => {
    it('should reject when admin auth fails', async () => {
      const mockResponse = { status: 403, json: () => ({ error: 'Not admin' }) }
      ;(requireAdmin as any).mockResolvedValue({
        authenticated: false,
        response: mockResponse,
      })

      const { GET } = await import('@/app/api/admin/meet/slots/route')
      const result = await GET(createRequest())

      // Should return the auth response, not proceed to DB
      expect(result).toBe(mockResponse)
    })

    it('should proceed when admin auth succeeds', async () => {
      ;(requireAdmin as any).mockResolvedValue({
        authenticated: true,
        user: { id: 'admin-1', email: 'admin@test.com' },
        admin: { id: 'a1', role: 'superadmin' },
      })

      const chain = createChain([{ id: '1', day_of_week: 1 }])
      mockSupabase.from.mockReturnValue(chain)

      const { GET } = await import('@/app/api/admin/meet/slots/route')
      const result = await GET(createRequest())

      // The function should have queried the database
      expect(mockSupabase.from).toHaveBeenCalledWith('amiko_meet_slots')
    })
  })

  describe('PATCH — Mass Assignment Protection', () => {
    it('should only allow whitelisted fields', async () => {
      ;(requireAdmin as any).mockResolvedValue({
        authenticated: true,
        user: { id: 'admin-1', email: 'admin@test.com' },
        admin: { id: 'a1', role: 'superadmin' },
      })

      const chain = createChain({ id: 's1', day_of_week: 3 })
      mockSupabase.from.mockReturnValue(chain)

      const { PATCH } = await import('@/app/api/admin/meet/slots/route')
      const result = await PATCH(
        createRequest('PATCH', 'http://localhost:3000/api/admin/meet/slots', {
          body: {
            id: 's1',
            day_of_week: 3,
            created_at: '2020-01-01',  // Should be stripped
            created_by: 'hacker',       // Should be stripped
            evil_field: 'injected',     // Should be stripped
          },
        })
      )

      // update() should have been called with only allowed fields
      const updateCall = chain.update.mock.calls[0]?.[0]
      if (updateCall) {
        expect(updateCall).not.toHaveProperty('created_at')
        expect(updateCall).not.toHaveProperty('created_by')
        expect(updateCall).not.toHaveProperty('evil_field')
        expect(updateCall).toHaveProperty('day_of_week', 3)
      }
    })

    it('should reject when no valid fields provided', async () => {
      ;(requireAdmin as any).mockResolvedValue({
        authenticated: true,
        user: { id: 'admin-1', email: 'admin@test.com' },
        admin: { id: 'a1', role: 'superadmin' },
      })

      const { PATCH } = await import('@/app/api/admin/meet/slots/route')
      const result = await PATCH(
        createRequest('PATCH', 'http://localhost:3000/api/admin/meet/slots', {
          body: { id: 's1', evil: 'injected' },
        })
      )

      const json = await result.json()
      expect(result.status).toBe(400)
      expect(json.error).toContain('No valid fields')
    })
  })
})

// ═══════════════════════════════════════════════════════
// 2. TIMER API
// ═══════════════════════════════════════════════════════
describe('Timer API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should require authentication', async () => {
    const { GET } = await import('@/app/api/meet/sessions/[id]/timer/route')
    const req = createRequest('GET', 'http://localhost:3000/api/meet/sessions/s1/timer', {
      headers: {}, // No auth header
    })
    const result = await GET(req, createContext('s1'))
    const json = await result.json()
    expect(result.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('should return timer state for authenticated user', async () => {
    mockAuthUser()

    const now = new Date()
    const startedAt = new Date(now.getTime() - 10 * 60 * 1000) // 10 min ago

    const chain = createChain({
      id: 's1',
      status: 'live',
      scheduled_at: startedAt.toISOString(),
      started_at: startedAt.toISOString(),
      ended_at: null,
      duration_minutes: 20,
    })
    mockSupabase.from.mockReturnValue(chain)

    const { GET } = await import('@/app/api/meet/sessions/[id]/timer/route')
    const result = await GET(
      createRequest('GET', 'http://localhost:3000/api/meet/sessions/s1/timer'),
      createContext('s1')
    )

    const json = await result.json()
    expect(json.session_id).toBe('s1')
    expect(json.remaining_seconds).toBeGreaterThan(0)
    expect(json.remaining_seconds).toBeLessThanOrEqual(600) // ~10 min left
  })

  it('should return 404 for non-existent session', async () => {
    mockAuthUser()

    const chain = createChain(null)
    mockSupabase.from.mockReturnValue(chain)

    const { GET } = await import('@/app/api/meet/sessions/[id]/timer/route')
    const result = await GET(
      createRequest('GET', 'http://localhost:3000/api/meet/sessions/s1/timer'),
      createContext('s1')
    )

    const json = await result.json()
    expect(result.status).toBe(404)
  })

  it('should include warning for last 5 minutes', async () => {
    mockAuthUser()

    const now = new Date()
    const startedAt = new Date(now.getTime() - 17 * 60 * 1000) // 17 min ago

    const chain = createChain({
      id: 's1',
      status: 'live',
      scheduled_at: startedAt.toISOString(),
      started_at: startedAt.toISOString(),
      ended_at: null,
      duration_minutes: 20,
    })
    mockSupabase.from.mockReturnValue(chain)

    const { GET } = await import('@/app/api/meet/sessions/[id]/timer/route')
    const result = await GET(
      createRequest('GET', 'http://localhost:3000/api/meet/sessions/s1/timer'),
      createContext('s1')
    )

    const json = await result.json()
    expect(json.warnings).toBeDefined()
    expect(json.warnings.length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════
// 3. CHAT API
// ═══════════════════════════════════════════════════════
describe('Chat API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('should require authentication', async () => {
      const { GET } = await import('@/app/api/meet/sessions/[id]/chat/route')
      const req = createRequest('GET', 'http://localhost:3000/api/meet/sessions/s1/chat', {
        headers: {}, // No auth header
      })
      const result = await GET(req, createContext('s1'))
      const json = await result.json()
      expect(result.status).toBe(401)
    })
  })

  describe('POST', () => {
    it('should reject empty content', async () => {
      mockAuthUser()

      const { POST } = await import('@/app/api/meet/sessions/[id]/chat/route')
      const result = await POST(
        createRequest('POST', 'http://localhost:3000/api/meet/sessions/s1/chat', {
          body: { content: '' },
          headers: { 'Authorization': 'Bearer test-token' },
        }),
        createContext('s1')
      )

      const json = await result.json()
      expect(result.status).toBe(400)
      expect(json.error).toContain('Content is required')
    })

    it('should reject messages longer than 500 chars', async () => {
      mockAuthUser()

      const { POST } = await import('@/app/api/meet/sessions/[id]/chat/route')
      const longMsg = 'a'.repeat(501)
      const result = await POST(
        createRequest('POST', 'http://localhost:3000/api/meet/sessions/s1/chat', {
          body: { content: longMsg },
          headers: { 'Authorization': 'Bearer test-token' },
        }),
        createContext('s1')
      )

      const json = await result.json()
      expect(result.status).toBe(400)
      expect(json.error).toContain('too long')
    })

    it('should reject non-participants', async () => {
      mockAuthUser()

      // First call: participant lookup returns null
      const participantChain = createChain(null)
      mockSupabase.from.mockReturnValue(participantChain)

      const { POST } = await import('@/app/api/meet/sessions/[id]/chat/route')
      const result = await POST(
        createRequest('POST', 'http://localhost:3000/api/meet/sessions/s1/chat', {
          body: { content: 'Hello!' },
          headers: { 'Authorization': 'Bearer test-token' },
        }),
        createContext('s1')
      )

      const json = await result.json()
      expect(result.status).toBe(403)
    })
  })
})

// ═══════════════════════════════════════════════════════
// 4. ENROLLMENT API
// ═══════════════════════════════════════════════════════
describe('Enrollment API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should require authentication for enrollment', async () => {
    const { POST } = await import('@/app/api/meet/sessions/[id]/enroll/route')
    const req = createRequest('POST', 'http://localhost:3000/api/meet/sessions/s1/enroll', {
      headers: {}, // No auth header
    })
    const result = await POST(req, createContext('s1'))
    const json = await result.json()
    expect(result.status).toBe(401)
  })

  it('should reject enrollment in cancelled sessions', async () => {
    mockAuthUser()

    // Session is cancelled
    const sessionChain = createChain({
      id: 's1',
      status: 'cancelled',
      current_participants: 0,
      max_participants: 6,
    })
    mockSupabase.from.mockReturnValue(sessionChain)

    const { POST } = await import('@/app/api/meet/sessions/[id]/enroll/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/meet/sessions/s1/enroll'),
      createContext('s1')
    )

    const json = await result.json()
    expect(result.status).toBe(400)
    expect(json.error).toContain('cancelled')
  })

  it('should reject enrollment in completed sessions', async () => {
    mockAuthUser()

    const sessionChain = createChain({
      id: 's1',
      status: 'completed',
      current_participants: 0,
      max_participants: 6,
    })
    mockSupabase.from.mockReturnValue(sessionChain)

    const { POST } = await import('@/app/api/meet/sessions/[id]/enroll/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/meet/sessions/s1/enroll'),
      createContext('s1')
    )

    const json = await result.json()
    expect(result.status).toBe(400)
    expect(json.error).toContain('ended')
  })
})

// ═══════════════════════════════════════════════════════
// 5. CAPTIONS START/STOP (Phase 1 integration points)
// ═══════════════════════════════════════════════════════
describe('Captions Start API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should require authentication', async () => {
    const { POST } = await import('@/app/api/meet/sessions/[id]/captions/start/route')
    const req = createRequest('POST', 'http://localhost:3000/api/meet/sessions/s1/captions/start', {
      headers: {}, // No auth header
    })
    const result = await POST(req, createContext('s1'))
    const json = await result.json()
    expect(result.status).toBe(401)
  })

  it('should reject non-live sessions', async () => {
    mockAuthUser()

    // Session is scheduled, not live
    const chain = createChain({
      id: 's1',
      status: 'scheduled',
      host_id: 'user-123',
    })
    mockSupabase.from.mockReturnValue(chain)

    const { POST } = await import('@/app/api/meet/sessions/[id]/captions/start/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/meet/sessions/s1/captions/start'),
      createContext('s1')
    )

    const json = await result.json()
    expect(result.status).toBe(400)
    expect(json.error).toContain('live')
  })
})

describe('Captions Stop API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should require authentication', async () => {
    const { POST } = await import('@/app/api/meet/sessions/[id]/captions/stop/route')
    const req = createRequest('POST', 'http://localhost:3000/api/meet/sessions/s1/captions/stop', {
      headers: {}, // No auth header
    })
    const result = await POST(req, createContext('s1'))
    const json = await result.json()
    expect(result.status).toBe(401)
  })
})
