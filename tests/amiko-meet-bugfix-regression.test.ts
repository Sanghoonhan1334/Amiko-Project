/**
 * AMIKO Meet — Bug-fix Regression Tests
 *
 * Tests every bug fix applied during the audit.
 * Each test is tagged with the fix it verifies, so a failing test
 * immediately tells you which fix regressed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Supabase ─────────────────────────────────────
const mockGetUser = vi.fn()

function createChain(finalData: any = null, finalError: any = null) {
  const chain: any = {}
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'gte', 'gt', 'or', 'order', 'limit',
    'is', 'not', 'range', 'ilike', 'single', 'maybeSingle',
  ]
  methods.forEach(m => {
    chain[m] = vi.fn().mockReturnValue(chain)
  })
  chain.single = vi.fn().mockResolvedValue({ data: finalData, error: finalError })
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: finalData, error: finalError })
  // Return a proper thenable so .then().catch() works
  chain.then = vi.fn((cb: any) => {
    const result = cb({ data: finalData, error: finalError })
    return { catch: vi.fn().mockReturnValue(result) }
  })
  chain.catch = vi.fn().mockReturnValue(chain)
  return chain
}

const mockSupabase: any = {
  auth: { getUser: mockGetUser },
  from: vi.fn(),
}

vi.mock('@/lib/supabaseServer', () => ({
  supabaseServer: mockSupabase,
}))

vi.mock('@/lib/admin-auth', () => ({
  requireAdmin: vi.fn(),
}))

vi.mock('@/lib/meet-summary', () => ({
  generateSessionSummary: vi.fn().mockResolvedValue({
    id: 'summary-1',
    session_id: 'session-123',
    topics: [],
    vocabulary: [],
    cultural_notes: [],
    generation_status: 'completed',
  }),
}))


// ── Helpers ───────────────────────────────────────────
function createRequest(
  method: string = 'GET',
  url: string = 'http://localhost:3000/api/test',
  body?: any,
) {
  const headers = new Headers({ authorization: 'Bearer test-token' })
  return {
    method,
    url,
    headers: { get: (n: string) => headers.get(n.toLowerCase()) },
    json: vi.fn().mockResolvedValue(body || {}),
    signal: { addEventListener: vi.fn() },
  } as any
}

function createContext(id: string = 'session-123') {
  return { params: Promise.resolve({ id }) }
}

function mockAuthUser(id: string) {
  mockGetUser.mockResolvedValue({
    data: {
      user: {
        id,
        email: 'user@test.com',
        user_metadata: { display_name: 'Tester' },
      },
    },
    error: null,
  })
}


// ═══════════════════════════════════════════════════════
// FIX 1 — Timer: remainingMs <= 0 (was ===0)
// ═══════════════════════════════════════════════════════
describe('FIX: Timer auto-close uses <= 0 instead of === 0', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should mark session completed when time has expired (remainingMs < 0)', async () => {
    mockAuthUser('user-1')

    // Session that started 31 minutes ago (1 min over 30-minute limit)
    const startedAt = new Date(Date.now() - 31 * 60 * 1000)
    const chain = createChain({
      id: 'session-123',
      status: 'live',
      scheduled_at: startedAt.toISOString(),
      started_at: startedAt.toISOString(),
      ended_at: null,
      duration_minutes: 30,
    })
    mockSupabase.from.mockReturnValue(chain)

    const { GET } = await import('@/app/api/meet/sessions/[id]/timer/route')
    const result = await GET(createRequest(), createContext())
    const json = await result.json()

    expect(json.status).toBe('completed')
    expect(json.remaining_seconds).toBe(0)
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed' })
    )
  })

  it('should trigger at exactly 30 minutes (not only == 0)', async () => {
    mockAuthUser('user-1')

    // Use exact 30 min offset — previously this was missed due to === 0
    // In reality timing granularity means we'll almost always be slightly over
    const startedAt = new Date(Date.now() - 30 * 60 * 1000 - 50) // 50ms over
    const chain = createChain({
      id: 'session-123',
      status: 'live',
      scheduled_at: startedAt.toISOString(),
      started_at: startedAt.toISOString(),
      ended_at: null,
      duration_minutes: 30,
    })
    mockSupabase.from.mockReturnValue(chain)

    const { GET } = await import('@/app/api/meet/sessions/[id]/timer/route')
    const result = await GET(createRequest(), createContext())
    const json = await result.json()

    expect(json.status).toBe('completed')
    expect(json.remaining_seconds).toBe(0)
    expect(json.warnings).toContain('session_ended')
  })
})


// ═══════════════════════════════════════════════════════
// FIX 2 — Session status transition validation
// ═══════════════════════════════════════════════════════
describe('FIX: Status transition validation prevents invalid status changes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should reject completed → scheduled transition', async () => {
    mockAuthUser('host-1')

    const sessionChain = createChain({ host_id: 'host-1', status: 'completed' })
    const adminChain = createChain(null)
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'admin_users') return adminChain
      return sessionChain
    })

    const { PATCH } = await import('@/app/api/meet/sessions/[id]/route')
    const result = await PATCH(
      createRequest('PATCH', 'http://localhost:3000/api/meet/sessions/x', { status: 'scheduled' }),
      createContext()
    )

    expect(result.status).toBe(400)
    const json = await result.json()
    expect(json.error).toContain('Cannot transition')
  })

  it('should reject cancelled → live transition', async () => {
    mockAuthUser('host-1')

    const sessionChain = createChain({ host_id: 'host-1', status: 'cancelled' })
    const adminChain = createChain(null)
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'admin_users') return adminChain
      return sessionChain
    })

    const { PATCH } = await import('@/app/api/meet/sessions/[id]/route')
    const result = await PATCH(
      createRequest('PATCH', 'http://localhost:3000/api/meet/sessions/x', { status: 'live' }),
      createContext()
    )

    expect(result.status).toBe(400)
  })

  it('should allow scheduled → live transition', async () => {
    mockAuthUser('host-1')

    const sessionChain = createChain({ host_id: 'host-1', status: 'scheduled' })
    const adminChain = createChain(null)
    const updateChain = createChain({ id: 's1', status: 'live' })
    let callIdx = 0
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'admin_users') return adminChain
      if (table === 'amiko_meet_sessions') {
        callIdx++
        return callIdx === 1 ? sessionChain : updateChain
      }
      return createChain()
    })

    const { PATCH } = await import('@/app/api/meet/sessions/[id]/route')
    const result = await PATCH(
      createRequest('PATCH', 'http://localhost:3000/api/meet/sessions/x', { status: 'live' }),
      createContext()
    )

    expect(result.status).toBeLessThan(400)
  })

  it('should reject invalid status values (e.g. "hacked")', async () => {
    mockAuthUser('host-1')

    const sessionChain = createChain({ host_id: 'host-1', status: 'scheduled' })
    const adminChain = createChain(null)
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'admin_users') return adminChain
      return sessionChain
    })

    const { PATCH } = await import('@/app/api/meet/sessions/[id]/route')
    const result = await PATCH(
      createRequest('PATCH', 'http://localhost:3000/api/meet/sessions/x', { status: 'hacked' }),
      createContext()
    )

    expect(result.status).toBe(400)
    const json = await result.json()
    expect(json.error).toContain('Invalid status')
  })
})


// ═══════════════════════════════════════════════════════
// FIX 3 — Session PATCH now accepts title/description/topic
// ═══════════════════════════════════════════════════════
describe('FIX: PATCH session accepts title, description, topic updates', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should include title in updateable fields', async () => {
    mockAuthUser('host-1')

    const sessionChain = createChain({ host_id: 'host-1', status: 'scheduled' })
    const adminChain = createChain(null)
    const updateChain = createChain({ id: 's1', title: 'New Title' })
    let callIdx = 0
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'admin_users') return adminChain
      if (table === 'amiko_meet_sessions') {
        callIdx++
        return callIdx === 1 ? sessionChain : updateChain
      }
      return createChain()
    })

    const { PATCH } = await import('@/app/api/meet/sessions/[id]/route')
    const result = await PATCH(
      createRequest('PATCH', 'http://localhost:3000/api/meet/sessions/x', { title: 'New Title' }),
      createContext()
    )

    expect(result.status).toBeLessThan(400)
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New Title' })
    )
  })
})


// ═══════════════════════════════════════════════════════
// FIX 4 — Sessions GET filter: completed sessions reachable
// ═══════════════════════════════════════════════════════
describe('FIX: GET sessions with status=completed returns completed sessions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should not apply future-date filter when requesting completed sessions', async () => {
    const chain = createChain([
      { id: 's-done', status: 'completed', scheduled_at: '2025-01-01T00:00:00Z' },
    ])
    mockSupabase.from.mockReturnValue(chain)

    const { GET } = await import('@/app/api/meet/sessions/route')
    const result = await GET(
      createRequest('GET', 'http://localhost:3000/api/meet/sessions?status=completed'),
    )

    // Should call .eq('status', 'completed') and NOT .gte('scheduled_at', ...)
    expect(chain.eq).toHaveBeenCalledWith('status', 'completed')
    // For completed status, .gte should NOT be called
    const gteCallsAfterEq = chain.gte.mock.calls
    // Only scheduled status should get .gte filter
    expect(
      gteCallsAfterEq.every((call: any[]) => call[0] !== 'scheduled_at')
    ).toBe(true)
  })
})


// ═══════════════════════════════════════════════════════
// FIX 5 — Session creation: scheduled_at future validation
// ═══════════════════════════════════════════════════════
describe('FIX: Session creation rejects past scheduled_at dates', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should reject a date 1 hour in the past', async () => {
    mockAuthUser('host-1')

    const pastDate = new Date(Date.now() - 3600_000).toISOString()

    const { POST } = await import('@/app/api/meet/sessions/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/meet/sessions', {
        title: 'Past Session',
        scheduled_at: pastDate,
      }),
    )

    expect(result.status).toBe(400)
    const json = await result.json()
    expect(json.error).toContain('future')
  })

  it('should reject an invalid date string', async () => {
    mockAuthUser('host-1')

    const { POST } = await import('@/app/api/meet/sessions/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/meet/sessions', {
        title: 'Bad Date',
        scheduled_at: 'not-a-date',
      }),
    )

    expect(result.status).toBe(400)
    const json = await result.json()
    expect(json.error).toContain('future')
  })
})


// ═══════════════════════════════════════════════════════
// FIX 6 — Session creation: input length validation
// ═══════════════════════════════════════════════════════
describe('FIX: Session creation validates input lengths', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should reject title > 200 characters', async () => {
    mockAuthUser('host-1')

    const futureDate = new Date(Date.now() + 3600_000).toISOString()

    const { POST } = await import('@/app/api/meet/sessions/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/meet/sessions', {
        title: 'A'.repeat(201),
        scheduled_at: futureDate,
      }),
    )

    expect(result.status).toBe(400)
    const json = await result.json()
    expect(json.error).toContain('200')
  })

  it('should reject description > 2000 characters', async () => {
    mockAuthUser('host-1')

    const futureDate = new Date(Date.now() + 3600_000).toISOString()

    const { POST } = await import('@/app/api/meet/sessions/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/meet/sessions', {
        title: 'OK title',
        description: 'D'.repeat(2001),
        scheduled_at: futureDate,
      }),
    )

    expect(result.status).toBe(400)
    const json = await result.json()
    expect(json.error).toContain('2000')
  })

  it('should reject topic > 200 characters', async () => {
    mockAuthUser('host-1')

    const futureDate = new Date(Date.now() + 3600_000).toISOString()

    const { POST } = await import('@/app/api/meet/sessions/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/meet/sessions', {
        title: 'OK title',
        topic: 'T'.repeat(201),
        scheduled_at: futureDate,
      }),
    )

    expect(result.status).toBe(400)
    const json = await result.json()
    expect(json.error).toContain('200')
  })
})


// ═══════════════════════════════════════════════════════
// FIX 7 — Access log: session_created (was token_issued)
// ═══════════════════════════════════════════════════════
describe('FIX: Session creation logs action as session_created', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should log session_created not token_issued', async () => {
    mockAuthUser('host-1')

    const futureDate = new Date(Date.now() + 3600_000).toISOString()

    const usageChain = createChain([])
    const sessionChain = createChain({
      id: 'new-session',
      host_id: 'host-1',
      title: 'Test',
      scheduled_at: futureDate,
      duration_minutes: 30,
      status: 'scheduled',
      agora_channel: 'amiko-meet-abc12345',
    })
    const enrollChain = createChain({ id: 'p1' })
    const logChain = createChain(null)

    let fromCall = 0
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'amiko_meet_participants') {
        fromCall++
        if (fromCall === 1) return usageChain
        return enrollChain
      }
      if (table === 'amiko_meet_sessions') return sessionChain
      if (table === 'amiko_meet_access_logs') return logChain
      return createChain()
    })

    const { POST } = await import('@/app/api/meet/sessions/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/meet/sessions', {
        title: 'Test Session',
        scheduled_at: futureDate,
      }),
    )

    expect(result.status).toBe(201)

    // Verify the access log action
    const insertCall = logChain.insert.mock.calls[0]?.[0]
    expect(insertCall?.action).toBe('session_created')
  })
})


// ═══════════════════════════════════════════════════════
// FIX 8 — Moderation: "puta" matches at end of string
// ═══════════════════════════════════════════════════════
describe('FIX: Moderation detects "puto/puta" at end of string', () => {
  it('should flag "puta" at the end of a string (no trailing space)', async () => {
    // Import the actual checkContent
    const mod = await import('@/lib/meet-moderation')
    const result = mod.checkContent({
      session_id: 's1',
      content: 'eres una puta',
      language: 'es',
    })

    expect(result.flagged).toBe(true)
    expect(result.flags.some(f => f.rule === 'es_slur_02')).toBe(true)
  })

  it('should flag "puto" at end of string', async () => {
    const mod = await import('@/lib/meet-moderation')
    const result = mod.checkContent({
      session_id: 's1',
      content: 'eres puto',
      language: 'es',
    })

    expect(result.flagged).toBe(true)
  })

  it('should still flag "puta " with trailing space', async () => {
    const mod = await import('@/lib/meet-moderation')
    const result = mod.checkContent({
      session_id: 's1',
      content: 'eres puta y más',
      language: 'es',
    })

    expect(result.flagged).toBe(true)
  })
})


// ═══════════════════════════════════════════════════════
// FIX 9 — Moderation: unaccented estupido/a detected
// ═══════════════════════════════════════════════════════
describe('FIX: Moderation detects unaccented "estupido/a"', () => {
  it('should flag "estupida" (without accent)', async () => {
    const mod = await import('@/lib/meet-moderation')
    const result = mod.checkContent({
      session_id: 's1',
      content: 'eres estupida',
      language: 'es',
    })

    expect(result.flagged).toBe(true)
    expect(result.flags.some(f => f.rule === 'es_insult_01')).toBe(true)
  })

  it('should flag "estúpido" (with accent)', async () => {
    const mod = await import('@/lib/meet-moderation')
    const result = mod.checkContent({
      session_id: 's1',
      content: 'que estúpido eres',
      language: 'es',
    })

    expect(result.flagged).toBe(true)
  })

  it('should not flag "estudio" (false positive check)', async () => {
    const mod = await import('@/lib/meet-moderation')
    const result = mod.checkContent({
      session_id: 's1',
      content: 'estudio mucho coreano',
      language: 'es',
    })

    // "estudio" should not match est[uú]pid[oa]
    const hasInsult = result.flags.some(f => f.rule === 'es_insult_01')
    expect(hasInsult).toBe(false)
  })
})


// ═══════════════════════════════════════════════════════
// FIX 10 — Reputation: integer validation for ratings
// ═══════════════════════════════════════════════════════
describe('FIX: Reputation rejects non-integer ratings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should reject float overall_rating (4.7)', async () => {
    mockAuthUser('user-1')

    const participantChain = createChain({ id: 'p1' })
    mockSupabase.from.mockReturnValue(participantChain)

    const { POST } = await import('@/app/api/meet/sessions/[id]/reputation/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/meet/sessions/s1/reputation', {
        rated_user_id: 'other-user',
        overall_rating: 4.7,
      }),
      createContext()
    )

    expect(result.status).toBe(400)
    const json = await result.json()
    expect(json.error).toContain('integer')
  })

  it('should reject overall_rating = 0', async () => {
    mockAuthUser('user-1')

    const participantChain = createChain({ id: 'p1' })
    mockSupabase.from.mockReturnValue(participantChain)

    const { POST } = await import('@/app/api/meet/sessions/[id]/reputation/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/meet/sessions/s1/reputation', {
        rated_user_id: 'other-user',
        overall_rating: 0,
      }),
      createContext()
    )

    expect(result.status).toBe(400)
  })

  it('should reject overall_rating = 6', async () => {
    mockAuthUser('user-1')

    const participantChain = createChain({ id: 'p1' })
    mockSupabase.from.mockReturnValue(participantChain)

    const { POST } = await import('@/app/api/meet/sessions/[id]/reputation/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/meet/sessions/s1/reputation', {
        rated_user_id: 'other-user',
        overall_rating: 6,
      }),
      createContext()
    )

    expect(result.status).toBe(400)
  })
})


// ═══════════════════════════════════════════════════════
// FIX 11 — Reputation: sub-rating validation
// ═══════════════════════════════════════════════════════
describe('FIX: Reputation validates sub-ratings (1-5 integer)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should reject communication_rating = 3.5', async () => {
    mockAuthUser('user-1')

    const participantChain = createChain({ id: 'p1' })
    mockSupabase.from.mockReturnValue(participantChain)

    const { POST } = await import('@/app/api/meet/sessions/[id]/reputation/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/meet/sessions/s1/reputation', {
        rated_user_id: 'other-user',
        overall_rating: 4,
        communication_rating: 3.5,
      }),
      createContext()
    )

    expect(result.status).toBe(400)
    const json = await result.json()
    expect(json.error).toContain('communication_rating')
  })
})


// ═══════════════════════════════════════════════════════
// FIX 12 — Reputation: badge whitelist validation
// ═══════════════════════════════════════════════════════
describe('FIX: Reputation rejects invalid badge names', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should reject badge "super_hacker"', async () => {
    mockAuthUser('user-1')

    const participantChain = createChain({ id: 'p1' })
    mockSupabase.from.mockReturnValue(participantChain)

    const { POST } = await import('@/app/api/meet/sessions/[id]/reputation/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/meet/sessions/s1/reputation', {
        rated_user_id: 'other-user',
        overall_rating: 5,
        badges: ['super_hacker'],
      }),
      createContext()
    )

    expect(result.status).toBe(400)
    const json = await result.json()
    expect(json.error).toContain('super_hacker')
  })

  it('should accept valid badge "great_communicator"', async () => {
    mockAuthUser('user-1')

    const participantChain = createChain({ id: 'p1' })
    const ratedChain = createChain({ id: 'p2' })
    const ratingChain = createChain({
      id: 'r1',
      overall_rating: 5,
      badges: ['great_communicator'],
    })

    let partCall = 0
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'amiko_meet_participants') {
        partCall++
        return partCall === 1 ? participantChain : ratedChain
      }
      if (table === 'amiko_meet_session_reputation') return ratingChain
      return createChain()
    })

    const { POST } = await import('@/app/api/meet/sessions/[id]/reputation/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/meet/sessions/s1/reputation', {
        rated_user_id: 'other-user',
        overall_rating: 5,
        badges: ['great_communicator'],
      }),
      createContext()
    )

    expect(result.status).toBe(201)
  })
})


// ═══════════════════════════════════════════════════════
// FIX 13 — Reputation GET: participant verification
// ═══════════════════════════════════════════════════════
describe('FIX: Reputation GET checks participant membership', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return 403 for non-participants', async () => {
    mockAuthUser('outsider')

    const participantChain = createChain(null) // Not a participant
    mockSupabase.from.mockReturnValue(participantChain)

    const { GET } = await import('@/app/api/meet/sessions/[id]/reputation/route')
    const result = await GET(
      createRequest('GET', 'http://localhost:3000/api/meet/sessions/s1/reputation'),
      createContext()
    )

    expect(result.status).toBe(403)
  })
})


// ═══════════════════════════════════════════════════════
// FIX 14 — Summary POST: session completion check
// ═══════════════════════════════════════════════════════
describe('FIX: Summary generation requires completed session', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should reject summary generation for a live session', async () => {
    mockAuthUser('user-1')

    const participantChain = createChain({ id: 'p1' })
    const sessionChain = createChain({ status: 'live' }) // Not completed

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'amiko_meet_participants') return participantChain
      if (table === 'amiko_meet_sessions') return sessionChain
      return createChain()
    })

    const { POST } = await import('@/app/api/meet/sessions/[id]/summary/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/meet/sessions/s1/summary'),
      createContext()
    )

    expect(result.status).toBe(400)
    const json = await result.json()
    expect(json.error).toContain('completed')
  })

  it('should allow summary generation for a completed session', async () => {
    mockAuthUser('user-1')

    const participantChain = createChain({ id: 'p1' })
    const sessionChain = createChain({ status: 'completed' })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'amiko_meet_participants') return participantChain
      if (table === 'amiko_meet_sessions') return sessionChain
      return createChain()
    })

    const { POST } = await import('@/app/api/meet/sessions/[id]/summary/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/meet/sessions/s1/summary'),
      createContext()
    )

    expect(result.status).toBeLessThan(400)
  })
})


// ═══════════════════════════════════════════════════════
// FIX 15 — Summary GET: participant verification
// ═══════════════════════════════════════════════════════
describe('FIX: Summary GET checks participant membership', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return 403 for non-participants', async () => {
    mockAuthUser('outsider')

    const participantChain = createChain(null)
    mockSupabase.from.mockReturnValue(participantChain)

    const { GET } = await import('@/app/api/meet/sessions/[id]/summary/route')
    const result = await GET(
      createRequest('GET', 'http://localhost:3000/api/meet/sessions/s1/summary'),
      createContext()
    )

    expect(result.status).toBe(403)
  })
})


// ═══════════════════════════════════════════════════════
// FIX 16 — Recording GET: participant verification
// ═══════════════════════════════════════════════════════
describe('FIX: Recording GET checks participant membership', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return 403 for non-participants', async () => {
    mockAuthUser('outsider')

    const participantChain = createChain(null)
    mockSupabase.from.mockReturnValue(participantChain)

    const { GET } = await import('@/app/api/meet/sessions/[id]/recording/route')
    const result = await GET(
      createRequest('GET', 'http://localhost:3000/api/meet/sessions/s1/recording'),
      createContext()
    )

    expect(result.status).toBe(403)
  })
})


// ═══════════════════════════════════════════════════════
// FIX (notes) — Cancelled participants cannot create notes
// ═══════════════════════════════════════════════════════
describe('FIX: Notes POST excludes cancelled participants', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should check participant status includes enrolled/joined/left but not cancelled', async () => {
    mockAuthUser('user-1')

    const participantChain = createChain(null) // No valid participant found
    mockSupabase.from.mockReturnValue(participantChain)

    const { POST } = await import('@/app/api/meet/sessions/[id]/notes/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/meet/sessions/s1/notes', {
        content: 'Test note',
        note_type: 'general',
      }),
      createContext()
    )

    expect(result.status).toBe(403)

    // Verify the query included the status filter
    expect(participantChain.in).toHaveBeenCalledWith(
      'status',
      expect.arrayContaining(['enrolled', 'joined', 'left'])
    )
  })
})
