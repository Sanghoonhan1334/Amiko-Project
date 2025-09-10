'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'


interface TimeSlot {
  start: string
  end: string
}

interface DaySchedule {
  isWorking: boolean
  timeSlots: TimeSlot[]
}

interface WeeklySchedule {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

interface Consultant {
  id: string
  name: string
  email: string
  specialty: string
  hourly_rate: number
  timezone: string
  available_hours: WeeklySchedule
  is_active: boolean
}

export default function CreateBookingPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    consultantId: '',
    date: '',
    time: '',
    duration: '60', // 기본 60분
    topic: '',
    description: '',
    price: 0
  })

  // 상담사 목록 조회
  useEffect(() => {
    fetchConsultants()
  }, [])

  const fetchConsultants = async () => {
    try {
              const response = await fetch('/api/consultants')
      if (!response.ok) {
        throw new Error('상담사 목록을 불러올 수 없습니다.')
      }
      const data = await response.json()
      setConsultants(data.consultants || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    }
  }

  // 상담사 선택 시 가격 업데이트 및 예약 가능 시간 계산
  const handleConsultantChange = (consultantId: string) => {
    const consultant = consultants.find(c => c.id === consultantId)
    if (consultant) {
      setFormData(prev => ({
        ...prev,
        consultantId,
        price: consultant.hourly_rate * (parseInt(prev.duration) / 60)
      }))
      
      // 날짜가 선택되어 있다면 예약 가능 시간 계산
      if (formData.date) {
        calculateAvailableTimes(consultant, formData.date)
      }
    }
  }

  // 날짜 선택 시 예약 가능 시간 계산
  const handleDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, date, time: '' }))
    
    if (formData.consultantId) {
      const consultant = consultants.find(c => c.id === formData.consultantId)
      if (consultant) {
        calculateAvailableTimes(consultant, date)
      }
    }
  }

  // 상담사별 예약 가능 시간 계산
  const calculateAvailableTimes = (consultant: Consultant, date: string) => {
    const selectedDate = new Date(date)
    const dayOfWeek = selectedDate.getDay() // 0: 일요일, 1: 월요일, ...
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayKey = dayNames[dayOfWeek] as keyof WeeklySchedule
    
    const daySchedule = consultant.available_hours[dayKey]
    
    if (!daySchedule || !daySchedule.isWorking) {
      setAvailableTimes([])
      return
    }

    // 30분 단위로 시간 슬롯 생성
    let times: string[] = []
    daySchedule.timeSlots.forEach(slot => {
      const start = new Date(`2000-01-01T${slot.start}`)
      const end = new Date(`2000-01-01T${slot.end}`)
      
      while (start < end) {
        times.push(start.toTimeString().slice(0, 5))
        start.setMinutes(start.getMinutes() + 30)
      }
    })

    // 현재 시간 이후만 표시 (오늘인 경우)
    const today = new Date().toDateString()
    if (date === today) {
      const now = new Date()
      const currentTime = now.toTimeString().slice(0, 5)
      times = times.filter(time => time > currentTime)
    }

    setAvailableTimes(times)
  }

  // 상담 시간 변경 시 가격 업데이트
  const handleDurationChange = (duration: string) => {
    setFormData(prev => ({ ...prev, duration }))
    
    if (formData.consultantId) {
      const consultant = consultants.find(c => c.id === formData.consultantId)
      if (consultant) {
        setFormData(prev => ({
          ...prev,
          price: consultant.hourly_rate * (parseInt(duration) / 60)
        }))
      }
    }
  }

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 필수 필드 검증
      if (!formData.consultantId || !formData.date || !formData.time || !formData.topic) {
        throw new Error('모든 필수 항목을 입력해주세요.')
      }

      // 예약 데이터 생성
      const startAt = new Date(`${formData.date}T${formData.time}`)
      const endAt = new Date(startAt.getTime() + parseInt(formData.duration) * 60 * 1000)

      const bookingData = {
        userId: user?.id,
        consultantId: formData.consultantId,
        topic: formData.topic,
        description: formData.description,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        duration: parseInt(formData.duration),
        price: formData.price
      }

      // 예약 생성 API 호출
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '예약 생성에 실패했습니다.')
      }

      const { booking } = await response.json()
      
      // 결제 페이지로 이동 (예약 ID와 함께)
      router.push(`/payments/checkout?bookingId=${booking.id}&amount=${formData.price}`)
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 상담사별 예약 가능 시간 요약
  const getScheduleSummary = (consultant: Consultant) => {
    const workingDays = Object.values(consultant.available_hours).filter(day => day?.isWorking).length
    if (workingDays === 0) return '휴무'
    if (workingDays === 7) return '매일 근무'
    if (workingDays === 5 && !consultant.available_hours.saturday?.isWorking && !consultant.available_hours.sunday?.isWorking) return '평일 근무'
    return `${workingDays}일 근무`
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                상담 예약하기
              </h1>
              <p className="text-gray-600">
                원하는 상담사를 선택하고 예약을 생성하세요.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>예약 정보 입력</CardTitle>
                <CardDescription>
                  상담사, 날짜, 시간, 주제를 선택해주세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 상담사 선택 */}
                  <div className="space-y-2">
                    <Label htmlFor="consultant">상담사 선택 *</Label>
                    <Select 
                      value={formData.consultantId} 
                      onValueChange={handleConsultantChange}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="상담사를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {consultants
                          .filter(c => c.is_active)
                          .map((consultant) => (
                          <SelectItem key={consultant.id} value={consultant.id}>
                            <div className="flex justify-between items-center w-full">
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{consultant.name}</span>
                                <span className="text-sm text-gray-500">{consultant.specialty}</span>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {getScheduleSummary(consultant)}
                                </Badge>
                              </div>
                              <span className="text-sm text-gray-500 ml-4">
                                ₩{consultant.hourly_rate.toLocaleString()}/시간
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.consultantId && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>전문 분야: {consultants.find(c => c.id === formData.consultantId)?.specialty}</p>
                        <p>시간대: {consultants.find(c => c.id === formData.consultantId)?.timezone}</p>
                      </div>
                    )}
                  </div>

                  {/* 날짜 선택 */}
                  <div className="space-y-2">
                    <Label htmlFor="date">날짜 *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleDateChange(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  {/* 시간 선택 */}
                  <div className="space-y-2">
                    <Label htmlFor="time">시간 *</Label>
                    {availableTimes.length > 0 ? (
                      <Select 
                        value={formData.time} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, time: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="예약 가능한 시간을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTimes.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                        {formData.consultantId && formData.date 
                          ? '선택한 날짜에 예약 가능한 시간이 없습니다.'
                          : '상담사와 날짜를 먼저 선택해주세요.'
                        }
                      </div>
                    )}
                  </div>

                  {/* 상담 시간 */}
                  <div className="space-y-2">
                    <Label htmlFor="duration">상담 시간</Label>
                    <Select 
                      value={formData.duration} 
                      onValueChange={handleDurationChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30분</SelectItem>
                        <SelectItem value="60">60분</SelectItem>
                        <SelectItem value="90">90분</SelectItem>
                        <SelectItem value="120">120분</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 주제 */}
                  <div className="space-y-2">
                    <Label htmlFor="topic">상담 주제 *</Label>
                    <Input
                      id="topic"
                      value={formData.topic}
                      onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                      placeholder="예: 한국어 발음 교정, 한국 문화 이해 등"
                      required
                    />
                  </div>

                  {/* 상세 설명 */}
                  <div className="space-y-2">
                    <Label htmlFor="description">상세 설명</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="구체적인 상담 내용이나 질문사항을 입력하세요"
                      rows={3}
                    />
                  </div>

                  {/* 가격 표시 */}
                  {formData.price > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-blue-900">상담 비용</span>
                        <span className="text-2xl font-bold text-blue-900">
                          ₩{formData.price.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        {formData.duration}분 상담 • ₩{consultants.find(c => c.id === formData.consultantId)?.hourly_rate.toLocaleString()}/시간
                      </p>
                    </div>
                  )}

                  {/* 에러 메시지 */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  {/* 제출 버튼 */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || !formData.consultantId || !formData.date || !formData.time || !formData.topic}
                  >
                    {loading ? '예약 생성 중...' : '예약 생성하기'}
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
