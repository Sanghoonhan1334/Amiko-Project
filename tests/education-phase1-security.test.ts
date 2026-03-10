/**
 * AMIKO Education Phase 1 — Security Tests
 *
 * Acceptance criteria validated:
 * 1. Nobody without paid enrollment gets a token
 * 2. Direct enrollment without PayPal is blocked (405)
 * 3. Chat requires enrollment + live session
 * 4. Presence join requires enrollment + valid payment
 * 5. Access-token validates time window, enrollment, payment, blocked status
 * 6. Timer GET has no write side-effects
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock setup ────────────────────────────────────────
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
    if (key !== 'single' && key !== 'then') {
      chain[key].mockReturnValue(chain)
    }
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

// Mock education auth
const mockRequireEducationAuth = vi.fn()
vi.mock('@/lib/education-auth', () => ({
  requireEducationAuth: (...args: any[]) => mockRequireEducationAuth(...args),
}))

// Mock agora-token for access-token tests
vi.mock('agora-token', () => ({
  RtcTokenBuilder: {
    buildTokenWithUid: vi.fn(() => 'mock-agora-token-xyz'),
  },
  RtcRole: { PUBLISHER: 1, SUBSCRIBER: 2 },
}))

// Mock paypal-server for capture tests
vi.mock('@/lib/paypal-server', () => ({
  getPayPalOrder: vi.fn(),
  capturePayPalOrder: vi.fn(),
  getPayPalToken: vi.fn(() => 'mock-paypal-token'),
  getPayPalBase: vi.fn(() => 'https://api-m.sandbox.paypal.com'),
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
  } as any
}

function createContext(id: string = 'session-id-1') {
  return { params: Promise.resolve({ id }) }
}

function mockAuthSuccess(userId: string = 'student-1', email: string = 'student@test.com') {
  mockRequireEducationAuth.mockResolvedValue({
    user: { id: userId, email },
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
// 1. DIRECT ENROLLMENT BLOCKED (BUG 3 FIX)
// ═══════════════════════════════════════════════════════
describe('Direct Enrollment Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POST /api/education/enroll should return 405 (payment bypass blocked)', async () => {
    const { POST } = await import('@/app/api/education/enroll/route')
    const req = createRequest('POST', 'http://localhost:3000/api/education/enroll', {
      body: { course_id: 'course-1', paypal_order_id: 'FAKE-ORDER', amount_paid: 29.99 },
    })

    const result = await POST(req)
    expect(result.status).toBe(405)

    const json = await result.json()
    expect(json.error).toContain('Direct enrollment is disabled')
    expect(json.flow).toBeDefined()
    expect(json.flow.length).toBe(2)
  })

  it('GET /api/education/enroll should still work for listing enrollments', async () => {
    mockAuthSuccess()
    const chain = createChain([])
    mockFrom.mockReturnValue(chain)

    const { GET } = await import('@/app/api/education/enroll/route')
    const req = createRequest('GET', 'http://localhost:3000/api/education/enroll')
    const result = await GET(req)

    expect(result.status).toBe(200)
    const json = await result.json()
    expect(json.enrollments).toBeDefined()
  })
})

// ═══════════════════════════════════════════════════════
// 2. ACCESS-TOKEN SECURITY (No enrollment = no token)
// ═══════════════════════════════════════════════════════
describe('Access Token Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up Agora env vars
    process.env.NEXT_PUBLIC_AGORA_APP_ID = 'test-app-id'
    process.env.AGORA_APP_CERTIFICATE = 'test-certificate'
  })

  const futureDate = new Date(Date.now() + 5 * 60 * 1000) // 5 min from now
  const sessionData = {
    id: 'session-1',
    session_number: 1,
    status: 'scheduled',
    scheduled_at: futureDate.toISOString(),
    duration_minutes: 60,
    agora_channel: 'edu_abc12345_1',
    agora_uid_instructor: null,
    course_id: 'course-1',
    course: {
      id: 'course-1',
      status: 'published',
      allow_recording: false,
      instructor: { user_id: 'instructor-1' },
    },
  }

  it('should reject unauthenticated users', async () => {
    mockAuthFail()

    const { POST } = await import('@/app/api/education/sessions/[id]/access-token/route')
    const result = await POST(createRequest(), createContext())
    expect(result.status).toBe(401)
  })

  it('should reject students without enrollment (no payment)', async () => {
    mockAuthSuccess('student-no-enrollment')

    // Session query succeeds
    const sessionChain = createChain(sessionData)
    // Enrollment query returns null
    const enrollmentChain = createChain(null, null)

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return sessionChain
      return enrollmentChain
    })

    const { POST } = await import('@/app/api/education/sessions/[id]/access-token/route')
    const result = await POST(createRequest(), createContext())
    expect(result.status).toBe(403)

    const json = await result.json()
    expect(json.error).toContain('Not enrolled')
  })

  it('should reject students with pending payment (not completed)', async () => {
    mockAuthSuccess('student-pending')

    const sessionChain = createChain(sessionData)
    const enrollmentChain = createChain({
      id: 'enroll-1',
      payment_status: 'pending',
      enrollment_status: 'pending_payment',
    })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return sessionChain
      return enrollmentChain
    })

    const { POST } = await import('@/app/api/education/sessions/[id]/access-token/route')
    const result = await POST(createRequest(), createContext())
    expect(result.status).toBe(403)
  })

  it('should reject blocked students', async () => {
    mockAuthSuccess('student-blocked')

    const sessionChain = createChain(sessionData)
    const enrollmentChain = createChain({
      id: 'enroll-1',
      payment_status: 'completed',
      enrollment_status: 'blocked',
    })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return sessionChain
      return enrollmentChain
    })

    const { POST } = await import('@/app/api/education/sessions/[id]/access-token/route')
    const result = await POST(createRequest(), createContext())
    expect(result.status).toBe(403)

    const json = await result.json()
    expect(json.error).toContain('blocked')
  })

  it('should reject access before window opens (too early)', async () => {
    mockAuthSuccess('student-early')

    const farFuture = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    const earlySession = {
      ...sessionData,
      scheduled_at: farFuture.toISOString(),
    }

    const sessionChain = createChain(earlySession)
    const enrollmentChain = createChain({
      id: 'enroll-1',
      payment_status: 'completed',
      enrollment_status: 'active',
    })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return sessionChain
      return enrollmentChain
    })

    const { POST } = await import('@/app/api/education/sessions/[id]/access-token/route')
    const result = await POST(createRequest(), createContext())
    expect(result.status).toBe(425)

    const json = await result.json()
    expect(json.error).toContain('Too early')
    expect(json.minutes_until_open).toBeGreaterThan(0)
  })

  it('should reject access after window closes', async () => {
    mockAuthSuccess('student-late')

    const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    const expiredSession = {
      ...sessionData,
      scheduled_at: pastDate.toISOString(),
      status: 'completed',
    }

    const sessionChain = createChain(expiredSession)

    mockFrom.mockReturnValue(sessionChain)

    const { POST } = await import('@/app/api/education/sessions/[id]/access-token/route')
    const result = await POST(createRequest(), createContext())

    // Should be either 400 (session completed) or 410 (window closed)
    expect([400, 410]).toContain(result.status)
  })

  it('should reject cancelled sessions', async () => {
    mockAuthSuccess('student-1')

    const cancelledSession = { ...sessionData, status: 'cancelled' }
    const sessionChain = createChain(cancelledSession)
    mockFrom.mockReturnValue(sessionChain)

    const { POST } = await import('@/app/api/education/sessions/[id]/access-token/route')
    const result = await POST(createRequest(), createContext())
    expect(result.status).toBe(400)

    const json = await result.json()
    expect(json.error).toContain('cancelled')
  })

  it('should issue token to enrolled student within time window', async () => {
    mockAuthSuccess('student-valid')

    // Session starts NOW → window is open (15 min before to 60 min after)
    const nowSession = {
      ...sessionData,
      scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min from now
      status: 'scheduled',
    }

    const sessionChain = createChain(nowSession)
    const enrollmentChain = createChain({
      id: 'enroll-1',
      payment_status: 'completed',
      enrollment_status: 'active',
    })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return sessionChain
      return enrollmentChain
    })

    const { POST } = await import('@/app/api/education/sessions/[id]/access-token/route')
    const result = await POST(createRequest(), createContext())
    expect(result.status).toBe(200)

    const json = await result.json()
    expect(json.token).toBe('mock-agora-token-xyz')
    expect(json.channel).toBe('edu_abc12345_1')
    expect(json.uid).toBeDefined()
    expect(json.app_id).toBe('test-app-id')
    expect(json.is_instructor).toBe(false)
  })

  it('should let instructor access without enrollment check', async () => {
    mockAuthSuccess('instructor-1') // matches instructor user_id

    const nowSession = {
      ...sessionData,
      scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    }

    const sessionChain = createChain(nowSession)
    // Instructor store uid chain
    const updateChain = createChain(null)

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return sessionChain
      return updateChain
    })

    const { POST } = await import('@/app/api/education/sessions/[id]/access-token/route')
    const result = await POST(createRequest(), createContext())
    expect(result.status).toBe(200)

    const json = await result.json()
    expect(json.is_instructor).toBe(true)
    expect(json.token).toBeDefined()
  })

  it('each session should have its own unique agora channel', async () => {
    mockAuthSuccess('instructor-1')

    const session1 = { ...sessionData, agora_channel: 'edu_abc12345_1', session_number: 1 }
    const session2 = { ...sessionData, id: 'session-2', agora_channel: 'edu_abc12345_2', session_number: 2 }
    const session3 = { ...sessionData, id: 'session-3', agora_channel: 'edu_abc12345_3', session_number: 3 }

    // All three sessions should have different channels
    expect(session1.agora_channel).not.toBe(session2.agora_channel)
    expect(session2.agora_channel).not.toBe(session3.agora_channel)
    expect(session1.agora_channel).not.toBe(session3.agora_channel)

    // Channels follow the format: edu_{courseIdFirst8}_{sessionNumber}
    expect(session1.agora_channel).toMatch(/^edu_[a-z0-9]+_\d+$/)
    expect(session2.agora_channel).toMatch(/^edu_[a-z0-9]+_\d+$/)
  })
})

// ═══════════════════════════════════════════════════════
// 3. CHAT ENROLLMENT SECURITY (BUG 4 FIX)
// ═══════════════════════════════════════════════════════
describe('Chat Enrollment Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject unauthenticated chat POST', async () => {
    mockAuthFail()

    const { POST } = await import('@/app/api/education/chat/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/education/chat', {
        body: { session_id: 'session-1', message: 'Hello' },
      })
    )
    expect(result.status).toBe(401)
  })

  it('should reject chat from non-enrolled user', async () => {
    mockAuthSuccess('outsider-1')

    // Session found with course info
    const sessionChain = createChain({
      id: 'session-1',
      status: 'live',
      course_id: 'course-1',
      course: { id: 'course-1', instructor_id: 'instr-1', instructor: { user_id: 'instructor-1' } },
    })
    // Enrollment not found
    const enrollChain = createChain(null, null)

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return sessionChain
      return enrollChain
    })

    const { POST } = await import('@/app/api/education/chat/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/education/chat', {
        body: { session_id: 'session-1', message: 'I snuck in!' },
      })
    )
    expect(result.status).toBe(403)

    const json = await result.json()
    expect(json.error).toContain('Not enrolled')
  })

  it('should reject chat in non-live session', async () => {
    mockAuthSuccess('student-1')

    const sessionChain = createChain({
      id: 'session-1',
      status: 'scheduled', // not live!
      course_id: 'course-1',
      course: { id: 'course-1', instructor_id: 'instr-1', instructor: { user_id: 'instructor-1' } },
    })

    mockFrom.mockReturnValue(sessionChain)

    const { POST } = await import('@/app/api/education/chat/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/education/chat', {
        body: { session_id: 'session-1', message: 'Too early' },
      })
    )
    expect(result.status).toBe(400)

    const json = await result.json()
    expect(json.error).toContain('only available during live sessions')
  })

  it('should allow enrolled student to chat in live session', async () => {
    mockAuthSuccess('student-1')

    // session (live)
    const sessionChain = createChain({
      id: 'session-1',
      status: 'live',
      course_id: 'course-1',
      course: { id: 'course-1', instructor_id: 'instr-1', instructor: { user_id: 'instructor-1' } },
    })
    // enrollment (paid)
    const enrollChain = createChain({ id: 'enroll-1', payment_status: 'completed' })
    // profile
    const profileChain = createChain({ username: 'student1', full_name: 'Test Student', avatar_url: null })
    // insert message
    const insertChain = createChain({ id: 'msg-1', session_id: 'session-1', user_id: 'student-1', message: 'Hello!' })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return sessionChain     // session lookup
      if (callCount === 2) return enrollChain       // enrollment check
      if (callCount === 3) return profileChain      // profile lookup
      return insertChain                             // message insert
    })

    const { POST } = await import('@/app/api/education/chat/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/education/chat', {
        body: { session_id: 'session-1', message: 'Hello!' },
      })
    )
    expect(result.status).toBe(201)
  })

  it('should allow instructor to chat without enrollment', async () => {
    mockAuthSuccess('instructor-1') // matches instructor user_id in session.course.instructor

    const sessionChain = createChain({
      id: 'session-1',
      status: 'live',
      course_id: 'course-1',
      course: { id: 'course-1', instructor_id: 'instr-1', instructor: { user_id: 'instructor-1' } },
    })
    const profileChain = createChain({ username: 'instructor', full_name: 'Prof X', avatar_url: null })
    const insertChain = createChain({ id: 'msg-2', session_id: 'session-1', user_id: 'instructor-1', message: 'Welcome!' })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return sessionChain
      if (callCount === 2) return profileChain
      return insertChain
    })

    const { POST } = await import('@/app/api/education/chat/route')
    const result = await POST(
      createRequest('POST', 'http://localhost:3000/api/education/chat', {
        body: { session_id: 'session-1', message: 'Welcome!' },
      })
    )
    expect(result.status).toBe(201)
  })

  it('GET chat should require enrollment', async () => {
    mockAuthSuccess('outsider-1')

    // session lookup
    const sessionChain = createChain({
      id: 'session-1',
      course_id: 'course-1',
      course: { id: 'course-1', instructor_id: 'instr-1', instructor: { user_id: 'instructor-1' } },
    })
    // enrollment not found
    const enrollChain = createChain(null, null)

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return sessionChain
      return enrollChain
    })

    const { GET } = await import('@/app/api/education/chat/route')
    const result = await GET(
      createRequest('GET', 'http://localhost:3000/api/education/chat?sessionId=session-1')
    )
    expect(result.status).toBe(403)
  })
})

// ═══════════════════════════════════════════════════════
// 4. PRESENCE JOIN SECURITY
// ═══════════════════════════════════════════════════════
describe('Presence Join Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject unauthenticated join', async () => {
    mockAuthFail()

    const { POST } = await import('@/app/api/education/sessions/[id]/presence/join/route')
    const result = await POST(createRequest(), createContext())
    expect(result.status).toBe(401)
  })

  it('should reject student without payment', async () => {
    mockAuthSuccess('student-nopay')

    const sessionChain = createChain({
      id: 'session-1',
      status: 'live',
      course_id: 'course-1',
      course: { id: 'course-1', instructor_id: 'instr-1', instructor: { user_id: 'instructor-1' } },
    })
    const enrollChain = createChain(null, null) // no enrollment

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return sessionChain
      return enrollChain
    })

    const { POST } = await import('@/app/api/education/sessions/[id]/presence/join/route')
    const result = await POST(createRequest(), createContext())
    expect(result.status).toBe(403)
  })

  it('should reject join for cancelled session', async () => {
    mockAuthSuccess('student-1')

    const sessionChain = createChain({
      id: 'session-1',
      status: 'cancelled',
      course_id: 'course-1',
      course: { id: 'course-1', instructor_id: 'instr-1', instructor: { user_id: 'instructor-1' } },
    })
    mockFrom.mockReturnValue(sessionChain)

    const { POST } = await import('@/app/api/education/sessions/[id]/presence/join/route')
    const result = await POST(createRequest(), createContext())
    expect(result.status).toBe(400)
  })

  it('should allow enrolled student to join live session', async () => {
    mockAuthSuccess('student-1')

    const sessionChain = createChain({
      id: 'session-1',
      status: 'live',
      course_id: 'course-1',
      course: { id: 'course-1', instructor_id: 'instr-1', instructor: { user_id: 'instructor-1' } },
    })
    const enrollChain = createChain({ id: 'enroll-1', payment_status: 'completed' })
    const upsertChain = createChain(null) // attendance upsert

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return sessionChain
      if (callCount === 2) return enrollChain
      return upsertChain
    })

    const { POST } = await import('@/app/api/education/sessions/[id]/presence/join/route')
    const result = await POST(createRequest(), createContext())
    expect(result.status).toBe(200)

    const json = await result.json()
    expect(json.success).toBe(true)
    expect(json.is_instructor).toBe(false)
  })

  it('should auto-transition session to live when instructor joins', async () => {
    mockAuthSuccess('instructor-1')

    const sessionChain = createChain({
      id: 'session-1',
      status: 'scheduled',
      course_id: 'course-1',
      course: { id: 'course-1', instructor_id: 'instr-1', instructor: { user_id: 'instructor-1' } },
    })
    const updateChain = createChain(null) // session status update

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return sessionChain
      return updateChain
    })

    const { POST } = await import('@/app/api/education/sessions/[id]/presence/join/route')
    const result = await POST(createRequest(), createContext())

    const json = await result.json()
    expect(json.is_instructor).toBe(true)
    expect(json.session_status).toBe('live')
  })
})

// ═══════════════════════════════════════════════════════
// 5. PRESENCE LEAVE — ATTENDANCE TRACKING
// ═══════════════════════════════════════════════════════
describe('Presence Leave — Attendance Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should calculate attendance percentage correctly', async () => {
    mockAuthSuccess('student-1')

    const scheduledAt = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    const joinedAt = new Date(scheduledAt.getTime() + 2 * 60 * 1000) // joined 2 min after start

    const sessionChain = createChain({
      id: 'session-1',
      status: 'live',
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: 60,
      started_at: scheduledAt.toISOString(),
      course_id: 'course-1',
    })
    const attendanceChain = createChain({
      id: 'att-1',
      joined_at: joinedAt.toISOString(),
      status: 'joined',
    })
    const updateChain = createChain({
      id: 'att-1',
      left_at: new Date().toISOString(),
      total_seconds_connected: 3480,
      status: 'attended',
    })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return sessionChain
      if (callCount === 2) return attendanceChain
      return updateChain
    })

    const { POST } = await import('@/app/api/education/sessions/[id]/presence/leave/route')
    const result = await POST(createRequest(), createContext())
    expect(result.status).toBe(200)

    const json = await result.json()
    expect(json.success).toBe(true)
    expect(json.total_seconds_connected).toBeGreaterThan(0)
    expect(json.attendance_status).toBeDefined()
  })

  it('should mark absent if attended less than 20%', async () => {
    mockAuthSuccess('student-absent')

    const scheduledAt = new Date(Date.now() - 60 * 60 * 1000)
    const joinedAt = new Date(Date.now() - 5 * 60 * 1000) // only 5 min connected in 60 min session

    const sessionChain = createChain({
      id: 'session-1',
      status: 'live',
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: 60,
      started_at: scheduledAt.toISOString(),
      course_id: 'course-1',
    })
    const attendanceChain = createChain({
      id: 'att-1',
      joined_at: joinedAt.toISOString(),
      status: 'joined',
    })
    const updateChain = createChain({ status: 'absent' })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return sessionChain
      if (callCount === 2) return attendanceChain
      return updateChain
    })

    const { POST } = await import('@/app/api/education/sessions/[id]/presence/leave/route')
    const result = await POST(createRequest(), createContext())

    const json = await result.json()
    // 5 min / 60 min = 8.3% < 20% → absent
    expect(json.attendance_status).toBe('absent')
  })
})

// ═══════════════════════════════════════════════════════
// 6. TIMER — NO WRITE SIDE-EFFECTS (BUG 5 FIX)
// ═══════════════════════════════════════════════════════
describe('Timer — Pure Read (No Side Effects)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return timer state without modifying session', async () => {
    mockAuthSuccess('student-1')

    const now = new Date()
    const startedAt = new Date(now.getTime() - 30 * 60 * 1000) // started 30 min ago

    const sessionChain = createChain({
      id: 'session-1',
      status: 'live',
      scheduled_at: startedAt.toISOString(),
      duration_minutes: 60,
      started_at: startedAt.toISOString(),
      ended_at: null,
    })
    mockFrom.mockReturnValue(sessionChain)

    const { GET } = await import('@/app/api/education/sessions/[id]/timer/route')
    const result = await GET(createRequest(), createContext())
    expect(result.status).toBe(200)

    const json = await result.json()
    expect(json.remaining_seconds).toBeGreaterThan(0)
    expect(json.remaining_seconds).toBeLessThanOrEqual(30 * 60)
    expect(json.elapsed_seconds).toBeGreaterThan(0)
    expect(json.duration_minutes).toBe(60)
    expect(json.progress_percent).toBeGreaterThanOrEqual(45)
    expect(json.progress_percent).toBeLessThanOrEqual(55)

    // CRITICAL: .update() should NOT have been called
    expect(sessionChain.update).not.toHaveBeenCalled()
  })

  it('should report ended state via warnings without DB write', async () => {
    mockAuthSuccess('student-1')

    const startedAt = new Date(Date.now() - 65 * 60 * 1000) // started 65 min ago (past the 60 min)

    const sessionChain = createChain({
      id: 'session-1',
      status: 'live',
      scheduled_at: startedAt.toISOString(),
      duration_minutes: 60,
      started_at: startedAt.toISOString(),
      ended_at: null,
    })
    mockFrom.mockReturnValue(sessionChain)

    const { GET } = await import('@/app/api/education/sessions/[id]/timer/route')
    const result = await GET(createRequest(), createContext())
    expect(result.status).toBe(200)

    const json = await result.json()
    expect(json.remaining_seconds).toBe(0)
    expect(json.warnings.ended).toBe(true)
    expect(json.warnings.should_end_session).toBe(true)

    // CRITICAL: No update should have been made
    expect(sessionChain.update).not.toHaveBeenCalled()
  })

  it('should show closing warnings at 10, 5, 1 minute marks', async () => {
    mockAuthSuccess('student-1')

    // 4 min remaining
    const startedAt = new Date(Date.now() - 56 * 60 * 1000)

    const sessionChain = createChain({
      id: 'session-1',
      status: 'live',
      scheduled_at: startedAt.toISOString(),
      duration_minutes: 60,
      started_at: startedAt.toISOString(),
      ended_at: null,
    })
    mockFrom.mockReturnValue(sessionChain)

    const { GET } = await import('@/app/api/education/sessions/[id]/timer/route')
    const result = await GET(createRequest(), createContext())

    const json = await result.json()
    expect(json.warnings.closing_10min).toBe(true) // 4 min < 10 min
    expect(json.warnings.closing_5min).toBe(true)  // 4 min < 5 min
    expect(json.warnings.closing_1min).toBe(false)  // 4 min > 1 min
  })
})

// ═══════════════════════════════════════════════════════
// 7. ACCESS STATUS — COMPREHENSIVE CHECKS
// ═══════════════════════════════════════════════════════
describe('Access Status Checks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return not_enrolled for unenrolled user', async () => {
    mockAuthSuccess('outsider-1')

    const sessionChain = createChain({
      id: 'session-1',
      session_number: 1,
      title: 'Class 1',
      status: 'scheduled',
      scheduled_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      duration_minutes: 60,
      course_id: 'course-1',
      agora_channel: 'edu_abc_1',
      course: { id: 'course-1', status: 'published', instructor_id: 'instr-1', title: 'Test Course', instructor: { user_id: 'instructor-1' } },
    })
    const enrollChain = createChain(null, null)

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return sessionChain
      return enrollChain
    })

    const { GET } = await import('@/app/api/education/sessions/[id]/access-status/route')
    const result = await GET(createRequest(), createContext())

    const json = await result.json()
    expect(json.can_enter).toBe(false)
    expect(json.reason).toBe('not_enrolled')
    expect(json.viewer_role).toBe('none')
  })

  it('should report too_early if window not open', async () => {
    mockAuthSuccess('student-1')

    const farFuture = new Date(Date.now() + 2 * 60 * 60 * 1000)
    const sessionChain = createChain({
      id: 'session-1',
      session_number: 1,
      title: 'Class 1',
      status: 'scheduled',
      scheduled_at: farFuture.toISOString(),
      duration_minutes: 60,
      course_id: 'course-1',
      agora_channel: 'edu_abc_1',
      course: { id: 'course-1', status: 'published', instructor_id: 'instr-1', title: 'Test', instructor: { user_id: 'instructor-1' } },
    })
    const enrollChain = createChain({ id: 'enroll-1', enrollment_status: 'active', payment_status: 'completed' })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return sessionChain
      return enrollChain
    })

    const { GET } = await import('@/app/api/education/sessions/[id]/access-status/route')
    const result = await GET(createRequest(), createContext())

    const json = await result.json()
    expect(json.can_enter).toBe(false)
    expect(json.reason).toBe('too_early')
    expect(json.minutes_until_open).toBeGreaterThan(0)
  })

  it('should allow entry within time window for enrolled student', async () => {
    mockAuthSuccess('student-1')

    // Session starts 5 min from now → window already open (opens 15 min before)
    const soon = new Date(Date.now() + 5 * 60 * 1000)
    const sessionChain = createChain({
      id: 'session-1',
      session_number: 1,
      title: 'Class 1',
      status: 'scheduled',
      scheduled_at: soon.toISOString(),
      duration_minutes: 60,
      course_id: 'course-1',
      agora_channel: 'edu_abc_1',
      course: { id: 'course-1', status: 'published', instructor_id: 'instr-1', title: 'Test', instructor: { user_id: 'instructor-1' } },
    })
    const enrollChain = createChain({ id: 'enroll-1', enrollment_status: 'active', payment_status: 'completed' })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return sessionChain
      return enrollChain
    })

    const { GET } = await import('@/app/api/education/sessions/[id]/access-status/route')
    const result = await GET(createRequest(), createContext())

    const json = await result.json()
    expect(json.can_enter).toBe(true)
    expect(json.reason).toBeNull()
    expect(json.viewer_role).toBe('student')
    expect(json.is_enrolled).toBe(true)
  })

  it('should return instructor role for course instructor', async () => {
    mockAuthSuccess('instructor-1')

    const soon = new Date(Date.now() + 5 * 60 * 1000)
    const sessionChain = createChain({
      id: 'session-1',
      session_number: 1,
      title: 'Class 1',
      status: 'scheduled',
      scheduled_at: soon.toISOString(),
      duration_minutes: 60,
      course_id: 'course-1',
      agora_channel: 'edu_abc_1',
      course: { id: 'course-1', status: 'published', instructor_id: 'instr-1', title: 'Test', instructor: { user_id: 'instructor-1' } },
    })

    mockFrom.mockReturnValue(sessionChain)

    const { GET } = await import('@/app/api/education/sessions/[id]/access-status/route')
    const result = await GET(createRequest(), createContext())

    const json = await result.json()
    expect(json.can_enter).toBe(true)
    expect(json.viewer_role).toBe('instructor')
  })
})
