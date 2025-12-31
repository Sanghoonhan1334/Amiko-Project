console.log('🔥 VERIFY_START MODULE LOADING');

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('🔥 VERIFY_START HANDLER ENTERED');
  console.log('🔥 VERIFY_START Request method:', request.method);
  return NextResponse.json({ ok: true });
}
