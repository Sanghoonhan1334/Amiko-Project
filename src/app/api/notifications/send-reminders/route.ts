import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { emailService } from '@/lib/email-service'

// 상담 시작 1시간 전 알림 이메일 발송
export async function POST() {
  try {
    console.log('[REMINDER] 상담 알림 이메일 발송 시작')

    // 1시간 후에 시작하는 상담 조회
    const oneHourFromNow = new Date()
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1)
    
    const { data: upcomingBookings, error } = await (supabase as any)
      .from('bookings')
      .select(`
        *,
        users!inner(email, name),
        consultants!inner(name, specialty)
      `)
      .eq('status', 'confirmed')
      .gte('start_at', oneHourFromNow.toISOString())
      .lt('start_at', new Date(oneHourFromNow.getTime() + 5 * 60 * 1000).toISOString()) // 5분 범위

    if (error) {
      console.error('[REMINDER] 상담 조회 실패:', error)
      return NextResponse.json(
        { success: false, error: '상담 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (!upcomingBookings || upcomingBookings.length === 0) {
      console.log('[REMINDER] 발송할 상담 알림이 없습니다.')
      return NextResponse.json({
        success: true,
        message: '발송할 상담 알림이 없습니다.',
        count: 0
      })
    }

    console.log(`[REMINDER] ${upcomingBookings.length}개의 상담 알림 발송 시작`)

    // 각 상담에 대해 알림 이메일 발송
    const emailResults = []
    for (const booking of upcomingBookings) {
      try {
        await emailService.sendNotificationEmail(
          booking.users.email,
          'consultation_reminder',
          {
            consultantName: booking.consultants.name,
            bookingDate: new Date(booking.start_at).toLocaleString('ko-KR'),
            duration: booking.duration,
            topic: booking.topic,
            startTime: new Date(booking.start_at).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit'
            })
          }
        )
        
        emailResults.push({
          bookingId: booking.id,
          email: booking.users.email,
          status: 'success'
        })
        
        console.log(`[REMINDER] 상담 알림 이메일 발송 성공: ${booking.users.email}`)
      } catch (emailError) {
        console.error(`[REMINDER] 상담 알림 이메일 발송 실패: ${booking.users.email}`, emailError)
        emailResults.push({
          bookingId: booking.id,
          email: booking.users.email,
          status: 'failed',
          error: emailError instanceof Error ? emailError.message : '알 수 없는 오류'
        })
      }
    }

    const successCount = emailResults.filter(r => r.status === 'success').length
    const failedCount = emailResults.filter(r => r.status === 'failed').length

    console.log(`[REMINDER] 상담 알림 발송 완료: 성공 ${successCount}개, 실패 ${failedCount}개`)

    return NextResponse.json({
      success: true,
      message: '상담 알림 이메일 발송이 완료되었습니다.',
      total: upcomingBookings.length,
      successCount: successCount,
      failed: failedCount,
      results: emailResults
    })

  } catch (error) {
    console.error('[REMINDER] 상담 알림 발송 중 예외:', error)
    return NextResponse.json(
      { success: false, error: '상담 알림 발송에 실패했습니다.' },
      { status: 500 }
    )
  }
}
