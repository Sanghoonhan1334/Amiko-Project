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

  // 운영자 여부 확인
  useEffect(() => {
    if (!authUser?.id || !token) {
      setCheckingAdmin(false)
      return
    }

    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/admin/check?userId=' + authUser.id, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        setIsAdmin(data.isAdmin || false)
      } catch (error) {
        console.error('운영자 확인 실패:', error)
      } finally {
        setCheckingAdmin(false)
      }
    }

    checkAdmin()
  }, [authUser, token])

  // ZEP 이벤트 날짜 불러오기
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch('/api/admin/events/zep')
        if (response.ok) {
          const data = await response.json()
          if (data.event && data.event.start_date) {
            const eventDate = new Date(data.event.start_date)
            setNextEventDate(eventDate)
            // 이벤트 날짜의 달로 달력 이동
            setCurrentMonth(eventDate.getMonth())
            setCurrentYear(eventDate.getFullYear())
          }
        }
      } catch (error) {
        console.error('ZEP 이벤트 조회 실패:', error)
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

  // 각 시간대별 날짜와 시간을 가져오는 함수
  const getDateTimeForTimezone = (timezone: string) => {
    try {
      // 설정된 이벤트 날짜는 남미 시간대 기준 (예: 11월 8일)
      // 남미 시간 8PM (UTC-5) = UTC 01:00 (다음날)
      const year = nextEventDate.getFullYear()
      const month = String(nextEventDate.getMonth() + 1).padStart(2, '0')
      const day = String(nextEventDate.getDate()).padStart(2, '0')
      
      // 페루(Lima) 시간 8PM = UTC 다음날 01:00
      // UTC = 2024-11-09 01:00 = 페루 2024-11-08 20:00
      const utcString = `${year}-${month}-${day}T01:00:00.000Z`
      
      // UTC 시간을 명시적으로 다음날로 조정 (남미 8PM이 UTC 다음날 01시이므로)
      const tempDate = new Date(`${year}-${month}-${day}T00:00:00Z`)
      tempDate.setUTCDate(tempDate.getUTCDate() + 1)
      tempDate.setUTCHours(1, 0, 0, 0)
      
      // 목표 시간대로 변환
      const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
      const targetDate = new Date(tempDate.toLocaleString('en-US', { timeZone: timezone }))
      const dateStr = `${targetDate.getDate()} de ${monthNames[targetDate.getMonth()]}`
      
      const timeStr = tempDate.toLocaleTimeString('en-US', {
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
          title: 'Reunión con Operadores de ZEP',
          description: 'Tiempo para hablar directamente con los operadores una vez al mes',
          max_participants: 30,
          zep_link: 'https://zep.us/play/EgkBJz'
        })
      })

      if (response.ok) {
        setNextEventDate(selectedDate)
        // 저장한 날짜의 달로 달력 이동
        setCurrentMonth(selectedDate.getMonth())
        setCurrentYear(selectedDate.getFullYear())
        alert(`La fecha de la reunión ZEP se ha establecido para el ${formattedDate}!`)
      } else {
        alert('이벤트 날짜 설정에 실패했습니다.')
      }
    } catch (error) {
      console.error('이벤트 날짜 저장 실패:', error)
      alert('이벤트 날짜 저장에 실패했습니다.')
    }
  }

  const handleEnterZep = () => {
    // ZEP 라운지 링크
    window.open('https://zep.us/play/EgkBJz', '_blank')
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

  const handleDateClick = (date: number) => {
    if (!isAdmin || checkingAdmin) return

    // 달력에서 선택한 날짜는 남미 시간대 기준
    const clickedDate = new Date(currentYear, currentMonth, date)
    
    setSelectedDate(clickedDate)
    handleSaveDate()
  }

  const isCheckedDate = (date: number) => {
    if (!nextEventDate) return false
    
    // nextEventDate는 남미 날짜 기준이므로 직접 비교
    const year = nextEventDate.getFullYear()
    const month = nextEventDate.getMonth()
    const day = nextEventDate.getDate()
    
    return year === currentYear && month === currentMonth && day === date
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
          <div className="text-2xl">🎈</div>
          <CardTitle className="text-lg md:text-xl text-purple-700 dark:text-purple-300">
            Reunión con Operadores de ZEP
          </CardTitle>
          <Badge className="ml-auto bg-purple-500 text-white">
            En vivo
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ZEP 이미지 */}
        <div className="relative w-full h-32 md:h-40 rounded-lg overflow-hidden">
          <img 
            src="/misc/zep.jpg" 
            alt="Reunión con Operadores de ZEP"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tiempo para hablar directamente con los operadores una vez al mes
        </p>

        {/* 달력 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousMonth}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <h4 className="text-sm md:text-base font-semibold text-gray-700 dark:text-gray-300 min-w-[100px] text-center">
                {monthNames[currentMonth]} {currentYear}
              </h4>
              <button
                onClick={goToNextMonth}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            {isAdmin && !checkingAdmin && (
              <span className="text-xs text-purple-600 dark:text-purple-400 text-right">
                Fecha (hora de América del Sur)
              </span>
            )}
          </div>
          
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
            {daysOfWeek.map((day, idx) => (
              <div
                key={idx}
                className="text-center text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {calendarDays.map((date, idx) => {
              if (date === null) {
                return <div key={idx} className="aspect-square"></div>
              }
              const checked = isCheckedDate(date)
              const isClickable = isAdmin && !checkingAdmin
              
              return (
                <button
                  key={idx}
                  onClick={() => handleDateClick(date)}
                  disabled={!isClickable}
                  className={`
                    aspect-square text-xs md:text-base font-medium rounded-md
                    transition-all duration-200 relative
                    bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600
                    ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                  `}
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* 숫자 */}
                    <span className={checked ? 'relative z-10' : ''}>{date}</span>
                    {/* 체크된 날짜에 빨간 동그라미 테두리 */}
                    {checked && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="42" 
                            fill="none" 
                            stroke="#ef4444" 
                            strokeWidth="8"
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
          {/* 각 시간대별 시간 표시 */}
          <div className="space-y-1">
            {TIMEZONES.map((tz) => {
              const { dateStr, timeStr } = getDateTimeForTimezone(tz.timezone)
              return (
                <div key={tz.code} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {tz.flag} {tz.code === 'KST' ? 'Corea' : tz.name}: {dateStr}, {timeStr}
                </div>
              )
            })}
          </div>
          
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Máximo 30 participantes
            </span>
          </div>
        </div>

        {/* 참여 버튼 */}
        {isEventOpen() ? (
          <>
            <Button
              onClick={handleEnterZep}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Entrar a ZEP
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

