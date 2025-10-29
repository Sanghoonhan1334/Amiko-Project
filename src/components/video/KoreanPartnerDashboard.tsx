'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, User, CheckCircle, XCircle, Calendar, Plus, Trash2, List, CalendarDays, ChevronLeft, ChevronRight, Settings, Video } from 'lucide-react'
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
import { Navigation, Pagination } from 'swiper/modules'
import 'react-day-picker/dist/style.css'
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
      const response = await fetch(`/api/bookings/${bookingId}/approve`, { method: 'POST' })
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

  const handleReject = async (bookingId: string, reason: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: reason })
      })
      if (response.ok) onRefresh()
    } catch (error) {
      console.error('예약 거절 실패:', error)
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
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            month={selectedMonth}
            onMonthChange={onMonthChange}
            locale={language === 'es' ? es : ko}
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
              hasApprovedBooking: 'bg-green-500 dark:bg-green-600 text-white font-bold ring-2 ring-green-600 dark:ring-green-400 ring-offset-2',
            }}
            className="mx-auto"
            components={{
              IconLeft: () => <ChevronLeft className="w-4 h-4" />,
              IconRight: () => <ChevronRight className="w-4 h-4" />,
            }}
            classNames={{
              months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
              month: 'space-y-4',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-sm font-medium',
              nav: 'space-x-1 flex items-center',
              nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-input hover:bg-accent hover:text-accent-foreground',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
              row: 'flex w-full mt-2',
              cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 [&:has(.day.modifier-has-onetime.modifier-has-recurring)]:bg-gradient-to-br [&:has(.day.modifier-has-onetime.modifier-has-recurring)]:from-purple-100 [&:has(.day.modifier-has-onetime.modifier-has-recurring)]:to-blue-100 [&:has(.day.modifier-has-onetime.modifier-has-recurring)]:dark:from-purple-900 [&:has(.day.modifier-has-onetime.modifier-has-recurring)]:dark:to-blue-900',
              day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md',
              day_selected: 'bg-purple-500 text-white hover:bg-purple-600 focus:bg-purple-600 text-white focus:text-white',
              day_today: 'bg-accent text-accent-foreground font-semibold',
              day_outside: 'text-muted-foreground opacity-50',
              day_disabled: 'text-muted-foreground opacity-50',
              day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
              day_hidden: 'invisible',
            }}
          />
          
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

  return (
    <div className="space-y-4 px-1 md:px-0">
      {/* 예약 관리 */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl border p-3 md:p-6">
        <h2 className="text-xl font-bold mb-4">{language === 'es' ? '📅 Gestión de Reservas' : '📅 예약 관리'}</h2>

        {/* 대기 중 */}
        {pendingBookings.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-yellow-600">{language === 'es' ? '⏳ Esperando confirmación' : '⏳ 대기 중'}</h3>
            <div className="space-y-3">
              {pendingBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{booking.users?.full_name || '익명'}</span>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {booking.date} {booking.start_time} - {booking.end_time}
                        </p>
                        {booking.topic && <p className="text-sm mt-1">주제: {booking.topic}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApprove(booking.id)} disabled={loading} className="bg-green-500 hover:bg-green-600 text-white">
                          <CheckCircle className="w-4 h-4 mr-1" /> 승인
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => {
                          const reason = prompt(language === 'es' ? 'Razón de rechazo:' : '거절 사유:')
                          if (reason) handleReject(booking.id, reason)
                        }} disabled={loading}>
                          <XCircle className="w-4 h-4 mr-1" /> 거절
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
            <h3 className="text-lg font-semibold mb-3 text-green-600">{language === 'es' ? '✓ Confirmado' : '✓ 승인된 예약'}</h3>
            <div className="space-y-3">
              {approvedBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{booking.users?.full_name || '익명'}</span>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                          <Clock className="w-3 h-3" />
                          {booking.date} {booking.start_time} - {booking.end_time}
                        </p>
                        {booking.meet_url && (
                          <div className="mt-2">
                            <a
                              href={booking.meet_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                            >
                              <Video className="w-3 h-3" />
                              {language === 'es' ? 'Enlace de Google Meet' : 'Google Meet 링크'}
                            </a>
                          </div>
                        )}
                      </div>
                      <Badge className="bg-green-50 text-green-700">✓ {language === 'es' ? 'Confirmado' : '승인됨'}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 거절된 예약 */}
        {rejectedBookings.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-red-600">{language === 'es' ? '✗ Rechazado' : '✗ 거절된 예약'}</h3>
            <div className="space-y-3">
              {rejectedBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{booking.users?.full_name || '익명'}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {booking.date} {booking.start_time}
                        </p>
                        {booking.rejection_reason && (
                          <p className="text-xs text-red-600 mt-1">사유: {booking.rejection_reason}</p>
                        )}
                      </div>
                      <Badge className="bg-red-50 text-red-700">✗ {language === 'es' ? 'Rechazado' : '거절됨'}</Badge>
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{language === 'es' ? '📅 Horarios Recurrentes' : '📅 정기 가능 시간 설정'}</h2>
                  <Dialog open={showAddRecurringSchedule} onOpenChange={setShowAddRecurringSchedule}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                        <Plus className="w-4 h-4 mr-1" /> {language === 'es' ? 'Agregar recurrente' : '정기 시간 추가'}
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
                <div className="space-y-2">
                  {recurringSchedules.length > 0 ? (
                    recurringSchedules.map((schedule) => {
                      const dayInfo = DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)
                      return (
                        <Card key={schedule.id}>
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm font-semibold">{dayInfo?.full}</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {schedule.start_time} - {schedule.end_time}
                              </span>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteRecurringSchedule(schedule.id)} disabled={loading}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })
                  ) : (
                    <p className="text-center text-gray-500 py-4">{language === 'es' ? 'No hay horarios recurrentes aún.' : '아직 등록된 정기 시간이 없습니다.'}</p>
                  )}
                </div>
              </div>

              {/* 일회성 가능 시간 설정 */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{language === 'es' ? '⏰ Horarios Disponibles' : '⏰ 가능 시간 설정'}</h2>
                  <Dialog open={showAddSchedule} onOpenChange={setShowAddSchedule}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
                  <Plus className="w-4 h-4 mr-1" /> {language === 'es' ? 'Agregar horario' : '예약 가능 시간 추가'}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-gray-100">{language === 'es' ? 'Agregar horario disponible' : '예약 가능 시간 추가'}</DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400">
                    {language === 'es' ? 'Agrega un horario específico para una fecha determinada' : '특정 날짜에 대한 구체적인 시간을 추가합니다'}
                  </DialogDescription>
                </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-900 dark:text-gray-100 font-semibold">{language === 'es' ? 'Fecha' : '날짜'}</Label>
                  <Input type="date" value={scheduleForm.date} onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })} className="text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400" />
                </div>
                <div>
                  <Label className="text-gray-900 dark:text-gray-100 font-semibold mb-2 block">{language === 'es' ? 'Hora de inicio' : '시작 시간'}</Label>
                  <Select 
                    value={scheduleForm.start_time} 
                    onValueChange={(value) => setScheduleForm({ ...scheduleForm, start_time: value })}
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
                    value={scheduleForm.end_time} 
                    onValueChange={(value) => setScheduleForm({ ...scheduleForm, end_time: value })}
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
                <Button onClick={handleAddSchedule} disabled={loading} className="w-full bg-purple-500 hover:bg-purple-600 text-white">
                  {language === 'es' ? 'Agregar' : '추가하기'}
                </Button>
              </div>
              </DialogContent>
            </Dialog>
                </div>

                {/* 일회성 스케줄 목록 */}
                <div className="space-y-2 mt-4">
                  {mySchedules && mySchedules.length > 0 ? (
                    mySchedules.map((schedule) => (
                      <Card key={schedule.id}>
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{schedule.date} {schedule.start_time} - {schedule.end_time}</span>
                            {schedule.status !== 'available' && (
                              <Badge>{translateStatus(schedule.status)}</Badge>
                            )}
                          </div>
                          {schedule.status === 'available' && (
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteSchedule(schedule.id)} disabled={loading}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))
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
  )
}

