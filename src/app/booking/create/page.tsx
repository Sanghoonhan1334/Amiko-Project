'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { checkAuthAndRedirect } from '@/lib/auth-utils'
import { ArrowLeft, Calendar, Clock, User, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { getTimezoneFromPhoneNumber } from '@/lib/timezone-converter'

interface Partner {
  id: string
  name: string
  avatar_url: string | null
  specialty: string | null
  status: string
}

interface AvailableSlot {
  id: string
  date: string
  start_time: string
  end_time: string
}

// 예약 가능한 날짜 달력 컴포넌트
function AvailableDatesCalendar({
  availableDates,
  selectedDate,
  onDateSelect,
  userLanguage = 'es', // 사용자 프로필 언어 (회원가입 시 선택한 국적 기반)
  userTimezone = 'America/Lima' // 사용자 프로필 타임존
}: {
  availableDates: string[]
  selectedDate: string
  onDateSelect: (date: string) => void
  userLanguage?: 'ko' | 'es' // 회원가입 시 선택한 국적 기반 언어
  userTimezone?: string // 사용자 프로필 타임존
}) {
  // 사용자 프로필 타임존 사용 (브라우저 시스템 타임존이 아니라)
  const browserTimezone = userTimezone
  
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const monthNames = {
    es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  }
  
  const dayNames = {
    es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    ko: ['일', '월', '화', '수', '목', '금', '토']
  }
  
  // 사용자 프로필 언어 사용 (헤더 언어 변경과 무관)
  const calendarLanguage = userLanguage || 'es'
  const monthName = monthNames[calendarLanguage] || monthNames.es
  const dayName = dayNames[calendarLanguage] || dayNames.es
  
  console.log('[AvailableDatesCalendar] 달력 언어 (프로필 기반):', calendarLanguage, 'monthName:', monthName, 'dayName:', dayName)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  
  // 해당 월의 첫 날과 마지막 날
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()
  
  // 이전/다음 월 이동
  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }
  
  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }
  
  // 날짜를 사용자 타임존 기준으로 문자열 변환
  // 주의: date가 브라우저 로컬 타임존으로 해석되므로, 사용자 타임존으로 명시적으로 변환해야 함
  const formatDateInUserTimezone = (date: Date): string => {
    // Date 객체의 연/월/일을 추출 (로컬 타임존 기준)
    const localYear = date.getFullYear()
    const localMonth = date.getMonth()
    const localDay = date.getDate()
    
    // 이 날짜/시간을 사용자 타임존의 같은 날짜로 해석
    // 예: 2025-11-07 00:00 (로컬) → 2025-11-07 00:00 (사용자 타임존)
    // 사용자 타임존의 해당 날짜 00:00:00을 나타내는 UTC 시간 계산
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: browserTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    
    // Date 객체를 사용자 타임존으로 변환
    // 하지만 Date 객체가 이미 로컬 타임존이므로, 이를 UTC로 변환한 후 사용자 타임존으로 다시 변환해야 함
    // 더 정확한 방법: 로컬 날짜를 사용자 타임존의 같은 날짜로 해석
    
    // 방법: 로컬 타임존의 해당 날짜 00:00:00을 UTC로 변환 후, 사용자 타임존으로 변환
    // 또는 더 간단하게: Intl.DateTimeFormat을 사용하여 로컬 Date 객체를 사용자 타임존으로 변환
    return formatter.format(date)
  }
  
  // 날짜가 예약 가능한지 확인
  const isDateAvailable = (date: Date) => {
    const dateStr = formatDateInUserTimezone(date)
    return availableDates.includes(dateStr)
  }
  
  // 날짜가 오늘 이후인지 확인
  const isDateInFuture = (date: Date) => {
    return date >= today
  }
  
  // 날짜 클릭 핸들러
  const handleDateClick = (day: number) => {
    // 달력의 year/month/day를 직접 YYYY-MM-DD 형식으로 변환 (타임존 변환 없이)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    // availableDates 목록에 있는지 확인
    if (availableDates.includes(dateStr)) {
      const todayStr = formatDateInUserTimezone(today)
      // 날짜가 오늘 이후인지 확인 (문자열 비교)
      if (dateStr >= todayStr) {
        onDateSelect(dateStr)
      }
    }
  }
  
  // 날짜 렌더링
  const renderCalendarDays = () => {
    const days = []
    
    // 빈 칸 (월의 첫 날 전)
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square"></div>
      )
    }
    
    // 실제 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      // 달력의 year/month/day를 사용자 타임존의 날짜 문자열로 직접 변환
      // 방법: 사용자 타임존의 해당 날짜를 YYYY-MM-DD 형식으로 직접 생성
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      
      // availableDates 목록에 직접 포함 여부 확인 (타임존 변환 없이)
      const isInAvailableList = availableDates.includes(dateStr)
      
      // 날짜가 오늘 이후인지 확인 (사용자 타임존 기준 날짜 문자열 비교)
      const todayStr = formatDateInUserTimezone(today)
      const isFuture = dateStr >= todayStr
      const isSelected = selectedDate === dateStr
      
      // 오늘 날짜 확인 (사용자 타임존 기준)
      const isToday = dateStr === todayStr
      
      // 실제로 예약 가능한지: availableDates에 있고, 미래 날짜여야 함
      const isAvailable = isInAvailableList && isFuture
      
      // 표시를 위한 Date 객체 생성 (로컬 타임존으로 해석, 표시용)
      const date = new Date(year, month, day)
      
      const canClick = isAvailable
      
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          disabled={!canClick}
          className={`
            aspect-square rounded-lg text-sm font-medium transition-all
            ${isSelected 
              ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-300' 
              : canClick
                ? 'bg-white hover:bg-purple-50 hover:border-purple-300 text-gray-900 border-2 border-gray-200 cursor-pointer'
                : !isAvailable
                  ? 'bg-gray-200 text-gray-600 border-2 border-gray-300 cursor-not-allowed' // No disponible: 중간 회색 배경, 진한 회색 텍스트 (우선순위 높임)
                  : isToday
                    ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'
            }
            ${isToday && !isSelected ? 'ring-1 ring-gray-300' : ''}
          `}
          title={!isAvailable ? (calendarLanguage === 'es' ? 'No disponible' : '예약 불가') : (isInAvailableList && !isFuture ? (calendarLanguage === 'es' ? 'Ya pasó este día' : '이미 지난 날짜') : '')}
        >
          {day}
        </button>
      )
    }
    
    return days
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* 달력 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {monthName[month]} {year}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayName.map((day, index) => (
          <div key={index} className="text-center text-xs font-semibold text-gray-600 py-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
      
      {/* 범례 */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded border-2 border-gray-200 bg-white"></div>
          <span className="text-gray-900">{calendarLanguage === 'es' ? 'Disponible' : '예약 가능'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-gray-200 border-2 border-gray-300"></div>
          <span className="text-gray-600">{calendarLanguage === 'es' ? 'No disponible' : '예약 불가'}</span>
        </div>
      </div>
    </div>
  )
}

function CreateBookingPageContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const partnerIdFromUrl = searchParams.get('partnerId')
  
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loadingDates, setLoadingDates] = useState(false)
  const [error, setError] = useState('')
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [availableDates, setAvailableDates] = useState<string[]>([]) // 예약 가능한 날짜 목록
  const [userLanguage, setUserLanguage] = useState<'ko' | 'es'>('es') // 사용자 프로필 언어
  const [userTimezone, setUserTimezone] = useState<string>('America/Lima') // 사용자 타임존 (기본값: 페루)
  
  const [formData, setFormData] = useState({
    partnerId: '',
    scheduleId: '',
    date: '',
    time: '',
    topic: '',
    description: ''
  })
  
  // 대화 주제 옵션 목록
  const topicOptions = [
    'Práctica de conversación en coreano',
    'Preguntas sobre la cultura coreana',
    'Aprender vocabulario coreano',
    'Práctica de pronunciación',
    'Discusión sobre K-POP',
    'Hablemos sobre dramas coreanos',
    'Gastronomía coreana',
    'Viajes y turismo en Corea',
    'Intercambio cultural',
    'Preparación para TOPIK'
  ]
  
  const CUSTOM_TOPIC_OPTION = 'custom'
  
  const [topicType, setTopicType] = useState<'select' | 'custom'>('select') // 선택 타입: 드롭다운 또는 직접 입력

  // 사용자 프로필 언어 및 타임존 가져오기
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return
      
      try {
        const response = await fetch(`/api/profile?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          
          // 회원가입 시 입력한 전화번호를 기준으로 타임존 결정
          const signupPhone = data.user?.user_metadata?.phone
          const signupCountry = data.user?.user_metadata?.country // fallback 및 언어 결정용
          const profileLanguage = data.user?.language || data.profile?.language
          
          console.log('[CreateBookingPageContent] 프로필 데이터:', { 
            signupPhone, // 회원가입 시 입력한 전화번호
            signupCountry, // 회원가입 시 입력한 국적 (fallback 및 언어 결정용)
            language: profileLanguage, 
            user_metadata: data.user?.user_metadata 
          })
          
          // 전화번호 기준으로 타임존 결정 (전화번호에 국가번호가 없으면 country를 fallback으로 사용)
          const determinedTimezone = getTimezoneFromPhoneNumber(signupPhone, signupCountry)
          console.log('[CreateBookingPageContent] 전화번호 기준 타임존 설정:', signupPhone, '(fallback:', signupCountry, ')', '→', determinedTimezone)
          
          let determinedLanguage: 'ko' | 'es' = 'es' // 기본값: 페루 등 현지인은 스페인어
          
          // 언어 결정 (국적 기준으로 유지, 전화번호로는 언어를 확정하기 어려움)
          if (signupCountry) {
            if (signupCountry === 'KR' || signupCountry === '대한민국' || signupCountry === 'South Korea' || signupCountry === 'Korea' || signupCountry === 'KOR') {
              determinedLanguage = 'ko'
            } else {
              determinedLanguage = 'es'
            }
            console.log('[CreateBookingPageContent] 회원가입 국적 기반 언어 설정:', signupCountry, '→', determinedLanguage)
          } else if (profileLanguage) {
            // 회원가입 국적이 없으면 language 필드로 판단
            if (profileLanguage === 'ko') {
              determinedTimezone = 'Asia/Seoul'
              determinedLanguage = 'ko'
            } else {
              determinedTimezone = 'America/Lima'
              determinedLanguage = 'es'
            }
            console.log('[CreateBookingPageContent] language 필드 기반 설정:', profileLanguage, '→', { timezone: determinedTimezone, language: determinedLanguage })
          } else {
            // 둘 다 없으면 기본값: 스페인어, 페루 타임존
            console.log('[CreateBookingPageContent] 기본값 사용: es, America/Lima')
          }
          
          setUserTimezone(determinedTimezone)
          setUserLanguage(determinedLanguage)
          console.log('[CreateBookingPageContent] 최종 설정:', { timezone: determinedTimezone, language: determinedLanguage })
        }
      } catch (error) {
        console.error('[CreateBookingPageContent] 사용자 프로필 가져오기 실패:', error)
        // 실패 시 기본값: 스페인어, 페루 타임존
        setUserLanguage('es')
        setUserTimezone('America/Lima')
      }
    }
    
    fetchUserProfile()
  }, [user?.id])

  // URL에서 partnerId가 있으면 파트너 정보 로드
  // userTimezone이 설정된 후에만 fetchAvailableDates 호출
  useEffect(() => {
    if (partnerIdFromUrl) {
      fetchPartnerInfo(partnerIdFromUrl)
      setFormData(prev => ({ ...prev, partnerId: partnerIdFromUrl }))
      // userTimezone이 준비되면 예약 가능 날짜 조회
      if (userTimezone) {
        fetchAvailableDates(partnerIdFromUrl)
      }
    } else {
      fetchPartners()
    }
  }, [partnerIdFromUrl, userTimezone])

  // 파트너 정보 조회 (개별)
  const fetchPartnerInfo = async (partnerId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/conversation-partners/${partnerId}`)
      if (!response.ok) {
        throw new Error('No se pudo cargar la información del amigo coreano.')
      }
      const data = await response.json()
      setSelectedPartner(data.partner)
      setFormData(prev => ({ ...prev, partnerId: partnerId }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido.')
    } finally {
      setLoading(false)
    }
  }

  // 파트너 목록 조회
  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/conversation-partners')
      if (!response.ok) {
        throw new Error('No se pudo cargar la lista de amigos.')
      }
      const data = await response.json()
      // 한국인만 필터링
      const koreanPartners = (data.partners || []).filter((p: any) => p.country === '대한민국')
      setPartners(koreanPartners)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido.')
    }
  }

  // 파트너의 예약 가능한 날짜 가져오기 (다음 30일)
  const fetchAvailableDates = async (partnerId: string) => {
    try {
      setLoadingDates(true)
      console.log('[예약 생성] 예약 가능 날짜 조회 시작, partnerId:', partnerId)
      console.log('[예약 생성] 사용자 프로필 타임존:', userTimezone)
      
      // 사용자 프로필 타임존 사용 (브라우저 시스템 타임존이 아니라)
      
      // 사용자 타임존 기준으로 오늘 날짜 계산
      const todayFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      const todayStr = todayFormatter.format(new Date())
      
      // 다음 30일치 날짜 배열 생성 (사용자 타임존 기준)
      const dateStrings: string[] = []
      
      // 첫 날짜를 Date 객체로 파싱 (로컬 타임존으로 해석)
      const [startYear, startMonth, startDay] = todayStr.split('-').map(Number)
      const startDate = new Date(startYear, startMonth - 1, startDay)
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        
        // 사용자 타임존 기준 날짜 문자열 생성
        const dateFormatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: userTimezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
        const dateStr = dateFormatter.format(date)
        dateStrings.push(dateStr)
      }
      
      console.log('[예약 생성] 조회할 날짜 목록 (사용자 타임존 기준):', dateStrings.length, '개, 첫날짜:', dateStrings[0], '마지막날짜:', dateStrings[dateStrings.length - 1])
      console.log('[예약 생성] 사용자 타임존:', userTimezone)
      
      // 병렬로 모든 날짜 조회
      const datePromises = dateStrings.map(async (dateStr) => {
        try {
          const response = await fetch(`/api/partners/${partnerId}/available-slots?date=${dateStr}`, {
            headers: {
              'x-user-timezone': userTimezone
            },
            credentials: 'include' // 쿠키 포함 (RLS를 위한 세션)
          })
          if (response.ok) {
            const data = await response.json()
            console.log(`[예약 생성] ${dateStr} 날짜 API 응답:`, {
              slotsCount: data.slots?.length || 0,
              userTimezone: data.userTimezone,
              firstSlot: data.slots?.[0] || null,
              debug: data.debug || null
            })
            
            // 디버깅: 슬롯이 0개인 경우 상세 정보 출력
            if (data.slots?.length === 0 && data.debug) {
              console.warn(`[예약 생성] ⚠️ ${dateStr} 날짜 슬롯 0개 - 디버깅 정보:`, {
                partnerUserId: data.debug.partnerUserId,
                userSelectedDate: data.debug.userSelectedDate,
                kstDate: data.debug.kstDateStr,
                kstDayOfWeek: data.debug.kstDayOfWeek,
                allRecurringSchedules: data.debug.allRecurringSchedulesCount,
                matchingRecurringSchedules: data.debug.matchingRecurringSchedulesCount,
                convertedRecurringSlots: data.debug.convertedRecurringSlotsCount,
                matchingRecurring: data.debug.matchingRecurringCount,
                specificSlots: data.debug.specificSlotsCount,
                convertedSpecificSlots: data.debug.convertedSpecificSlotsCount
              })
            }
            if (data.slots && data.slots.length > 0) {
              return dateStr
            }
          } else {
            const errorData = await response.json().catch(() => ({}))
            console.error(`[예약 생성] ⚠️ ${dateStr} 날짜 조회 실패:`, response.status, errorData)
          }
        } catch (err) {
          console.error(`[예약 생성] ${dateStr} 날짜 조회 예외:`, err)
        }
        return null
      })
      
      const results = await Promise.all(datePromises)
      const available = results.filter((date): date is string => date !== null)
      
      // 과거 날짜 필터링 (오늘 이후 날짜만 포함)
      // todayStr는 위에서 이미 계산됨
      const futureAvailable = available.filter(dateStr => {
        const isFuture = dateStr >= todayStr
        if (!isFuture) {
          console.log(`[예약 생성] 과거 날짜 제외: ${dateStr} (오늘: ${todayStr})`)
        }
        return isFuture
      })
      
      console.log('[예약 생성] 예약 가능한 날짜:', futureAvailable.length, '개:', futureAvailable)
      console.log('[예약 생성] 필터링 전:', available.length, '개, 필터링 후:', futureAvailable.length, '개')
      console.log('[예약 생성] 오늘 날짜:', todayStr)
      setAvailableDates(futureAvailable)
    } catch (error) {
      console.error('[예약 생성] 예약 가능 날짜 조회 실패:', error)
      setAvailableDates([])
    } finally {
      setLoadingDates(false)
    }
  }

  // 파트너 선택 시
  const handlePartnerChange = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId)
    if (partner) {
      setSelectedPartner(partner)
    }
    setFormData(prev => ({
      ...prev,
      partnerId,
      scheduleId: '',
      date: '',
      time: ''
    }))
    setAvailableSlots([])
    setAvailableDates([])
    // 예약 가능한 날짜 가져오기 (userTimezone이 준비된 상태에서만)
    if (userTimezone) {
      fetchAvailableDates(partnerId)
    }
  }

  // 날짜 선택 시 가능 시간 조회
  const handleDateChange = async (date: string) => {
    console.log('[예약 생성] 날짜 변경:', date)
    setFormData(prev => ({ ...prev, date, time: '', scheduleId: '' }))
    setAvailableSlots([])
    
    // partnerId 확인 (formData 또는 URL에서)
    const currentPartnerId = formData.partnerId || partnerIdFromUrl
    console.log('[예약 생성] 현재 partnerId:', currentPartnerId, 'formData.partnerId:', formData.partnerId, 'partnerIdFromUrl:', partnerIdFromUrl)
    
    if (currentPartnerId && date) {
      setLoadingSlots(true)
      setError('')
      try {
        const apiUrl = `/api/partners/${currentPartnerId}/available-slots?date=${date}`
        console.log('[예약 생성] 시간 슬롯 조회 시작:', apiUrl)
        
        // 브라우저 타임존을 헤더에 포함
        // 사용자 프로필 타임존 사용
        const response = await fetch(apiUrl, {
          headers: {
            'x-user-timezone': userTimezone
          }
        })
        console.log('[예약 생성] API 응답 상태:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('[예약 생성] 시간 슬롯 데이터:', data)
          setAvailableSlots(data.slots || [])
          
          if (data.slots && data.slots.length === 0) {
            setError('No hay horarios disponibles para esta fecha. Por favor selecciona otra fecha.')
          } else {
            setError('')
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Error al cargar horarios' }))
          console.error('[예약 생성] API 에러:', errorData)
          setError(errorData.error || 'Error al cargar los horarios disponibles.')
        }
      } catch (error) {
        console.error('[예약 생성] 시간 슬롯 조회 예외:', error)
        setError('Error al cargar los horarios disponibles.')
      } finally {
        setLoadingSlots(false)
      }
    } else if (!currentPartnerId) {
      setError('Por favor selecciona un amigo coreano primero.')
    } else if (!date) {
      setError('Por favor selecciona una fecha.')
    }
  }

  // 파트너가 선택되면 날짜가 있으면 자동으로 시간 슬롯 로드
  useEffect(() => {
    const currentPartnerId = formData.partnerId || partnerIdFromUrl
    if (currentPartnerId && formData.date && availableSlots.length === 0 && !loadingSlots) {
      handleDateChange(formData.date)
    }
  }, [formData.partnerId, partnerIdFromUrl])

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 사용자 로그인 체크 (인증은 나중에 확인)
    if (!user) {
      setError('로그인이 필요합니다.')
      router.push('/sign-in')
      setLoading(false)
      return
    }

    try {
      // 필수 필드 검증
      if (!formData.partnerId || !formData.scheduleId || !formData.topic) {
        throw new Error('Por favor completa todos los campos requeridos.')
      }

      // 선택한 스케줄 정보 가져오기
      const selectedSlot = availableSlots.find(s => s.id === formData.scheduleId)
      if (!selectedSlot) {
        throw new Error('No se encontró el horario seleccionado.')
      }

      // 종료 시간 계산: 시작 시간 + 20분
      // 주의: 날짜 경계를 넘어가면 다음날 00:00으로 처리 (24:00은 유효하지 않음)
      const [startHour, startMinute] = selectedSlot.start_time.split(':').map(Number)
      const endTotalMinutes = startMinute + 20
      let endHour = startHour + Math.floor(endTotalMinutes / 60)
      const finalEndMinute = endTotalMinutes % 60
      
      // 24:00 이상이면 다음날 00:00으로 처리
      if (endHour >= 24) {
        endHour = endHour % 24
        // 날짜는 API에서 처리하므로 여기서는 00:00만 반환
      }
      
      const calculatedEndTime = `${String(endHour).padStart(2, '0')}:${String(finalEndMinute).padStart(2, '0')}`

      const bookingData: any = {
        partner_id: formData.partnerId,
        schedule_id: formData.scheduleId,
        date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        end_time: calculatedEndTime,
        duration: 20,
        topic: formData.topic,
        description: formData.description
      }

      // 예약 요청 API 호출
      const response = await fetch('/api/bookings/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 쿠키 포함하여 세션 전달
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al enviar la solicitud de reserva.')
      }

      alert('¡Solicitud de reserva enviada! Te notificaremos cuando sea confirmada.')
      router.push('/main?tab=me')
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pt-20 md:pt-32 pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* 뒤로가기 버튼 */}
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </Button>
            </div>
            
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Reserva de Videollamada
              </h1>
              <p className="text-gray-600">
                Selecciona un amigo coreano y solicita una reserva.
              </p>
            </div>

            {/* 파트너 정보 카드 (선택된 경우) */}
            {selectedPartner && (
              <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-16 h-16">
                      {selectedPartner.avatar_url ? (
                        <AvatarImage 
                          src={selectedPartner.avatar_url} 
                          alt={selectedPartner.name}
                        />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-gray-700 font-medium">
                        {selectedPartner.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{selectedPartner.name}</h3>
                      {selectedPartner.specialty && (
                        <p className="text-sm text-gray-600">{selectedPartner.specialty}</p>
                      )}
                      <Badge className="mt-1 bg-green-100 text-green-800">
                        {selectedPartner.status === 'online' ? 'En línea' : 'Desconectado'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Ingresar Información de Reserva</CardTitle>
                <CardDescription>
                  Por favor selecciona un amigo, fecha, hora y tema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 한국인 친구 선택 */}
                  {!partnerIdFromUrl && (
                    <div className="space-y-2">
                      <Label htmlFor="partner">Seleccionar Amigo Coreano *</Label>
                      <Select 
                        value={formData.partnerId} 
                        onValueChange={handlePartnerChange}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un amigo" />
                        </SelectTrigger>
                        <SelectContent>
                          {partners
                            .filter(p => p.status === 'online')
                            .map((partner) => (
                            <SelectItem key={partner.id} value={partner.id}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{partner.name}</span>
                                <Badge variant="outline" className="text-xs">En línea</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* 날짜 선택 - 달력 */}
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha *</Label>
                    {!formData.partnerId && !partnerIdFromUrl ? (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                        Por favor selecciona un amigo coreano primero.
                      </div>
                    ) : loadingDates ? (
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Cargando fechas disponibles...</p>
                      </div>
                    ) : availableDates.length === 0 ? (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                        No hay fechas disponibles para este amigo coreano en los próximos 30 días.
                      </div>
                    ) : (
          <AvailableDatesCalendar
            availableDates={availableDates}
            selectedDate={formData.date}
            onDateSelect={handleDateChange}
            userLanguage={userLanguage}
            userTimezone={userTimezone}
          />
                    )}
                  </div>

                  {/* 가능한 시간 슬롯 선택 */}
                  <div className="space-y-2">
                    <Label htmlFor="time">Hora *</Label>
                    {!formData.partnerId && !partnerIdFromUrl ? (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                        Por favor selecciona un amigo coreano primero.
                      </div>
                    ) : !formData.date ? (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                        Por favor selecciona una fecha primero.
                      </div>
                    ) : loadingSlots ? (
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Cargando horarios disponibles...</p>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">
                          Horarios disponibles ({availableSlots.length}):
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {availableSlots.map((slot) => {
                            // 사용자 timezone 기준으로 과거 시간대인지 확인
                            // slot.date와 slot.start_time은 이미 사용자 timezone으로 변환된 값
                            // 사용자 timezone의 현재 날짜/시간과 직접 비교
                            
                            const now = new Date()
                            const formatter = new Intl.DateTimeFormat('en-CA', {
                              timeZone: userTimezone,
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })
                            
                            // 현재 시간을 사용자 timezone으로 포맷팅
                            const nowParts = formatter.formatToParts(now)
                            const nowYear = nowParts.find(p => p.type === 'year')?.value || '0'
                            const nowMonth = nowParts.find(p => p.type === 'month')?.value || '0'
                            const nowDay = nowParts.find(p => p.type === 'day')?.value || '0'
                            const nowHour = nowParts.find(p => p.type === 'hour')?.value || '0'
                            const nowMinute = nowParts.find(p => p.type === 'minute')?.value || '0'
                            
                            const nowDateStr = `${nowYear}-${nowMonth}-${nowDay}`
                            const nowTimeStr = `${nowHour.padStart(2, '0')}:${nowMinute.padStart(2, '0')}`
                            
                            // 날짜 비교
                            const isPastDate = slot.date < nowDateStr
                            // 같은 날짜인 경우 시간 비교
                            const isPastTime = slot.date === nowDateStr && slot.start_time < nowTimeStr
                            const isPast = isPastDate || isPastTime
                            
                            // 30분 미만인지 확인 (같은 날짜이고 과거가 아닌 경우만)
                            let isTooSoon = false
                            if (slot.date === nowDateStr && !isPast) {
                              const [slotHour, slotMinute] = slot.start_time.split(':').map(Number)
                              const [currentHour, currentMinute] = nowTimeStr.split(':').map(Number)
                              const slotTotalMinutes = slotHour * 60 + slotMinute
                              const currentTotalMinutes = currentHour * 60 + currentMinute
                              const diffMinutes = slotTotalMinutes - currentTotalMinutes
                              isTooSoon = diffMinutes < 30
                            }
                            
                            const isUnavailable = isPast || isTooSoon
                            
                            if (isPast || isTooSoon) {
                              console.log('[예약 생성] 시간 슬롯 체크:', {
                                slot: `${slot.date} ${slot.start_time}`,
                                userTimezone,
                                nowInUserTimezone: `${nowDateStr} ${nowTimeStr}`,
                                isPast,
                                isTooSoon,
                                isUnavailable
                              })
                            }
                            
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => {
                                  if (!isUnavailable) {
                                    console.log('[예약 생성] 시간 슬롯 선택:', slot)
                                    setFormData(prev => ({ ...prev, scheduleId: slot.id, time: slot.start_time }))
                                  }
                                }}
                                disabled={isUnavailable}
                                className={`p-4 rounded-lg border-2 text-sm transition-all ${
                                  isUnavailable
                                    ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed opacity-75' // No disponible 스타일
                                    : formData.scheduleId === slot.id
                                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-semibold shadow-md ring-2 ring-purple-200 hover:scale-105'
                                      : 'border-gray-200 hover:border-purple-300 bg-white hover:bg-purple-50 hover:scale-105'
                                }`}
                                title={isUnavailable ? (userLanguage === 'es' ? 'No disponible' : '예약 불가') : ''}
                              >
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <Clock className={`w-4 h-4 ${
                                    isUnavailable 
                                      ? 'text-gray-400' 
                                      : formData.scheduleId === slot.id 
                                        ? 'text-purple-600' 
                                        : 'text-gray-500'
                                  }`} />
                                  <span className={`font-semibold text-base ${
                                    isUnavailable ? 'line-through' : ''
                                  }`}>
                                    {slot.start_time}
                                  </span>
                                  {slot.end_time && (
                                    <p className={`text-xs ${
                                      isUnavailable ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      ~ {slot.end_time}
                                    </p>
                                  )}
                                  {isUnavailable && (
                                    <span className="text-xs text-gray-500 mt-1">
                                      {userLanguage === 'es' ? 'No disponible' : '예약 불가'}
                                    </span>
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                        {formData.scheduleId && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              <span>
                                <span className="font-semibold">Horario seleccionado:</span>{' '}
                                {availableSlots.find(s => s.id === formData.scheduleId)?.start_time}
                                {availableSlots.find(s => s.id === formData.scheduleId)?.end_time && 
                                  ` - ${availableSlots.find(s => s.id === formData.scheduleId)?.end_time}`
                                }
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-semibold">No hay horarios disponibles</span>
                        </div>
                        <p>Este amigo coreano no tiene horarios disponibles para esta fecha. Por favor selecciona otra fecha.</p>
                      </div>
                    )}
                  </div>

                  {/* 상담 시간 - 20분 고정 */}
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración de la Consulta</Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>20 minutos (fijo)</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Actualmente todas las reservas se realizan en unidades de 20 minutos.
                    </p>
                  </div>

                  {/* 주제 */}
                  <div className="space-y-2">
                    <Label htmlFor="topic">Tema de Conversación *</Label>
                    <Select
                      value={topicType === 'custom' ? CUSTOM_TOPIC_OPTION : (formData.topic || '')}
                      onValueChange={(value) => {
                        if (value === CUSTOM_TOPIC_OPTION) {
                          setTopicType('custom')
                          setFormData(prev => ({ ...prev, topic: '' }))
                        } else {
                          setTopicType('select')
                          setFormData(prev => ({ ...prev, topic: value }))
                        }
                      }}
                    >
                      <SelectTrigger id="topic">
                        <SelectValue placeholder="Selecciona un tema o escribe uno personalizado" />
                      </SelectTrigger>
                      <SelectContent>
                        {topicOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                        <SelectItem value={CUSTOM_TOPIC_OPTION}>
                          Otro tema (escribir personalmente)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* 직접 입력 필드 (직접 입력 선택 시에만 표시) */}
                    {topicType === 'custom' && (
                      <div className="mt-2">
                        <Input
                          id="topic-custom"
                          value={formData.topic}
                          onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                          placeholder="Escribe tu tema de conversación personalizado"
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* 상세 설명 */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción Detallada</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Ingresa el contenido específico de la conversación o tus preguntas"
                      rows={3}
                    />
                  </div>

                  {/* Google Meet 링크 안내 */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <p className="text-xs text-blue-800">
                        El enlace de Google Meet se generará automáticamente cuando tu reserva sea confirmada. Recibirás una notificación con el enlace.
                      </p>
                    </div>
                  </div>

                  {/* 에러 메시지 */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  {/* 제출 버튼 */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                    disabled={loading || !formData.partnerId || !formData.scheduleId || !formData.topic}
                  >
                    {loading ? 'Enviando solicitud...' : 'Enviar Solicitud de Reserva'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function CreateBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 pt-20 md:py-12 pb-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <CreateBookingPageContent />
    </Suspense>
  )
}

