import { NextResponse } from 'next/server'

// Test endpoint removed for security — use /api/admin/points/total-ranking instead
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'This test endpoint has been removed. Use /api/admin/points/total-ranking instead.' },
    { status: 410 }
  )
}

