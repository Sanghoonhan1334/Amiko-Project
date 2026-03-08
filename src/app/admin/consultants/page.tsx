'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ConsultantScheduleEditor from '@/components/admin/ConsultantScheduleEditor'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

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
  const { language } = useLanguage()
  const { token } = useAuth()
  const t = (ko: string, es: string) => language === 'ko' ? ko : es

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
      const response = await fetch('/api/admin/consultants', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) {
        throw new Error(t('상담사 목록을 불러올 수 없습니다.', 'No se pudo cargar la lista de consultores.'))
      }
      const data = await response.json()
      setConsultants(data.consultants || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('알 수 없는 오류가 발생했습니다.', 'Ocurrió un error desconocido.'))
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error(t('상담사 저장에 실패했습니다.', 'Error al guardar el consultor.'))
      }

      setIsDialogOpen(false)
      resetForm()
      fetchConsultants()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('알 수 없는 오류가 발생했습니다.', 'Ocurrió un error desconocido.'))
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
    if (!confirm(t('정말로 이 상담사를 삭제하시겠습니까?', '¿Está seguro de eliminar este consultor?'))) return
    
    try {
      const response = await fetch(`/api/admin/consultants/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error(t('상담사 삭제에 실패했습니다.', 'Error al eliminar el consultor.'))
      }

      fetchConsultants()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('알 수 없는 오류가 발생했습니다.', 'Ocurrió un error desconocido.'))
    }
  }

  // 상담사 상태 토글
  const handleToggleStatus = async (consultant: Consultant) => {
    try {
      const response = await fetch(`/api/admin/consultants/${consultant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...consultant,
          is_active: !consultant.is_active
        })
      })

      if (!response.ok) {
        throw new Error(t('상담사 상태 변경에 실패했습니다.', 'Error al cambiar el estado del consultor.'))
      }

      fetchConsultants()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('알 수 없는 오류가 발생했습니다.', 'Ocurrió un error desconocido.'))
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
      return t('일정 미설정', 'Sin horario')
    }
    
    const workingDays = Object.values(schedule).filter(day => day?.isWorking).length
    const totalSlots = Object.values(schedule).reduce((sum, day) => {
      if (day && day.timeSlots && Array.isArray(day.timeSlots)) {
        return sum + day.timeSlots.length
      }
      return sum
    }, 0)
    
    if (workingDays === 0) return t('휴무', 'Descanso')
    if (workingDays === 7) return t('매일 근무', 'Trabajo diario')
    if (workingDays === 5 && !schedule.saturday?.isWorking && !schedule.sunday?.isWorking) return t('평일 근무', 'Días hábiles')
    
    return t(`${workingDays}일 근무 (${totalSlots}개 시간)`, `${workingDays} días de trabajo (${totalSlots} horarios)`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('상담사 관리', 'Gestión de Consultores')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('상담사 정보와 예약 가능 시간을 관리할 수 있습니다.', 'Gestione la información y horarios disponibles de los consultores.')}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}>
              {t('상담사 추가', 'Agregar Consultor')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConsultant ? t('상담사 수정', 'Editar Consultor') : t('상담사 추가', 'Agregar Consultor')}
              </DialogTitle>
              <DialogDescription>
                {t('상담사의 기본 정보와 예약 가능 시간을 설정하세요.', 'Configure la información básica y horarios disponibles del consultor.')}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">{t('기본 정보', 'Información Básica')}</TabsTrigger>
                <TabsTrigger value="schedule">{t('일정 설정', 'Configuración de Horario')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">{t('이름', 'Nombre')} *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">{t('이메일', 'Email')} *</Label>
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
                      <Label htmlFor="specialty">{t('전문 분야', 'Especialidad')}</Label>
                      <Input
                        id="specialty"
                        value={formData.specialty}
                        onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                        placeholder={t('예: 웹 개발, UI/UX 디자인', 'Ej: Desarrollo web, Diseño UI/UX')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hourly_rate">{t('시간당 요금 (원)', 'Tarifa por hora (₩)')} *</Label>
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
                    <Label htmlFor="timezone">{t('시간대', 'Zona Horaria')}</Label>
                    <Select value={formData.timezone} onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Seoul">{t('한국 (UTC+9)', 'Corea (UTC+9)')}</SelectItem>
                        <SelectItem value="America/New_York">{t('미국 동부 (UTC-5)', 'EE.UU. Este (UTC-5)')}</SelectItem>
                        <SelectItem value="America/Los_Angeles">{t('미국 서부 (UTC-8)', 'EE.UU. Oeste (UTC-8)')}</SelectItem>
                        <SelectItem value="Europe/London">{t('영국 (UTC+0)', 'Reino Unido (UTC+0)')}</SelectItem>
                        <SelectItem value="Europe/Paris">{t('프랑스 (UTC+1)', 'Francia (UTC+1)')}</SelectItem>
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
                    <Label htmlFor="is_active">{t('활성 상태', 'Estado Activo')}</Label>
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
                {t('취소', 'Cancelar')}
              </Button>
              <Button onClick={handleSubmit}>
                {editingConsultant ? t('저장', 'Guardar') : t('추가', 'Agregar')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 상담사 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('상담사 목록', 'Lista de Consultores')}</CardTitle>
          <CardDescription>
            {t(`${consultants.length}명의 상담사가 등록되어 있습니다.`, `${consultants.length} consultores registrados.`)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {consultants.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('등록된 상담사가 없습니다.', 'No hay consultores registrados.')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{t('이름', 'Nombre')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{t('이메일', 'Email')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{t('전문 분야', 'Especialidad')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{t('시간당 요금', 'Tarifa/hora')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{t('시간대', 'Zona Horaria')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{t('예약 가능 시간', 'Horario Disponible')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{t('상태', 'Estado')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{t('작업', 'Acciones')}</th>
                  </tr>
                </thead>
                <tbody>
                  {consultants.map((consultant) => (
                    <tr key={consultant.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{consultant.name}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {consultant.email}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {consultant.specialty || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        ₩{consultant.hourly_rate.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {consultant.timezone}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {getScheduleSummary(consultant.available_hours || DEFAULT_SCHEDULE)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={consultant.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}>
                          {consultant.is_active ? t('활성', 'Activo') : t('비활성', 'Inactivo')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                                                         <Link href={`/admin/consultants/${consultant.id}/bookings`}>
                                 <Button variant="outline" size="sm">
                                   {t('예약 관리', 'Gestión de Reservas')}
                                 </Button>
                               </Link>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleEdit(consultant)}
                               >
                                 {t('수정', 'Editar')}
                               </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(consultant)}
                          >
                            {consultant.is_active ? t('비활성화', 'Desactivar') : t('활성화', 'Activar')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(consultant.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            {t('삭제', 'Eliminar')}
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
