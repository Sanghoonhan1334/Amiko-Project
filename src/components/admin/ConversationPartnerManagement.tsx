'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Edit, Check, X } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

export default function ConversationPartnerManagement() {
  const { language } = useLanguage()
  const { token } = useAuth()
  const t = (ko: string, es: string) => language === 'ko' ? ko : es

  const [partners, setPartners] = useState<any[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    language_level: '',
    country: '',
    status: 'online',
    interests: '',
    bio: '',
    avatar_url: '',
    meet_url: '' // Google Meet 링크
  })

  // 파트너 목록 조회
  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/admin/conversation-partners', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setPartners(data.partners || [])
      }
    } catch (error) {
      console.error('Partner fetch failed:', error)
    }
  }

  useEffect(() => {
    fetchPartners()
  }, [])

  // 파트너 추가
  const handleAdd = async () => {
    try {
      const interests = formData.interests.split(',').map(i => i.trim()).filter(Boolean)
      
      const response = await fetch('/api/admin/conversation-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          interests
        })
      })

      if (response.ok) {
        await fetchPartners()
        resetForm()
      }
    } catch (error) {
      console.error('Partner add failed:', error)
      alert(t('파트너 저장에 실패했습니다.', 'Error al guardar el compañero'))
    }
  }

  // 파트너 삭제
  const handleDelete = async (id: string) => {
    if (!confirm(t('정말로 이 파트너를 삭제하시겠습니까?', '¿Está seguro de eliminar este compañero?'))) return

    try {
      const response = await fetch(`/api/admin/conversation-partners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        await fetchPartners()
      }
    } catch (error) {
      console.error('Partner delete failed:', error)
      alert(t('파트너 삭제에 실패했습니다.', 'Error al eliminar el compañero'))
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      language_level: '',
      country: '',
      status: 'online',
      interests: '',
      bio: '',
      avatar_url: '',
      meet_url: ''
    })
    setIsAdding(false)
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold dark:text-white">{t('대화 파트너 관리', 'Gestión de Compañeros de Conversación')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('대화 파트너를 추가하고 관리합니다', 'Agregue y gestione compañeros de conversación')}</p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('새 파트너 추가', 'Agregar Nuevo Compañero')}
        </Button>
      </div>

      {/* 추가/수정 폼 */}
      {(isAdding || editingId) && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">{editingId ? t('파트너 수정', 'Editar Compañero') : t('새 파트너 추가', 'Agregar Nuevo Compañero')}</CardTitle>
            <CardDescription className="dark:text-gray-400">{t('화상 채팅 파트너 정보를 입력하세요.', 'Ingrese la información del compañero de conversación.')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-gray-300">{t('이름', 'Nombre')}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('김민수', 'Nombre del compañero')}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <Label className="dark:text-gray-300">{t('국가', 'País')}</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder={t('대한민국', 'País')}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-gray-300">{t('언어', 'Idioma')} / {t('레벨', 'Nivel')}</Label>
                <Select
                  value={formData.language_level}
                  onValueChange={(value) => setFormData({ ...formData, language_level: value })}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder={t('선택하세요', 'Seleccionar')} />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                    <SelectItem value="초급">{t('초급', 'Principiante')}</SelectItem>
                    <SelectItem value="중급">{t('중급', 'Intermedio')}</SelectItem>
                    <SelectItem value="고급">{t('고급', 'Avanzado')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="dark:text-gray-300">{t('상태', 'Estado')}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                    <SelectItem value="online">{t('온라인', 'En línea')}</SelectItem>
                    <SelectItem value="offline">{t('오프라인', 'Desconectado')}</SelectItem>
                    <SelectItem value="busy">{t('바쁨', 'Ocupado')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="dark:text-gray-300">{t('관심사 (쉼표로 구분)', 'Intereses (separados por coma)')}</Label>
              <Input
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                placeholder={t('영화, 음악, 여행', 'Películas, Música, Viajes')}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <Label className="dark:text-gray-300">{t('소개', 'Introducción')}</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder={t('안녕하세요! 한국어를 가르치고 싶은 김민수입니다...', 'Hola, me gustaría enseñar coreano...')}
                rows={3}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <Label className="dark:text-gray-300">{t('프로필 이미지 URL (선택사항)', 'URL de imagen de perfil (opcional)')}</Label>
              <Input
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                placeholder="/quizzes/mbti-with-kpop-stars/celebs/jin.webp"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <Label className="dark:text-gray-300">{t('Google Meet 링크 (선택사항, MVP 테스트용)', 'Enlace de Google Meet (opcional, para pruebas MVP)')}</Label>
              <Input
                value={formData.meet_url}
                onChange={(e) => setFormData({ ...formData, meet_url: e.target.value })}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <X className="w-4 h-4 mr-2" />
                {t('취소', 'Cancelar')}
              </Button>
              <Button onClick={handleAdd}>
                <Check className="w-4 h-4 mr-2" />
                {t('저장', 'Guardar')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 파트너 목록 */}
      <div className="space-y-3">
        {partners.map((partner) => (
          <Card key={partner.id} className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {partner.avatar_url ? (
                    <img
                      src={partner.avatar_url}
                      alt={partner.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                      {partner.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold dark:text-white">{partner.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {partner.country} · {partner.language_level}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{partner.bio}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    partner.status === 'online' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    partner.status === 'offline' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}>
                    {partner.status === 'online' ? t('온라인', 'En línea') :
                     partner.status === 'offline' ? t('오프라인', 'Desconectado') : t('바쁨', 'Ocupado')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(partner.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

