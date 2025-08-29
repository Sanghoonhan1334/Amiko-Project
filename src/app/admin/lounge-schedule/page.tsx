'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar, 
  Clock, 
  Users, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Plus,
  Trash2,
  Save,
  AlertCircle
} from 'lucide-react'
import { format, addDays, isToday, isFuture } from 'date-fns'
import { ko } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'

// 운영자 권한 체크
const isOperator = async (): Promise<boolean> => {
  try {
    // Supabase에서 현재 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return false
    }

    // 운영자 권한 체크 API 호출
    const response = await fetch('/api/admin/check-operator', {
      headers: {
        'Authorization': `Bearer ${await supabase.auth.getSession().then((res: any) => res.data.session?.access_token)}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      return result.isOperator
    }

    return false
  } catch (error) {
    console.error('Operator check error:', error)
    return false
  }
}

// 일정 상태 타입
type ScheduleStatus = 'draft' | 'confirmed' | 'cancelled'

// 라운지 일정 타입
interface LoungeSchedule {
  id: string
  scheduled_date: string
  start_time: string
  duration_minutes: number
  topic: string
  description: string
  status: ScheduleStatus
  max_participants: number
  created_at: string
}

export default function LoungeSchedulePage() {
  const [schedules, setSchedules] = useState<LoungeSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<LoungeSchedule | null>(null)
  
  // 폼 상태
  const [formData, setFormData] = useState({
    scheduled_date: '',
    start_time: '20:00',
    duration_minutes: 120,
    topic: '',
    description: '',
    max_participants: 30
  })

  // 운영자 권한 체크
  useEffect(() => {
    if (!isOperator()) {
      // 운영자가 아닌 경우 리다이렉트
      window.location.href = '/'
      return
    }
    
    // 일정 데이터 로드
    loadSchedules()
  }, [])

  // 일정 데이터 로드 (목업)
  const loadSchedules = async () => {
    setIsLoading(true)
    
    // TODO: 실제 Supabase API 호출로 교체
    const mockSchedules: LoungeSchedule[] = [
      {
        id: '1',
        scheduled_date: '2025-01-25',
        start_time: '20:00',
        duration_minutes: 120,
        topic: '한국 음식 문화 이야기',
        description: '한국의 다양한 음식과 문화에 대해 이야기해요',
        status: 'confirmed',
        max_participants: 30,
        created_at: '2025-01-20T10:00:00Z'
      },
      {
        id: '2',
        scheduled_date: '2025-02-01',
        start_time: '19:00',
        duration_minutes: 120,
        topic: '한국 여행 가이드',
        description: '한국 여행 추천 코스와 팁을 공유해요',
        status: 'draft',
        max_participants: 25,
        created_at: '2025-01-21T10:00:00Z'
      }
    ]
    
    setSchedules(mockSchedules)
    setIsLoading(false)
  }

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingSchedule) {
      // 일정 수정
      await updateSchedule(editingSchedule.id, formData)
    } else {
      // 새 일정 생성
      await createSchedule(formData)
    }
    
    // 폼 초기화
    setFormData({
      scheduled_date: '',
      start_time: '20:00',
      duration_minutes: 120,
      topic: '',
      description: '',
      max_participants: 30
    })
    setShowForm(false)
    setEditingSchedule(null)
    
    // 일정 목록 새로고침
    loadSchedules()
  }

  // 새 일정 생성
  const createSchedule = async (data: any) => {
    // TODO: 실제 Supabase API 호출
    console.log('새 일정 생성:', data)
    alert('새 일정이 생성되었습니다!')
  }

  // 일정 수정
  const updateSchedule = async (id: string, data: any) => {
    // TODO: 실제 Supabase API 호출
    console.log('일정 수정:', id, data)
    alert('일정이 수정되었습니다!')
  }

  // 일정 상태 변경
  const updateScheduleStatus = async (id: string, status: ScheduleStatus) => {
    // TODO: 실제 Supabase API 호출
    console.log('일정 상태 변경:', id, status)
    alert(`일정 상태가 ${status === 'confirmed' ? '확정' : '취소'}되었습니다!`)
    loadSchedules()
  }

  // 일정 삭제
  const deleteSchedule = async (id: string) => {
    if (!confirm('정말로 이 일정을 삭제하시겠습니까?')) return
    
    // TODO: 실제 Supabase API 호출
    console.log('일정 삭제:', id)
    alert('일정이 삭제되었습니다!')
    loadSchedules()
  }

  // 일정 편집 모드 시작
  const startEditing = (schedule: LoungeSchedule) => {
    setEditingSchedule(schedule)
    setFormData({
      scheduled_date: schedule.scheduled_date,
      start_time: schedule.start_time,
      duration_minutes: schedule.duration_minutes,
      topic: schedule.topic,
      description: schedule.description,
      max_participants: schedule.max_participants
    })
    setShowForm(true)
  }

  // 폼 취소
  const cancelForm = () => {
    setShowForm(false)
    setEditingSchedule(null)
    setFormData({
      scheduled_date: '',
      start_time: '20:00',
      duration_minutes: 120,
      topic: '',
      description: '',
      max_participants: 30
    })
  }

  // 상태별 배지 색상
  const getStatusBadge = (status: ScheduleStatus) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300">초안</Badge>
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-700 border-green-300">확정</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 border-red-300">취소</Badge>
    }
  }

  // 상태별 액션 버튼
  const getActionButtons = (schedule: LoungeSchedule) => {
    switch (schedule.status) {
      case 'draft':
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => updateScheduleStatus(schedule.id, 'confirmed')}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              확정
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => startEditing(schedule)}
            >
              <Edit className="w-4 h-4 mr-1" />
              수정
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => deleteSchedule(schedule.id)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              삭제
            </Button>
          </div>
        )
      case 'confirmed':
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => startEditing(schedule)}
            >
              <Edit className="w-4 h-4 mr-1" />
              수정
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateScheduleStatus(schedule.id, 'cancelled')}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1" />
              취소
            </Button>
          </div>
        )
      case 'cancelled':
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => updateScheduleStatus(schedule.id, 'draft')}
              className="bg-gray-600 hover:bg-gray-700"
            >
              <Edit className="w-4 h-4 mr-1" />
              초안으로
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => deleteSchedule(schedule.id)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              삭제
            </Button>
          </div>
        )
    }
  }

  if (!isOperator()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">접근 권한이 없습니다</h1>
          <p className="text-gray-600">운영자만 접근할 수 있는 페이지입니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎈 ZEP 라운지 일정 관리
          </h1>
          <p className="text-lg text-gray-600">
            운영자로서 라운지 일정을 관리하고 확정할 수 있습니다
          </p>
        </div>

        {/* 새 일정 생성 버튼 */}
        <div className="text-center mb-8">
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-brand-500 to-mint-500 hover:from-brand-600 hover:to-mint-600 text-white px-8 py-3 text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <Plus className="w-5 h-5 mr-2" />
            새 일정 만들기
          </Button>
        </div>

        {/* 일정 생성/수정 폼 */}
        {showForm && (
          <Card className="mb-8 bg-white/80 backdrop-blur-sm border-2 border-brand-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {editingSchedule ? <Edit className="w-6 h-6 text-brand-600" /> : <Plus className="w-6 h-6 text-brand-600" />}
                {editingSchedule ? '일정 수정' : '새 일정 생성'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* 날짜 */}
                  <div>
                    <Label htmlFor="scheduled_date">일정 날짜</Label>
                    <Input
                      id="scheduled_date"
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* 시간 */}
                  <div>
                    <Label htmlFor="start_time">시작 시간</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>

                  {/* 지속시간 */}
                  <div>
                    <Label htmlFor="duration_minutes">지속시간 (분)</Label>
                    <Select
                      value={formData.duration_minutes.toString()}
                      onValueChange={(value) => setFormData({ ...formData, duration_minutes: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">60분 (1시간)</SelectItem>
                        <SelectItem value="90">90분 (1.5시간)</SelectItem>
                        <SelectItem value="120">120분 (2시간)</SelectItem>
                        <SelectItem value="180">180분 (3시간)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 최대 참여자 */}
                  <div>
                    <Label htmlFor="max_participants">최대 참여자 수</Label>
                    <Input
                      id="max_participants"
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                      min="10"
                      max="100"
                      required
                    />
                  </div>
                </div>

                {/* 주제 */}
                <div>
                  <Label htmlFor="topic">라운지 주제</Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="예: 한국 음식 문화 이야기"
                    required
                  />
                </div>

                {/* 설명 */}
                <div>
                  <Label htmlFor="description">상세 설명</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="라운지에서 다룰 내용을 자세히 설명해주세요"
                    rows={3}
                  />
                </div>

                {/* 버튼 */}
                <div className="flex gap-4 justify-end">
                  <Button type="button" variant="outline" onClick={cancelForm}>
                    취소
                  </Button>
                  <Button type="submit" className="bg-brand-600 hover:bg-brand-700">
                    <Save className="w-4 h-4 mr-2" />
                    {editingSchedule ? '수정하기' : '생성하기'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 일정 목록 */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
            📅 라운지 일정 목록
          </h2>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">일정을 불러오는 중...</p>
            </div>
          ) : schedules.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200/50">
              <CardContent className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">아직 일정이 없습니다</h3>
                <p className="text-gray-500">새 일정을 만들어보세요!</p>
              </CardContent>
            </Card>
          ) : (
            schedules.map((schedule) => (
              <Card key={schedule.id} className="bg-white/80 backdrop-blur-sm border-2 border-mint-200/50">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* 일정 정보 */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-gray-800">
                          {schedule.topic}
                        </h3>
                        {getStatusBadge(schedule.status)}
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-brand-500" />
                          <span>{format(new Date(schedule.scheduled_date), 'M월 d일 (E)', { locale: ko })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-mint-500" />
                          <span>{schedule.start_time} ({schedule.duration_minutes}분)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-yellow-500" />
                          <span>최대 {schedule.max_participants}명</span>
                        </div>
                      </div>
                      
                      {schedule.description && (
                        <p className="text-gray-600 text-sm">
                          {schedule.description}
                        </p>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex-shrink-0">
                      {getActionButtons(schedule)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
