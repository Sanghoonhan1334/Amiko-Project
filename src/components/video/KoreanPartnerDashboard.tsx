'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Clock, User, CheckCircle, XCircle, Calendar, Plus, Trash2, List, CalendarDays, ChevronLeft, ChevronRight, ChevronDown, Settings, Video, DoorClosed, DoorOpen } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DayPicker } from 'react-day-picker'
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { ko, es } from 'date-fns/locale'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import UserBadge from '@/components/common/UserBadge'
import { Navigation, Pagination } from 'swiper/modules'
import 'react-day-picker/src/style.css'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface KoreanPartnerDashboardProps {
  bookings: any[]
  mySchedules: any[]
  onRefresh: () => void
  onScheduleRefresh: () => void
}

export default function KoreanPartnerDashboard({ 
  bookings, 
  mySchedules, 
  onRefresh,
  onScheduleRefresh 
}: KoreanPartnerDashboardProps) {
  const { language, t } = useLanguage()
  const { token } = useAuth()
  const router = useRouter()
  
  // 스케줄 상태 번역 함수
  const translateStatus = (status: string) => {
    if (language === 'es') {
      switch (status) {
        case 'available': return 'Disponible'
        case 'booked': return 'Reservado'
        case 'pending': return 'Pendiente'
        case 'confirmed': return 'Confirmado'
        case 'rejected': return 'Rechazado'
        case 'cancelled': return 'Cancelado'
        default: return status
      }
    } else {
      switch (status) {
        case 'available': return '가능'
        case 'booked': return '예약됨'
        case 'pending': return '대기중'
        case 'confirmed': return '확정'
        case 'rejected': return '거절됨'
        case 'cancelled': return '취소됨'
        default: return status
      }
    }
  }
  const [showAddSchedule, setShowAddSchedule] = useState(false)
  const [showAddRecurringSchedule, setShowAddRecurringSchedule] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [recurringSchedules, setRecurringSchedules] = useState<any[]>([])
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    start_time: '',
    end_time: ''
  })
  const [recurringForm, setRecurringForm] = useState({
    days_of_week: [] as number[],
    start_time: '',
    end_time: ''
  })
  const [mainView, setMainView] = useState<'settings' | 'calendar'>('settings')
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(undefined)
  const [swiperInstance, setSwiperInstance] = useState<any>(null)
  
  // 아코디언 상태
  const [isPendingExpanded, setIsPendingExpanded] = useState(true)
  const [isApprovedExpanded, setIsApprovedExpanded] = useState(true)
  const [isRejectedExpanded, setIsRejectedExpanded] = useState(false)
  
  // 거절 모달 상태
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string>('')
  
  // 거절 사유 옵션 (한국어 원본 - DB에 저장될 값)
  const rejectionReasons = [
    { value: '일정이 맞지 않습니다', labelKo: '일정이 맞지 않습니다', labelEs: 'El horario no coincide' },
    { value: '개인 사정이 있습니다', labelKo: '개인 사정이 있습니다', labelEs: 'Tengo asuntos personales' },
    { value: '예약 시간이 부적절합니다', labelKo: '예약 시간이 부적절합니다', labelEs: 'La hora de la reserva no es apropiada' },
    { value: '급한 일이 생겼습니다', labelKo: '급한 일이 생겼습니다', labelEs: 'Ha surgido algo urgente' },
    { value: '기타', labelKo: '기타', labelEs: 'Otro' }
  ]

  // 인증 헤더 생성
  const getAuthHeaders = async () => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    // 토큰 가져오기 (여러 소스에서 시도)
    let authToken: string | null = token || null
    
    if (!authToken && typeof window !== 'undefined') {
      authToken = localStorage.getItem('amiko_token')
      
      // 토큰이 없으면 Supabase 세션에서 가져오기 시도
      if (!authToken) {
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          )
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.access_token) {
            authToken = session.access_token
            localStorage.setItem('amiko_token', authToken)
          }
        } catch (error) {
          console.error('토큰 가져오기 실패:', error)
        }
      }
    }
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${encodeURIComponent(authToken)}`
    } else {
      console.warn('인증 토큰을 찾을 수 없습니다.')
    }
    
    return headers
  }

  const DAYS_OF_WEEK = [
    { value: 0, label: language === 'es' ? 'Dom' : '일', full: language === 'es' ? 'Domingo' : '일요일' },
    { value: 1, label: language === 'es' ? 'Lun' : '월', full: language === 'es' ? 'Lunes' : '월요일' },
    { value: 2, label: language === 'es' ? 'Mar' : '화', full: language === 'es' ? 'Martes' : '화요일' },
    { value: 3, label: language === 'es' ? 'Mié' : '수', full: language === 'es' ? 'Miércoles' : '수요일' },
    { value: 4, label: language === 'es' ? 'Jue' : '목', full: language === 'es' ? 'Jueves' : '목요일' },
    { value: 5, label: language === 'es' ? 'Vie' : '금', full: language === 'es' ? 'Viernes' : '금요일' },
    { value: 6, label: language === 'es' ? 'Sáb' : '토', full: language === 'es' ? 'Sábado' : '토요일' }
  ]

  const handleApprove = async (bookingId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/approve`, { 
        method: 'POST',
        credentials: 'include'
      })
      if (response.ok) {
        alert(language === 'es' 
          ? '✅ Reserva aprobada. El enlace de Google Meet se ha generado automáticamente.'
          : '✅ 예약이 승인되었습니다. Google Meet 링크가 자동으로 생성되었습니다.')
        onRefresh()
      } else {
        const error = await response.json()
        alert(language === 'es' 
          ? `Error: ${error.error || 'Error al aprobar la reserva'}`
          : `오류: ${error.error || '예약 승인 실패'}`)
      }
    } catch (error) {
      console.error('예약 승인 실패:', error)
      alert(language === 'es' 
        ? 'Error al aprobar la reserva'
        : '예약 승인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleRejectClick = (bookingId: string) => {
    setRejectingBookingId(bookingId)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const handleRejectConfirm = async () => {
    if (!rejectingBookingId || !rejectionReason) {
      alert(language === 'es' ? 'Por favor selecciona un motivo de rechazo' : '거절 사유를 선택해주세요.')
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`/api/bookings/${rejectingBookingId}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: rejectionReason })
      })
      if (response.ok) {
        setShowRejectModal(false)
        setRejectingBookingId(null)
        setRejectionReason('')
        onRefresh()
      } else {
        const error = await response.json().catch(() => ({ error: '알 수 없는 오류' }))
        alert(language === 'es' 
          ? `Error: ${error.error || 'Error al rechazar la reserva'}`
          : `오류: ${error.error || '예약 거절 실패'}`)
      }
    } catch (error) {
      console.error('예약 거절 실패:', error)
      alert(language === 'es' 
        ? 'Error al rechazar la reserva'
        : '예약 거절 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSchedule = async () => {
    if (!scheduleForm.date || !scheduleForm.start_time || !scheduleForm.end_time) {
      alert(language === 'es' ? 'Por favor completa todos los campos' : '모든 필드를 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/partners/schedules', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(scheduleForm)
      })
      if (response.ok) {
        setShowAddSchedule(false)
        setScheduleForm({ date: '', start_time: '', end_time: '' })
        // 스케줄 목록 새로고침 (약간의 지연을 두어 DB 반영 대기)
        setTimeout(() => {
          onScheduleRefresh()
        }, 300)
        alert(language === 'es' ? 'Horario agregado correctamente' : '가능 시간이 추가되었습니다.')
      } else {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }))
        const errorMessage = errorData.error || '가능 시간 추가 실패'
        console.error('[handleAddSchedule] 오류 상세:', errorData)
        alert(language === 'es' 
          ? `Error: ${errorMessage}`
          : `오류: ${errorMessage}`)
      }
    } catch (error) {
      console.error('가능 시간 추가 실패:', error)
      alert(language === 'es' 
        ? 'Error al agregar horario. Por favor intenta de nuevo.'
        : '가능 시간 추가 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm(language === 'es' ? '¿Eliminar este horario?' : '가능 시간을 삭제하시겠습니까?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/partners/schedules/${scheduleId}`, { 
        method: 'DELETE',
        headers: await getAuthHeaders()
      })
      if (response.ok) onScheduleRefresh()
    } catch (error) {
      console.error('가능 시간 삭제 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // mySchedules 변경 추적 (디버깅용)
  useEffect(() => {
    console.log('[KoreanPartnerDashboard] mySchedules 변경:', mySchedules?.length || 0, '개', mySchedules)
  }, [mySchedules])

  // bookings 변경 추적 및 DB 값 확인 (디버깅용)
  useEffect(() => {
    console.log('[KoreanPartnerDashboard] ⚠️ bookings prop 변경됨:', bookings?.length || 0, '개')
    
    if (bookings && bookings.length > 0) {
      console.log('[KoreanPartnerDashboard] ⚠️ 예약 데이터 확인 (DB에서 받은 원본 값):')
      bookings.forEach((b: any, index: number) => {
        console.log(`[KoreanPartnerDashboard] 예약 #${index + 1}:`, {
          id: b.id,
          date: b.date,
          start_time: b.start_time,
          end_time: b.end_time,
          status: b.status,
          user_name: b.users?.full_name || b.users?.nickname || '알 수 없음',
          topic: b.topic
        })
      })
    } else {
      console.log('[KoreanPartnerDashboard] ⚠️ 예약 데이터가 없습니다.')
    }
  }, [bookings])

  // 달력 뷰 컴포넌트
  const CalendarView = ({ 
    schedules, 
    recurringSchedules,
    bookings,
    selectedMonth, 
    onMonthChange, 
    onDeleteSchedule,
    loading,
    language,
    translateStatus,
    selectedDate,
    onDateSelect
  }: {
    schedules: any[]
    recurringSchedules: any[]
    bookings: any[]
    selectedMonth: Date
    onMonthChange: (date: Date) => void
    onDeleteSchedule: (id: string) => void
    loading: boolean
    language: string
    translateStatus: (status: string) => string
    selectedDate: Date | undefined
    onDateSelect: (date: Date | undefined) => void
  }) => {
    // 날짜별 스케줄 그룹화
    const schedulesByDate = schedules.reduce((acc, schedule) => {
      const date = schedule.date
      if (!acc[date]) acc[date] = []
      acc[date].push(schedule)
      return acc
    }, {} as Record<string, any[]>)

    // 확정된 예약 날짜 그룹화
    const approvedBookingsByDate = bookings
      .filter(booking => booking.status === 'approved')
      .reduce((acc, booking) => {
        const date = booking.date
        if (!acc[date]) acc[date] = []
        acc[date].push(booking)
        return acc
      }, {} as Record<string, any[]>)

    // 정기 스케줄을 해당 월의 실제 날짜로 변환
    const getRecurringScheduleDates = (month: Date) => {
      const dates: Date[] = []
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

      daysInMonth.forEach(day => {
        const dayOfWeek = day.getDay()
        recurringSchedules.forEach(recurring => {
          // days_of_week (배열) 또는 day_of_week (단일 값) 모두 지원
          const days = recurring.days_of_week || (recurring.day_of_week !== undefined ? [recurring.day_of_week] : [])
          if (days.includes(dayOfWeek) && (recurring.is_active !== false)) {
            dates.push(day)
          }
        })
      })
      return dates
    }

    const recurringDates = getRecurringScheduleDates(selectedMonth)

    // 날짜에 확정 예약이 있는지 확인
    const dateHasApprovedBooking = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      return !!approvedBookingsByDate[dateStr] && approvedBookingsByDate[dateStr].length > 0
    }

    // 날짜에 스케줄이 있는지 확인 (정기만, 일회성만, 둘 다)
    const getScheduleType = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const hasOneTime = !!schedulesByDate[dateStr]
      const hasRecurring = recurringDates.some(d => isSameDay(d, date))
      
      if (hasOneTime && hasRecurring) return 'both'
      if (hasOneTime) return 'onetime'
      if (hasRecurring) return 'recurring'
      return null
    }

    const dateHasSchedule = (date: Date) => {
      return getScheduleType(date) !== null
    }

    // 날짜별로 스케줄 개수 반환
    const getScheduleCountForDate = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const oneTimeCount = schedulesByDate[dateStr]?.length || 0
      const dayOfWeek = date.getDay()
      const recurringCount = recurringSchedules.filter(r => 
        r.days_of_week?.includes(dayOfWeek) && r.is_active
      ).length
      return { oneTime: oneTimeCount, recurring: recurringCount, total: oneTimeCount + recurringCount }
    }

    // 선택된 날짜의 스케줄 목록
    const selectedDateSchedules = selectedDate ? (() => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const oneTime = schedulesByDate[dateStr] || []
      const dayOfWeek = selectedDate.getDay()
      const recurring = recurringSchedules.filter(r => {
        const days = r.days_of_week || (r.day_of_week !== undefined ? [r.day_of_week] : [])
        return days.includes(dayOfWeek) && (r.is_active !== false)
      })
      const approved = approvedBookingsByDate[dateStr] || []
      return { oneTime, recurring, approved }
    })() : null

    // 날짜 포맷터 (react-day-picker용)
    const formatDate = (date: Date) => {
      return format(date, 'yyyy-MM-dd')
    }

    return (
      <div className="space-y-4">
        {/* 달력 */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 md:p-4 overflow-hidden">
          {/* 커스텀 월 네비게이션 */}
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <button 
              onClick={() => {
                const prevMonth = new Date(selectedMonth)
                prevMonth.setMonth(prevMonth.getMonth() - 1)
                onMonthChange(prevMonth)
              }}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold">
              {selectedMonth.getFullYear()}년 {selectedMonth.getMonth() + 1}월
            </h3>
            <button 
              onClick={() => {
                const nextMonth = new Date(selectedMonth)
                nextMonth.setMonth(nextMonth.getMonth() + 1)
                onMonthChange(nextMonth)
              }}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full flex justify-center px-2">
            <div className="w-[245px] min-[350px]:w-[280px]">
              {/* 요일 헤더 - 반응형 */}
              <div className="flex mb-1 w-[245px] min-[350px]:w-[280px]">
                {(language === 'es' 
                  ? ['D', 'L', 'M', 'X', 'J', 'V', 'S']
                  : ['일', '월', '화', '수', '목', '금', '토']
                ).map((day, index) => (
                  <div 
                    key={index} 
                    className="w-[35px] min-[350px]:w-[40px] text-center text-gray-600 dark:text-gray-400 text-[10px] min-[350px]:text-[11px] md:text-xs font-semibold py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

                {/* DayPicker - 헤더 없이 */}
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={onDateSelect}
                  month={selectedMonth}
                  onMonthChange={onMonthChange}
                  locale={language === 'es' ? es : ko}
                  showOutsideDays
                  modifiers={{
                    hasSchedule: (date) => dateHasSchedule(date),
                    hasOneTime: (date) => {
                      const type = getScheduleType(date)
                      return (type === 'onetime' || type === 'both') && !dateHasApprovedBooking(date)
                    },
                    hasRecurring: (date) => {
                      const type = getScheduleType(date)
                      return (type === 'recurring' || type === 'both') && !dateHasApprovedBooking(date)
                    },
                    hasApprovedBooking: (date) => dateHasApprovedBooking(date),
                  }}
                  modifiersClassNames={{
                    hasSchedule: 'font-semibold',
                    hasOneTime: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
                    hasRecurring: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
                    hasApprovedBooking: 'bg-green-500 dark:bg-green-600 text-white font-bold ring-2 ring-green-600',
                  }}
                  className="w-full"
                />
            </div>
          </div>
          
          {/* 범례 */}
          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-purple-100 dark:bg-purple-900"></div>
              <span>{language === 'es' ? 'Horarios únicos' : '일회성 스케줄'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900"></div>
              <span>{language === 'es' ? 'Horarios recurrentes' : '정기 스케줄'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-500 dark:bg-green-600 ring-2 ring-green-600 dark:ring-green-400"></div>
              <span className="font-semibold">{language === 'es' ? 'Reserva confirmada' : '확정된 예약'}</span>
            </div>
          </div>
        </div>

        {/* 선택된 날짜의 스케줄 목록 */}
        {selectedDate && selectedDateSchedules && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">
                  {format(selectedDate, language === 'es' ? 'EEEE, d MMMM yyyy' : 'yyyy년 M월 d일 (E)', { 
                    locale: language === 'es' ? es : ko 
                  })}
                </h3>
                <Button size="sm" variant="ghost" onClick={() => onDateSelect(undefined)}>
                  ✕
                </Button>
              </div>

              {/* 확정된 예약 */}
              {selectedDateSchedules.approved.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {language === 'es' ? 'Reservas confirmadas' : '확정된 예약'}
                  </h4>
                  <div className="space-y-2">
                    {selectedDateSchedules.approved.map((booking: any) => (
                      <div key={booking.id} className="bg-green-50 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-400 p-3 rounded-lg flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-green-700 dark:text-green-300" />
                            <span className="font-semibold text-green-700 dark:text-green-300">
                              {booking.users?.full_name || '익명'}
                            </span>
                            <Badge className="bg-green-500 text-white">
                              ✓ {language === 'es' ? 'Confirmado' : '확정'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{booking.start_time} - {booking.end_time}</span>
                          </div>
                          {booking.topic && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{booking.topic}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 정기 스케줄 */}
              {selectedDateSchedules.recurring.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'es' ? 'Horarios recurrentes' : '정기 스케줄'}
                  </h4>
                  <div className="space-y-2">
                    {selectedDateSchedules.recurring.map((schedule: any, idx: number) => {
                      const days = schedule.days_of_week || (schedule.day_of_week !== undefined ? [schedule.day_of_week] : [])
                      return (
                        <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">{schedule.start_time} - {schedule.end_time}</span>
                            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                              {language === 'es' ? 'Recurrente' : '정기'}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 일회성 스케줄 */}
              {selectedDateSchedules.oneTime.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'es' ? 'Horarios únicos' : '일회성 스케줄'}
                  </h4>
                  <div className="space-y-2">
                    {selectedDateSchedules.oneTime.map((schedule: any) => (
                      <div key={schedule.id} className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-600" />
                          <span className="text-sm">{schedule.start_time} - {schedule.end_time}</span>
                          {schedule.status !== 'available' && (
                            <Badge>{translateStatus(schedule.status)}</Badge>
                          )}
                        </div>
                        {schedule.status === 'available' && (
                          <Button size="sm" variant="ghost" onClick={() => onDeleteSchedule(schedule.id)} disabled={loading}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDateSchedules.recurring.length === 0 && selectedDateSchedules.oneTime.length === 0 && (
                <p className="text-center text-gray-500 py-4 text-sm">
                  {language === 'es' ? 'No hay horarios para esta fecha' : '이 날짜에는 스케줄이 없습니다'}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedDate && (
          <p className="text-center text-gray-500 py-2 text-sm">
            {language === 'es' ? 'Selecciona una fecha para ver los horarios' : '날짜를 선택하면 해당 날짜의 스케줄을 볼 수 있습니다'}
          </p>
        )}
      </div>
    )
  }

  // 반복 스케줄 조회
  const fetchRecurringSchedules = async () => {
    try {
      const response = await fetch('/api/partners/recurring-schedules', {
        headers: await getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setRecurringSchedules(data.schedules || [])
      } else if (response.status === 401) {
        console.error('인증 오류: 로그인이 필요합니다.')
      }
    } catch (error) {
      console.error('반복 스케줄 조회 실패:', error)
    } finally {
      setIsInitialLoading(false)
    }
  }

  // 반복 스케줄 추가
  const handleAddRecurringSchedule = async () => {
    if (recurringForm.days_of_week.length === 0 || !recurringForm.start_time || !recurringForm.end_time) {
      alert(language === 'es' ? 'Por favor completa todos los campos' : '모든 필드를 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/partners/recurring-schedules', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(recurringForm)
      })
      if (response.ok) {
        setShowAddRecurringSchedule(false)
        setRecurringForm({ days_of_week: [], start_time: '', end_time: '' })
        fetchRecurringSchedules()
        // 반복 스케줄을 내일 날짜로 변환
        const generateResponse = await fetch('/api/partners/generate-schedules', {
          method: 'POST',
          headers: await getAuthHeaders(),
          body: JSON.stringify({ target_date: null })
        })
        if (generateResponse.ok) {
          const generateData = await generateResponse.json()
          console.log('가능 시간 생성 성공:', generateData.generated, '개 생성')
        } else {
          const errorData = await generateResponse.json().catch(() => ({}))
          console.error('가능 시간 생성 실패:', generateResponse.status, errorData.error || '알 수 없는 오류')
        }
        // 스케줄 목록 새로고침 (약간의 지연을 두어 DB 반영 대기)
        setTimeout(() => {
          onScheduleRefresh()
        }, 500)
      } else {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }))
        alert(language === 'es' 
          ? `Error: ${errorData.error || 'Error al agregar horario recurrente'}`
          : `오류: ${errorData.error || '반복 스케줄 추가 실패'}`)
      }
    } catch (error) {
      console.error('반복 스케줄 추가 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 반복 스케줄 삭제
  const handleDeleteRecurringSchedule = async (scheduleId: string) => {
    if (!confirm(language === 'es' ? '¿Eliminar este horario recurrente?' : '이 반복 스케줄을 삭제하시겠습니까?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/partners/recurring-schedules/${scheduleId}`, { 
        method: 'DELETE',
        headers: await getAuthHeaders()
      })
      if (response.ok) fetchRecurringSchedules()
    } catch (error) {
      console.error('반복 스케줄 삭제 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 요일 선택 토글
  const toggleDay = (day: number) => {
    setRecurringForm(prev => {
      const newDays = prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort()
      return { ...prev, days_of_week: newDays }
    })
  }

  // 컴포넌트 마운트 시 반복 스케줄 조회
  useEffect(() => {
    fetchRecurringSchedules()
  }, [])

  const pendingBookings = bookings.filter(b => b.status === 'pending')
  const approvedBookings = bookings.filter(b => b.status === 'approved')
  const rejectedBookings = bookings.filter(b => b.status === 'rejected')
  
  // 디버깅: 필터링 결과 확인
  useEffect(() => {
    console.log('[KoreanPartnerDashboard] ⚠️ 필터링 결과:', {
      총_예약수: bookings.length,
      pending: pendingBookings.length,
      approved: approvedBookings.length,
      rejected: rejectedBookings.length,
      pendingList: pendingBookings.map(b => ({ id: b.id, status: b.status })),
      approvedList: approvedBookings.map(b => ({ id: b.id, status: b.status }))
    })
  }, [bookings, pendingBookings.length, approvedBookings.length, rejectedBookings.length])

  return (
    <>
      {/* 거절 모달 */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              {language === 'es' ? 'Motivo de rechazo' : '거절 사유'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {language === 'es' 
                ? 'Por favor selecciona el motivo por el cual rechazas esta reserva.'
                : '거절 사유를 선택해주세요.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-900 dark:text-gray-100 font-semibold mb-2 block">
                {language === 'es' ? 'Motivo' : '사유 선택'}
              </Label>
              <Select 
                value={rejectionReason} 
                onValueChange={setRejectionReason}
              >
                <SelectTrigger className="w-full text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder={language === 'es' ? 'Selecciona un motivo' : '사유를 선택하세요'} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] z-[100000]">
                  {rejectionReasons.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {language === 'es' ? reason.labelEs : reason.labelKo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                  setRejectingBookingId(null)
                }}
                disabled={loading}
              >
                {language === 'es' ? 'Cancelar' : '취소'}
              </Button>
              <Button
                onClick={handleRejectConfirm}
                disabled={loading || !rejectionReason}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {loading 
                  ? (language === 'es' ? 'Procesando...' : '처리 중...')
                  : (language === 'es' ? 'Rechazar' : '거절하기')
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-4 px-1 md:px-0">
      {/* 예약 관리 */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl border p-3 md:p-6">
        <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">{language === 'es' ? '📅 Gestión de Reservas' : '📅 예약 관리'}</h2>

        {/* 대기 중 */}
        {pendingBookings.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setIsPendingExpanded(!isPendingExpanded)}
              className="w-full flex items-center justify-between text-base md:text-lg font-semibold mb-2 md:mb-3 text-yellow-600 hover:text-yellow-700 transition-colors"
            >
              <span>{language === 'es' ? '⏳ Esperando confirmación' : '⏳ 대기 중'} ({pendingBookings.length})</span>
              <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${isPendingExpanded ? 'rotate-180' : ''}`} />
            </button>
            <div className={`space-y-2 overflow-hidden transition-all duration-300 ${isPendingExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {pendingBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-2.5 md:p-3">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            {booking.users?.avatar_url ? (
                              <AvatarImage src={booking.users.avatar_url} alt={booking.users?.full_name || ''} />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-gray-700 text-xs">
                              {booking.users?.full_name ? booking.users.full_name.charAt(0).toUpperCase() : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 inline-flex items-center gap-1">
                              {booking.users?.full_name || booking.users?.nickname || booking.users?.spanish_name || booking.users?.korean_name || (language === 'es' ? 'Usuario' : '사용자')}
                              <UserBadge totalPoints={booking.users?.total_points ?? 0} className="ml-0.5 scale-90" />
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {booking.date} {booking.start_time} - {booking.end_time}
                        </p>
                        {booking.topic && <p className="text-xs mt-1 text-gray-700 dark:text-gray-300">주제: {booking.topic}</p>}
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0 w-full md:w-auto">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprove(booking.id)} 
                          disabled={loading} 
                          className="bg-green-500 hover:bg-green-600 text-white whitespace-nowrap flex-1 md:flex-initial text-xs py-1 h-7"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> {language === 'es' ? 'Aprobar' : '승인'}
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleRejectClick(booking.id)} 
                          disabled={loading} 
                          className="bg-red-500 hover:bg-red-600 text-white whitespace-nowrap flex-1 md:flex-initial text-xs py-1 h-7"
                        >
                          <XCircle className="w-3 h-3 mr-1" /> {language === 'es' ? 'Rechazar' : '거절'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 승인된 예약 */}
        {approvedBookings.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setIsApprovedExpanded(!isApprovedExpanded)}
              className="w-full flex items-center justify-between text-base md:text-lg font-semibold mb-2 md:mb-3 text-green-600 hover:text-green-700 transition-colors"
            >
              <span>{language === 'es' ? '✓ Confirmado' : '✓ 승인된 예약'} ({approvedBookings.length})</span>
              <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${isApprovedExpanded ? 'rotate-180' : ''}`} />
            </button>
            <div className={`space-y-2 overflow-hidden transition-all duration-300 ${isApprovedExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {approvedBookings.map((booking) => {
                // 예약 시간 체크
                const bookingDateTime = new Date(`${booking.date}T${booking.start_time}`)
                const bookingEndTime = new Date(`${booking.date}T${booking.end_time}`)
                const now = new Date()
                const waitSeconds = Math.ceil((bookingDateTime.getTime() - now.getTime()) / 1000)
                // 3분 전부터 입장 가능
                const canJoin = now >= new Date(bookingDateTime.getTime() - 3 * 60 * 1000) && now < bookingEndTime
                const isPast = now >= bookingEndTime
                const minutesRemaining = Math.ceil(waitSeconds / 60)
                const showCountdown = waitSeconds <= 600 && waitSeconds > 0

                return (
                  <Card key={booking.id}>
                    <CardContent className="p-2.5 md:p-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Avatar className="w-8 h-8 flex-shrink-0">
                                {booking.users?.avatar_url ? (
                                  <AvatarImage src={booking.users.avatar_url} alt={booking.users?.full_name || ''} />
                                ) : null}
                                <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-gray-700 text-xs">
                                  {booking.users?.full_name ? booking.users.full_name.charAt(0).toUpperCase() : '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {booking.users?.full_name || booking.users?.nickname || booking.users?.spanish_name || booking.users?.korean_name || (language === 'es' ? 'Usuario' : '사용자')}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-1">
                              <Clock className="w-2.5 h-2.5" />
                              {booking.date} {booking.start_time} - {booking.end_time}
                            </p>
                            {booking.meet_url && (
                              <div className="mt-1">
                                <a
                                  href={booking.meet_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-blue-600 hover:text-blue-800 underline flex items-center gap-0.5"
                                >
                                  <Video className="w-2.5 h-2.5" />
                                  {language === 'es' ? 'Enlace de Google Meet' : 'Google Meet 링크'}
                                </a>
                              </div>
                            )}
                          </div>
                          <Badge className="bg-green-50 text-green-700 text-[10px] px-1.5 py-0 h-5">✓ {language === 'es' ? 'Confirmado' : '승인됨'}</Badge>
                        </div>

                        {/* 참여하기 버튼 */}
                        <div className="pt-2 border-t">
                          {isPast ? (
                            <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-center">
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <CheckCircle className="w-5 h-5 text-gray-500" />
                                <span className="text-sm font-semibold text-gray-700">
                                  {language === 'es' ? 'Consulta Completada' : '상담 종료됨'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">
                                {language === 'es' ? 'La hora de reserva ha pasado' : '예약 시간이 지났습니다'}
                              </p>
                            </div>
                          ) : canJoin ? (
                            <Button
                              onClick={() => router.push(`/call/${booking.id}`)}
                              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                            >
                              <DoorOpen className="w-4 h-4 mr-2" />
                              {language === 'es' ? 'Participar Ahora' : '지금 참여하기'}
                            </Button>
                          ) : showCountdown ? (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <DoorClosed className={`w-5 h-5 ${waitSeconds <= 180 ? 'text-green-500 animate-pulse' : waitSeconds <= 60 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`} />
                                <span className="text-sm font-semibold text-orange-700">
                                  {waitSeconds <= 180 ? (
                                    <span className="text-green-700">
                                      {minutesRemaining}분 후 입장 가능! ✅
                                    </span>
                                  ) : (
                                    `${minutesRemaining}분 남음`
                                  )}
                                </span>
                              </div>
                              <Button
                                onClick={() => router.push(`/call/${booking.id}`)}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                                size="sm"
                              >
                                {language === 'es' ? 'Ver Estado' : '대기 중 보기'}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => router.push(`/call/${booking.id}`)}
                              className="w-full bg-gray-500 hover:bg-gray-600 text-white"
                              disabled
                            >
                              <DoorClosed className="w-4 h-4 mr-2" />
                              {language === 'es' ? 'Próximamente' : '곧 시작'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* 거절된 예약 */}
        {rejectedBookings.length > 0 && (
          <div>
            <button
              onClick={() => setIsRejectedExpanded(!isRejectedExpanded)}
              className="w-full flex items-center justify-between text-base md:text-lg font-semibold mb-2 md:mb-3 text-red-600 hover:text-red-700 transition-colors"
            >
              <span>{language === 'es' ? '✗ Rechazado' : '✗ 거절된 예약'} ({rejectedBookings.length})</span>
              <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${isRejectedExpanded ? 'rotate-180' : ''}`} />
            </button>
            <div className={`space-y-2 overflow-hidden transition-all duration-300 ${isRejectedExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {rejectedBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-2.5 md:p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            {booking.users?.avatar_url ? (
                              <AvatarImage src={booking.users.avatar_url} alt={booking.users?.full_name || ''} />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-gray-700 text-xs">
                              {booking.users?.full_name ? booking.users.full_name.charAt(0).toUpperCase() : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {booking.users?.full_name || booking.users?.nickname || booking.users?.spanish_name || booking.users?.korean_name || (language === 'es' ? 'Usuario' : '사용자')}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {booking.date} {booking.start_time}
                        </p>
                        {booking.rejection_reason && (
                          <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5">사유: {booking.rejection_reason}</p>
                        )}
                      </div>
                      <Badge className="bg-red-50 text-red-700 text-[10px] px-1.5 py-0 h-5">✗ {language === 'es' ? 'Rechazado' : '거절됨'}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {bookings.length === 0 && (
          <p className="text-center text-gray-500 py-8">{language === 'es' ? 'No hay reservas aún.' : '아직 예약이 없습니다.'}</p>
        )}
      </div>

      {/* 스케줄 관리 슬라이드 */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl border overflow-hidden">
        {/* 슬라이드 전환 버튼 */}
        <div className="flex items-center justify-center gap-2 p-3 border-b bg-gray-50 dark:bg-gray-900">
          <Button
            size="sm"
            variant={mainView === 'settings' ? 'default' : 'ghost'}
            onClick={() => {
              setMainView('settings')
              // Swiper 인스턴스가 없으면 약간의 지연 후 다시 시도
              if (swiperInstance) {
                swiperInstance.slideTo(0, 300)
              } else {
                setTimeout(() => {
                  if (swiperInstance) {
                    swiperInstance.slideTo(0, 300)
                  }
                }, 100)
              }
            }}
            className={`${mainView === 'settings' ? 'bg-purple-500 hover:bg-purple-600 text-white' : ''}`}
          >
            <Settings className="w-4 h-4 mr-1" />
            {language === 'es' ? 'Configuración' : '설정'}
          </Button>
          <Button
            size="sm"
            variant={mainView === 'calendar' ? 'default' : 'ghost'}
            onClick={() => {
              setMainView('calendar')
              // Swiper 인스턴스가 없으면 약간의 지연 후 다시 시도
              if (swiperInstance) {
                swiperInstance.slideTo(1, 300)
              } else {
                setTimeout(() => {
                  if (swiperInstance) {
                    swiperInstance.slideTo(1, 300)
                  }
                }, 100)
              }
            }}
            className={`${mainView === 'calendar' ? 'bg-purple-500 hover:bg-purple-600 text-white' : ''}`}
          >
            <CalendarDays className="w-4 h-4 mr-1" />
            {language === 'es' ? 'Calendario' : '달력'}
          </Button>
        </div>

        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={0}
          slidesPerView={1}
          autoHeight={false}
          onSwiper={setSwiperInstance}
          onSlideChange={(swiper) => {
            setMainView(swiper.activeIndex === 0 ? 'settings' : 'calendar')
          }}
          className="schedule-swiper"
          style={{ minHeight: '600px', height: 'auto' }}
        >
          {/* 슬라이드 1: 설정 + 목록 */}
          <SwiperSlide style={{ minHeight: '600px', overflow: 'auto' }}>
            <div className="p-3 md:p-6 space-y-6 w-full">
              {/* 정기 가능 시간 설정 */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base md:text-lg font-bold">{language === 'es' ? '📅 Horarios Recurrentes' : '📅 정기 가능 시간'}</h2>
                  <Dialog open={showAddRecurringSchedule} onOpenChange={setShowAddRecurringSchedule}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] md:text-xs h-6 md:h-7 px-2 md:px-3">
                        <Plus className="w-2.5 h-2.5 md:w-3 md:h-3 mr-0.5 md:mr-1" /> {language === 'es' ? 'Agregar recurrente' : '정기 시간 추가'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white dark:bg-gray-800">
                      <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-gray-100">{language === 'es' ? 'Agregar horario recurrente' : '정기 가능 시간 추가'}</DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400">
                          {language === 'es' ? 'Establece horarios regulares que se aplicarán automáticamente cada semana' : '매주 자동으로 적용될 정기 시간을 설정합니다'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-900 dark:text-gray-100 font-semibold mb-2 block">{language === 'es' ? 'Días de la semana' : '요일 선택'}</Label>
                          <div className="grid grid-cols-7 gap-2">
                            {DAYS_OF_WEEK.map((day) => (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() => toggleDay(day.value)}
                                className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                                  recurringForm.days_of_week.includes(day.value)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                              >
                                {day.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-900 dark:text-gray-100 font-semibold mb-2 block">{language === 'es' ? 'Hora de inicio' : '시작 시간'}</Label>
                          <Select 
                            value={recurringForm.start_time} 
                            onValueChange={(value) => setRecurringForm({ ...recurringForm, start_time: value })}
                          >
                            <SelectTrigger className="text-gray-900 dark:text-gray-100">
                              <SelectValue placeholder={language === 'es' ? 'Seleccionar hora' : '시간 선택 (10분 단위)'} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px] z-[100000]">
                              {Array.from({ length: 24 }, (_, i) => i).map(hour => {
                                return ['00', '10', '20', '30', '40', '50'].map(minute => {
                                  const timeValue = `${String(hour).padStart(2, '0')}:${minute}`
                                  return (
                                    <SelectItem key={timeValue} value={timeValue}>
                                      {timeValue}
                                    </SelectItem>
                                  )
                                })
                              }).flat()}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-gray-900 dark:text-gray-100 font-semibold mb-2 block">{language === 'es' ? 'Hora de fin' : '종료 시간'}</Label>
                          <Select 
                            value={recurringForm.end_time} 
                            onValueChange={(value) => setRecurringForm({ ...recurringForm, end_time: value })}
                          >
                            <SelectTrigger className="text-gray-900 dark:text-gray-100">
                              <SelectValue placeholder={language === 'es' ? 'Seleccionar hora' : '시간 선택 (10분 단위)'} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px] z-[100000]">
                              {Array.from({ length: 24 }, (_, i) => i).map(hour => {
                                return ['00', '10', '20', '30', '40', '50'].map(minute => {
                                  const timeValue = `${String(hour).padStart(2, '0')}:${minute}`
                                  return (
                                    <SelectItem key={timeValue} value={timeValue}>
                                      {timeValue}
                                    </SelectItem>
                                  )
                                })
                              }).flat()}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddRecurringSchedule} disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                          {language === 'es' ? 'Agregar' : '추가하기'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {recurringSchedules.length > 0 && (
                  <div className="mb-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={async () => {
                        setLoading(true)
                        try {
                          const response = await fetch('/api/partners/generate-schedules', {
                            method: 'POST',
                            headers: await getAuthHeaders(),
                            body: JSON.stringify({ target_date: null })
                          })
                          if (response.ok) {
                            const data = await response.json()
                            alert(language === 'es' 
                              ? `${data.generated} horarios generados para mañana`
                              : `내일 날짜로 ${data.generated}개의 가능 시간이 생성되었습니다.`)
                            onScheduleRefresh()
                          }
                        } catch (error) {
                          console.error('가능 시간 생성 실패:', error)
                        } finally {
                          setLoading(false)
                        }
                      }}
                      disabled={loading}
                      className="w-full"
                    >
                      {language === 'es' ? 'Generar horarios para mañana' : '내일 가능 시간 생성'}
                    </Button>
                  </div>
                )}
                <div className="space-y-0.5">
                  {recurringSchedules.length > 0 ? (
                    recurringSchedules.map((schedule) => {
                      const dayInfo = DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)
                      return (
                        <div key={schedule.id} className="flex items-center justify-between px-2 py-0.5 md:py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-1 md:gap-1.5">
                            <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-400 flex-shrink-0" />
                            <span className="text-[11px] md:text-xs font-semibold leading-tight">{dayInfo?.full}</span>
                            <span className="text-[11px] md:text-xs text-gray-600 leading-tight">
                              {schedule.start_time} - {schedule.end_time}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteRecurringSchedule(schedule.id)} 
                            disabled={loading}
                            className="h-4 w-4 md:h-5 md:w-5 flex items-center justify-center hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      )
                    })
                  ) : isInitialLoading ? (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center gap-2 text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                        <span>{language === 'es' ? 'Cargando...' : '로딩 중...'}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">{language === 'es' ? 'No hay horarios recurrentes aún.' : '아직 등록된 정기 시간이 없습니다.'}</p>
                  )}
                </div>
              </div>

              {/* 일회성 가능 시간 설정 */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base md:text-lg font-bold">{language === 'es' ? '⏰ Horarios Únicos' : '⏰ 일회성 가능 시간'}</h2>
                  <Dialog open={showAddSchedule} onOpenChange={setShowAddSchedule}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white text-[10px] md:text-xs h-6 md:h-7 px-2 md:px-3">
                  <Plus className="w-2.5 h-2.5 md:w-3 md:h-3 mr-0.5 md:mr-1" /> {language === 'es' ? 'Agregar horario único' : '일회성 시간 추가'}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-gray-800 max-w-md mx-2">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-gray-100 text-base md:text-lg">{language === 'es' ? 'Agregar horario único' : '일회성 시간 추가'}</DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">
                    {language === 'es' ? 'Agrega un horario específico para una fecha determinada' : '특정 날짜에 대한 구체적인 시간을 추가합니다'}
                  </DialogDescription>
                </DialogHeader>
              <div className="space-y-3 md:space-y-4">
                <div>
                  <Label className="text-gray-900 dark:text-gray-100 font-semibold text-xs md:text-sm">{language === 'es' ? 'Fecha' : '날짜'}</Label>
                  <Input type="date" value={scheduleForm.date} onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })} className="text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 h-9 md:h-10 text-sm" />
                </div>
                <div>
                  <Label className="text-gray-900 dark:text-gray-100 font-semibold mb-1.5 md:mb-2 block text-xs md:text-sm">{language === 'es' ? 'Hora de inicio' : '시작 시간'}</Label>
                  <Select 
                    value={scheduleForm.start_time} 
                    onValueChange={(value) => setScheduleForm({ ...scheduleForm, start_time: value })}
                  >
                    <SelectTrigger className="text-gray-900 dark:text-gray-100 h-9 md:h-10 text-sm">
                      <SelectValue placeholder={language === 'es' ? 'Seleccionar hora' : '시간 선택 (10분 단위)'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] z-[100000] text-sm">
                      {Array.from({ length: 24 }, (_, i) => i).map(hour => {
                        return ['00', '10', '20', '30', '40', '50'].map(minute => {
                          const timeValue = `${String(hour).padStart(2, '0')}:${minute}`
                          return (
                            <SelectItem key={timeValue} value={timeValue}>
                              {timeValue}
                            </SelectItem>
                          )
                        })
                      }).flat()}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-900 dark:text-gray-100 font-semibold mb-1.5 md:mb-2 block text-xs md:text-sm">{language === 'es' ? 'Hora de fin' : '종료 시간'}</Label>
                  <Select 
                    value={scheduleForm.end_time} 
                    onValueChange={(value) => setScheduleForm({ ...scheduleForm, end_time: value })}
                  >
                    <SelectTrigger className="text-gray-900 dark:text-gray-100 h-9 md:h-10 text-sm">
                      <SelectValue placeholder={language === 'es' ? 'Seleccionar hora' : '시간 선택 (10분 단위)'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] z-[100000] text-sm">
                      {Array.from({ length: 24 }, (_, i) => i).map(hour => {
                        return ['00', '10', '20', '30', '40', '50'].map(minute => {
                          const timeValue = `${String(hour).padStart(2, '0')}:${minute}`
                          return (
                            <SelectItem key={timeValue} value={timeValue}>
                              {timeValue}
                            </SelectItem>
                          )
                        })
                      }).flat()}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddSchedule} disabled={loading} className="w-full bg-purple-500 hover:bg-purple-600 text-white h-9 md:h-10 text-sm md:text-base">
                  {language === 'es' ? 'Agregar' : '추가하기'}
                </Button>
              </div>
              </DialogContent>
            </Dialog>
                </div>

                {/* 일회성 스케줄 목록 */}
                <div className="space-y-0.5 mt-4">
                  {mySchedules && mySchedules.length > 0 ? (
                    mySchedules.map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between px-2 py-0.5 md:py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-1 md:gap-1.5">
                          <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-400 flex-shrink-0" />
                          <span className="text-[11px] md:text-xs leading-tight">{schedule.date} {schedule.start_time} - {schedule.end_time}</span>
                          {schedule.status !== 'available' && (
                            <span className="text-[9px] md:text-[10px] py-0 px-1 bg-gray-100 rounded leading-tight">{translateStatus(schedule.status)}</span>
                          )}
                        </div>
                        {schedule.status === 'available' && (
                          <button 
                            onClick={() => handleDeleteSchedule(schedule.id)} 
                            disabled={loading}
                            className="h-4 w-4 md:h-5 md:w-5 flex items-center justify-center hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-400 hover:text-red-500" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : isInitialLoading ? (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center gap-2 text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                        <span>{language === 'es' ? 'Cargando...' : '로딩 중...'}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">{language === 'es' ? 'No hay horarios disponibles aún.' : '아직 등록된 가능 시간이 없습니다.'}</p>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* 슬라이드 2: 달력 뷰 */}
          <SwiperSlide style={{ minHeight: '600px', overflow: 'auto' }}>
            <div className="p-3 md:p-6 w-full">
              <CalendarView 
                schedules={mySchedules || []}
                recurringSchedules={recurringSchedules}
                bookings={bookings || []}
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
                onDeleteSchedule={handleDeleteSchedule}
                loading={loading}
                language={language}
                translateStatus={translateStatus}
                selectedDate={selectedCalendarDate}
                onDateSelect={setSelectedCalendarDate}
              />
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
      </div>
    </>
  )
}

