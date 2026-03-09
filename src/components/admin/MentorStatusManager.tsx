'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
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
  const { language } = useLanguage()
  const { token } = useAuth()
  const t = (ko: string, es: string) => language === 'ko' ? ko : es
  const [mentors, setMentors] = useState<MentorStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  // 멘토 상태 목록 조회
  const fetchMentorStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/mentors/status', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()

      if (data.success) {
        setMentors(data.mentors || [])
      } else {
        toast.error(t('멘토 상태를 불러오는데 실패했습니다.', 'No se pudo cargar el estado de los mentores.'))
      }
    } catch (error) {
      console.error('멘토 상태 조회 실패:', error)
      toast.error(t('멘토 상태를 불러오는데 실패했습니다.', 'No se pudo cargar el estado de los mentores.'))
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mentorId,
          status,
          isActive
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(t('멘토 상태가 업데이트되었습니다.', 'El estado del mentor se ha actualizado.'))
        fetchMentorStatus() // 목록 새로고침
      } else {
        toast.error(data.error || t('상태 업데이트에 실패했습니다.', 'Error al cambiar el estado.'))
      }
    } catch (error) {
      console.error('멘토 상태 업데이트 실패:', error)
      toast.error(t('상태 업데이트에 실패했습니다.', 'Error al cambiar el estado.'))
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
        return t('온라인', 'En línea')
      case 'busy':
        return t('다른 상담 중', 'Ocupado')
      case 'offline':
        return t('오프라인', 'Desconectado')
      default:
        return t('알 수 없음', 'Desconocido')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">{t('멘토 상태를 불러오는 중...', 'Cargando estado de mentores...')}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('멘토 상태 관리', 'Gestión de Estado de Mentores')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('멘토들의 현재 상태를 관리하고 모니터링하세요.', 'Gestione y monitoree el estado actual de los mentores.')}</p>
        </div>
        <Button onClick={fetchMentorStatus} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('새로고침', 'Actualizar')}
        </Button>
      </div>

      {/* 상태 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('온라인', 'En línea')}</p>
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
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('다른 상담 중', 'Ocupado')}</p>
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
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <XCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('오프라인', 'Desconectado')}</p>
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
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('전체 멘토', 'Total de Mentores')}</p>
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
            {t('멘토 상태 관리', 'Gestión de Estado de Mentores')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mentors.map((mentor) => (
              <div
                key={mentor.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md dark:hover:shadow-gray-900/30 transition-shadow dark:bg-gray-800/50"
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
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {mentor.mentors?.name || t('알 수 없는 멘토', 'Mentor desconocido')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {mentor.mentors?.email || t('이메일 없음', 'Sin email')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {mentor.mentors?.is_korean ? t('한국인', 'Coreano/a') : t('현지인', 'Local')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {t('경력', 'Exp.')} {mentor.mentors?.experience_years || 0}{t('년', ' años')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {t('평점', 'Punt.')} {mentor.mentors?.rating || 0}
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
                        <SelectItem value="online">{t('온라인', 'En línea')}</SelectItem>
                        <SelectItem value="busy">{t('다른 상담 중', 'Ocupado')}</SelectItem>
                        <SelectItem value="offline">{t('오프라인', 'Desconectado')}</SelectItem>
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
                      <Label className="text-sm dark:text-gray-300">
                        {mentor.is_active ? t('활성', 'Activo') : t('비활성', 'Inactivo')}
                      </Label>
                    </div>
                  </div>

                  {/* 마지막 활동 시간 */}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(mentor.updated_at).toLocaleString(language === 'ko' ? 'ko-KR' : 'es-ES')}
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
