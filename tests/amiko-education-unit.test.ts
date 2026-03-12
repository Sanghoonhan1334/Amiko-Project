/**
 * AMIKO Education — Unit Tests
 *
 * Tests for:
 * 1. Education Auth — Bearer token, cookie-based, dual strategy
 * 2. Rate Limiter — sliding window, eviction, identity extraction
 * 3. Reviews API — auth, enrollment check, rating validation, upsert
 * 4. Certificates API — auth, enrollment ownership, completion check, issuance
 * 5. Courses API — listing filters, course creation validation
 * 6. Enroll API — direct enrollment blocked, enrollment listing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ═══════════════════════════════════════════════════════
// 1. EDUCATION RATE LIMITER (pure logic, no mocks needed)
// ═══════════════════════════════════════════════════════
describe('Education Rate Limiter', () => {
  let checkRateLimit: typeof import('@/lib/education-rate-limiter').checkRateLimit
  let getRateLimitIdentity: typeof import('@/lib/education-rate-limiter').getRateLimitIdentity

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('@/lib/education-rate-limiter')
    checkRateLimit = mod.checkRateLimit
    getRateLimitIdentity = mod.getRateLimitIdentity
  })

  describe('checkRateLimit', () => {
    it('allows requests within the limit', () => {
      const action = `test-action-${Date.now()}`
      expect(checkRateLimit(action, 'user-1', 3, 60000)).toBe(true)
      expect(checkRateLimit(action, 'user-1', 3, 60000)).toBe(true)
      expect(checkRateLimit(action, 'user-1', 3, 60000)).toBe(true)
    })

    it('blocks requests exceeding the limit', () => {
      const action = `test-block-${Date.now()}`
      checkRateLimit(action, 'user-2', 2, 60000)
      checkRateLimit(action, 'user-2', 2, 60000)
      expect(checkRateLimit(action, 'user-2', 2, 60000)).toBe(false)
    })

    it('uses separate buckets per action+identity', () => {
      const ts = Date.now()
      const action1 = `action-a-${ts}`
      const action2 = `action-b-${ts}`

      checkRateLimit(action1, 'user-3', 1, 60000)
      expect(checkRateLimit(action1, 'user-3', 1, 60000)).toBe(false) // blocked

      // Different action should still be allowed
      expect(checkRateLimit(action2, 'user-3', 1, 60000)).toBe(true)
    })

    it('uses separate buckets per user', () => {
      const action = `test-users-${Date.now()}`

      checkRateLimit(action, 'user-a', 1, 60000)
      expect(checkRateLimit(action, 'user-a', 1, 60000)).toBe(false) // blocked

      // Different user should be allowed
      expect(checkRateLimit(action, 'user-b', 1, 60000)).toBe(true)
    })

    it('allows requests after window expires', async () => {
      const action = `test-expiry-${Date.now()}`
      checkRateLimit(action, 'user-x', 1, 50) // 50ms window
      expect(checkRateLimit(action, 'user-x', 1, 50)).toBe(false) // blocked

      await new Promise(resolve => setTimeout(resolve, 100)) // wait beyond window
      expect(checkRateLimit(action, 'user-x', 1, 50)).toBe(true) // allowed again
    })

    it('defaults to 60s window when not specified', () => {
      const action = `test-default-${Date.now()}`
      expect(checkRateLimit(action, 'user-def', 5)).toBe(true)
    })
  })

  describe('getRateLimitIdentity', () => {
    it('returns userId when provided', () => {
      const mockReq = {
        headers: new Headers(),
      } as unknown as Request
      expect(getRateLimitIdentity(mockReq, 'user-123')).toBe('user-123')
    })

    it('falls back to x-forwarded-for header', () => {
      const mockReq = {
        headers: new Headers({ 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }),
      } as unknown as Request
      expect(getRateLimitIdentity(mockReq)).toBe('192.168.1.1')
    })

    it('falls back to x-real-ip header', () => {
      const mockReq = {
        headers: new Headers({ 'x-real-ip': '10.0.0.5' }),
      } as unknown as Request
      expect(getRateLimitIdentity(mockReq)).toBe('10.0.0.5')
    })

    it('returns "unknown" when no identity available', () => {
      const mockReq = {
        headers: new Headers(),
      } as unknown as Request
      expect(getRateLimitIdentity(mockReq)).toBe('unknown')
    })
  })
})

// ═══════════════════════════════════════════════════════
// SHARED SETUP FOR API TESTS
// ═══════════════════════════════════════════════════════
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
    is: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: finalData, error: finalError }),
    then: vi.fn((cb: any) => cb({ data: finalData, error: finalError })),
  }
  Object.keys(chain).forEach(key => {
    if (key !== 'single' && key !== 'then') chain[key].mockReturnValue(chain)
  })
  return chain
}

const mockFrom = vi.fn()
const mockSupabase = { from: mockFrom }

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

const mockRequireEducationAuth = vi.fn()
vi.mock('@/lib/education-auth', () => ({
  requireEducationAuth: (...args: any[]) => mockRequireEducationAuth(...args),
}))

// ── Helpers ───────────────────────────────────────────
function createRequest(
  method: string = 'GET',
  url: string = 'http://localhost:3000/api/test',
  options: { body?: any; headers?: Record<string, string> } = {}
) {
  const headers = new Headers(options.headers || {})
  if (!options.headers && !headers.has('authorization')) {
    headers.set('authorization', 'Bearer test-token-123')
  }
  return {
    method,
    url,
    headers: {
      get: (name: string) => headers.get(name.toLowerCase()),
    },
    cookies: { getAll: () => [] },
    json: vi.fn().mockResolvedValue(options.body || {}),
    text: vi.fn().mockResolvedValue(JSON.stringify(options.body || {})),
  } as any
}

function createContext(id: string = 'course-1') {
  return { params: Promise.resolve({ id }) }
}

function mockAuthSuccess(userId: string = 'student-1') {
  mockRequireEducationAuth.mockResolvedValue({
    user: { id: userId, email: `${userId}@test.com` },
    error: null,
  })
}

function mockAuthFail() {
  const { NextResponse } = require('next/server')
  mockRequireEducationAuth.mockResolvedValue({
    user: null,
    error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
  })
}

// ═══════════════════════════════════════════════════════
// 2. REVIEWS API
// ═══════════════════════════════════════════════════════
describe('Education Reviews API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/education/reviews', () => {
    it('rejects unauthenticated requests', async () => {
      mockAuthFail()

      const { POST } = await import('@/app/api/education/reviews/route')
      const result = await POST(
        createRequest('POST', '/api/education/reviews', {
          body: {
            course_id: 'course-1',
            clarity_rating: 5,
            content_rating: 4,
            interaction_rating: 5,
            usefulness_rating: 4,
          },
        })
      )
      expect(result.status).toBe(401)
    })

    it('rejects when course_id is missing', async () => {
      mockAuthSuccess()

      const { POST } = await import('@/app/api/education/reviews/route')
      const result = await POST(
        createRequest('POST', '/api/education/reviews', {
          body: {
            clarity_rating: 5,
            content_rating: 4,
            interaction_rating: 5,
            usefulness_rating: 4,
          },
        })
      )
      expect(result.status).toBe(400)
    })

    it('rejects when student is not enrolled', async () => {
      mockAuthSuccess('student-1')

      const enrollChain = createChain(null) // no enrollment
      mockFrom.mockReturnValue(enrollChain)

      const { POST } = await import('@/app/api/education/reviews/route')
      const result = await POST(
        createRequest('POST', '/api/education/reviews', {
          body: {
            course_id: 'course-1',
            clarity_rating: 5,
            content_rating: 4,
            interaction_rating: 5,
            usefulness_rating: 4,
          },
        })
      )
      expect(result.status).toBe(403)
    })

    it('rejects ratings outside 1-5 range', async () => {
      mockAuthSuccess('student-1')

      const enrollChain = createChain({ id: 'enroll-1', enrollment_status: 'completed' })
      mockFrom.mockReturnValue(enrollChain)

      const { POST } = await import('@/app/api/education/reviews/route')
      const result = await POST(
        createRequest('POST', '/api/education/reviews', {
          body: {
            course_id: 'course-1',
            clarity_rating: 6, // invalid
            content_rating: 4,
            interaction_rating: 5,
            usefulness_rating: 0, // invalid
          },
        })
      )
      expect(result.status).toBe(400)
    })

    it('successfully creates a review with valid data', async () => {
      mockAuthSuccess('student-1')

      const enrollChain = createChain({ id: 'enroll-1', enrollment_status: 'completed' })
      const reviewChain = createChain({
        id: 'review-1',
        course_id: 'course-1',
        student_id: 'student-1',
        clarity_rating: 5,
        content_rating: 4,
        interaction_rating: 5,
        usefulness_rating: 4,
        comment: 'Great course!',
      })

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) return enrollChain
        return reviewChain
      })

      const { POST } = await import('@/app/api/education/reviews/route')
      const result = await POST(
        createRequest('POST', '/api/education/reviews', {
          body: {
            course_id: 'course-1',
            clarity_rating: 5,
            content_rating: 4,
            interaction_rating: 5,
            usefulness_rating: 4,
            comment: 'Great course!',
          },
        })
      )
      expect(result.status).toBe(201)
      const json = await result.json()
      expect(json.review).toBeDefined()
      expect(json.review.clarity_rating).toBe(5)
    })
  })

  describe('GET /api/education/reviews', () => {
    it('rejects when no courseId or instructorId provided', async () => {
      const { GET } = await import('@/app/api/education/reviews/route')
      const result = await GET(
        createRequest('GET', 'http://localhost:3000/api/education/reviews')
      )
      expect(result.status).toBe(400)
    })

    it('returns reviews for a course', async () => {
      const reviewsChain = createChain([
        { id: 'r-1', clarity_rating: 5, course_id: 'course-1' },
        { id: 'r-2', clarity_rating: 4, course_id: 'course-1' },
      ])
      mockFrom.mockReturnValue(reviewsChain)

      const { GET } = await import('@/app/api/education/reviews/route')
      const result = await GET(
        createRequest('GET', 'http://localhost:3000/api/education/reviews?courseId=course-1')
      )
      expect(result.status).toBe(200)
      const json = await result.json()
      expect(json.reviews).toBeDefined()
    })
  })
})

// ═══════════════════════════════════════════════════════
// 3. CERTIFICATES API
// ═══════════════════════════════════════════════════════
describe('Education Certificates API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/education/certificates', () => {
    it('rejects unauthenticated requests', async () => {
      mockAuthFail()

      const { POST } = await import('@/app/api/education/certificates/route')
      const result = await POST(
        createRequest('POST', '/api/education/certificates', {
          body: { enrollment_id: 'enroll-1' },
        })
      )
      expect(result.status).toBe(401)
    })

    it('rejects when enrollment_id is missing', async () => {
      mockAuthSuccess()

      const { POST } = await import('@/app/api/education/certificates/route')
      const result = await POST(
        createRequest('POST', '/api/education/certificates', {
          body: {},
        })
      )
      expect(result.status).toBe(400)
    })

    it('returns 404 when enrollment not found', async () => {
      mockAuthSuccess('student-1')

      const enrollChain = createChain(null, { message: 'Not found' })
      mockFrom.mockReturnValue(enrollChain)

      const { POST } = await import('@/app/api/education/certificates/route')
      const result = await POST(
        createRequest('POST', '/api/education/certificates', {
          body: { enrollment_id: 'nonexistent' },
        })
      )
      expect(result.status).toBe(404)
    })

    it('rejects when student does not own the enrollment', async () => {
      mockAuthSuccess('student-1')

      const enrollChain = createChain({
        id: 'enroll-1',
        student_id: 'other-student', // different student
        enrollment_status: 'completed',
        certificate_issued: false,
      })
      mockFrom.mockReturnValue(enrollChain)

      const { POST } = await import('@/app/api/education/certificates/route')
      const result = await POST(
        createRequest('POST', '/api/education/certificates', {
          body: { enrollment_id: 'enroll-1' },
        })
      )
      expect(result.status).toBe(403)
    })

    it('rejects when course is not yet completed', async () => {
      mockAuthSuccess('student-1')

      const enrollChain = createChain({
        id: 'enroll-1',
        student_id: 'student-1',
        enrollment_status: 'active', // not completed
        certificate_issued: false,
      })
      mockFrom.mockReturnValue(enrollChain)

      const { POST } = await import('@/app/api/education/certificates/route')
      const result = await POST(
        createRequest('POST', '/api/education/certificates', {
          body: { enrollment_id: 'enroll-1' },
        })
      )
      expect(result.status).toBe(400)
    })

    it('returns existing certificate if already issued', async () => {
      mockAuthSuccess('student-1')

      const enrollChain = createChain({
        id: 'enroll-1',
        student_id: 'student-1',
        enrollment_status: 'completed',
        certificate_issued: true,
        certificate_url: '/education/certificate/enroll-1',
      })
      mockFrom.mockReturnValue(enrollChain)

      const { POST } = await import('@/app/api/education/certificates/route')
      const result = await POST(
        createRequest('POST', '/api/education/certificates', {
          body: { enrollment_id: 'enroll-1' },
        })
      )
      expect(result.status).toBe(200)
      const json = await result.json()
      expect(json.already_issued).toBe(true)
      expect(json.certificate_url).toBe('/education/certificate/enroll-1')
    })

    it('issues a new certificate successfully', async () => {
      mockAuthSuccess('student-1')

      const enrollChain = createChain({
        id: 'enroll-1',
        student_id: 'student-1',
        enrollment_status: 'completed',
        certificate_issued: false,
        certificate_url: null,
        course: { title: 'Korean Culture 101', total_classes: 10 },
      })
      const profileChain = createChain({
        username: 'testuser',
        full_name: 'Test Student',
        avatar_url: null,
      })
      const updateChain = createChain(null) // update success
      const notifChain = createChain(null) // notification

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) return enrollChain
        if (callCount === 2) return profileChain
        if (callCount === 3) return updateChain
        return notifChain
      })

      const { POST } = await import('@/app/api/education/certificates/route')
      const result = await POST(
        createRequest('POST', '/api/education/certificates', {
          body: { enrollment_id: 'enroll-1' },
        })
      )
      expect(result.status).toBe(201)
      const json = await result.json()
      expect(json.issued).toBe(true)
      expect(json.certificate_url).toContain('/education/certificate/')
      expect(json.student_name).toBe('Test Student')
      expect(json.course_title).toBe('Korean Culture 101')
    })
  })

  describe('GET /api/education/certificates', () => {
    it('rejects when enrollmentId is missing', async () => {
      const { GET } = await import('@/app/api/education/certificates/route')
      const result = await GET(
        createRequest('GET', 'http://localhost:3000/api/education/certificates')
      )
      expect(result.status).toBe(400)
    })

    it('returns 404 when enrollment not found', async () => {
      const enrollChain = createChain(null, { message: 'Not found' })
      mockFrom.mockReturnValue(enrollChain)

      const { GET } = await import('@/app/api/education/certificates/route')
      const result = await GET(
        createRequest('GET', 'http://localhost:3000/api/education/certificates?enrollmentId=nonexistent')
      )
      expect(result.status).toBe(404)
    })

    it('rejects when certificate not yet issued', async () => {
      const enrollChain = createChain({
        id: 'enroll-1',
        student_id: 'student-1',
        certificate_issued: false,
      })
      mockFrom.mockReturnValue(enrollChain)

      const { GET } = await import('@/app/api/education/certificates/route')
      const result = await GET(
        createRequest('GET', 'http://localhost:3000/api/education/certificates?enrollmentId=enroll-1')
      )
      expect(result.status).toBe(400)
    })

    it('returns certificate data for rendering', async () => {
      const enrollChain = createChain({
        id: 'enroll-1',
        student_id: 'student-1',
        certificate_issued: true,
        completed_at: '2026-03-01',
        enrolled_at: '2026-01-15',
        course: {
          title: 'Korean Culture 101',
          category: 'korean_culture',
          level: 'basic',
          teaching_language: 'bilingual',
          total_classes: 10,
          class_duration_minutes: 60,
          instructor: {
            display_name: 'Prof. Kim',
            is_verified: true,
          },
        },
      })
      const profileChain = createChain({
        username: 'testuser',
        full_name: 'Test Student',
        avatar_url: 'https://example.com/avatar.jpg',
      })

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) return enrollChain
        return profileChain
      })

      const { GET } = await import('@/app/api/education/certificates/route')
      const result = await GET(
        createRequest('GET', 'http://localhost:3000/api/education/certificates?enrollmentId=enroll-1')
      )
      expect(result.status).toBe(200)
      const json = await result.json()
      expect(json.certificate).toBeDefined()
      expect(json.certificate.student_name).toBe('Test Student')
      expect(json.certificate.course_title).toBe('Korean Culture 101')
      expect(json.certificate.instructor_name).toBe('Prof. Kim')
      expect(json.certificate.certificate_id).toMatch(/^AMIKO-EDU-/)
    })
  })
})

// ═══════════════════════════════════════════════════════
// 4. ENROLL API
// ═══════════════════════════════════════════════════════
describe('Education Enroll API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/education/enroll (disabled)', () => {
    it('returns 405 — direct enrollment is disabled', async () => {
      mockAuthSuccess()

      const { POST } = await import('@/app/api/education/enroll/route')
      const result = await POST(
        createRequest('POST', '/api/education/enroll', {
          body: { course_id: 'course-1' },
        })
      )
      expect(result.status).toBe(405)
    })
  })

  describe('GET /api/education/enroll', () => {
    it('rejects unauthenticated requests', async () => {
      mockAuthFail()

      const { GET } = await import('@/app/api/education/enroll/route')
      const result = await GET(
        createRequest('GET', 'http://localhost:3000/api/education/enroll')
      )
      expect(result.status).toBe(401)
    })

    it('returns enrollments for authenticated student', async () => {
      mockAuthSuccess('student-1')

      const enrollChain = createChain([
        {
          id: 'enroll-1',
          course_id: 'course-1',
          enrollment_status: 'active',
          course: { title: 'Korean 101' },
        },
      ])
      mockFrom.mockReturnValue(enrollChain)

      const { GET } = await import('@/app/api/education/enroll/route')
      const result = await GET(
        createRequest('GET', 'http://localhost:3000/api/education/enroll')
      )
      expect(result.status).toBe(200)
    })
  })
})

// ═══════════════════════════════════════════════════════
// 5. COURSES API
// ═══════════════════════════════════════════════════════
describe('Education Courses API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/education/courses', () => {
    it('returns courses with default filters', async () => {
      const coursesChain = createChain([
        { id: 'course-1', title: 'Korean Language 101', status: 'published' },
        { id: 'course-2', title: 'K-Pop History', status: 'published' },
      ])
      mockFrom.mockReturnValue(coursesChain)

      const { GET } = await import('@/app/api/education/courses/route')
      const result = await GET(
        createRequest('GET', 'http://localhost:3000/api/education/courses')
      )
      expect(result.status).toBe(200)
    })

    it('filters by category', async () => {
      const coursesChain = createChain([
        { id: 'course-1', title: 'Korean Culture', category: 'korean_culture' },
      ])
      mockFrom.mockReturnValue(coursesChain)

      const { GET } = await import('@/app/api/education/courses/route')
      const result = await GET(
        createRequest('GET', 'http://localhost:3000/api/education/courses?category=korean_culture')
      )
      expect(result.status).toBe(200)
    })

    it('filters by level', async () => {
      const coursesChain = createChain([
        { id: 'course-1', title: 'Advanced Korean', level: 'advanced' },
      ])
      mockFrom.mockReturnValue(coursesChain)

      const { GET } = await import('@/app/api/education/courses/route')
      const result = await GET(
        createRequest('GET', 'http://localhost:3000/api/education/courses?level=advanced')
      )
      expect(result.status).toBe(200)
    })
  })

  describe('POST /api/education/courses', () => {
    it('rejects unauthenticated requests', async () => {
      mockAuthFail()

      const { POST } = await import('@/app/api/education/courses/route')
      const result = await POST(
        createRequest('POST', '/api/education/courses', {
          body: { title: 'Test Course' },
        })
      )
      expect(result.status).toBe(401)
    })

    it('rejects when user has no instructor profile', async () => {
      mockAuthSuccess('user-no-instructor')

      const instructorChain = createChain(null) // no instructor profile
      mockFrom.mockReturnValue(instructorChain)

      const { POST } = await import('@/app/api/education/courses/route')
      const result = await POST(
        createRequest('POST', '/api/education/courses', {
          body: {
            title: 'Test Course',
            description: 'A test course',
            category: 'korean_language',
            level: 'basic',
            teaching_language: 'bilingual',
          },
        })
      )
      // Should get 403 or 400 since no instructor profile
      expect([400, 403]).toContain(result.status)
    })
  })
})

// ═══════════════════════════════════════════════════════
// 6. SESSIONS API
// ═══════════════════════════════════════════════════════
describe('Education Sessions API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/education/sessions', () => {
    it('returns sessions by courseId', async () => {
      const sessionsChain = createChain([
        { id: 'sess-1', course_id: 'course-1', status: 'scheduled', title: 'Class 1' },
        { id: 'sess-2', course_id: 'course-1', status: 'scheduled', title: 'Class 2' },
      ])
      mockFrom.mockReturnValue(sessionsChain)

      const { GET } = await import('@/app/api/education/sessions/route')
      const result = await GET(
        createRequest('GET', 'http://localhost:3000/api/education/sessions?courseId=course-1')
      )
      expect(result.status).toBe(200)
    })
  })
})
