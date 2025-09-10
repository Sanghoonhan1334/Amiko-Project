import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    // 모든 결제 내역 조회
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[ADMIN PAYMENTS] 조회 실패:', error)
      
      // payments 테이블이 없는 경우 더미 데이터 반환
      if (error.code === 'PGRST205') {
        console.log('[ADMIN PAYMENTS] payments 테이블이 없어서 더미 데이터 반환')
        return NextResponse.json({
          success: true,
          payments: [
            {
              id: 'dummy-1',
              payment_key: 'dummy_payment_key_1',
              order_id: 'order-123',
              amount: 40000,
              status: 'DONE',
              customer_email: 'test@example.com',
              created_at: new Date().toISOString()
            },
            {
              id: 'dummy-2',
              payment_key: 'dummy_payment_key_2',
              order_id: 'order-456',
              amount: 60000,
              status: 'DONE',
              customer_email: 'test2@example.com',
              created_at: new Date().toISOString()
            }
          ],
          message: '더미 데이터 (payments 테이블이 없음)'
        })
      }
      
      return NextResponse.json(
        { success: false, error: '결제 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      payments: payments || [],
      message: '결제 목록 조회 성공'
    })

  } catch (error) {
    console.error('결제 목록 조회 실패:', error)
    return NextResponse.json(
      { success: false, error: '결제 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
