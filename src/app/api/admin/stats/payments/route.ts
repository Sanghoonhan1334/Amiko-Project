import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    // 전체 결제 통계
    const { data: totalData, error: totalError } = await supabase
      .from('payments')
      .select('id, amount, status')

    if (totalError) {
      console.error('[ADMIN] 결제 통계 조회 실패:', totalError)
      return NextResponse.json(
        { success: false, message: '결제 통계 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 총 결제 건수
    const totalPayments = totalData.length

    // 총 결제 금액
    const totalAmount = totalData.reduce((sum: number, payment: { amount: number }) => sum + payment.amount, 0)

    // 결제 상태별 통계
    const statusStats = totalData.reduce((acc: Record<string, number>, payment: { status: string }) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1
      return acc
    }, {})

    // 최근 결제 내역 (최근 5건)
    const { data: recentPayments, error: recentError } = await supabase
      .from('payments')
      .select('id, amount, status, method, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) {
      console.error('[ADMIN] 최근 결제 조회 실패:', recentError)
    }

    return NextResponse.json({
      success: true,
      total: totalPayments,
      totalAmount,
      statusStats,
      recent: recentPayments || []
    })

  } catch (error: unknown) {
    console.error('[ADMIN] 결제 통계 처리 실패:', error)
    return NextResponse.json(
      { success: false, message: '결제 통계 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
