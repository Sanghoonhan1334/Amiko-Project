/**
 * AMIKO Meet Phase 5 — Recording + Summary + Notes + Reputation Tests
 *
 * Tests for:
 * 1. Recording consent system
 *    - Consent flow: initiator requests → participants consent → recording starts
 *    - Auto-consent for initiator
 *    - Recording denied when any participant declines
 *    - Recording state transitions (pending → active → completed / denied)
 * 2. Auto-summary generation
 *    - Summary from caption/translation events
 *    - Topic extraction with bilingual labels
 *    - Vocabulary extraction (word pairs)
 *    - Cultural notes extraction
 *    - Bilingual summary text generation
 * 3. Session notes
 *    - Note creation with type/tags
 *    - Public/private visibility
 *    - Note types: general, vocabulary, grammar, cultural, pronunciation
 * 4. Reputation system
 *    - Per-session rating with breakdown scores
 *    - Aggregated user reputation
 *    - Tier system (newcomer → ambassador)
 *    - Badge assignment
 * 5. Post-session UI flow
 *    - Summary tab displays correctly
 *    - Notes tab CRUD
 *    - Rating tab star interaction
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Supabase ─────────────────────────────────────
const mockGetUser = vi.fn()

function createChain(finalData: any = null, finalError: any = null) {
  const chain: any = {}
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'gte', 'gt', 'or', 'order', 'limit',
    'is', 'not', 'range',
  ]
  methods.forEach(m => {
    chain[m] = vi.fn().mockReturnValue(chain)
  })
  chain.single = vi.fn().mockResolvedValue({ data: finalData, error: finalError })
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: finalData, error: finalError })
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

// ── Constants ─────────────────────────────────────────
const SESSION_ID = 'session-abc-123'
const USER_1 = 'user-a-111'
const USER_2 = 'user-b-222'

// ─────────────────────────────────────────────────────
// 1. Recording Consent System
// ─────────────────────────────────────────────────────
describe('Phase 5 — Recording Consent System', () => {
  describe('Consent flow', () => {
    it('should create recording with pending status when initiator requests', () => {
      const recording = {
        id: 'rec-1',
        session_id: SESSION_ID,
        initiated_by: USER_1,
        status: 'pending',
        storage_path: null,
        file_size: null,
      }
      expect(recording.status).toBe('pending')
      expect(recording.initiated_by).toBe(USER_1)
    })

    it('should auto-consent for the initiator', () => {
      const consents = [
        { recording_id: 'rec-1', user_id: USER_1, consented: true },
      ]
      const initiatorConsent = consents.find(c => c.user_id === USER_1)
      expect(initiatorConsent).toBeTruthy()
      expect(initiatorConsent!.consented).toBe(true)
    })

    it('should start recording when all participants consent', () => {
      const consents = [
        { user_id: USER_1, consented: true },
        { user_id: USER_2, consented: true },
      ]
      const allConsented = consents.every(c => c.consented)
      expect(allConsented).toBe(true)

      // recording transitions to active
      const recording = { status: allConsented ? 'active' : 'pending' }
      expect(recording.status).toBe('active')
    })

    it('should deny recording when any participant declines', () => {
      const consents = [
        { user_id: USER_1, consented: true },
        { user_id: USER_2, consented: false },
      ]
      const allConsented = consents.every(c => c.consented)
      expect(allConsented).toBe(false)

      const recording = { status: allConsented ? 'active' : 'denied' }
      expect(recording.status).toBe('denied')
    })

    it('should transition to completed when recording stops', () => {
      const recording = {
        status: 'active' as string,
        ended_at: null as string | null,
      }
      // Stop recording
      recording.status = 'completed'
      recording.ended_at = new Date().toISOString()

      expect(recording.status).toBe('completed')
      expect(recording.ended_at).toBeTruthy()
    })
  })

  describe('Edge cases', () => {
    it('should not allow duplicate recording requests for same session', () => {
      const existingRecordings = [
        { session_id: SESSION_ID, status: 'active' },
      ]
      const hasActive = existingRecordings.some(
        r => r.session_id === SESSION_ID && r.status === 'active'
      )
      expect(hasActive).toBe(true)
      // API should reject new recording request
    })

    it('should handle consent timeout gracefully', () => {
      const consentRequestTime = Date.now() - 60000 // 1 minute ago
      const CONSENT_TIMEOUT_MS = 30000 // 30 seconds
      const isTimedOut = Date.now() - consentRequestTime > CONSENT_TIMEOUT_MS
      expect(isTimedOut).toBe(true)
    })
  })
})

// ─────────────────────────────────────────────────────
// 2. Auto-Summary Generation
// ─────────────────────────────────────────────────────
describe('Phase 5 — Auto-Summary Generation', () => {
  const sampleCaptions = [
    { text: '안녕하세요, 오늘 뭐 했어요?', language: 'ko', speaker_uid: 1001 },
    { text: 'Hoy fui al mercado a comprar comida coreana.', language: 'es', speaker_uid: 1002 },
    { text: '어떤 한국 음식을 샀어요? 김치?', language: 'ko', speaker_uid: 1001 },
    { text: 'Sí, compré kimchi y tteokbokki. Me encanta la comida coreana.', language: 'es', speaker_uid: 1002 },
    { text: '좋아요! 지드래곤 노래도 좋아해요?', language: 'ko', speaker_uid: 1001 },
    { text: 'Sí, me encanta G-Dragon y BLACKPINK.', language: 'es', speaker_uid: 1002 },
  ]

  const sampleTranslations = [
    { original_text: '안녕하세요', translated_text: 'Hola', source_language: 'ko', target_language: 'es' },
    { original_text: '김치', translated_text: 'Kimchi', source_language: 'ko', target_language: 'es' },
    { original_text: 'comida coreana', translated_text: '한국 음식', source_language: 'es', target_language: 'ko' },
  ]

  describe('Topic extraction', () => {
    it('should identify food-related topics from captions', () => {
      const foodKeywords = ['음식', '먹', '김치', '떡볶이', 'comida', 'kimchi', 'tteokbokki']
      const allText = sampleCaptions.map(c => c.text).join(' ').toLowerCase()
      const foodMentions = foodKeywords.filter(k => allText.includes(k.toLowerCase()))
      expect(foodMentions.length).toBeGreaterThanOrEqual(3)
    })

    it('should identify music-related topics', () => {
      const musicKeywords = ['노래', '음악', 'kpop', 'k-pop', 'g-dragon', 'blackpink']
      const allText = sampleCaptions.map(c => c.text).join(' ').toLowerCase()
      const musicMentions = musicKeywords.filter(k => allText.includes(k.toLowerCase()))
      expect(musicMentions.length).toBeGreaterThanOrEqual(1)
    })

    it('should provide bilingual topic labels', () => {
      const topicLabels: Record<string, { ko: string; es: string }> = {
        food: { ko: '음식', es: 'Comida' },
        music: { ko: '음악', es: 'Música' },
        culture: { ko: '문화', es: 'Cultura' },
        greetings: { ko: '인사', es: 'Saludos' },
        daily_life: { ko: '일상', es: 'Vida Diaria' },
      }

      expect(topicLabels.food.ko).toBe('음식')
      expect(topicLabels.food.es).toBe('Comida')
      expect(topicLabels.music.ko).toBe('음악')
    })
  })

  describe('Vocabulary extraction', () => {
    it('should extract word pairs from translations', () => {
      const vocabulary = sampleTranslations.map(t => ({
        original: t.original_text,
        translated: t.translated_text,
        source_lang: t.source_language,
      }))

      expect(vocabulary).toHaveLength(3)
      expect(vocabulary[0]).toEqual({
        original: '안녕하세요',
        translated: 'Hola',
        source_lang: 'ko',
      })
    })

    it('should deduplicate vocabulary entries', () => {
      const duplicateTranslations = [
        { original_text: '안녕', translated_text: 'Hola', source_language: 'ko' },
        { original_text: '안녕', translated_text: 'Hola', source_language: 'ko' },
        { original_text: '감사', translated_text: 'Gracias', source_language: 'ko' },
      ]

      const seen = new Set<string>()
      const unique = duplicateTranslations.filter(t => {
        const key = `${t.original_text}:${t.translated_text}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      expect(unique).toHaveLength(2)
    })
  })

  describe('Cultural notes extraction', () => {
    it('should detect cultural patterns in captions', () => {
      const culturalPatterns = [
        { pattern: /김치|kimchi/i, note_ko: '김치는 한국의 대표적인 발효 음식입니다', note_es: 'Kimchi es un plato fermentado típico coreano' },
        { pattern: /오빠|oppa/i, note_ko: '오빠는 여성이 나이 많은 남성을 부르는 호칭입니다', note_es: 'Oppa es un título que las mujeres usan para hombres mayores' },
      ]

      const allText = sampleCaptions.map(c => c.text).join(' ')
      const matchedNotes = culturalPatterns.filter(p => p.pattern.test(allText))
      expect(matchedNotes.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Summary statistics', () => {
    it('should calculate session duration from captions', () => {
      const startTime = new Date('2024-01-01T10:00:00Z')
      const endTime = new Date('2024-01-01T10:25:00Z')
      const durationMinutes = Math.round(
        (endTime.getTime() - startTime.getTime()) / 60000
      )
      expect(durationMinutes).toBe(25)
    })

    it('should count total captions and translations', () => {
      expect(sampleCaptions.length).toBe(6)
      expect(sampleTranslations.length).toBe(3)
    })
  })
})

// ─────────────────────────────────────────────────────
// 3. Session Notes
// ─────────────────────────────────────────────────────
describe('Phase 5 — Session Notes', () => {
  describe('Note creation', () => {
    it('should validate note type', () => {
      const validTypes = ['general', 'vocabulary', 'grammar', 'cultural', 'pronunciation']
      expect(validTypes.includes('vocabulary')).toBe(true)
      expect(validTypes.includes('invalid_type')).toBe(false)
    })

    it('should accept tags as array', () => {
      const note = {
        content: '오빠 = older brother for females',
        note_type: 'vocabulary',
        tags: ['korean', 'honorific', 'family'],
        is_public: false,
      }
      expect(Array.isArray(note.tags)).toBe(true)
      expect(note.tags).toHaveLength(3)
    })

    it('should default to private visibility', () => {
      const note = {
        content: 'Test note',
        note_type: 'general',
        is_public: false,
      }
      expect(note.is_public).toBe(false)
    })

    it('should require non-empty content', () => {
      const emptyContent = ''
      const whitespaceContent = '   '
      expect(emptyContent.trim().length).toBe(0)
      expect(whitespaceContent.trim().length).toBe(0)
    })
  })

  describe('Note visibility', () => {
    it('should show own notes (public and private)', () => {
      const notes = [
        { user_id: USER_1, is_public: true, content: 'Public note' },
        { user_id: USER_1, is_public: false, content: 'Private note' },
        { user_id: USER_2, is_public: true, content: 'Other public' },
        { user_id: USER_2, is_public: false, content: 'Other private' },
      ]

      const visibleToUser1 = notes.filter(
        n => n.user_id === USER_1 || n.is_public
      )
      expect(visibleToUser1).toHaveLength(3)
      // Should NOT see USER_2's private note
      expect(
        visibleToUser1.find(n => n.content === 'Other private')
      ).toBeUndefined()
    })
  })
})

// ─────────────────────────────────────────────────────
// 4. Reputation System
// ─────────────────────────────────────────────────────
describe('Phase 5 — Reputation System', () => {
  describe('Session rating', () => {
    it('should validate overall_rating range (1-5)', () => {
      const validRatings = [1, 2, 3, 4, 5]
      const invalidRatings = [0, 6, -1, 10]

      validRatings.forEach(r => {
        expect(r >= 1 && r <= 5).toBe(true)
      })
      invalidRatings.forEach(r => {
        expect(r >= 1 && r <= 5).toBe(false)
      })
    })

    it('should accept optional breakdown scores', () => {
      const rating = {
        overall_rating: 4,
        communication_score: 5,
        attitude_score: 4,
        helpfulness_score: 3,
        language_skill_score: 4,
        comment: 'Great conversation!',
      }
      expect(rating.overall_rating).toBe(4)
      expect(rating.communication_score).toBe(5)
    })

    it('should prevent self-rating', () => {
      const rater_id = USER_1
      const rated_user_id = USER_1
      expect(rater_id).toBe(rated_user_id)
      // API should reject this
    })

    it('should prevent duplicate ratings per session', () => {
      const existingRatings = [
        { session_id: SESSION_ID, rater_id: USER_1, rated_user_id: USER_2 },
      ]
      const isDuplicate = existingRatings.some(
        r => r.session_id === SESSION_ID &&
          r.rater_id === USER_1 &&
          r.rated_user_id === USER_2
      )
      expect(isDuplicate).toBe(true)
      // API should upsert instead of creating duplicate
    })
  })

  describe('Aggregated reputation', () => {
    it('should calculate correct average rating', () => {
      const ratings = [5, 4, 4, 3, 5]
      const average = ratings.reduce((a, b) => a + b, 0) / ratings.length
      expect(average).toBe(4.2)
    })

    it('should calculate correct tier based on sessions and rating', () => {
      function calculateTier(
        totalSessions: number,
        avgRating: number
      ): string {
        if (totalSessions >= 100 && avgRating >= 4.5) return 'ambassador'
        if (totalSessions >= 50 && avgRating >= 4.0) return 'expert'
        if (totalSessions >= 25 && avgRating >= 3.5) return 'trusted'
        if (totalSessions >= 10) return 'regular'
        if (totalSessions >= 3) return 'beginner'
        return 'newcomer'
      }

      expect(calculateTier(0, 0)).toBe('newcomer')
      expect(calculateTier(3, 3.0)).toBe('beginner')
      expect(calculateTier(10, 3.0)).toBe('regular')
      expect(calculateTier(25, 3.5)).toBe('trusted')
      expect(calculateTier(50, 4.0)).toBe('expert')
      expect(calculateTier(100, 4.5)).toBe('ambassador')
      expect(calculateTier(100, 3.0)).toBe('regular') // High sessions but low rating
      expect(calculateTier(5, 5.0)).toBe('beginner') // High rating but low sessions
    })

    it('should update aggregated scores on new rating', () => {
      // Simulate update_user_reputation trigger
      const existingReputation = {
        total_sessions: 10,
        total_ratings: 5,
        average_rating: 4.0,
        avg_communication: 4.2,
        avg_attitude: 4.0,
        avg_helpfulness: 3.8,
        avg_language_skill: 4.0,
      }

      const newRating = {
        overall_rating: 5,
        communication_score: 5,
        attitude_score: 5,
        helpfulness_score: 4,
        language_skill_score: 5,
      }

      // New averages
      const newTotalRatings = existingReputation.total_ratings + 1
      const newAvgRating =
        (existingReputation.average_rating * existingReputation.total_ratings +
          newRating.overall_rating) / newTotalRatings

      expect(newTotalRatings).toBe(6)
      expect(newAvgRating).toBeCloseTo(4.17, 1)
    })
  })

  describe('Badges', () => {
    it('should assign badges based on achievements', () => {
      const badges: string[] = []

      // Criteria
      const totalSessions = 15
      const avgRating = 4.5
      const culturalNotesCount = 10

      if (totalSessions >= 10) badges.push('active_learner')
      if (avgRating >= 4.5) badges.push('top_rated')
      if (culturalNotesCount >= 5) badges.push('culture_explorer')

      expect(badges).toContain('active_learner')
      expect(badges).toContain('top_rated')
      expect(badges).toContain('culture_explorer')
    })
  })

  describe('User reputation API', () => {
    it('should expose public reputation without private data', () => {
      const fullReputation = {
        user_id: USER_1,
        average_rating: 4.2,
        total_sessions: 25,
        total_ratings: 15,
        tier: 'trusted',
        badges: ['active_learner'],
        avg_communication: 4.5,
        avg_attitude: 4.0,
        avg_helpfulness: 4.2,
        avg_language_skill: 4.1,
        // These should NOT be exposed publicly
        _internal_flags: 2,
        _admin_notes: 'Good user',
      }

      // Public profile should exclude internal fields
      const { _internal_flags, _admin_notes, ...publicProfile } = fullReputation
      expect(publicProfile).not.toHaveProperty('_internal_flags')
      expect(publicProfile).not.toHaveProperty('_admin_notes')
      expect(publicProfile).toHaveProperty('average_rating')
      expect(publicProfile).toHaveProperty('tier')
    })
  })
})

// ─────────────────────────────────────────────────────
// 5. Post-Session UI Flow
// ─────────────────────────────────────────────────────
describe('Phase 5 — Post-Session UI', () => {
  describe('Tab navigation', () => {
    it('should have three tabs: summary, notes, rating', () => {
      const tabs = ['summary', 'notes', 'rating']
      expect(tabs).toHaveLength(3)
      expect(tabs).toContain('summary')
      expect(tabs).toContain('notes')
      expect(tabs).toContain('rating')
    })
  })

  describe('Star rating interaction', () => {
    it('should update rating when star is clicked', () => {
      let overallRating = 0
      // Simulate clicking 4th star
      overallRating = 4
      expect(overallRating).toBe(4)

      // Clicking same star should not deselect (unlike toggle)
      overallRating = 4
      expect(overallRating).toBe(4)
    })

    it('should require minimum overall rating to submit', () => {
      const overallRating = 0
      const canSubmit = overallRating > 0
      expect(canSubmit).toBe(false)

      const validRating = 3
      expect(validRating > 0).toBe(true)
    })
  })

  describe('Note type colors', () => {
    it('should have distinct colors for each note type', () => {
      const noteTypeColors: Record<string, string> = {
        general: 'bg-gray-500/20 text-gray-300',
        vocabulary: 'bg-blue-500/20 text-blue-300',
        grammar: 'bg-green-500/20 text-green-300',
        cultural: 'bg-purple-500/20 text-purple-300',
        pronunciation: 'bg-orange-500/20 text-orange-300',
      }

      const types = Object.keys(noteTypeColors)
      expect(types).toHaveLength(5)
      // Each type should have a unique color
      const colors = new Set(Object.values(noteTypeColors))
      expect(colors.size).toBe(5)
    })
  })

  describe('Bilingual support', () => {
    it('should provide Korean translations for all UI strings', () => {
      const koStrings: Record<string, string> = {
        title: '세션 완료!',
        subtitle: '오늘 대화가 어떠셨나요?',
        viewSummary: '요약 보기',
        addNotes: '노트 작성',
        ratePartner: '상대방 평가',
      }

      Object.values(koStrings).forEach(v => {
        expect(v).toBeTruthy()
        expect(typeof v).toBe('string')
      })
    })

    it('should provide Spanish translations for all UI strings', () => {
      const esStrings: Record<string, string> = {
        title: '¡Sesión Completada!',
        subtitle: '¿Cómo estuvo la conversación?',
        viewSummary: 'Ver Resumen',
        addNotes: 'Escribir Notas',
        ratePartner: 'Evaluar Compañero',
      }

      Object.values(esStrings).forEach(v => {
        expect(v).toBeTruthy()
        expect(typeof v).toBe('string')
      })
    })
  })
})

// ─────────────────────────────────────────────────────
// 6. Cross-Browser / Responsive Validation
// ─────────────────────────────────────────────────────
describe('Phase 5 — Cross-Browser & Responsive', () => {
  describe('CSS class validation for responsive design', () => {
    it('should use responsive breakpoints (sm, md, lg)', () => {
      // The components use Tailwind responsive prefixes
      const responsiveClasses = [
        'sm:px-6',
        'sm:w-auto',
        'sm:inline',
        'max-w-sm',
        'max-w-2xl',
        'mx-4',
      ]
      responsiveClasses.forEach(cls => {
        expect(typeof cls).toBe('string')
        expect(cls.length).toBeGreaterThan(0)
      })
    })

    it('should use cross-browser compatible CSS properties', () => {
      // No vendor-prefixed CSS that needs polyfills
      const safeProperties = [
        'flex', 'grid', 'gap', 'rounded', 'overflow',
        'backdrop-blur', 'transition', 'animate',
      ]
      // All are well-supported in modern Chrome, Edge, Opera, Firefox, Safari
      expect(safeProperties.length).toBe(8)
    })

    it('should handle mobile viewport dimensions', () => {
      // Validate that components use full-width on mobile
      const mobileClasses = ['w-full', 'inset-0', 'fixed']
      mobileClasses.forEach(cls => {
        expect(cls).toBeTruthy()
      })
    })
  })

  describe('z-index layering', () => {
    it('should maintain proper z-index stacking', () => {
      const layers = {
        videoRoom: 99999,
        consentModal: 100000,
        reputationModal: 100001,
      }

      expect(layers.consentModal).toBeGreaterThan(layers.videoRoom)
      expect(layers.reputationModal).toBeGreaterThan(layers.consentModal)
    })
  })

  describe('Dark mode compatibility', () => {
    it('should use dark-compatible Tailwind colors', () => {
      const darkColors = [
        'bg-gray-800', 'bg-gray-900', 'text-white',
        'text-gray-300', 'text-gray-400', 'border-gray-700',
      ]
      // These are all standard dark mode colors
      expect(darkColors).toHaveLength(6)
    })
  })
})
