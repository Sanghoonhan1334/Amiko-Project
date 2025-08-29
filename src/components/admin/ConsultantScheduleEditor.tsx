'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Clock, Plus, X, Calendar } from 'lucide-react'

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

interface ConsultantScheduleEditorProps {
  schedule: WeeklySchedule
  onScheduleChange: (schedule: WeeklySchedule) => void
  timezone: string
}

const DAYS = [
  { key: 'monday', label: '월요일', short: '월' },
  { key: 'tuesday', label: '화요일', short: '화' },
  { key: 'wednesday', label: '수요일', short: '수' },
  { key: 'thursday', label: '목요일', short: '목' },
  { key: 'friday', label: '금요일', short: '금' },
  { key: 'saturday', label: '토요일', short: '토' },
  { key: 'sunday', label: '일요일', short: '일' }
]

const TIME_OPTIONS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00'
]

export default function ConsultantScheduleEditor({
  schedule,
  onScheduleChange,
  timezone
}: ConsultantScheduleEditorProps) {
  const [selectedDay, setSelectedDay] = useState<keyof WeeklySchedule>('monday')

  // schedule이 undefined인 경우 기본값 사용
  const safeSchedule = schedule || {
    monday: { isWorking: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
    tuesday: { isWorking: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
    wednesday: { isWorking: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
    thursday: { isWorking: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
    friday: { isWorking: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
    saturday: { isWorking: false, timeSlots: [] },
    sunday: { isWorking: false, timeSlots: [] }
  }

  // 요일별 근무 여부 토글
  const toggleWorkingDay = (day: keyof WeeklySchedule) => {
    const newSchedule = { ...safeSchedule }
    newSchedule[day].isWorking = !newSchedule[day].isWorking
    
    if (!newSchedule[day].isWorking) {
      newSchedule[day].timeSlots = []
    } else {
      newSchedule[day].timeSlots = [{ start: '09:00', end: '18:00' }]
    }
    
    onScheduleChange(newSchedule)
  }

  // 시간 슬롯 추가
  const addTimeSlot = (day: keyof WeeklySchedule) => {
    const newSchedule = { ...safeSchedule }
    newSchedule[day].timeSlots.push({ start: '09:00', end: '10:00' })
    onScheduleChange(newSchedule)
  }

  // 시간 슬롯 삭제
  const removeTimeSlot = (day: keyof WeeklySchedule, index: number) => {
    const newSchedule = { ...safeSchedule }
    newSchedule[day].timeSlots.splice(index, 1)
    onScheduleChange(newSchedule)
  }

  // 시간 슬롯 변경
  const updateTimeSlot = (day: keyof WeeklySchedule, index: number, field: 'start' | 'end', value: string) => {
    const newSchedule = { ...safeSchedule }
    newSchedule[day].timeSlots[index][field] = value
    onScheduleChange(newSchedule)
  }

  // 전체 일정 복사
  const copyScheduleToAll = (sourceDay: keyof WeeklySchedule) => {
    const newSchedule = { ...safeSchedule }
    const sourceSchedule = safeSchedule[sourceDay]
    
    Object.keys(newSchedule).forEach((day) => {
      if (day !== sourceDay) {
        newSchedule[day as keyof WeeklySchedule] = {
          isWorking: sourceSchedule.isWorking,
          timeSlots: sourceSchedule.timeSlots.map(slot => ({ ...slot }))
        }
      }
    })
    
    onScheduleChange(newSchedule)
  }

  // 주말 설정
  const setWeekendSchedule = (isWorking: boolean) => {
    const newSchedule = { ...safeSchedule }
    newSchedule.saturday.isWorking = isWorking
    newSchedule.sunday.isWorking = isWorking
    
    if (isWorking) {
      newSchedule.saturday.timeSlots = [{ start: '10:00', end: '17:00' }]
      newSchedule.sunday.timeSlots = [{ start: '10:00', end: '17:00' }]
    } else {
      newSchedule.saturday.timeSlots = []
      newSchedule.sunday.timeSlots = []
    }
    
    onScheduleChange(newSchedule)
  }

  // 평일 설정
  const setWeekdaySchedule = (isWorking: boolean) => {
    const newSchedule = { ...safeSchedule }
    const weekdays: (keyof WeeklySchedule)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    
    weekdays.forEach(day => {
      newSchedule[day].isWorking = isWorking
      if (isWorking) {
        newSchedule[day].timeSlots = [{ start: '09:00', end: '18:00' }]
      } else {
        newSchedule[day].timeSlots = []
      }
    })
    
    onScheduleChange(newSchedule)
  }

  return (
    <div className="space-y-6">
      {/* 시간대 표시 */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Clock className="w-4 h-4" />
        <span>현재 시간대: {timezone}</span>
      </div>

      {/* 빠른 설정 버튼들 */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekdaySchedule(true)}
        >
          평일 09:00-18:00 설정
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekdaySchedule(false)}
        >
          평일 휴무 설정
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekendSchedule(true)}
        >
          주말 10:00-17:00 설정
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekendSchedule(false)}
        >
          주말 휴무 설정
        </Button>
      </div>

      {/* 요일별 탭 */}
      <div className="flex space-x-1 border-b">
        {DAYS.map((day) => (
          <button
            key={day.key}
            onClick={() => setSelectedDay(day.key as keyof WeeklySchedule)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              selectedDay === day.key
                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {day.short}
          </button>
        ))}
      </div>

      {/* 선택된 요일의 상세 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>{DAYS.find(d => d.key === selectedDay)?.label} 일정</span>
          </CardTitle>
          <CardDescription>
            {safeSchedule[selectedDay].isWorking ? '근무일' : '휴무일'} - 
            {safeSchedule[selectedDay].timeSlots.length}개 시간 슬롯
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 근무 여부 토글 */}
          <div className="flex items-center space-x-4">
            <Label className="text-sm font-medium">근무 여부</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`working-${selectedDay}`}
                checked={safeSchedule[selectedDay].isWorking}
                onChange={() => toggleWorkingDay(selectedDay)}
                className="w-4 h-4"
              />
              <Label htmlFor={`working-${selectedDay}`}>
                {safeSchedule[selectedDay].isWorking ? '근무일' : '휴무일'}
              </Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyScheduleToAll(selectedDay)}
            >
              다른 요일에 복사
            </Button>
          </div>

          {/* 시간 슬롯들 */}
          {safeSchedule[selectedDay].isWorking && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">예약 가능 시간</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTimeSlot(selectedDay)}
                  className="flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>시간 추가</span>
                </Button>
              </div>

              {safeSchedule[selectedDay].timeSlots.map((slot, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">시작:</Label>
                    <Select
                      value={slot.start}
                      onValueChange={(value) => updateTimeSlot(selectedDay, index, 'start', value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">종료:</Label>
                    <Select
                      value={slot.end}
                      onValueChange={(value) => updateTimeSlot(selectedDay, index, 'end', value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Badge variant="secondary">
                    {slot.start} - {slot.end}
                  </Badge>

                  {safeSchedule[selectedDay].timeSlots.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTimeSlot(selectedDay, index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 휴무일 메시지 */}
          {!safeSchedule[selectedDay].isWorking && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>이 요일은 휴무일입니다.</p>
              <p className="text-sm">예약을 받지 않습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 전체 일정 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>주간 일정 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day) => (
              <div key={day.key} className="text-center">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  {day.short}
                </div>
                <div className="text-xs">
                  {safeSchedule[day.key as keyof WeeklySchedule].isWorking ? (
                    <div className="space-y-1">
                      {safeSchedule[day.key as keyof WeeklySchedule].timeSlots.map((slot: TimeSlot, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {slot.start}-{slot.end}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-xs">휴무</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
