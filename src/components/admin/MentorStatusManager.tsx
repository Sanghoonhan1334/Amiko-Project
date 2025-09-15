'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

interface Mentor {
  id: string
  name: string
  email: string
  avatar_url?: string
  is_korean: boolean
  specialties: string[]
  bio?: string
  experience_years: number
  rating: number
  total_sessions: number
  is_active: boolean
}

interface MentorStatus {
  id: string
  mentor_id: string
  status: 'online' | 'busy' | 'offline'
  is_active: boolean
  last_activity: string
  current_session_id?: string
  notes?: string
  updated_at: string
  mentors?: Mentor
}

export default function MentorStatusManager() {
  const [mentors, setMentors] = useState<MentorStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  // 멘토 상태 목록 조회
  const fetchMentorStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/mentors/status')
      const data = await response.json()

      if (data.success) {
        setMentors(data.mentors || [])
      } else {
        toast.error('멘토 상태를 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('멘토 상태 조회 실패:', error)
      toast.error('멘토 상태를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 멘토 상태 업데이트
  const updateMentorStatus = async (mentorId: string, status: string, isActive: boolean) => {
    try {
      setUpdating(mentorId)
      const response = await fetch('/api/mentors/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mentorId,
          status,
          isActive
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('멘토 상태가 업데이트되었습니다.')
        fetchMentorStatus() // 목록 새로고침
      } else {
        toast.error(data.error || '상태 업데이트에 실패했습니다.')
      }
    } catch (error) {
      console.error('멘토 상태 업데이트 실패:', error)
      toast.error('상태 업데이트에 실패했습니다.')
    } finally {
      setUpdating(null)
    }
  }

  useEffect(() => {
    fetchMentorStatus()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'busy':
        return <Clock className="w-4 h-4 text-orange-600" />
      case 'offline':
        return <XCircle className="w-4 h-4 text-gray-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'busy':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'offline':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return '온라인'
      case 'busy':
        return '다른 상담 중'
      case 'offline':
        return '오프라인'
      default:
        return '알 수 없음'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">멘토 상태를 불러오는 중...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">멘토 상태 관리</h2>
          <p className="text-gray-600">멘토들의 현재 상태를 관리하고 모니터링하세요.</p>
        </div>
        <Button onClick={fetchMentorStatus} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 상태 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">온라인</p>
                <p className="text-xl font-bold text-green-600">
                  {mentors.filter(m => m.status === 'online' && m.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">다른 상담 중</p>
                <p className="text-xl font-bold text-orange-600">
                  {mentors.filter(m => m.status === 'busy' && m.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <XCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">오프라인</p>
                <p className="text-xl font-bold text-gray-600">
                  {mentors.filter(m => m.status === 'offline' && m.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">전체 멘토</p>
                <p className="text-xl font-bold text-blue-600">
                  {mentors.filter(m => m.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 멘토 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            멘토 상태 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mentors.map((mentor) => (
              <div
                key={mentor.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  {/* 멘토 아바타 */}
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {mentor.mentors?.name?.charAt(0) || 'M'}
                    </span>
                  </div>

                  {/* 멘토 정보 */}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {mentor.mentors?.name || '알 수 없는 멘토'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {mentor.mentors?.email || '이메일 없음'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {mentor.mentors?.is_korean ? '한국인' : '현지인'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        경력 {mentor.mentors?.experience_years || 0}년
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        평점 {mentor.mentors?.rating || 0}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* 상태 관리 */}
                <div className="flex items-center gap-4">
                  {/* 현재 상태 표시 */}
                  <div className="flex items-center gap-2">
                    {getStatusIcon(mentor.status)}
                    <Badge className={getStatusColor(mentor.status)}>
                      {getStatusText(mentor.status)}
                    </Badge>
                  </div>

                  {/* 상태 변경 */}
                  <div className="flex items-center gap-2">
                    <Select
                      value={mentor.status}
                      onValueChange={(value) => 
                        updateMentorStatus(mentor.mentor_id, value, mentor.is_active)
                      }
                      disabled={updating === mentor.mentor_id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">온라인</SelectItem>
                        <SelectItem value="busy">다른 상담 중</SelectItem>
                        <SelectItem value="offline">오프라인</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* 활성화 토글 */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={mentor.is_active}
                        onCheckedChange={(checked) => 
                          updateMentorStatus(mentor.mentor_id, mentor.status, checked)
                        }
                        disabled={updating === mentor.mentor_id}
                      />
                      <Label className="text-sm">
                        {mentor.is_active ? '활성' : '비활성'}
                      </Label>
                    </div>
                  </div>

                  {/* 마지막 활동 시간 */}
                  <div className="text-xs text-gray-500">
                    {new Date(mentor.updated_at).toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
