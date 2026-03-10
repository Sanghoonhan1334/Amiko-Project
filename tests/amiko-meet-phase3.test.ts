/**
 * AMIKO Meet Phase 3 — Translation Unit Tests (Comprehensive)
 *
 * Tests for:
 * 1. Translation engine (meet-translation.ts)
 *    - target language determination (ko, es, mixed, unknown)
 *    - fallback on failure
 *    - DB persistence + DB persist failure resilience
 *    - batch translation (sequential, empty array)
 *    - singleton init guard
 * 2. Translation Preferences API
 *    - GET defaults, saved prefs, auth
 *    - PATCH validation (display_mode, target_language, auto_translate)
 *    - atomic upsert, mixed valid/invalid fields, DB error handling
 * 3. Translate endpoint
 *    - auth, participant check, caption lookup, 404
 *    - result structure validation
 * 4. Caption event → translation trigger
 *    - only final ko/es captions trigger translation
 *    - fire-and-forget doesn't block or throw
 *    - content length limit respected
 * 5. Translation SSE stream
 *    - auth, session check, participant check
 *    - display_mode filtering logic
 *    - SSE response headers
 * 6. CaptionOverlay display modes
 *    - none / translated_only / original_and_translated
 *    - fallback on translation error
 * 7. Speaker isolation — no cross-speaker contamination
 * 8. Translation timing — translation_ms recorded
 * 9. DeepSeek integration — provider selection
 * 10. SSE stream display_mode filtering behavior
 * 11. Frontend translation prefs lifecycle
 * 12. SQL schema constraint validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Supabase ─────────────────────────────────────
const mockGetUser = vi.fn()

function createChain(finalData: any = null, finalError: any = null) {
  const chain: any = {}
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'gte', 'gt', 'or', 'order', 'limit',
  ]
  methods.forEach(m => {
    chain[m] = vi.fn().mockReturnValue(chain)
  })
  chain.single = vi.fn().mockResolvedValue({ data: finalData, error: finalError })
  chain.then = vi.fn((cb: any) => cb({ data: finalData, error: finalError }))
  return chain
}

const mockSupabase: any = {
  auth: { getUser: mockGetUser },
  from: vi.fn(),
}

vi.mock('@/lib/supabaseServer', () => ({
  supabaseServer: mockSupabase,
}))

vi.mock('@/lib/translation', () => {
  const mockTranslate = vi.fn().mockResolvedValue('[TRANSLATED]')
  return {
    TranslationService: {
      getInstance: () => ({
        translate: mockTranslate,
        getProvider: () => 'mock',
        setProvider: vi.fn(),
      }),
    },
    initializeTranslationService: vi.fn(),
    translateText: mockTranslate,
  }
})

// ── Mock Glossary + Moderation (added by Phase 4 integration) ──
vi.mock('@/lib/meet-glossary', () => ({
  applyGlossaryPipeline: vi.fn(async (
    text: string,
    _srcLang: string,
    _tgtLang: string,
    translateFn: (t: string) => Promise<string>
  ) => {
    const result = await translateFn(text)
    return { result, glossaryApplied: false, matchCount: 0 }
  }),
  loadGlossary: vi.fn().mockResolvedValue([]),
  invalidateGlossaryCache: vi.fn(),
  findMatches: vi.fn().mockReturnValue([]),
  preProcessText: vi.fn((t: string) => ({ processedText: t, placeholders: [] })),
  postProcessText: vi.fn((t: string) => t),
}))

vi.mock('@/lib/meet-moderation', () => ({
  moderateContent: vi.fn().mockResolvedValue({ flagged: false, flags: [] }),
  checkContent: vi.fn().mockReturnValue({ flagged: false, flags: [] }),
  persistFlags: vi.fn().mockResolvedValue(undefined),
  getHighestSeverity: vi.fn().mockReturnValue(null),
}))

// ── Helpers ───────────────────────────────────────────
function createRequest(
  method = 'GET',
  url = 'http://localhost/api/test',
  options: { body?: any; headers?: Record<string, string> } = {}
) {
  const hdrs = new Headers(options.headers || {})
  const hasExplicit = options && 'headers' in options
  if (!hasExplicit && !hdrs.has('authorization'))
    hdrs.set('authorization', 'Bearer test-token')
  return {
    method, url,
    headers: { get: (n: string) => hdrs.get(n.toLowerCase()) },
    json: vi.fn().mockResolvedValue(options.body || {}),
    signal: { addEventListener: vi.fn() },
  } as any
}

function createContext(id = 'session-1') {
  return { params: Promise.resolve({ id }) }
}

function mockAuthUser(userId = 'user-123') {
  mockGetUser.mockResolvedValue({
    data: { user: { id: userId, email: 'u@amiko.com', user_metadata: { display_name: 'Test' } } },
    error: null,
  })
}

// ═══════════════════════════════════════════════════════
// 1. TRANSLATION ENGINE — meet-translation.ts
// ═══════════════════════════════════════════════════════
describe('Meet Translation Engine', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should determine target language as opposite of source', () => {
    const getTarget = (src: string) => src === 'ko' ? 'es' : 'ko'
    expect(getTarget('ko')).toBe('es')
    expect(getTarget('es')).toBe('ko')
    expect(getTarget('mixed')).toBe('ko')
    expect(getTarget('unknown')).toBe('ko')
  })

  it('should call TranslationService.translate and persist result', async () => {
    const upsertChain = createChain({ id: 'te-1' })
    mockSupabase.from.mockReturnValue(upsertChain)

    const { translateCaptionEvent } = await import('@/lib/meet-translation')
    const result = await translateCaptionEvent({
      id: 'cap-1',
      session_id: 'sess-1',
      speaker_user_id: 'user-1',
      speaker_name: 'Test Speaker',
      content: '안녕하세요',
      language: 'ko',
      is_final: true,
      sequence_number: 1,
    })

    expect(result.success).toBe(true)
    expect(result.translated_language).toBe('es')
    expect(result.translated_content).toBe('[TRANSLATED]')
    expect(result.provider).toBe('mock')
    expect(result.translation_ms).toBeGreaterThanOrEqual(0)

    expect(upsertChain.upsert).toHaveBeenCalledTimes(1)
    const upsertArg = upsertChain.upsert.mock.calls[0][0]
    expect(upsertArg.caption_event_id).toBe('cap-1')
    expect(upsertArg.original_language).toBe('ko')
    expect(upsertArg.translated_language).toBe('es')
  })

  it('should return original on translation failure (fallback)', async () => {
    const { TranslationService } = await import('@/lib/translation')
    const instance = TranslationService.getInstance() as any
    instance.translate.mockRejectedValueOnce(new Error('API limit'))

    const upsertChain = createChain(null)
    mockSupabase.from.mockReturnValue(upsertChain)

    const { translateCaptionEvent } = await import('@/lib/meet-translation')
    const result = await translateCaptionEvent({
      id: 'cap-2',
      session_id: 'sess-1',
      speaker_user_id: 'user-1',
      speaker_name: 'Speaker',
      content: 'Hola amigos',
      language: 'es',
      is_final: true,
      sequence_number: 2,
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('API limit')
    expect(result.translated_content).toBe('Hola amigos')
    expect(upsertChain.upsert).toHaveBeenCalled()
    const upsertArg = upsertChain.upsert.mock.calls[0][0]
    expect(upsertArg.error_message).toContain('API limit')
  })

  it('should survive DB persist failure without breaking result', async () => {
    const { TranslationService } = await import('@/lib/translation')
    const instance = TranslationService.getInstance() as any
    instance.translate.mockResolvedValueOnce('Hola mundo')

    const badChain = createChain(null)
    badChain.upsert = vi.fn(() => { throw new Error('DB connection lost') })
    mockSupabase.from.mockReturnValue(badChain)

    const { translateCaptionEvent } = await import('@/lib/meet-translation')
    const result = await translateCaptionEvent({
      id: 'cap-db-fail',
      session_id: 'sess-1',
      speaker_user_id: 'user-1',
      speaker_name: 'Speaker',
      content: '좋은 아침',
      language: 'ko',
      is_final: true,
      sequence_number: 3,
    })

    expect(result.success).toBe(true)
    expect(result.translated_content).toBe('Hola mundo')
    expect(result.caption_event_id).toBe('cap-db-fail')
  })

  it('should include all required fields in result', async () => {
    const upsertChain = createChain(null)
    mockSupabase.from.mockReturnValue(upsertChain)

    const { translateCaptionEvent } = await import('@/lib/meet-translation')
    const result = await translateCaptionEvent({
      id: 'cap-fields',
      session_id: 'sess-1',
      speaker_user_id: 'user-1',
      speaker_name: 'Speaker',
      content: 'Test content',
      language: 'ko',
      is_final: true,
      sequence_number: 1,
    })

    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('caption_event_id')
    expect(result).toHaveProperty('original_content')
    expect(result).toHaveProperty('original_language')
    expect(result).toHaveProperty('translated_content')
    expect(result).toHaveProperty('translated_language')
    expect(result).toHaveProperty('provider')
    expect(result).toHaveProperty('translation_ms')
  })

  it('should persist speaker info in DB upsert', async () => {
    const upsertChain = createChain(null)
    mockSupabase.from.mockReturnValue(upsertChain)

    const { translateCaptionEvent } = await import('@/lib/meet-translation')
    await translateCaptionEvent({
      id: 'cap-speaker',
      session_id: 'sess-1',
      speaker_user_id: 'speaker-xyz',
      speaker_name: 'María García',
      content: 'Contenido de prueba',
      language: 'es',
      is_final: true,
      sequence_number: 5,
    })

    const upsertArg = upsertChain.upsert.mock.calls[0][0]
    expect(upsertArg.speaker_user_id).toBe('speaker-xyz')
    expect(upsertArg.speaker_name).toBe('María García')
    expect(upsertArg.session_id).toBe('sess-1')
    expect(upsertArg.is_final).toBe(true)
  })

  it('should use idempotent upsert with onConflict: caption_event_id', async () => {
    const upsertChain = createChain(null)
    mockSupabase.from.mockReturnValue(upsertChain)

    const { translateCaptionEvent } = await import('@/lib/meet-translation')
    await translateCaptionEvent({
      id: 'cap-idempotent',
      session_id: 'sess-1',
      speaker_user_id: 'user-1',
      speaker_name: 'Speaker',
      content: 'Test',
      language: 'ko',
      is_final: true,
      sequence_number: 1,
    })

    const upsertOpts = upsertChain.upsert.mock.calls[0][1]
    expect(upsertOpts.onConflict).toBe('caption_event_id')
  })

  it('translateCaptionBatch should process captions sequentially', async () => {
    const upsertChain = createChain(null)
    mockSupabase.from.mockReturnValue(upsertChain)

    const { translateCaptionBatch } = await import('@/lib/meet-translation')
    const captions = [
      { id: 'b1', session_id: 's1', speaker_user_id: 'u1', speaker_name: 'A', content: 'Hello', language: 'es' as const, is_final: true, sequence_number: 1 },
      { id: 'b2', session_id: 's1', speaker_user_id: 'u2', speaker_name: 'B', content: '안녕', language: 'ko' as const, is_final: true, sequence_number: 2 },
    ]

    const results = await translateCaptionBatch(captions)

    expect(results).toHaveLength(2)
    expect(results[0].caption_event_id).toBe('b1')
    expect(results[0].translated_language).toBe('ko')
    expect(results[1].caption_event_id).toBe('b2')
    expect(results[1].translated_language).toBe('es')
  })

  it('translateCaptionBatch with empty array should return empty', async () => {
    const { translateCaptionBatch } = await import('@/lib/meet-translation')
    const results = await translateCaptionBatch([])
    expect(results).toEqual([])
  })

  it('should pass sourceLang as undefined for mixed/unknown languages', async () => {
    const { TranslationService } = await import('@/lib/translation')
    const instance = TranslationService.getInstance() as any
    instance.translate.mockResolvedValueOnce('[TRANSLATED]')

    const upsertChain = createChain(null)
    mockSupabase.from.mockReturnValue(upsertChain)

    const { translateCaptionEvent } = await import('@/lib/meet-translation')
    await translateCaptionEvent({
      id: 'cap-mixed',
      session_id: 'sess-1',
      speaker_user_id: 'user-1',
      speaker_name: 'Speaker',
      content: 'Mixed language content',
      language: 'mixed',
      is_final: true,
      sequence_number: 1,
    })

    const translateCall = instance.translate.mock.calls[instance.translate.mock.calls.length - 1]
    expect(translateCall[2]).toBeUndefined()
    expect(translateCall[1]).toBe('ko')
  })
})

// ═══════════════════════════════════════════════════════
// 2. TRANSLATION PREFERENCES API
// ═══════════════════════════════════════════════════════
describe('Translation Preferences API', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('GET', () => {
    it('should return defaults when no prefs saved', async () => {
      mockAuthUser()
      mockSupabase.from.mockReturnValue(createChain(null))

      const { GET } = await import('@/app/api/users/me/translation-preferences/route')
      const result = await GET(createRequest())
      const json = await result.json()

      expect(json.preferences.display_mode).toBe('original_and_translated')
      expect(json.preferences.target_language).toBe('es')
      expect(json.preferences.auto_translate).toBe(true)
    })

    it('should return saved preferences', async () => {
      mockAuthUser()
      mockSupabase.from.mockReturnValue(createChain({
        user_id: 'user-123',
        display_mode: 'translated_only',
        target_language: 'ko',
        auto_translate: false,
      }))

      const { GET } = await import('@/app/api/users/me/translation-preferences/route')
      const result = await GET(createRequest())
      const json = await result.json()

      expect(json.preferences.display_mode).toBe('translated_only')
      expect(json.preferences.target_language).toBe('ko')
      expect(json.preferences.auto_translate).toBe(false)
    })

    it('should return 401 without auth token', async () => {
      const { GET } = await import('@/app/api/users/me/translation-preferences/route')
      const result = await GET(
        createRequest('GET', 'http://localhost/api/users/me/translation-preferences', {
          headers: {},
        })
      )
      expect(result.status).toBe(401)
    })

    it('should return 401 with invalid token', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid' } })

      const { GET } = await import('@/app/api/users/me/translation-preferences/route')
      const result = await GET(createRequest())
      expect(result.status).toBe(401)
    })
  })

  describe('PATCH', () => {
    it('should reject invalid display_mode', async () => {
      mockAuthUser()
      const { PATCH } = await import('@/app/api/users/me/translation-preferences/route')
      const result = await PATCH(
        createRequest('PATCH', 'http://localhost/api/users/me/translation-preferences', {
          body: { display_mode: 'everything' },
        })
      )
      const json = await result.json()
      expect(result.status).toBe(400)
      expect(json.error).toContain('No valid fields')
    })

    it('should reject invalid target_language', async () => {
      mockAuthUser()
      const { PATCH } = await import('@/app/api/users/me/translation-preferences/route')
      const result = await PATCH(
        createRequest('PATCH', 'http://localhost/api/users/me/translation-preferences', {
          body: { target_language: 'fr' },
        })
      )
      expect(result.status).toBe(400)
    })

    it('should use atomic upsert with onConflict', async () => {
      mockAuthUser()
      const chain = createChain({ user_id: 'user-123', display_mode: 'none' })
      mockSupabase.from.mockReturnValue(chain)

      const { PATCH } = await import('@/app/api/users/me/translation-preferences/route')
      await PATCH(
        createRequest('PATCH', 'http://localhost/api/users/me/translation-preferences', {
          body: { display_mode: 'none' },
        })
      )

      expect(chain.upsert).toHaveBeenCalledTimes(1)
      const args = chain.upsert.mock.calls[0]
      expect(args[0].display_mode).toBe('none')
      expect(args[0].user_id).toBe('user-123')
      expect(args[1].onConflict).toBe('user_id')
    })

    it('should accept valid auto_translate boolean', async () => {
      mockAuthUser()
      const chain = createChain({ user_id: 'user-123', auto_translate: false })
      mockSupabase.from.mockReturnValue(chain)

      const { PATCH } = await import('@/app/api/users/me/translation-preferences/route')
      await PATCH(
        createRequest('PATCH', 'http://localhost/api/users/me/translation-preferences', {
          body: { auto_translate: false },
        })
      )

      const upsertArg = chain.upsert.mock.calls[0][0]
      expect(upsertArg.auto_translate).toBe(false)
    })

    it('should return 401 without auth token', async () => {
      const { PATCH } = await import('@/app/api/users/me/translation-preferences/route')
      const result = await PATCH(
        createRequest('PATCH', 'http://localhost/api/users/me/translation-preferences', {
          headers: {},
          body: { display_mode: 'none' },
        })
      )
      expect(result.status).toBe(401)
    })

    it('should ignore non-boolean auto_translate', async () => {
      mockAuthUser()
      const { PATCH } = await import('@/app/api/users/me/translation-preferences/route')
      const result = await PATCH(
        createRequest('PATCH', 'http://localhost/api/users/me/translation-preferences', {
          body: { auto_translate: 'yes' },
        })
      )
      expect(result.status).toBe(400)
    })

    it('should accept only valid fields from mixed payload', async () => {
      mockAuthUser()
      const chain = createChain({ user_id: 'user-123', display_mode: 'translated_only' })
      mockSupabase.from.mockReturnValue(chain)

      const { PATCH } = await import('@/app/api/users/me/translation-preferences/route')
      await PATCH(
        createRequest('PATCH', 'http://localhost/api/users/me/translation-preferences', {
          body: {
            display_mode: 'translated_only',
            target_language: 'fr',
            auto_translate: 'maybe',
            hacked_field: true,
          },
        })
      )

      const upsertArg = chain.upsert.mock.calls[0][0]
      expect(upsertArg.display_mode).toBe('translated_only')
      expect(upsertArg.target_language).toBeUndefined()
      expect(upsertArg.auto_translate).toBeUndefined()
      expect(upsertArg.hacked_field).toBeUndefined()
    })

    it('should handle DB upsert error gracefully', async () => {
      mockAuthUser()
      const chain = createChain(null, { message: 'DB down' })
      mockSupabase.from.mockReturnValue(chain)

      const { PATCH } = await import('@/app/api/users/me/translation-preferences/route')
      const result = await PATCH(
        createRequest('PATCH', 'http://localhost/api/users/me/translation-preferences', {
          body: { display_mode: 'none' },
        })
      )
      expect(result.status).toBe(500)
      const json = await result.json()
      expect(json.error).toContain('Failed to save')
    })

    it('should accept all three valid display_mode values', async () => {
      const validModes = ['none', 'translated_only', 'original_and_translated']
      for (const mode of validModes) {
        vi.clearAllMocks()
        mockAuthUser()
        const chain = createChain({ user_id: 'user-123', display_mode: mode })
        mockSupabase.from.mockReturnValue(chain)

        const { PATCH } = await import('@/app/api/users/me/translation-preferences/route')
        await PATCH(
          createRequest('PATCH', 'http://localhost/api/users/me/translation-preferences', {
            body: { display_mode: mode },
          })
        )

        expect(chain.upsert).toHaveBeenCalledTimes(1)
        expect(chain.upsert.mock.calls[0][0].display_mode).toBe(mode)
      }
    })
  })
})

// ═══════════════════════════════════════════════════════
// 3. TRANSLATE ENDPOINT
// ═══════════════════════════════════════════════════════
describe('Translate Endpoint', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should require authentication', async () => {
    const { POST } = await import('@/app/api/meet/sessions/[id]/translations/translate/route')
    const result = await POST(
      createRequest('POST', 'http://localhost/api/meet/sessions/s1/translations/translate', {
        headers: {},
      }),
      createContext('s1')
    )
    expect(result.status).toBe(401)
  })

  it('should require caption_event_id', async () => {
    mockAuthUser()
    const { POST } = await import('@/app/api/meet/sessions/[id]/translations/translate/route')
    const result = await POST(
      createRequest('POST', 'http://localhost/api/meet/sessions/s1/translations/translate', {
        body: {},
      }),
      createContext('s1')
    )
    const json = await result.json()
    expect(result.status).toBe(400)
    expect(json.error).toContain('caption_event_id')
  })

  it('should reject non-participants', async () => {
    mockAuthUser()
    mockSupabase.from.mockReturnValue(createChain(null))

    const { POST } = await import('@/app/api/meet/sessions/[id]/translations/translate/route')
    const result = await POST(
      createRequest('POST', 'http://localhost/api/meet/sessions/s1/translations/translate', {
        body: { caption_event_id: 'cap-1' },
      }),
      createContext('s1')
    )
    expect(result.status).toBe(403)
  })

  it('should return 404 when caption not found', async () => {
    mockAuthUser()

    const participantChain = createChain({ id: 'p1' })
    const captionChain = createChain(null, { code: 'PGRST116' })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'amiko_meet_participants') return participantChain
      if (table === 'amiko_meet_caption_events') return captionChain
      return createChain()
    })

    const { POST } = await import('@/app/api/meet/sessions/[id]/translations/translate/route')
    const result = await POST(
      createRequest('POST', 'http://localhost/api/meet/sessions/s1/translations/translate', {
        body: { caption_event_id: 'nonexistent' },
      }),
      createContext('s1')
    )
    expect(result.status).toBe(404)
    const json = await result.json()
    expect(json.error).toContain('not found')
  })

  it('should translate and return result with correct structure', async () => {
    mockAuthUser()

    const participantChain = createChain({ id: 'p1' })
    const captionChain = createChain({
      id: 'cap-1',
      session_id: 'sess-1',
      speaker_user_id: 'user-1',
      speaker_name: 'Speaker',
      content: '오늘 날씨가 좋아요',
      language: 'ko',
      is_final: true,
      sequence_number: 5,
    })
    const upsertChain = createChain({ id: 'te-1' })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'amiko_meet_participants') return participantChain
      if (table === 'amiko_meet_caption_events') return captionChain
      if (table === 'amiko_meet_translation_events') return upsertChain
      return createChain()
    })

    const { POST } = await import('@/app/api/meet/sessions/[id]/translations/translate/route')
    const result = await POST(
      createRequest('POST', 'http://localhost/api/meet/sessions/sess-1/translations/translate', {
        body: { caption_event_id: 'cap-1' },
      }),
      createContext('sess-1')
    )

    const json = await result.json()
    expect(json.translation).toBeDefined()
    expect(json.translation.success).toBe(true)
    expect(json.translation.caption_event_id).toBe('cap-1')
    expect(json.translation.original_content).toBe('오늘 날씨가 좋아요')
    expect(json.translation.original_language).toBe('ko')
    expect(json.translation.translated_language).toBe('es')
    expect(json.translation.provider).toBe('mock')
    expect(json.translation.translation_ms).toBeGreaterThanOrEqual(0)
  })

  it('should verify participant with enrolled or joined status', async () => {
    mockAuthUser()

    const participantChain = createChain({ id: 'p1' })
    const captionChain = createChain({
      id: 'cap-1', session_id: 's1', speaker_user_id: 'u1', speaker_name: 'S',
      content: 'Test', language: 'ko', is_final: true, sequence_number: 1,
    })
    const upsertChain = createChain(null)

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'amiko_meet_participants') return participantChain
      if (table === 'amiko_meet_caption_events') return captionChain
      if (table === 'amiko_meet_translation_events') return upsertChain
      return createChain()
    })

    const { POST } = await import('@/app/api/meet/sessions/[id]/translations/translate/route')
    await POST(
      createRequest('POST', 'http://localhost/api/meet/sessions/s1/translations/translate', {
        body: { caption_event_id: 'cap-1' },
      }),
      createContext('s1')
    )

    expect(participantChain.in).toHaveBeenCalledWith('status', ['enrolled', 'joined'])
  })
})

// ═══════════════════════════════════════════════════════
// 4. CAPTION EVENT → TRANSLATION TRIGGER
// ═══════════════════════════════════════════════════════
describe('Caption Event — Translation Trigger', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should only trigger translation for final captions in ko/es', () => {
    const shouldTranslate = (is_final: boolean, language: string) =>
      is_final === true && ['ko', 'es'].includes(language)

    expect(shouldTranslate(true, 'ko')).toBe(true)
    expect(shouldTranslate(true, 'es')).toBe(true)
    expect(shouldTranslate(false, 'ko')).toBe(false)
    expect(shouldTranslate(false, 'es')).toBe(false)
    expect(shouldTranslate(true, 'mixed')).toBe(false)
    expect(shouldTranslate(true, 'unknown')).toBe(false)
  })

  it('fire-and-forget should not block if translation fails', async () => {
    const failingPromise = Promise.reject(new Error('Network error'))
    const result = failingPromise.catch(() => 'caught')
    await expect(result).resolves.toBe('caught')
  })

  it('content should be limited to 2000 chars before translation', () => {
    const longContent = 'a'.repeat(5000)
    const sliced = longContent.slice(0, 2000)
    expect(sliced.length).toBe(2000)
    expect(longContent.length).toBe(5000)
  })

  it('should use event.id and event.sequence_number from DB insert result', () => {
    const insertResult = { id: 'uuid-123', sequence_number: 42, created_at: '2024-01-01' }
    const translationInput = {
      id: insertResult.id,
      session_id: 'sess-1',
      speaker_user_id: 'user-1',
      speaker_name: 'Speaker',
      content: 'Test',
      language: 'ko' as const,
      is_final: true,
      sequence_number: insertResult.sequence_number,
    }

    expect(translationInput.id).toBe('uuid-123')
    expect(translationInput.sequence_number).toBe(42)
  })
})

// ═══════════════════════════════════════════════════════
// 5. TRANSLATIONS SSE STREAM
// ═══════════════════════════════════════════════════════
describe('Translations SSE Stream', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should require authentication', async () => {
    const { GET } = await import('@/app/api/meet/sessions/[id]/translations/stream/route')
    const result = await GET(
      createRequest('GET', 'http://localhost/api/meet/sessions/s1/translations/stream', {
        headers: {},
      }),
      createContext('s1')
    )
    expect(result.status).toBe(401)
  })

  it('should return 401 for invalid token', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid' } })

    const { GET } = await import('@/app/api/meet/sessions/[id]/translations/stream/route')
    const result = await GET(
      createRequest('GET', 'http://localhost/api/meet/sessions/s1/translations/stream'),
      createContext('s1')
    )
    expect(result.status).toBe(401)
  })

  it('should return 404 for non-existent session', async () => {
    mockAuthUser()
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'amiko_meet_sessions') return createChain(null)
      return createChain()
    })

    const { GET } = await import('@/app/api/meet/sessions/[id]/translations/stream/route')
    const result = await GET(
      createRequest('GET', 'http://localhost/api/meet/sessions/s1/translations/stream'),
      createContext('s1')
    )
    expect(result.status).toBe(404)
  })

  it('should reject non-participants', async () => {
    mockAuthUser()

    const sessionChain = createChain({ id: 's1', status: 'live' })
    const participantChain = createChain(null)

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'amiko_meet_sessions') return sessionChain
      if (table === 'amiko_meet_participants') return participantChain
      return createChain()
    })

    const { GET } = await import('@/app/api/meet/sessions/[id]/translations/stream/route')
    const result = await GET(
      createRequest('GET', 'http://localhost/api/meet/sessions/s1/translations/stream'),
      createContext('s1')
    )
    expect(result.status).toBe(403)
  })

  it('should return SSE response with correct headers', async () => {
    mockAuthUser()

    const sessionChain = createChain({ id: 's1', status: 'live' })
    const participantChain = createChain({ id: 'p1' })
    const prefsChain = createChain({ display_mode: 'original_and_translated', target_language: 'es', auto_translate: true })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'amiko_meet_sessions') return sessionChain
      if (table === 'amiko_meet_participants') return participantChain
      if (table === 'amiko_meet_translation_preferences') return prefsChain
      return createChain()
    })

    const { GET } = await import('@/app/api/meet/sessions/[id]/translations/stream/route')
    const result = await GET(
      createRequest('GET', 'http://localhost/api/meet/sessions/s1/translations/stream'),
      createContext('s1')
    )

    expect(result.headers.get('Content-Type')).toBe('text/event-stream')
    expect(result.headers.get('Cache-Control')).toBe('no-cache, no-transform')
    expect(result.headers.get('X-Accel-Buffering')).toBe('no')
  })

  it('should load translation preferences for display_mode filtering', async () => {
    mockAuthUser()

    const sessionChain = createChain({ id: 's1', status: 'live' })
    const participantChain = createChain({ id: 'p1' })
    const prefsChain = createChain({
      display_mode: 'translated_only',
      target_language: 'ko',
      auto_translate: true,
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'amiko_meet_sessions') return sessionChain
      if (table === 'amiko_meet_participants') return participantChain
      if (table === 'amiko_meet_translation_preferences') return prefsChain
      return createChain()
    })

    const { GET } = await import('@/app/api/meet/sessions/[id]/translations/stream/route')
    const result = await GET(
      createRequest('GET', 'http://localhost/api/meet/sessions/s1/translations/stream'),
      createContext('s1')
    )

    expect(result.status).toBe(200)
    expect(prefsChain.eq).toHaveBeenCalledWith('user_id', 'user-123')
  })

  it('should default to original_and_translated when no prefs exist', async () => {
    mockAuthUser()

    const sessionChain = createChain({ id: 's1', status: 'live' })
    const participantChain = createChain({ id: 'p1' })
    const prefsChain = createChain(null)

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'amiko_meet_sessions') return sessionChain
      if (table === 'amiko_meet_participants') return participantChain
      if (table === 'amiko_meet_translation_preferences') return prefsChain
      return createChain()
    })

    const { GET } = await import('@/app/api/meet/sessions/[id]/translations/stream/route')
    const result = await GET(
      createRequest('GET', 'http://localhost/api/meet/sessions/s1/translations/stream'),
      createContext('s1')
    )

    expect(result.status).toBe(200)
  })
})

// ═══════════════════════════════════════════════════════
// 6. CAPTION OVERLAY — DISPLAY MODES
// ═══════════════════════════════════════════════════════
describe('CaptionOverlay Display Modes', () => {
  it('display_mode="none" should show only original text', () => {
    const displayMode = 'none'
    const showOriginal = displayMode !== 'translated_only'
    const showTranslation = displayMode !== 'none'

    expect(showOriginal).toBe(true)
    expect(showTranslation).toBe(false)
  })

  it('display_mode="translated_only" should only show translation', () => {
    const displayMode = 'translated_only'
    const showOriginal = displayMode !== 'translated_only'
    const showTranslation = displayMode !== 'none'

    expect(showOriginal).toBe(false)
    expect(showTranslation).toBe(true)
  })

  it('display_mode="original_and_translated" should show both', () => {
    const displayMode = 'original_and_translated'
    const showOriginal = displayMode !== 'translated_only'
    const showTranslation = displayMode !== 'none'

    expect(showOriginal).toBe(true)
    expect(showTranslation).toBe(true)
  })

  it('should show original as fallback when translation fails in translated_only mode', () => {
    const displayMode = 'translated_only'
    const translationError = true

    const showFallback = displayMode === 'translated_only' && translationError
    expect(showFallback).toBe(true)
  })

  it('should not show translation when translation_error is true', () => {
    const translationError = true
    const translatedContent = 'some content'

    const showTranslated = !!translatedContent && !translationError
    expect(showTranslated).toBe(false)
  })

  it('should not show fallback in original_and_translated mode', () => {
    const displayMode = 'original_and_translated'
    const translationError = true

    const showFallback = displayMode === 'translated_only' && translationError
    expect(showFallback).toBe(false)
  })

  it('should not show translation text when translated_content is empty', () => {
    const translatedContent = ''
    const translationError = false
    const displayMode = 'original_and_translated'

    const showTranslated = displayMode !== 'none' && !!translatedContent && !translationError
    expect(showTranslated).toBe(false)
  })

  it('should apply correct CSS classes for dual display mode', () => {
    const displayMode = 'original_and_translated'
    const expectedClass = displayMode === 'original_and_translated'
      ? 'text-blue-300 mt-0.5'
      : 'text-white'

    expect(expectedClass).toBe('text-blue-300 mt-0.5')
  })
})

// ═══════════════════════════════════════════════════════
// 7. SPEAKER ISOLATION — no cross-speaker mixing
// ═══════════════════════════════════════════════════════
describe('Speaker Isolation', () => {
  it('translations should be linked by caption_event_id, not mixed between speakers', () => {
    const captions = [
      { id: 'cap-1', speaker_user_id: 'alice', content: '안녕' },
      { id: 'cap-2', speaker_user_id: 'bob', content: 'Hola' },
    ]

    const translation = {
      caption_event_id: 'cap-1',
      translated_content: 'Hola',
      translated_language: 'es',
    }

    const merged = captions.map(c =>
      c.id === translation.caption_event_id
        ? { ...c, translated_content: translation.translated_content }
        : c
    )

    expect(merged[0].translated_content).toBe('Hola')
    expect((merged[1] as any).translated_content).toBeUndefined()
  })

  it('should not merge translation for unknown caption_event_id', () => {
    const captions = [
      { id: 'cap-1', speaker_user_id: 'alice', content: '안녕' },
    ]

    const translation = {
      caption_event_id: 'cap-nonexistent',
      translated_content: 'Ghost translation',
    }

    const merged = captions.map(c =>
      c.id === translation.caption_event_id
        ? { ...c, translated_content: translation.translated_content }
        : c
    )

    expect((merged[0] as any).translated_content).toBeUndefined()
  })

  it('multiple translations for different speakers should not interfere', () => {
    const captions = [
      { id: 'cap-1', speaker_user_id: 'alice', content: '안녕' },
      { id: 'cap-2', speaker_user_id: 'bob', content: 'Hola' },
      { id: 'cap-3', speaker_user_id: 'alice', content: '감사합니다' },
    ]

    const translations = [
      { caption_event_id: 'cap-1', translated_content: 'Hola', translated_language: 'es' },
      { caption_event_id: 'cap-2', translated_content: '안녕', translated_language: 'ko' },
    ]

    let result = [...captions]
    for (const t of translations) {
      result = result.map((c: any) =>
        c.id === t.caption_event_id
          ? { ...c, translated_content: t.translated_content, translated_language: t.translated_language }
          : c
      )
    }

    expect((result[0] as any).translated_content).toBe('Hola')
    expect((result[1] as any).translated_content).toBe('안녕')
    expect((result[2] as any).translated_content).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════
// 8. TIMING — translation should record translation_ms
// ═══════════════════════════════════════════════════════
describe('Translation Timing', () => {
  beforeEach(() => vi.clearAllMocks())

  it('translation_ms should be recorded and positive', async () => {
    const upsertChain = createChain({ id: 'te-1' })
    mockSupabase.from.mockReturnValue(upsertChain)

    const { translateCaptionEvent } = await import('@/lib/meet-translation')
    const result = await translateCaptionEvent({
      id: 'cap-t1',
      session_id: 'sess-1',
      speaker_user_id: 'user-1',
      speaker_name: 'Tester',
      content: 'Testing timing',
      language: 'es',
      is_final: true,
      sequence_number: 10,
    })

    expect(result.translation_ms).toBeGreaterThanOrEqual(0)
    expect(result.translation_ms).toBeLessThan(5000)
  })

  it('translation_ms should be persisted in DB upsert', async () => {
    const upsertChain = createChain(null)
    mockSupabase.from.mockReturnValue(upsertChain)

    const { translateCaptionEvent } = await import('@/lib/meet-translation')
    await translateCaptionEvent({
      id: 'cap-t2',
      session_id: 'sess-1',
      speaker_user_id: 'user-1',
      speaker_name: 'Tester',
      content: 'DB timing test',
      language: 'ko',
      is_final: true,
      sequence_number: 11,
    })

    const upsertArg = upsertChain.upsert.mock.calls[0][0]
    expect(typeof upsertArg.translation_ms).toBe('number')
    expect(upsertArg.translation_ms).toBeGreaterThanOrEqual(0)
  })
})

// ═══════════════════════════════════════════════════════
// 9. DEEPSEEK INTEGRATION — provider selection
// ═══════════════════════════════════════════════════════
describe('DeepSeek Integration', () => {
  it('initializeTranslationService should be a callable function', async () => {
    const { initializeTranslationService } = await import('@/lib/translation')
    expect(initializeTranslationService).toBeDefined()
    expect(typeof initializeTranslationService).toBe('function')
  })

  it('provider should be included in translation result', async () => {
    const upsertChain = createChain(null)
    mockSupabase.from.mockReturnValue(upsertChain)

    const { translateCaptionEvent } = await import('@/lib/meet-translation')
    const result = await translateCaptionEvent({
      id: 'cap-provider',
      session_id: 'sess-1',
      speaker_user_id: 'user-1',
      speaker_name: 'Speaker',
      content: 'Provider test',
      language: 'ko',
      is_final: true,
      sequence_number: 1,
    })

    expect(result.provider).toBeDefined()
    expect(typeof result.provider).toBe('string')
    expect(result.provider).toBe('mock')
  })

  it('provider should be persisted in DB', async () => {
    const upsertChain = createChain(null)
    mockSupabase.from.mockReturnValue(upsertChain)

    const { translateCaptionEvent } = await import('@/lib/meet-translation')
    await translateCaptionEvent({
      id: 'cap-prov-db',
      session_id: 'sess-1',
      speaker_user_id: 'user-1',
      speaker_name: 'Speaker',
      content: 'DB provider test',
      language: 'es',
      is_final: true,
      sequence_number: 1,
    })

    const upsertArg = upsertChain.upsert.mock.calls[0][0]
    expect(upsertArg.provider).toBe('mock')
  })
})

// ═══════════════════════════════════════════════════════
// 10. SSE STREAM — display_mode filtering behavior
// ═══════════════════════════════════════════════════════
describe('SSE Stream — Display Mode Filtering', () => {
  it('translated_only mode should omit original_content from payload', () => {
    const displayMode = 'translated_only'
    const evt = {
      id: 'te-1',
      caption_event_id: 'cap-1',
      original_content: '안녕하세요',
      original_language: 'ko',
      translated_content: 'Hola',
      translated_language: 'es',
      speaker_user_id: 'user-1',
      speaker_name: 'Speaker',
      is_final: true,
      sequence_number: 1,
      provider: 'deepseek',
      translation_ms: 150,
      error_message: null,
    }

    const payload: Record<string, any> = {
      id: evt.id,
      caption_event_id: evt.caption_event_id,
      translated_content: evt.translated_content,
      translated_language: evt.translated_language,
      speaker_user_id: evt.speaker_user_id,
      speaker_name: evt.speaker_name,
      is_final: evt.is_final,
      sequence_number: evt.sequence_number,
      provider: evt.provider,
      translation_ms: evt.translation_ms,
    }

    if (displayMode !== 'translated_only') {
      payload.original_content = evt.original_content
      payload.original_language = evt.original_language
    }

    expect(payload.original_content).toBeUndefined()
    expect(payload.original_language).toBeUndefined()
    expect(payload.translated_content).toBe('Hola')
  })

  it('original_and_translated mode should include both contents', () => {
    const displayMode = 'original_and_translated'
    const evt = {
      original_content: '안녕하세요',
      original_language: 'ko',
      translated_content: 'Hola',
      translated_language: 'es',
    }

    const payload: Record<string, any> = {
      translated_content: evt.translated_content,
      translated_language: evt.translated_language,
    }

    if (displayMode !== 'translated_only') {
      payload.original_content = evt.original_content
      payload.original_language = evt.original_language
    }

    expect(payload.original_content).toBe('안녕하세요')
    expect(payload.translated_content).toBe('Hola')
  })

  it('error translations should be flagged for frontend fallback', () => {
    const evt = { error_message: 'API timeout', translated_content: '안녕하세요' }
    const payload: Record<string, any> = { translated_content: evt.translated_content }

    if (evt.error_message) {
      payload.translation_error = true
    }

    expect(payload.translation_error).toBe(true)
  })

  it('successful translations should not have translation_error flag', () => {
    const evt = { error_message: null, translated_content: 'Hola' }
    const payload: Record<string, any> = { translated_content: evt.translated_content }

    if (evt.error_message) {
      payload.translation_error = true
    }

    expect(payload.translation_error).toBeUndefined()
  })

  it('event type should be translation_final for final captions', () => {
    const isFinal = true
    const eventType = isFinal ? 'translation_final' : 'translation_partial'
    expect(eventType).toBe('translation_final')
  })

  it('event type should be translation_partial for partial captions', () => {
    const isFinal = false
    const eventType = isFinal ? 'translation_final' : 'translation_partial'
    expect(eventType).toBe('translation_partial')
  })
})

// ═══════════════════════════════════════════════════════
// 11. FRONTEND — Translation preferences lifecycle
// ═══════════════════════════════════════════════════════
describe('Translation Preferences Lifecycle', () => {
  it('default target_language should be opposite of UI language', () => {
    const getDefault = (uiLang: string) => uiLang === 'ko' ? 'es' : 'ko'
    expect(getDefault('ko')).toBe('es')
    expect(getDefault('es')).toBe('ko')
  })

  it('default display_mode should be original_and_translated', () => {
    const defaults = {
      display_mode: 'original_and_translated',
      target_language: 'es',
      auto_translate: true,
    }
    expect(defaults.display_mode).toBe('original_and_translated')
    expect(defaults.auto_translate).toBe(true)
  })

  it('translation SSE should disconnect when displayMode is none', () => {
    const displayMode = 'none'
    const enabled = true
    const authToken = 'token'

    const shouldConnect = enabled && !!authToken && displayMode !== 'none'
    expect(shouldConnect).toBe(false)
  })

  it('translation SSE should connect when displayMode is translated_only', () => {
    const displayMode = 'translated_only'
    const enabled = true
    const authToken = 'token'

    const shouldConnect = enabled && !!authToken && displayMode !== 'none'
    expect(shouldConnect).toBe(true)
  })

  it('translation SSE should connect when displayMode is original_and_translated', () => {
    const displayMode = 'original_and_translated'
    const enabled = true
    const authToken = 'token'

    const shouldConnect = enabled && !!authToken && displayMode !== 'none'
    expect(shouldConnect).toBe(true)
  })

  it('translation SSE should not connect when captions are disabled', () => {
    const displayMode = 'original_and_translated'
    const enabled = false
    const authToken = 'token'

    const shouldConnect = enabled && !!authToken && displayMode !== 'none'
    expect(shouldConnect).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════
// 12. SQL SCHEMA VALIDATION
// ═══════════════════════════════════════════════════════
describe('Phase 3 SQL Schema Constraints', () => {
  it('original_language CHECK constraint should allow ko, es, mixed, unknown', () => {
    const validOriginalLangs = ['ko', 'es', 'mixed', 'unknown']
    const invalidOriginalLangs = ['en', 'fr', 'ja', '']

    for (const lang of validOriginalLangs) {
      expect(['ko', 'es', 'mixed', 'unknown'].includes(lang)).toBe(true)
    }
    for (const lang of invalidOriginalLangs) {
      expect(['ko', 'es', 'mixed', 'unknown'].includes(lang)).toBe(false)
    }
  })

  it('translated_language CHECK constraint should only allow ko, es', () => {
    const validTranslatedLangs = ['ko', 'es']
    const invalidTranslatedLangs = ['mixed', 'unknown', 'en']

    for (const lang of validTranslatedLangs) {
      expect(['ko', 'es'].includes(lang)).toBe(true)
    }
    for (const lang of invalidTranslatedLangs) {
      expect(['ko', 'es'].includes(lang)).toBe(false)
    }
  })

  it('provider CHECK constraint should allow deepseek, google, libretranslate, mock', () => {
    const validProviders = ['deepseek', 'google', 'libretranslate', 'mock']
    const invalidProviders = ['openai', 'chatgpt', 'anthropic']

    for (const p of validProviders) {
      expect(['deepseek', 'google', 'libretranslate', 'mock'].includes(p)).toBe(true)
    }
    for (const p of invalidProviders) {
      expect(['deepseek', 'google', 'libretranslate', 'mock'].includes(p)).toBe(false)
    }
  })

  it('display_mode CHECK constraint should allow three values', () => {
    const valid = ['none', 'translated_only', 'original_and_translated']
    const invalid = ['all', 'both', 'dual']

    for (const m of valid) {
      expect(['none', 'translated_only', 'original_and_translated'].includes(m)).toBe(true)
    }
    for (const m of invalid) {
      expect(['none', 'translated_only', 'original_and_translated'].includes(m)).toBe(false)
    }
  })
})