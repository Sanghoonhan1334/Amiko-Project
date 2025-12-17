'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { format } from 'date-fns'

interface ZepEventCardProps {
  user?: any
}

// 시간대 정보
const TIMEZONES = [
  { code: 'KST', flag: '🇰🇷', name: 'Corea del Sur', timezone: 'Asia/Seoul', displayName: 'KST' },
  { code: 'MEX', flag: '🇲🇽', name: 'México', timezone: 'America/Mexico_City', displayName: 'MEX' },
  { code: 'PER', flag: '🇵🇪', name: 'Perú', timezone: 'America/Lima', displayName: 'PER' },
  { code: 'COL', flag: '🇨🇴', name: 'Colombia', timezone: 'America/Bogota', displayName: 'COL' },
]

export default function ZepEventCard({ user }: ZepEventCardProps) {
  const { t } = useLanguage()
  const { token, user: authUser } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(() => {
    // 기본값: 1년 후
    const today = new Date()
    return new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).getMonth()
  })
  const [currentYear, setCurrentYear] = useState(() => {
    // 기본값: 1년 후
    const today = new Date()
    return new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).getFullYear()
  })
  const [nextEventDate, setNextEventDate] = useState<Date>(() => {
    // 기본값: 1년 후 (이벤트 없음)
    const today = new Date()
    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
    return nextYear
  })
  const [zoomLink, setZoomLink] = useState('https://zoom.us/j/YOUR_ZOOM_MEETING_ID')
  const [zepLink, setZepLink] = useState('https://zep.us/play/EgkBJz')

  // 운영자 여부 확인
  useEffect(() => {
    if (!authUser?.id || !token) {
      setCheckingAdmin(false)
      return
    }

    const checkAdmin = async () => {
      try {
        console.log('[ZepEventCard] 관리자 확인 시작:', { userId: authUser.id, hasToken: !!token })
        const response = await fetch('/api/admin/check?userId=' + authUser.id, {
          headers: {
            'Authorization': `Bearer ${encodeURIComponent(token)}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          console.error('[ZepEventCard] 관리자 확인 API 오류:', response.status, response.statusText)
          setIsAdmin(false)
          setCheckingAdmin(false)
          return
        }
        
        const data = await response.json()
        console.log('[ZepEventCard] 관리자 확인 결과:', data)
        setIsAdmin(data.isAdmin || false)
      } catch (error) {
        console.error('운영자 확인 실패:', error)
        setIsAdmin(false)
      } finally {
        setCheckingAdmin(false)
      }
    }

    checkAdmin()
  }, [authUser, token])

  // 운영자 모임 이벤트 날짜 및 링크 불러오기
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch('/api/admin/events/zep')
        if (response.ok) {
          const data = await response.json()
          if (data.event && data.event.start_date) {
            // 날짜 문자열을 파싱할 때 시간대 문제 방지
            const dateStr = data.event.start_date
            const [year, month, day] = dateStr.split('-').map(Number)
            const eventDate = new Date(year, month - 1, day) // 월은 0-based
            setNextEventDate(eventDate)
            // 이벤트 날짜의 달로 달력 이동
            setCurrentMonth(eventDate.getMonth())
            setCurrentYear(eventDate.getFullYear())
            
            console.log('[ZepEventCard] 이벤트 날짜 로드:', {
              dateStr,
              eventDate: eventDate.toLocaleDateString('ko-KR'),
              dayOfWeek: eventDate.getDay(),
              currentMonth,
              currentYear
            })
            
            // 링크 불러오기
            if (data.event.zoom_link) {
              setZoomLink(data.event.zoom_link)
            }
            if (data.event.zep_link) {
              setZepLink(data.event.zep_link)
            }
          } else {
            // 이벤트가 없으면 오늘 날짜로 달력 설정
            const today = new Date()
            setCurrentMonth(today.getMonth())
            setCurrentYear(today.getFullYear())
          }
        }
      } catch (error) {
        console.error('이벤트 조회 실패:', error)
        // 오류 발생 시 오늘 날짜로 달력 설정
        const today = new Date()
        setCurrentMonth(today.getMonth())
        setCurrentYear(today.getFullYear())
      }
    }

    fetchEvent()
  }, [])

  const formatDate = (date: Date) => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const month = date.getMonth()
    const day = date.getDate()
    return `${day} de ${monthNames[month]}`
  }

  // 매월 2번째/4번째 토요일 계산 함수
  const getNthSaturday = (year: number, month: number, nth: number): Date => {
    // 해당 월의 첫 번째 날
    const firstDay = new Date(year, month, 1)
    // 첫 번째 토요일 찾기 (토요일 = 6)
    const firstDayOfWeek = firstDay.getDay()
    
    // 첫 번째 토요일까지의 일수 계산
    // 예: 월요일(1)이면 토요일까지 5일, 일요일(0)이면 토요일까지 6일
    let daysUntilFirstSaturday = 6 - firstDayOfWeek
    if (daysUntilFirstSaturday < 0) {
      daysUntilFirstSaturday += 7
    }
    
    const firstSaturday = new Date(year, month, 1 + daysUntilFirstSaturday)
    
    // nth번째 토요일 계산 (1번째 = 0주차, 2번째 = 1주차, 4번째 = 3주차)
    const nthSaturday = new Date(firstSaturday)
    nthSaturday.setDate(firstSaturday.getDate() + (nth - 1) * 7)
    
    return nthSaturday
  }
  
  // 현재 날짜가 2주차인지 4주차인지 판단
  const getWeekNumber = (date: Date): number | null => {
    if (!date) return null
    
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()
    const dayOfWeek = date.getDay()
    
    // 토요일이 아니면 null 반환
    if (dayOfWeek !== 6) {
      return null
    }
    
    // 해당 월의 2번째와 4번째 토요일 계산
    const secondSaturday = getNthSaturday(year, month, 2)
    const fourthSaturday = getNthSaturday(year, month, 4)
    
    // 날짜가 2번째 토요일인지 확인 (날짜와 요일 모두 확인)
    if (day === secondSaturday.getDate() && month === secondSaturday.getMonth() && year === secondSaturday.getFullYear()) {
      return 2
    }
    // 날짜가 4번째 토요일인지 확인
    if (day === fourthSaturday.getDate() && month === fourthSaturday.getMonth() && year === fourthSaturday.getFullYear()) {
      return 4
    }
    
    return null
  }

  // 각 시간대별 날짜와 시간을 가져오는 함수
  const getDateTimeForTimezone = (timezone: string) => {
    try {
      // 설정된 이벤트 날짜는 멕시코 시간대 기준
      // 멕시코 시간 9PM (America/Mexico_City) 기준으로 계산
      const year = nextEventDate.getFullYear()
      const month = nextEventDate.getMonth() + 1
      const day = nextEventDate.getDate()
      
      // 멕시코 시간 9PM을 나타내는 UTC 시간 계산
      // 정확한 방법: 다음날 UTC 03:00으로 시작하고, 멕시코 시간대로 변환하여 9PM인지 확인
      // 멕시코는 UTC-6 (일광절약시간 없을 때) 또는 UTC-5 (일광절약시간 있을 때)
      const nextDay = new Date(year, month - 1, day)
      nextDay.setDate(nextDay.getDate() + 1)
      
      // UTC 03:00으로 시도 (일광절약시간 없을 때)
      let utcTime = new Date(Date.UTC(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), 3, 0, 0))
      
      // 멕시코 시간대로 변환하여 9PM인지 확인
      const mexicoTimeCheck = utcTime.toLocaleString('en-US', {
        timeZone: 'America/Mexico_City',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      
      // 멕시코 시간이 9PM이 아니면 UTC 02:00으로 조정 (일광절약시간 있을 때)
      if (!mexicoTimeCheck.includes('21:00')) {
        utcTime = new Date(Date.UTC(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), 2, 0, 0))
      }
      
      // 목표 시간대로 변환
      const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
      const targetDate = new Date(utcTime.toLocaleString('en-US', { timeZone: timezone }))
      const dateStr = `${targetDate.getDate()} de ${monthNames[targetDate.getMonth()]}`
      
      const timeStr = utcTime.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
      })
      
      return { dateStr, timeStr }
    } catch (error) {
      console.error('날짜/시간 계산 오류:', error)
      return { dateStr: '--', timeStr: '--:--' }
    }
  }

  const formatDateForStorage = (date: Date) => {
    return format(date, 'yyyy-MM-dd')
  }

  const handleSaveDate = async () => {
    if (!selectedDate) return
    
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const formattedDate = `${selectedDate.getDate()} de ${monthNames[selectedDate.getMonth()]}`
    
    // 2주차/4주차 판단
    const weekNumber = getWeekNumber(selectedDate)
    if (!weekNumber) {
      alert('2주차 또는 4주차 토요일만 선택할 수 있습니다.')
      return
    }
    
    // 플랫폼과 링크 결정
    const platform = weekNumber === 2 ? 'zoom' : 'zep'
    const meetingLink = weekNumber === 2 ? zoomLink : zepLink
    
    try {
      // 서버에 저장
      const response = await fetch('/api/admin/events/zep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${encodeURIComponent(token)}`
        },
        body: JSON.stringify({
          start_date: formatDateForStorage(selectedDate),
          title: weekNumber === 2 
            ? 'Reunión con Operadores de Zoom' 
            : 'Reunión con Operadores de ZEP',
          description: 'Tiempo para hablar directamente con los operadores una vez al mes',
          max_participants: 30,
          platform: platform,
          week_number: weekNumber,
          zep_link: weekNumber === 4 ? zepLink : null,
          zoom_link: weekNumber === 2 ? zoomLink : null
        })
      })

      if (response.ok) {
        setNextEventDate(selectedDate)
        // 저장한 날짜의 달로 달력 이동
        setCurrentMonth(selectedDate.getMonth())
        setCurrentYear(selectedDate.getFullYear())
        const platformName = weekNumber === 2 ? 'Zoom' : 'ZEP'
        alert(`La fecha de la reunión ${platformName} (${weekNumber}ª semana) se ha establecido para el ${formattedDate}!`)
      } else {
        alert('이벤트 날짜 설정에 실패했습니다.')
      }
    } catch (error) {
      console.error('이벤트 날짜 저장 실패:', error)
      alert('이벤트 날짜 저장에 실패했습니다.')
    }
  }

  const handleEnterMeeting = () => {
    // 현재 이벤트의 플랫폼에 따라 링크 열기
    const weekNumber = getWeekNumber(nextEventDate)
    if (weekNumber === 2) {
      window.open(zoomLink, '_blank')
    } else {
      window.open(zepLink, '_blank')
    }
  }

  // 오늘 날짜가 설정된 날짜 이후인지 확인
  const isEventOpen = () => {
    if (!nextEventDate) return false
    
    const today = new Date()
    today.setHours(0, 0, 0, 0) // 시간을 00:00:00으로 설정
    
    const eventDate = new Date(nextEventDate)
    eventDate.setHours(0, 0, 0, 0)
    
    return today >= eventDate
  }
  
  // 이벤트가 이미 진행되었는지 확인 (오늘 날짜가 이벤트 날짜보다 이후)
  const isEventCompleted = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const eventDate = new Date(date)
    eventDate.setHours(0, 0, 0, 0)
    
    return today > eventDate
  }
  
  // 다음 일정 찾기
  const getNextEventDate = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 저장된 이벤트가 있고 오늘 이후면 반환
    if (nextEventDate) {
      const eventDate = new Date(nextEventDate)
      eventDate.setHours(0, 0, 0, 0)
      
      if (today <= eventDate) {
        return nextEventDate
      }
    }
    
    // 현재 달의 남은 2주차/4주차 토요일 찾기
    const currentMonthSecond = getNthSaturday(currentYear, currentMonth, 2)
    const currentMonthFourth = getNthSaturday(currentYear, currentMonth, 4)
    
    const todayTime = today.getTime()
    if (currentMonthSecond.getTime() >= todayTime) {
      return currentMonthSecond
    }
    if (currentMonthFourth.getTime() >= todayTime) {
      return currentMonthFourth
    }
    
    // 다음 달의 2주차/4주차 토요일 찾기
    const nextMonth = new Date(currentYear, currentMonth + 1, 1)
    const nextMonthSecond = getNthSaturday(nextMonth.getFullYear(), nextMonth.getMonth(), 2)
    const nextMonthFourth = getNthSaturday(nextMonth.getFullYear(), nextMonth.getMonth(), 4)
    
    if (nextMonthSecond.getTime() >= todayTime) {
      return nextMonthSecond
    }
    if (nextMonthFourth.getTime() >= todayTime) {
      return nextMonthFourth
    }
    
    // 다음 다음 달
    const nextNextMonth = new Date(currentYear, currentMonth + 2, 1)
    return getNthSaturday(nextNextMonth.getFullYear(), nextNextMonth.getMonth(), 2)
  }

  const handleDateClick = (date: number) => {
    console.log('[ZepEventCard] 날짜 클릭:', { date, isAdmin, checkingAdmin })
    
    if (!isAdmin || checkingAdmin) {
      console.log('[ZepEventCard] 관리자 권한 없음:', { isAdmin, checkingAdmin })
      alert('관리자만 날짜를 선택할 수 있습니다.')
      return
    }

    // 달력에서 선택한 날짜
    const clickedDate = new Date(currentYear, currentMonth, date)
    
    // 2주차 또는 4주차 토요일인지 확인
    const weekNumber = getWeekNumber(clickedDate)
    if (!weekNumber) {
      alert('2주차 또는 4주차 토요일만 선택할 수 있습니다.')
      return
    }
    
    console.log('[ZepEventCard] 날짜 선택:', { clickedDate, weekNumber })
    setSelectedDate(clickedDate)
    handleSaveDate()
  }
  
  // 날짜가 2주차/4주차 토요일인지 확인
  const isSelectableDate = (date: number): boolean => {
    const checkDate = new Date(currentYear, currentMonth, date)
    const weekNumber = getWeekNumber(checkDate)
    return weekNumber !== null
  }

  const isCheckedDate = (date: number) => {
    if (!nextEventDate) return false
    
    // nextEventDate와 현재 달력의 날짜를 정확히 비교
    const eventYear = nextEventDate.getFullYear()
    const eventMonth = nextEventDate.getMonth()
    const eventDay = nextEventDate.getDate()
    
    // 현재 달력의 날짜 객체 생성
    const calendarDate = new Date(currentYear, currentMonth, date)
    const calendarYear = calendarDate.getFullYear()
    const calendarMonth = calendarDate.getMonth()
    const calendarDay = calendarDate.getDate()
    
    // 년, 월, 일 모두 일치하는지 확인
    return eventYear === calendarYear && eventMonth === calendarMonth && eventDay === calendarDay
  }

  // 현재 달력의 날짜 배열 생성
  const getCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    
    const days: (number | null)[] = []
    // 빈 칸 추가
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    // 날짜 추가
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    
    return days
  }

  // 이전/다음 월 이동
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // 시간대별 시간 계산 (한국 시간 기준 10:00 AM)
  const getTimeForTimezone = (timezone: string) => {
    try {
      // KST 10:00 AM = UTC 01:00 AM
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      
      // KST 10:00을 UTC로 변환 (UTC+9이므로 01:00)
      const utcString = `${year}-${month}-${day}T01:00:00.000Z`
      const utcTime = new Date(utcString)
      
      // 목표 시간대로 변환
      return utcTime.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('시간 계산 오류:', error)
      return '--:--'
    }
  }

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const calendarDays = getCalendarDays()
  
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="text-xl sm:text-2xl">🎈</div>
          <CardTitle className="text-sm sm:text-base md:text-lg text-purple-700 dark:text-purple-300">
            {(() => {
              const weekNumber = getWeekNumber(nextEventDate)
              return weekNumber === 2 
                ? 'Reunión con Operadores de Zoom' 
                : weekNumber === 4
                ? 'Reunión con Operadores de ZEP'
                : 'Reunión con Operadores'
            })()}
          </CardTitle>
          <Badge className="ml-auto bg-purple-500 text-white text-xs">
            En vivo
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ZEP 이미지 */}
        <div className="relative w-full rounded-lg overflow-hidden">
          <img 
            src="/misc/zep.jpg" 
            alt="Reunión con Operadores de ZEP"
            className="w-full aspect-video object-cover max-h-64 sm:max-h-80 md:max-h-96"
          />
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tiempo para hablar directamente con los operadores una vez al mes
        </p>

        {/* 달력 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-2 md:p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <button
                onClick={goToPreviousMonth}
                className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <h4 className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[80px] text-center">
                {monthNames[currentMonth]} {currentYear}
              </h4>
              <button
                onClick={goToNextMonth}
                className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            {isAdmin && !checkingAdmin && (
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-purple-600 dark:text-purple-400 text-right">
                  Fecha (hora de México 9PM)
                </span>
                <span className="text-[9px] text-green-600 dark:text-green-400">
                  관리자 모드 활성화 ✓
                </span>
              </div>
            )}
          </div>
          
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-1">
            {daysOfWeek.map((day, idx) => (
              <div
                key={idx}
                className="text-center text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-0.5 md:gap-1">
            {calendarDays.map((date, idx) => {
              if (date === null) {
                return <div key={idx} className="aspect-square"></div>
              }
              const checked = isCheckedDate(date)
              const isClickable = isAdmin && !checkingAdmin
              
              const isSelectable = isSelectableDate(date)
              const isSaturday = new Date(currentYear, currentMonth, date).getDay() === 6
              const currentDate = new Date(currentYear, currentMonth, date)
              const weekNumber = getWeekNumber(currentDate)
              const isCompleted = isEventCompleted(currentDate)
              const isNextEvent = getNextEventDate()?.getTime() === currentDate.getTime()
              
              return (
                <button
                  key={idx}
                  onClick={() => handleDateClick(date)}
                  disabled={!isClickable || !isSelectable}
                  className={`
                    aspect-square text-[10px] md:text-xs font-medium rounded-md
                    transition-all duration-200 relative overflow-hidden
                    ${isSelectable && isSaturday 
                      ? weekNumber === 2
                        ? 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-800 dark:text-blue-200 hover:from-blue-200 hover:to-blue-300 dark:hover:from-blue-800/50 dark:hover:to-blue-700/50' 
                        : 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 text-purple-800 dark:text-purple-200 hover:from-purple-200 hover:to-purple-300 dark:hover:from-purple-800/50 dark:hover:to-purple-700/50'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}
                    ${isClickable && isSelectable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                    ${isNextEvent ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}
                  `}
                  title={isSelectable && isSaturday 
                    ? `${weekNumber}주차 (${weekNumber === 2 ? 'Zoom' : 'Zep'})${isCompleted ? ' - 완료' : ''}${isNextEvent ? ' - 다음 일정' : ''}` 
                    : '선택 불가'}
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* 숫자 */}
                    <span className={checked ? 'relative z-10 font-bold' : ''}>{date}</span>
                    
                    {/* 2주차/4주차 빵빠레 표시 */}
                    {isSelectable && isSaturday && weekNumber && (
                      <div className="absolute top-0 right-0 w-3 h-3 flex items-center justify-center">
                        <span className="text-[8px]">
                          {weekNumber === 2 ? '🎥' : '🎮'}
                        </span>
                      </div>
                    )}
                    
                    {/* 진행 완료 표시 */}
                    {isCompleted && checked && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500 dark:bg-green-400"></div>
                    )}
                    
                    {/* 다음 일정 표시 */}
                    {isNextEvent && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-[6px]">⭐</span>
                      </div>
                    )}
                    
                    {/* 체크된 날짜에 빨간 동그라미 테두리 */}
                    {checked && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="42" 
                            fill="none" 
                            stroke={isCompleted ? "#10b981" : "#ef4444"} 
                            strokeWidth="6"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 다음 모임 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
          {/* 다음 일정 표시 */}
          {(() => {
            const nextEvent = getNextEventDate()
            if (nextEvent) {
              const weekNumber = getWeekNumber(nextEvent)
              const platform = weekNumber === 2 ? 'Zoom' : 'Zep'
              const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
              const nextDateStr = `${nextEvent.getDate()} de ${monthNames[nextEvent.getMonth()]}`
              
              return (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">⭐</span>
                    <span className="text-xs sm:text-sm font-bold text-yellow-800 dark:text-yellow-200">
                      Próxima Reunión
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                    <span className="font-semibold">{nextDateStr}</span> - {weekNumber}ª semana ({platform})
                  </div>
                </div>
              )
            }
            return null
          })()}
          
          {/* 각 시간대별 시간 표시 */}
          <div className="space-y-1">
            {TIMEZONES.map((tz) => {
              const { dateStr, timeStr } = getDateTimeForTimezone(tz.timezone)
              return (
                <div key={tz.code} className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  {tz.flag} {tz.code === 'KST' ? 'Corea' : tz.name}: {dateStr}, {timeStr}
                </div>
              )
            })}
          </div>
          
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Máximo 30 participantes
            </span>
          </div>
        </div>

        {/* 관리자용 링크 설정 UI */}
        {isAdmin && !checkingAdmin && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2 border border-purple-200">
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">
              링크 설정 (관리자 전용)
            </p>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                  2주차 Zoom 링크:
                </label>
                <input
                  type="text"
                  value={zoomLink}
                  onChange={(e) => setZoomLink(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="https://zoom.us/j/YOUR_MEETING_ID"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                  4주차 Zep 링크:
                </label>
                <input
                  type="text"
                  value={zepLink}
                  onChange={(e) => setZepLink(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="https://zep.us/play/YOUR_ROOM_ID"
                />
              </div>
            </div>
          </div>
        )}

        {/* 참여 버튼 */}
        {isEventOpen() ? (
          <>
            <Button
              onClick={handleEnterMeeting}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {(() => {
                const weekNumber = getWeekNumber(nextEventDate)
                return weekNumber === 2 ? 'Entrar a Zoom' : 'Entrar a ZEP'
              })()}
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Hablemos de diversos temas con los operadores 🎉
            </p>
          </>
        ) : (
          <>
            <Button
              disabled
              className="w-full bg-gray-400 text-white cursor-not-allowed"
            >
              <ExternalLink className="w-4 h-4 mr-2 opacity-50" />
              Todavía no está abierto
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              El evento estará disponible a partir del {formatDate(nextEventDate)}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

