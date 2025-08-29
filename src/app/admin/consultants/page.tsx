'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ConsultantScheduleEditor from '@/components/admin/ConsultantScheduleEditor'

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
  created_at: string
}

interface ConsultantForm {
  name: string
  email: string
  specialty: string
  hourly_rate: number
  timezone: string
  available_hours: WeeklySchedule
  is_active: boolean
}

// 기본 일정 템플릿
const DEFAULT_SCHEDULE: WeeklySchedule = {
  monday: { isWorking: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
  tuesday: { isWorking: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
  wednesday: { isWorking: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
  thursday: { isWorking: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
  friday: { isWorking: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
  saturday: { isWorking: false, timeSlots: [] },
  sunday: { isWorking: false, timeSlots: [] }
}

export default function AdminConsultantsPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConsultant, setEditingConsultant] = useState<Consultant | null>(null)
  const [formData, setFormData] = useState<ConsultantForm>({
    name: '',
    email: '',
    specialty: '',
    hourly_rate: 50000,
    timezone: 'Asia/Seoul',
    available_hours: DEFAULT_SCHEDULE,
    is_active: true
  })

  // 상담사 목록 조회
  useEffect(() => {
    fetchConsultants()
  }, [])

  const fetchConsultants = async () => {
    try {
      const response = await fetch('/api/admin/consultants')
      if (!response.ok) {
        throw new Error('상담사 목록을 불러올 수 없습니다.')
      }
      const data = await response.json()
      setConsultants(data.consultants || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      specialty: '',
      hourly_rate: 50000,
      timezone: 'Asia/Seoul',
      available_hours: DEFAULT_SCHEDULE,
      is_active: true
    })
    setEditingConsultant(null)
  }

  // 상담사 추가/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingConsultant 
        ? `/api/admin/consultants/${editingConsultant.id}`
        : '/api/admin/consultants'
      
      const method = editingConsultant ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('상담사 저장에 실패했습니다.')
      }

      setIsDialogOpen(false)
      resetForm()
      fetchConsultants()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // 상담사 수정 모드
  const handleEdit = (consultant: Consultant) => {
    setEditingConsultant(consultant)
    setFormData({
      name: consultant.name,
      email: consultant.email,
      specialty: consultant.specialty,
      hourly_rate: consultant.hourly_rate,
      timezone: consultant.timezone,
      available_hours: consultant.available_hours || DEFAULT_SCHEDULE,
      is_active: consultant.is_active
    })
    setIsDialogOpen(true)
  }

  // 상담사 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 상담사를 삭제하시겠습니까?')) return
    
    try {
      const response = await fetch(`/api/admin/consultants/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('상담사 삭제에 실패했습니다.')
      }

      fetchConsultants()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // 상담사 상태 토글
  const handleToggleStatus = async (consultant: Consultant) => {
    try {
      const response = await fetch(`/api/admin/consultants/${consultant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...consultant,
          is_active: !consultant.is_active
        })
      })

      if (!response.ok) {
        throw new Error('상담사 상태 변경에 실패했습니다.')
      }

      fetchConsultants()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // 일정 변경 처리
  const handleScheduleChange = (newSchedule: WeeklySchedule) => {
    setFormData(prev => ({
      ...prev,
      available_hours: newSchedule
    }))
  }

  // 일정 요약 표시
  const getScheduleSummary = (schedule: WeeklySchedule | undefined) => {
    // schedule이 undefined인 경우 기본값 반환
    if (!schedule) {
      return '일정 미설정'
    }
    
    const workingDays = Object.values(schedule).filter(day => day?.isWorking).length
    const totalSlots = Object.values(schedule).reduce((sum, day) => {
      if (day && day.timeSlots && Array.isArray(day.timeSlots)) {
        return sum + day.timeSlots.length
      }
      return sum
    }, 0)
    
    if (workingDays === 0) return '휴무'
    if (workingDays === 7) return '매일 근무'
    if (workingDays === 5 && !schedule.saturday?.isWorking && !schedule.sunday?.isWorking) return '평일 근무'
    
    return `${workingDays}일 근무 (${totalSlots}개 시간)`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">상담사 관리</h1>
          <p className="text-gray-600">상담사 정보와 예약 가능 시간을 관리할 수 있습니다.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}>
              상담사 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConsultant ? '상담사 수정' : '상담사 추가'}
              </DialogTitle>
              <DialogDescription>
                상담사의 기본 정보와 예약 가능 시간을 설정하세요.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">기본 정보</TabsTrigger>
                <TabsTrigger value="schedule">일정 설정</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">이름 *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">이메일 *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="specialty">전문 분야</Label>
                      <Input
                        id="specialty"
                        value={formData.specialty}
                        onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                        placeholder="예: 웹 개발, UI/UX 디자인"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hourly_rate">시간당 요금 (원) *</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: parseInt(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="timezone">시간대</Label>
                    <Select value={formData.timezone} onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Seoul">한국 (UTC+9)</SelectItem>
                        <SelectItem value="America/New_York">미국 동부 (UTC-5)</SelectItem>
                        <SelectItem value="America/Los_Angeles">미국 서부 (UTC-8)</SelectItem>
                        <SelectItem value="Europe/London">영국 (UTC+0)</SelectItem>
                        <SelectItem value="Europe/Paris">프랑스 (UTC+1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    />
                    <Label htmlFor="is_active">활성 상태</Label>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="schedule" className="space-y-4">
                <ConsultantScheduleEditor
                  schedule={formData.available_hours}
                  onScheduleChange={handleScheduleChange}
                  timezone={formData.timezone}
                />
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSubmit}>
                {editingConsultant ? '수정' : '추가'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 상담사 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>상담사 목록</CardTitle>
          <CardDescription>
            {consultants.length}명의 상담사가 등록되어 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {consultants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 상담사가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">이름</th>
                    <th className="text-left py-3 px-4 font-medium">이메일</th>
                    <th className="text-left py-3 px-4 font-medium">전문 분야</th>
                    <th className="text-left py-3 px-4 font-medium">시간당 요금</th>
                    <th className="text-left py-3 px-4 font-medium">시간대</th>
                    <th className="text-left py-3 px-4 font-medium">예약 가능 시간</th>
                    <th className="text-left py-3 px-4 font-medium">상태</th>
                    <th className="text-left py-3 px-4 font-medium">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {consultants.map((consultant) => (
                    <tr key={consultant.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{consultant.name}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {consultant.email}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {consultant.specialty || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        ₩{consultant.hourly_rate.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {consultant.timezone}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {getScheduleSummary(consultant.available_hours || DEFAULT_SCHEDULE)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={consultant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {consultant.is_active ? '활성' : '비활성'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                                                         <Link href={`/admin/consultants/${consultant.id}/bookings`}>
                                 <Button variant="outline" size="sm">
                                   예약 관리
                                 </Button>
                               </Link>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleEdit(consultant)}
                               >
                                 수정
                               </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(consultant)}
                          >
                            {consultant.is_active ? '비활성화' : '활성화'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(consultant.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            삭제
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
