 'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Props = {
  userId: string
}

type ProfileResponse = {
  user?: {
    id: string
    email?: string
    full_name?: string
    nickname?: string
    spanish_name?: string
    korean_name?: string
    avatar_url?: string
    profile_image?: string
    join_date?: string
    introduction?: string | null
    one_line_intro?: string | null
    language?: string | null
  }
  profile?: {
    user_id: string
    display_name?: string
    bio?: string | null
    avatar_url?: string | null
    native_language?: string | null
    country?: string | null
  }
}

const REASONS = [
  { key: 'spam', ko: '스팸 / 광고', es: 'Spam o publicidad no deseada' },
  { key: 'harassment', ko: '혐오 / 괴롭힘', es: 'Acoso u ofensas' },
  { key: 'inappropriate', ko: '부적절한 콘텐츠', es: 'Contenido inapropiado' },
  { key: 'other', ko: '기타', es: 'Otro' }
]

export default function UserProfileView({ userId }: Props) {
  const router = useRouter()
  const { language, t } = useLanguage()
  const { user, token } = useAuth()
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState<string>('')
  const [reportDetails, setReportDetails] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)

  const reasonOptions = useMemo(
    () =>
      REASONS.map((reason) => ({
        key: reason.key,
        label: language === 'ko' ? reason.ko : reason.es
      })),
    [language]
  )

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`)
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || '사용자 정보를 불러올 수 없습니다.')
        }
        const data: ProfileResponse = await response.json()
        setProfileData(data)
      } catch (err) {
        console.error('[UserProfileView] load error:', err)
        setError(
          language === 'ko'
            ? '사용자 정보를 불러올 수 없습니다.'
            : 'No se pudo cargar la información del usuario.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [language, userId])

  const displayName = useMemo(() => {
    if (!profileData?.user) return ''
    const { user, profile } = profileData
    return (
      profile?.display_name ||
      user.nickname ||
      user.full_name ||
      user.spanish_name ||
      user.korean_name ||
      user.email?.split('@')[0] ||
      'Usuario'
    )
  }, [profileData])

  const avatarUrl = useMemo(() => {
    if (!profileData?.user) return null
    const { user, profile } = profileData
    return profile?.avatar_url || user.profile_image || user.avatar_url || null
  }, [profileData])

  const handleSubmitReport = async () => {
    if (!token) {
      setError(
        language === 'ko'
          ? '신고하려면 먼저 로그인하세요.'
          : 'Debes iniciar sesión para enviar una denuncia.'
      )
      return
    }
    if (!reportReason) {
      setError(language === 'ko' ? '신고 사유를 선택하세요.' : 'Selecciona un motivo de denuncia.')
      return
    }

    try {
      setReportSubmitting(true)
      setReportSuccess(false)
      setError(null)

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reportedUserId: userId,
          reportType: 'account',
          reason: reportReason,
          details: reportDetails.trim()
        })
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || result.message || '신고에 실패했습니다.')
      }

      setReportSuccess(true)
      setReportReason('')
      setReportDetails('')
      // 2초 후 모달 닫기
      setTimeout(() => {
        setShowReportModal(false)
        setReportSuccess(false)
      }, 2000)
    } catch (err) {
      console.error('[UserProfileView] report error:', err)
      setError(
        language === 'ko'
          ? '신고를 제출하는 중 문제가 발생했습니다.'
          : 'Ocurrió un problema al enviar la denuncia.'
      )
    } finally {
      setReportSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="h-10 w-10 border-2 border-b-transparent border-gray-400 rounded-full animate-spin" />
          <p>{language === 'ko' ? '사용자 정보를 불러오는 중입니다...' : 'Cargando perfil...'}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <p className="text-red-500 text-sm">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          {language === 'ko' ? '뒤로 가기' : 'Volver'}
        </Button>
      </div>
    )
  }

  if (!profileData?.user) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <p className="text-gray-500 text-sm">
          {language === 'ko' ? '사용자를 찾을 수 없습니다.' : 'No se encontró al usuario.'}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          {language === 'ko' ? '뒤로 가기' : 'Volver'}
        </Button>
      </div>
    )
  }

  const userProfile = profileData.user
  const extraInfo = profileData.profile

  return (
    <div className="max-w-3xl mx-auto px-4 pt-32 pb-10">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-3xl font-semibold text-blue-500">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
            ) : (
              displayName.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{displayName}</h1>
            {userProfile.one_line_intro && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {userProfile.one_line_intro}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
              {userProfile.join_date && (
                <span>
                  {language === 'ko'
                    ? `가입일 ${new Date(userProfile.join_date).toLocaleDateString()}`
                    : `Miembro desde ${new Date(userProfile.join_date).toLocaleDateString()}`}
                </span>
              )}
              {extraInfo?.country && <span>🌍 {extraInfo.country}</span>}
              {extraInfo?.native_language && (
                <span>
                  {language === 'ko' ? '모국어' : 'Idioma nativo'}: {extraInfo.native_language}
                </span>
              )}
            </div>
          </div>
        </div>

        {userProfile.introduction && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-base">
                {language === 'ko' ? '자기 소개' : 'Presentación personal'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                {userProfile.introduction}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 신고하기 버튼 */}
        <div className="mt-8 flex justify-end">
          {!user ? (
            <p className="text-sm text-gray-600">
              {language === 'ko'
                ? '신고 기능을 사용하려면 먼저 로그인해주세요.'
                : 'Inicia sesión para poder enviar una denuncia.'}
            </p>
          ) : (
            <Button
              onClick={() => setShowReportModal(true)}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              {language === 'ko' ? '이 사용자 신고하기' : 'Denunciar a este usuario'}
            </Button>
          )}
        </div>
      </div>

      {/* 신고 모달 */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700">
              {language === 'ko' ? '이 사용자 신고하기' : 'Denunciar a este usuario'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ko'
                ? '부적절한 행동이나 콘텐츠를 신고해주세요.'
                : 'Reporta comportamientos o contenido inapropiado.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {language === 'ko' ? '신고 사유' : 'Motivo de la denuncia'}
              </label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={language === 'ko' ? '사유를 선택하세요' : 'Selecciona un motivo'} />
                </SelectTrigger>
                <SelectContent>
                  {reasonOptions.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {language === 'ko'
                  ? '상세 설명 (선택)'
                  : 'Descripción detallada (opcional)'}
              </label>
              <Textarea
                value={reportDetails}
                onChange={(event) => setReportDetails(event.target.value)}
                rows={4}
                maxLength={500}
                className="text-sm"
                placeholder={
                  language === 'ko'
                    ? '문제가 발생한 상황이나 참고할 내용을 적어주세요.'
                    : 'Describe qué sucedió o agrega información adicional.'}
                disabled={reportSubmitting}
              />
              <p className="text-xs text-gray-400 mt-1">{reportDetails.length}/500</p>
            </div>

            {error && (
              <p className="text-xs text-red-500">
                {error}
              </p>
            )}

            {reportSuccess && (
              <p className="text-xs text-green-600">
                {language === 'ko'
                  ? '신고가 접수되었습니다. 운영자가 검토 후 조치하겠습니다.'
                  : 'Tu denuncia ha sido registrada. El equipo la revisará.'}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReportModal(false)
                  setReportReason('')
                  setReportDetails('')
                  setError(null)
                  setReportSuccess(false)
                }}
                disabled={reportSubmitting}
              >
                {language === 'ko' ? '취소' : 'Cancelar'}
              </Button>
              <Button
                onClick={handleSubmitReport}
                disabled={reportSubmitting || !reportReason}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {reportSubmitting
                  ? language === 'ko'
                    ? '전송 중...'
                    : 'Enviando...'
                  : language === 'ko'
                  ? '신고 제출'
                  : 'Enviar denuncia'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

