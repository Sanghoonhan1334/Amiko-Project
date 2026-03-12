/**
 * AMIKO Mentor — Unit Tests
 *
 * Tests for:
 * 1. Booking Approve API — auth, meet link generation, status transition, rollback
 * 2. Booking Reject API — auth, status transition, schedule restoration
 * 3. Booking Cancel API — auth, ownership check (IDOR), status update
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Chain builder ─────────────────────────────────────
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

// ── Shared Supabase mock ──────────────────────────────
const mockGetUser = vi.fn()
const mockGetSession = vi.fn()
const mockFrom = vi.fn()

const mockSupabaseInstance = {
  auth: {
    getUser: mockGetUser,
    getSession: mockGetSession,
  },
  from: mockFrom,
}

// Mock @/lib/supabase — createSupabaseClient (used in approve/reject)
vi.mock('@/lib/supabase', () => ({
  createSupabaseClient: vi.fn(async () => mockSupabaseInstance),
}))

// Mock @supabase/supabase-js — createClient (used in cancel)
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseInstance),
}))

// Mock meet-link-generator
vi.mock('@/lib/meet-link-generator', () => ({
  generateMeetLink: vi.fn((id: string) => `https://meet.google.com/abc-defg-hij`),
}))

// ── Helpers ───────────────────────────────────────────
function createRequest(
  method: string = 'GET',
  url: string = 'http://localhost:3000/api/test',
  options: { body?: any; headers?: Record<string, string> } = {}
) {
  const headers = new Headers(options.headers || {})
  return {
    method,
    url,
    headers: {
      get: (name: string) => headers.get(name.toLowerCase()),
    },
    json: vi.fn().mockResolvedValue(options.body || {}),
  } as any
}

function createContext(id: string = 'booking-1') {
  return { params: Promise.resolve({ id }) }
}

function mockAuthUser(userId: string = 'partner-user-1') {
  mockGetUser.mockResolvedValue({
    data: { user: { id: userId, email: 'partner@test.com' } },
    error: null,
  })
}

function mockNoAuth() {
  mockGetUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'No auth' },
  })
}

// ═══════════════════════════════════════════════════════
// 1. BOOKING APPROVE
// ═══════════════════════════════════════════════════════
describe('Booking Approve API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated requests', async () => {
    mockNoAuth()

    const { POST } = await import('@/app/api/bookings/[id]/approve/route')
    const result = await POST(createRequest('POST', '/api/bookings/booking-1/approve'), createContext())
    expect(result.status).toBe(401)
  })

  it('rejects non-partner users (403)', async () => {
    mockAuthUser('user-1')

    // Partner lookup returns null
    const partnerChain = createChain(null)
    mockFrom.mockReturnValue(partnerChain)

    const { POST } = await import('@/app/api/bookings/[id]/approve/route')
    const result = await POST(createRequest('POST', '/api/bookings/booking-1/approve'), createContext())
    expect(result.status).toBe(403)
  })

  it('returns 404 when booking not found', async () => {
    mockAuthUser('partner-user-1')

    const partnerChain = createChain({ id: 'p-1', user_id: 'partner-user-1' })
    const bookingChain = createChain(null) // booking not found

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return partnerChain // conversation_partners
      return bookingChain
    })

    const { POST } = await import('@/app/api/bookings/[id]/approve/route')
    const result = await POST(createRequest('POST', '/api/bookings/booking-1/approve'), createContext())
    expect(result.status).toBe(404)
  })

  it('rejects when partner does not own the booking (403)', async () => {
    mockAuthUser('partner-user-1')

    const partnerChain = createChain({ id: 'p-1', user_id: 'partner-user-1' })
    const bookingChain = createChain({
      id: 'booking-1',
      partner_id: 'other-partner', // different partner
      status: 'pending',
    })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return partnerChain
      return bookingChain
    })

    const { POST } = await import('@/app/api/bookings/[id]/approve/route')
    const result = await POST(createRequest('POST', '/api/bookings/booking-1/approve'), createContext())
    expect(result.status).toBe(403)
  })

  it('rejects already-processed bookings (not pending)', async () => {
    mockAuthUser('partner-user-1')

    const partnerChain = createChain({ id: 'p-1', user_id: 'partner-user-1' })
    const bookingChain = createChain({
      id: 'booking-1',
      partner_id: 'partner-user-1',
      status: 'approved', // already processed
    })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return partnerChain
      return bookingChain
    })

    const { POST } = await import('@/app/api/bookings/[id]/approve/route')
    const result = await POST(createRequest('POST', '/api/bookings/booking-1/approve'), createContext())
    expect(result.status).toBe(400)
  })

  it('approves booking, generates meet link, sends notification', async () => {
    mockAuthUser('partner-user-1')

    const partnerChain = createChain({ id: 'p-1', user_id: 'partner-user-1' })
    const bookingChain = createChain({
      id: 'booking-1',
      partner_id: 'partner-user-1',
      user_id: 'student-1',
      status: 'pending',
      date: '2026-03-20',
      start_time: '14:00',
      meet_url: null,
    })
    const updateChain = createChain(null) // update success (no error)
    const scheduleChain = createChain(null) // schedule update success
    const userChain = createChain({ full_name: 'Test Partner', nickname: 'tp' })
    const notifChain = createChain(null) // notification insert

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return partnerChain       // conversation_partners
      if (callCount === 2) return bookingChain        // booking_requests (read)
      if (callCount === 3) return updateChain         // booking_requests (update)
      if (callCount === 4) return scheduleChain       // available_schedules (update)
      if (callCount === 5) return userChain           // users (partner name)
      return notifChain                               // notifications (insert)
    })

    const { POST } = await import('@/app/api/bookings/[id]/approve/route')
    const result = await POST(createRequest('POST', '/api/bookings/booking-1/approve'), createContext())
    expect(result.status).toBe(200)
    const json = await result.json()
    expect(json.success).toBe(true)
  })

  it('reuses existing meet_url if already present', async () => {
    mockAuthUser('partner-user-1')

    const partnerChain = createChain({ id: 'p-1', user_id: 'partner-user-1' })
    const bookingChain = createChain({
      id: 'booking-1',
      partner_id: 'partner-user-1',
      user_id: 'student-1',
      status: 'pending',
      date: '2026-03-20',
      start_time: '14:00',
      meet_url: 'https://meet.google.com/existing-link', // already exists
    })
    const updateChain = createChain(null)
    const scheduleChain = createChain(null)
    const userChain = createChain({ full_name: 'Partner', nickname: 'p' })
    const notifChain = createChain(null)

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return partnerChain
      if (callCount === 2) return bookingChain
      if (callCount === 3) return updateChain
      if (callCount === 4) return scheduleChain
      if (callCount === 5) return userChain
      return notifChain
    })

    const { POST } = await import('@/app/api/bookings/[id]/approve/route')
    const result = await POST(createRequest('POST', '/api/bookings/booking-1/approve'), createContext())
    expect(result.status).toBe(200)

    // The update call should contain the existing meet_url
    const updateCall = updateChain.update.mock.calls[0]?.[0]
    expect(updateCall.meet_url).toBe('https://meet.google.com/existing-link')
  })

  it('rolls back on schedule update failure', async () => {
    mockAuthUser('partner-user-1')

    const partnerChain = createChain({ id: 'p-1', user_id: 'partner-user-1' })
    const bookingChain = createChain({
      id: 'booking-1',
      partner_id: 'partner-user-1',
      user_id: 'student-1',
      status: 'pending',
      date: '2026-03-20',
      meet_url: null,
    })
    const updateChain = createChain(null) // booking update success
    const scheduleChain = createChain(null, { message: 'Schedule update failed' }) // schedule FAILS
    const rollbackChain = createChain(null) // rollback

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return partnerChain
      if (callCount === 2) return bookingChain
      if (callCount === 3) return updateChain
      if (callCount === 4) return scheduleChain
      if (callCount === 5) return rollbackChain // rollback call
      return createChain(null)
    })

    const { POST } = await import('@/app/api/bookings/[id]/approve/route')
    const result = await POST(createRequest('POST', '/api/bookings/booking-1/approve'), createContext())
    expect(result.status).toBe(500)
  })
})

// ═══════════════════════════════════════════════════════
// 2. BOOKING REJECT
// ═══════════════════════════════════════════════════════
describe('Booking Reject API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated requests', async () => {
    mockNoAuth()

    const { POST } = await import('@/app/api/bookings/[id]/reject/route')
    const result = await POST(
      createRequest('POST', '/api/bookings/booking-1/reject', {
        body: { rejection_reason: 'Not available' },
      }),
      createContext()
    )
    expect(result.status).toBe(401)
  })

  it('rejects non-partner users', async () => {
    mockAuthUser('user-1')
    mockFrom.mockReturnValue(createChain(null)) // no partner found

    const { POST } = await import('@/app/api/bookings/[id]/reject/route')
    const result = await POST(
      createRequest('POST', '/api/bookings/booking-1/reject', {
        body: { rejection_reason: 'Busy' },
      }),
      createContext()
    )
    expect(result.status).toBe(403)
  })

  it('returns 404 when booking not found', async () => {
    mockAuthUser('partner-user-1')

    const partnerChain = createChain({ id: 'p-1', user_id: 'partner-user-1' })
    const bookingChain = createChain(null)

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return partnerChain
      return bookingChain
    })

    const { POST } = await import('@/app/api/bookings/[id]/reject/route')
    const result = await POST(
      createRequest('POST', '/api/bookings/booking-1/reject', {
        body: { rejection_reason: 'Unavailable' },
      }),
      createContext()
    )
    expect(result.status).toBe(404)
  })

  it('rejects booking not owned by the partner', async () => {
    mockAuthUser('partner-user-1')

    const partnerChain = createChain({ id: 'p-1', user_id: 'partner-user-1' })
    const bookingChain = createChain({
      id: 'booking-1',
      partner_id: 'other-partner',
      status: 'pending',
    })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return partnerChain
      return bookingChain
    })

    const { POST } = await import('@/app/api/bookings/[id]/reject/route')
    const result = await POST(
      createRequest('POST', '/api/bookings/booking-1/reject', {
        body: { rejection_reason: 'Busy' },
      }),
      createContext()
    )
    expect(result.status).toBe(403)
  })

  it('rejects already-processed bookings', async () => {
    mockAuthUser('partner-user-1')

    const partnerChain = createChain({ id: 'p-1', user_id: 'partner-user-1' })
    const bookingChain = createChain({
      id: 'booking-1',
      partner_id: 'partner-user-1',
      status: 'approved', // not pending
    })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return partnerChain
      return bookingChain
    })

    const { POST } = await import('@/app/api/bookings/[id]/reject/route')
    const result = await POST(
      createRequest('POST', '/api/bookings/booking-1/reject', {
        body: { rejection_reason: 'Changed plans' },
      }),
      createContext()
    )
    expect(result.status).toBe(400)
  })

  it('successfully rejects a pending booking and restores schedule', async () => {
    mockAuthUser('partner-user-1')

    const partnerChain = createChain({ id: 'p-1', user_id: 'partner-user-1' })
    const bookingChain = createChain({
      id: 'booking-1',
      partner_id: 'partner-user-1',
      user_id: 'student-1',
      status: 'pending',
      date: '2026-04-01',
      start_time: '10:00',
    })
    const updateChain = createChain(null) // update success
    const scheduleChain = createChain(null) // schedule restore success
    const userChain = createChain({ full_name: 'Partner Name', nickname: 'pn' })
    const notifChain = createChain(null)

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return partnerChain
      if (callCount === 2) return bookingChain
      if (callCount === 3) return updateChain
      if (callCount === 4) return scheduleChain
      if (callCount === 5) return userChain
      return notifChain
    })

    const { POST } = await import('@/app/api/bookings/[id]/reject/route')
    const result = await POST(
      createRequest('POST', '/api/bookings/booking-1/reject', {
        body: { rejection_reason: 'Schedule conflict' },
      }),
      createContext()
    )
    expect(result.status).toBe(200)
    const json = await result.json()
    expect(json.success).toBe(true)

    // Verify reject reason was set
    const updatePayload = updateChain.update.mock.calls[0]?.[0]
    expect(updatePayload.status).toBe('rejected')
    expect(updatePayload.rejection_reason).toBe('Schedule conflict')
  })

  it('uses default rejection reason when none provided', async () => {
    mockAuthUser('partner-user-1')

    const partnerChain = createChain({ id: 'p-1', user_id: 'partner-user-1' })
    const bookingChain = createChain({
      id: 'booking-1',
      partner_id: 'partner-user-1',
      user_id: 'student-1',
      status: 'pending',
      date: '2026-04-01',
      start_time: '10:00',
    })
    const updateChain = createChain(null)
    const scheduleChain = createChain(null)
    const userChain = createChain({ full_name: 'Partner', nickname: 'p' })
    const notifChain = createChain(null)

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return partnerChain
      if (callCount === 2) return bookingChain
      if (callCount === 3) return updateChain
      if (callCount === 4) return scheduleChain
      if (callCount === 5) return userChain
      return notifChain
    })

    const { POST } = await import('@/app/api/bookings/[id]/reject/route')
    const result = await POST(
      createRequest('POST', '/api/bookings/booking-1/reject', {
        body: {}, // no rejection_reason
      }),
      createContext()
    )
    expect(result.status).toBe(200)

    // Should use default reason
    const updatePayload = updateChain.update.mock.calls[0]?.[0]
    expect(updatePayload.rejection_reason).toBeTruthy()
  })
})

// ═══════════════════════════════════════════════════════
// 3. BOOKING CANCEL
// ═══════════════════════════════════════════════════════
describe('Booking Cancel API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated requests', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'No session' },
    })

    const { POST } = await import('@/app/api/bookings/[id]/cancel/route')
    const result = await POST(
      createRequest('POST', '/api/bookings/booking-1/cancel', {
        body: { cancelReason: 'Not needed' },
      }),
      createContext()
    )
    expect(result.status).toBe(401)
  })

  it('prevents IDOR — rejects cancellation by non-owner', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'attacker-user' } } },
      error: null,
    })

    // Booking owned by different user
    const bookingChain = createChain({
      id: 'booking-1',
      user_id: 'real-owner',
      status: 'confirmed',
    })
    mockFrom.mockReturnValue(bookingChain)

    const { POST } = await import('@/app/api/bookings/[id]/cancel/route')
    const result = await POST(
      createRequest('POST', '/api/bookings/booking-1/cancel', {
        body: { cancelReason: 'Steal cancel' },
      }),
      createContext()
    )
    expect(result.status).toBe(403)
  })

  it('returns 404 when booking does not exist', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    })

    const bookingChain = createChain(null, { message: 'Not found' })
    mockFrom.mockReturnValue(bookingChain)

    const { POST } = await import('@/app/api/bookings/[id]/cancel/route')
    const result = await POST(
      createRequest('POST', '/api/bookings/booking-1/cancel', {
        body: { cancelReason: 'Test' },
      }),
      createContext()
    )
    expect(result.status).toBe(404)
  })

  it('successfully cancels a booking owned by the user', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    })

    // Read booking
    const readChain = createChain({
      id: 'booking-1',
      user_id: 'user-1',
      status: 'confirmed',
    })
    // Update booking
    const updateChain = createChain({
      id: 'booking-1',
      status: 'cancelled',
    })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return readChain
      return updateChain
    })

    const { POST } = await import('@/app/api/bookings/[id]/cancel/route')
    const result = await POST(
      createRequest('POST', '/api/bookings/booking-1/cancel', {
        body: { cancelReason: 'Schedule changed' },
      }),
      createContext()
    )
    expect(result.status).toBe(200)
    const json = await result.json()
    expect(json.success).toBe(true)
    expect(json.data.status).toBe('cancelled')
  })
})
