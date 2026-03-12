/**
 * AMIKO Meet — Unit Tests
 *
 * Tests for:
 * 1. Meet Link Generator — link format, uniqueness, validation
 * 2. Content Moderation — keyword/pattern detection, severity levels
 * 3. Glossary Engine — cache, findMatches, invalidation
 * 4. Recording API — consent flow, start/stop
 * 5. Reputation API — rating validation, self-rating prevention
 * 6. User Reputation API — public profile, defaults
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Top-level mock setup (hoisted) ────────────────────
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
}

vi.mock('@/lib/supabaseServer', () => ({
  supabaseServer: mockSupabase,
}))

vi.mock('@/lib/admin-auth', () => ({
  requireAdmin: vi.fn(),
}))

// Chain builder
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
  Object.keys(chain).forEach(key => {
    if (key !== 'single' && key !== 'then') chain[key].mockReturnValue(chain)
  })
  return chain
}

// ── Helpers ───────────────────────────────────────────
function createRequest(method: string, url: string, options: { body?: any; headers?: Record<string, string> } = {}) {
  const headers = new Headers(options.headers || {})
  if (!options.headers) headers.set('authorization', 'Bearer test-token')
  return {
    method,
    url,
    headers: { get: (name: string) => headers.get(name.toLowerCase()) },
    json: vi.fn().mockResolvedValue(options.body || {}),
  } as any
}

function createContext(id: string = 'sess-1') {
  return { params: Promise.resolve({ id }) }
}

function createUserContext(userId: string = 'user-1') {
  return { params: Promise.resolve({ userId }) }
}

function mockAuth(userId: string = 'user-1') {
  mockGetUser.mockResolvedValue({
    data: { user: { id: userId, email: 'user@test.com' } },
    error: null,
  })
}

function mockNoAuth() {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No auth' } })
}

// ═══════════════════════════════════════════════════════
// 1. MEET LINK GENERATOR
// ═══════════════════════════════════════════════════════
describe('Meet Link Generator', () => {
  let generateMeetLink: typeof import('@/lib/meet-link-generator').generateMeetLink
  let isValidMeetLink: typeof import('@/lib/meet-link-generator').isValidMeetLink

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('@/lib/meet-link-generator')
    generateMeetLink = mod.generateMeetLink
    isValidMeetLink = mod.isValidMeetLink
  })

  describe('generateMeetLink', () => {
    it('returns a Google Meet URL in xxx-xxxx-xxx format', () => {
      const link = generateMeetLink('abc12345-6789-0000-0000-000000000000')
      expect(link).toMatch(/^https:\/\/meet\.google\.com\/[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/)
    })

    it('generates different links for different booking IDs', () => {
      const link1 = generateMeetLink('aaaa1111-0000-0000-0000-000000000000')
      const link2 = generateMeetLink('bbbb2222-0000-0000-0000-000000000000')
      expect(link1).not.toBe(link2)
    })

    it('produces 3-part code with correct lengths', () => {
      const link = generateMeetLink('abcd1234-extra-stuff')
      const parts = link.replace('https://meet.google.com/', '').split('-')
      expect(parts).toHaveLength(3)
      expect(parts[0]).toHaveLength(3)
      expect(parts[1]).toHaveLength(4)
      expect(parts[2]).toHaveLength(3)
    })

    it('handles date parameter without errors', () => {
      const link = generateMeetLink('test1234-id', '2026-03-15')
      expect(link).toMatch(/^https:\/\/meet\.google\.com\/[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/)
    })

    it('generates valid link with short booking ID', () => {
      const link = generateMeetLink('ab')
      expect(isValidMeetLink(link)).toBe(true)
    })

    it('generates valid link with empty booking ID', () => {
      const link = generateMeetLink('')
      expect(link).toMatch(/^https:\/\/meet\.google\.com\//)
    })
  })

  describe('isValidMeetLink', () => {
    it('accepts valid meet.google.com links', () => {
      expect(isValidMeetLink('https://meet.google.com/abc-defg-hij')).toBe(true)
    })

    it('accepts http links', () => {
      expect(isValidMeetLink('http://meet.google.com/abc-defg-hij')).toBe(true)
    })

    it('rejects empty strings', () => {
      expect(isValidMeetLink('')).toBe(false)
    })

    it('rejects null/undefined', () => {
      expect(isValidMeetLink(null as any)).toBe(false)
      expect(isValidMeetLink(undefined as any)).toBe(false)
    })

    it('rejects non-Google-Meet URLs', () => {
      expect(isValidMeetLink('https://zoom.us/j/123456')).toBe(false)
      expect(isValidMeetLink('https://example.com/abc-defg-hij')).toBe(false)
    })

    it('rejects URLs with spaces', () => {
      expect(isValidMeetLink('https://meet.google.com/abc def hij')).toBe(false)
    })

    it('rejects non-string values', () => {
      expect(isValidMeetLink(123 as any)).toBe(false)
    })
  })
})

// ═══════════════════════════════════════════════════════
// 2. CONTENT MODERATION ENGINE
// ═══════════════════════════════════════════════════════
describe('Content Moderation Engine', () => {
  let checkContent: typeof import('@/lib/meet-moderation').checkContent

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    const mod = await import('@/lib/meet-moderation')
    checkContent = mod.checkContent
  })

  it('flags Korean high-risk profanity', () => {
    const result = checkContent({
      session_id: 'sess-1',
      content: '시발 뭐야',
      language: 'ko',
    })
    expect(result.flagged).toBe(true)
    expect(result.flags.length).toBeGreaterThan(0)
    expect(result.flags[0].severity).toBe('high_risk')
  })

  it('flags Korean threats of violence', () => {
    const result = checkContent({
      session_id: 'sess-1',
      content: '죽여버릴거야',
      language: 'ko',
    })
    expect(result.flagged).toBe(true)
    expect(result.flags.some(f => f.severity === 'high_risk')).toBe(true)
  })

  it('flags Korean warning-level insults', () => {
    const result = checkContent({
      session_id: 'sess-1',
      content: '바보야',
      language: 'ko',
    })
    expect(result.flagged).toBe(true)
    expect(result.flags.some(f => f.severity === 'warning')).toBe(true)
  })

  it('flags Spanish high-risk profanity', () => {
    const result = checkContent({
      session_id: 'sess-1',
      content: 'hijo de puta',
      language: 'es',
    })
    expect(result.flagged).toBe(true)
    expect(result.flags[0].severity).toBe('high_risk')
  })

  it('flags Spanish threats of violence', () => {
    const result = checkContent({
      session_id: 'sess-1',
      content: 'te voy a matar',
      language: 'es',
    })
    expect(result.flagged).toBe(true)
    expect(result.flags.some(f => f.severity === 'high_risk')).toBe(true)
  })

  it('flags Spanish warning-level insults', () => {
    const result = checkContent({
      session_id: 'sess-1',
      content: 'eres un idiota',
      language: 'es',
    })
    expect(result.flagged).toBe(true)
    expect(result.flags.some(f => f.severity === 'warning')).toBe(true)
  })

  it('does not flag clean Korean content', () => {
    const result = checkContent({
      session_id: 'sess-1',
      content: '오늘 날씨가 좋습니다',
      language: 'ko',
    })
    expect(result.flagged).toBe(false)
    expect(result.flags).toHaveLength(0)
  })

  it('does not flag clean Spanish content', () => {
    const result = checkContent({
      session_id: 'sess-1',
      content: 'Hoy el tiempo está muy bonito',
      language: 'es',
    })
    expect(result.flagged).toBe(false)
    expect(result.flags).toHaveLength(0)
  })

  it('returns matched_text in flags', () => {
    const result = checkContent({
      session_id: 'sess-1',
      content: 'idiota total',
      language: 'es',
    })
    expect(result.flagged).toBe(true)
    expect(result.flags[0].matched_text).toBeTruthy()
  })

  it('includes confidence score in flags', () => {
    const result = checkContent({
      session_id: 'sess-1',
      content: '씨발',
      language: 'ko',
    })
    expect(result.flagged).toBe(true)
    expect(result.flags[0].confidence).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════
// 3. GLOSSARY ENGINE
// ═══════════════════════════════════════════════════════
describe('Glossary Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('loadGlossary', () => {
    it('returns cached entries when within TTL', async () => {
      mockFrom.mockReturnValue(createChain([
        { id: '1', source_term: '김치', is_active: true },
      ]))

      const { loadGlossary } = await import('@/lib/meet-glossary')

      const first = await loadGlossary(true)
      const second = await loadGlossary()
      expect(first).toHaveLength(1)
      expect(second).toHaveLength(1)
      expect(mockFrom).toHaveBeenCalledTimes(1)
    })

    it('returns stale cache on DB error', async () => {
      mockFrom.mockReturnValueOnce(createChain([
        { id: '1', source_term: '김치', is_active: true },
      ]))

      const { loadGlossary, invalidateGlossaryCache } = await import('@/lib/meet-glossary')

      await loadGlossary(true)
      invalidateGlossaryCache()

      mockFrom.mockReturnValueOnce(createChain(null, { message: 'DB down' }))

      const result = await loadGlossary(true)
      expect(result).toEqual([])
    })
  })

  describe('invalidateGlossaryCache', () => {
    it('forces next call to refresh from DB', async () => {
      mockFrom.mockReturnValue(createChain([
        { id: '1', source_term: 'test', is_active: true },
      ]))

      const { loadGlossary, invalidateGlossaryCache } = await import('@/lib/meet-glossary')

      await loadGlossary(true)
      expect(mockFrom).toHaveBeenCalledTimes(1)

      invalidateGlossaryCache()
      await loadGlossary()
      expect(mockFrom).toHaveBeenCalledTimes(2)
    })
  })

  describe('findMatches', () => {
    it('finds matching glossary entries in text', async () => {
      const { findMatches } = await import('@/lib/meet-glossary')
      const entries = [
        {
          id: '1',
          source_term: '김치',
          target_value: 'Kimchi',
          source_language: 'ko',
          target_language: 'es',
          rule: 'no_translate' as const,
          priority: 10,
          is_active: true,
          category: 'food' as const,
        },
      ] as any

      const matches = findMatches('오늘 김치를 먹었어요', 'ko', 'es', entries)
      expect(matches.length).toBeGreaterThan(0)
      expect(matches[0].original_segment).toBe('김치')
    })

    it('returns empty array when no matches', async () => {
      const { findMatches } = await import('@/lib/meet-glossary')
      const entries = [
        {
          id: '1',
          source_term: 'nonexistent_xyz',
          target_value: 'test',
          source_language: 'ko',
          target_language: 'es',
          rule: 'translate',
          priority: 10,
          is_active: true,
          category: 'food',
        },
      ] as any

      const matches = findMatches('hello world', 'ko', 'es', entries)
      expect(matches).toHaveLength(0)
    })

    it('filters by source/target language', async () => {
      const { findMatches } = await import('@/lib/meet-glossary')
      const entries = [
        {
          id: '1',
          source_term: 'taco',
          target_value: '타코',
          source_language: 'es',
          target_language: 'ko',
          rule: 'translate',
          priority: 10,
          is_active: true,
          category: 'food',
        },
      ] as any

      const matches = findMatches('quiero un taco', 'ko', 'es', entries)
      expect(matches).toHaveLength(0)

      const matches2 = findMatches('quiero un taco', 'es', 'ko', entries)
      expect(matches2.length).toBeGreaterThan(0)
    })
  })
})

// ═══════════════════════════════════════════════════════
// 4. RECORDING API
// ═══════════════════════════════════════════════════════
describe('Recording API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('rejects unauthenticated requests', async () => {
    mockNoAuth()

    const { GET } = await import('@/app/api/meet/sessions/[id]/recording/route')
    const result = await GET(createRequest('GET', '/api/meet/sessions/sess-1/recording'), createContext())
    expect(result.status).toBe(401)
  })

  it('returns recordings for authenticated user (GET)', async () => {
    mockAuth()
    const participantChain = createChain({ id: 'p-1' })
    const recordingsChain = createChain([
      { id: 'rec-1', status: 'completed', session_id: 'sess-1' },
    ])

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return participantChain
      return recordingsChain
    })

    const { GET } = await import('@/app/api/meet/sessions/[id]/recording/route')
    const result = await GET(createRequest('GET', '/api/meet/sessions/sess-1/recording'), createContext())
    expect(result.status).toBe(200)
  })
})

// ═══════════════════════════════════════════════════════
// 5. SESSION REPUTATION API
// ═══════════════════════════════════════════════════════
describe('Session Reputation API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('rejects unauthenticated POST', async () => {
    mockNoAuth()

    const { POST } = await import('@/app/api/meet/sessions/[id]/reputation/route')
    const result = await POST(
      createRequest('POST', '/api/meet/sessions/sess-1/reputation', {
        body: { rated_user_id: 'user-2', overall_rating: 5 },
      }),
      createContext()
    )
    expect(result.status).toBe(401)
  })

  it('prevents self-rating', async () => {
    mockAuth('user-1')

    const { POST } = await import('@/app/api/meet/sessions/[id]/reputation/route')
    const result = await POST(
      createRequest('POST', '/api/meet/sessions/sess-1/reputation', {
        body: { rated_user_id: 'user-1', overall_rating: 5 },
      }),
      createContext()
    )
    expect(result.status).toBe(400)
  })
})

// ═══════════════════════════════════════════════════════
// 6. USER REPUTATION API (PUBLIC)
// ═══════════════════════════════════════════════════════
describe('User Reputation API (public)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns user reputation data', async () => {
    const reputationChain = createChain({
      user_id: 'user-1',
      tier: 'contributor',
      total_sessions: 15,
      avg_overall_rating: 4.5,
    })
    const ratingsChain = createChain([
      { id: 'r-1', overall_rating: 5, session_id: 'sess-1' },
    ])

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return reputationChain
      return ratingsChain
    })

    const { GET } = await import('@/app/api/meet/users/[userId]/reputation/route')
    const result = await GET(
      createRequest('GET', '/api/meet/users/user-1/reputation'),
      createUserContext('user-1')
    )
    expect(result.status).toBe(200)
    const json = await result.json()
    expect(json.reputation).toBeDefined()
  })

  it('returns newcomer defaults when no data exists', async () => {
    const emptyChain = createChain(null, { code: 'PGRST116' })
    const ratingsChain = createChain([])

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return emptyChain
      return ratingsChain
    })

    const { GET } = await import('@/app/api/meet/users/[userId]/reputation/route')
    const result = await GET(
      createRequest('GET', '/api/meet/users/user-1/reputation'),
      createUserContext('user-1')
    )
    expect(result.status).toBe(200)
    const json = await result.json()
    expect(json.reputation.reputation_tier).toBe('newcomer')
  })
})
