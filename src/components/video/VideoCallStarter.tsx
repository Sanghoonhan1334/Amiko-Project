'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Video, 
  Phone, 
  Users,
  Settings,
  Clock,
  User
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { checkAuthAndRedirect } from '@/lib/auth-utils'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import TranslatedInterests from '@/components/common/TranslatedInterests'
import UserProfileModal from '@/components/common/UserProfileModal'
import KoreanPartnerDashboard from './KoreanPartnerDashboard'

// Agora 관련 컴포넌트를 동적 임포트로 처리 (SSR 방지)
const VideoCall = dynamic(() => import('./VideoCall'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400 mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">AI 화상 채팅 로딩 중...</p>
    </div>
  )
})

interface VideoCallStarterProps {
  onStartCall?: (channelName: string) => void
}

export default function VideoCallStarter({ onStartCall }: VideoCallStarterProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user, token: authToken, refreshSession } = useAuth()
  const [isCallActive, setIsCallActive] = useState(false)
  const [channelName, setChannelName] = useState('')
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'verified' | 'unverified'>('loading')
  const [allPartners, setAllPartners] = useState<any[]>([])
  const [isKoreanPartner, setIsKoreanPartner] = useState(false)
  const [bookings, setBookings] = useState<any[]>([])
  const [mySchedules, setMySchedules] = useState<any[]>([])
  const [showAddSchedule, setShowAddSchedule] = useState(false)
  
  // 헤더와 동일한 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!user?.id) {
        setVerificationStatus('unverified')
        return
      }
      
      // 이미 확인 중이면 중복 호출 방지
      if (verificationStatus === 'loading') {
        return
      }
      
      try {
        setVerificationStatus('loading')
        const response = await fetch(`/api/auth/status?userId=${user.id}`)
        const result = await response.json()
        if (response.ok && result.success) {
          if (result.emailVerified || result.smsVerified) {
            setVerificationStatus('verified')
          } else {
            setVerificationStatus('unverified')
          }
        } else {
          setVerificationStatus('unverified')
        }
      } catch (error) {
        console.error('인증 상태 확인 오류:', error)
        setVerificationStatus('unverified')
      }
    }
    
    // user.id가 존재할 때만 실행
    if (user?.id) {
      checkAuthStatus()
    }
  }, [user?.id]) // verificationStatus는 의존성에서 제거



  const handleStartCall = () => {
    if (!channelName.trim()) {
      alert(t('videoCall.enterChannelName'))
      return
    }

    // 인증 체크 - 화상채팅 참여는 인증이 필요
    if (!checkAuthAndRedirect(user, router, '화상채팅 참여')) {
      return
    }
    
    setIsCallActive(true)
    setShowStartDialog(false)
    onStartCall?.(channelName)
  }

  const handleEndCall = () => {
    setIsCallActive(false)
    setChannelName('')
  }

  // 파트너의 언어 수준 표시 함수
  const getLanguageDisplay = (partner: any) => {
    if (partner.country === '대한민국') {
      // 한국인은 스페인어 수준 표시
      const level = partner.language.replace('스페인어 ', '')
      let levelKey = 'beginner'
      if (level === '중급') levelKey = 'intermediate'
      else if (level === '고급') levelKey = 'advanced'
      return `${t('videoCall.spanishLevel')} ${t(`videoCall.${levelKey}`)}`
    } else {
      // 외국인은 한국어 수준 표시
      const level = partner.language.replace('한국어 ', '')
      let levelKey = 'beginner'
      if (level === '중급') levelKey = 'intermediate'
      else if (level === '고급') levelKey = 'advanced'
      return `${t('videoCall.koreanLevel')} ${t(`videoCall.${levelKey}`)}`
    }
  }

  // 관심사 번역 함수 - 동적 번역 지원
  const translateInterests = (interests: string[]) => {
    return interests.map(interest => {
      try {
        // 1. videoCall.interests.{interest} 형태로 번역 시도
        const translated = t(`videoCall.interests.${interest}`)
        
        // 2. 번역이 키와 다르면 번역된 값 반환
        if (translated !== `videoCall.interests.${interest}`) {
          return translated
        }
        
        // 3. 번역 키가 없으면 원본 반환
        return interest
      } catch {
        // 4. 번역 실패 시 원본 반환
        return interest
      }
    })
  }


  // 내가 한국인 파트너인지 확인
  useEffect(() => {
    const checkIfPartner = async () => {
      if (!user?.id) {
        console.log('[checkIfPartner] 사용자 ID 없음')
        setIsKoreanPartner(false)
        return
      }

      console.log('[checkIfPartner] 파트너 확인 시작:', user.id)
      try {
        const response = await fetch(`/api/conversation-partners/check?userId=${user.id}`)
        console.log('[checkIfPartner] API 응답:', response.status, response.statusText)
        
        if (response.ok) {
          const data = await response.json()
          console.log('[checkIfPartner] API 데이터:', data)
          const isPartner = data.isPartner || data.isRegistered || false
          console.log('[checkIfPartner] 파트너 여부:', isPartner)
          setIsKoreanPartner(isPartner)
          
          // 파트너가 확실한 경우에만 예약 목록과 스케줄 가져오기
          if (isPartner && user?.id) {
            console.log('[checkIfPartner] 파트너 확인됨, 상태 업데이트 후 스케줄 조회 예정')
            // 상태는 useEffect에서 자동으로 반응하여 스케줄을 가져올 것입니다
          } else {
            console.log('[checkIfPartner] 파트너가 아님 또는 사용자 ID 없음')
          }
        } else {
          const errorText = await response.text().catch(() => '')
          console.error('[checkIfPartner] API 실패:', response.status, errorText)
          setIsKoreanPartner(false)
        }
      } catch (error) {
        console.error('[checkIfPartner] 파트너 확인 실패:', error)
        setIsKoreanPartner(false)
      }
    }
    checkIfPartner()
  }, [user?.id])

  // 예약 목록 가져오기
  const fetchMyBookings = async (skipCheck = false) => {
    console.log('[fetchMyBookings] ⚠️ 함수 호출됨!', { skipCheck, userId: user?.id, isKoreanPartner })
    
    if (!skipCheck && (!user?.id || !isKoreanPartner)) {
      console.log('[fetchMyBookings] ⚠️ 스킵 (skipCheck=false이고 조건 불만족)')
      setBookings([])
      return
    }
    if (!user?.id) {
      console.log('[fetchMyBookings] ⚠️ 스킵 (userId 없음)')
      setBookings([])
      return
    }

    console.log('[fetchMyBookings] ⚠️ API 호출 시작...')
    try {
      // 쿠키 기반 인증 사용 (credentials: 'include'로 쿠키 전송)
      console.log('[fetchMyBookings] ⚠️ fetch 요청 전송 중...')
      let response = await fetch('/api/bookings/my-bookings', {
        method: 'GET',
        credentials: 'include', // 쿠키 포함
        headers: {
          'Content-Type': 'application/json'
        }
      }).catch((error) => {
        console.error('[fetchMyBookings] ⚠️ fetch 실패:', error)
        return null
      })
      
      console.log('[fetchMyBookings] ⚠️ fetch 응답 받음:', response?.status, response?.ok)
      
      // 401 오류 발생 시 세션 갱신 후 재시도
      if (response?.status === 401) {
        console.log('[fetchMyBookings] 401 오류 발생, 세션 갱신 시도...')
        const refreshed = await refreshSession()
        if (refreshed) {
          response = await fetch('/api/bookings/my-bookings', {
            method: 'GET',
            credentials: 'include', // 쿠키 포함
            headers: {
              'Content-Type': 'application/json'
            }
          }).catch(() => null)
        }
      }
      
      if (!response) {
        console.error('[fetchMyBookings] 네트워크 오류')
        setBookings([])
        return
      }
      
      if (response.status === 401) {
        console.error('[fetchMyBookings] 인증 실패 (401)')
        setBookings([])
        return
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[fetchMyBookings] API 오류:', response.status, errorData)
        setBookings([])
        return
      }
      
      const data = await response.json()
      const bookingsCount = data.bookings?.length || 0
      console.log('[fetchMyBookings] 조회 성공:', bookingsCount, '개')
      
      // DB에 저장된 실제 값 확인 (클라이언트 로깅) - 항상 출력
      console.log('[fetchMyBookings] 전체 응답 데이터:', JSON.stringify(data, null, 2))
      
      if (data.bookings && data.bookings.length > 0) {
        console.log('[fetchMyBookings] ⚠️ DB에서 받은 예약 데이터 (KST) - 원본값:')
        data.bookings.forEach((b: any, index: number) => {
          console.log(`[fetchMyBookings] 예약 #${index + 1}:`, {
            id: b.id,
            date: b.date,
            start_time: b.start_time,
            end_time: b.end_time,
            status: b.status,
            topic: b.topic,
            user_id: b.user_id,
            partner_id: b.partner_id
          })
        })
      } else {
        console.log('[fetchMyBookings] ⚠️ 예약 데이터가 없습니다.')
      }
      
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('[fetchMyBookings] 예외 발생:', error)
      setBookings([])
    }
  }

  // 내 가능 시간 목록 가져오기
  const fetchMySchedules = async (skipCheck = false) => {
    if (!skipCheck && (!user?.id || !isKoreanPartner)) {
      console.log('[fetchMySchedules] 스킵: 사용자 없음 또는 파트너 아님', { userId: user?.id, isKoreanPartner })
      setMySchedules([])
      return
    }
    if (!user?.id) {
      console.log('[fetchMySchedules] 스킵: 사용자 ID 없음')
      setMySchedules([])
      return
    }

    console.log('[fetchMySchedules] 시작:', user.id)

    try {
      // 인증 헤더 생성
      const getHeaders = async (): Promise<HeadersInit> => {
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        }
        
        // 토큰 가져오기 (여러 소스에서 시도)
        let token: string | null = authToken || null
        
        // AuthContext에서 토큰이 없으면 localStorage 확인
        if (!token && typeof window !== 'undefined') {
          token = localStorage.getItem('amiko_token')
        }
        
        // 여전히 토큰이 없으면 Supabase 세션에서 가져오기 시도
        if (!token && typeof window !== 'undefined') {
          try {
            const { createClient } = await import('@supabase/supabase-js')
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.access_token) {
              token = session.access_token
              localStorage.setItem('amiko_token', token)
            }
          } catch (error) {
            console.error('토큰 가져오기 실패:', error)
          }
        }
        
        if (token) {
          headers['Authorization'] = `Bearer ${encodeURIComponent(token)}`
        }
        
        return headers
      }

      let headers = await getHeaders()
      let response = await fetch('/api/partners/schedules', {
        headers
      }).catch(() => null)
      
      // 401 오류 발생 시 토큰 갱신 후 재시도
      if (response?.status === 401) {
        console.log('401 오류 발생, 토큰 갱신 시도...')
        const refreshed = await refreshSession()
        if (refreshed) {
          // 갱신 후 새 헤더로 재시도
          headers = await getHeaders()
          response = await fetch('/api/partners/schedules', {
            headers
          }).catch(() => null)
        }
      }
      
      if (!response) {
        console.error('스케줄 조회 실패: 네트워크 오류')
        setMySchedules([])
        return
      }
      
      if (response.status === 401) {
        console.error('스케줄 조회 실패: 인증 오류 (토큰이 없거나 만료됨)')
        setMySchedules([])
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        console.log('[fetchMySchedules] 스케줄 조회 성공:', data.schedules?.length || 0, '개')
        if (data.schedules && data.schedules.length > 0) {
          console.log('[fetchMySchedules] 조회된 스케줄 상세:', data.schedules)
        } else {
          console.warn('[fetchMySchedules] 조회된 스케줄이 없습니다. 빈 배열이 반환되었습니다.')
        }
        setMySchedules(data.schedules || [])
      } else {
        const errorText = await response.text().catch(() => '')
        console.error('[fetchMySchedules] 스케줄 조회 실패:', response.status, response.statusText, errorText)
        setMySchedules([])
      }
    } catch (error) {
      setMySchedules([])
    }
  }

  // 목업 파트너 데이터
  // 파트너 목록 가져오기
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await fetch('/api/conversation-partners')
        if (response.ok) {
          const data = await response.json()
          const partners = data.partners?.map((p: any) => ({
            id: p.id,
            name: p.name,
            language: `${p.country === '대한민국' ? '스페인어' : '한국어'} ${p.language_level}`,
            country: p.country,
            status: p.status,
            interests: p.interests || [],
            bio: p.bio,
            avatar: p.avatar_url
          })) || []
          setAllPartners(partners)
        }
      } catch (error) {
        console.error('파트너 목록 가져오기 실패:', error)
      }
    }
    
    // 파트너가 아닌 경우에만 파트너 목록 가져오기
    if (!isKoreanPartner) {
      fetchPartners()
    } else if (isKoreanPartner && user?.id) {
      // 파트너로 확인되면 예약과 스케줄 가져오기
      console.log('[useEffect isKoreanPartner] 파트너 확인됨, 스케줄 조회 시작')
      // 약간의 지연을 주어 상태 업데이트가 완전히 완료되도록 함
      setTimeout(() => {
        console.log('[useEffect isKoreanPartner] setTimeout 내부 - fetchMyBookings 호출')
        fetchMyBookings(true)  // skipCheck=true로 호출
        fetchMySchedules(true)  // skipCheck=true로 호출
      }, 200)
    }
  }, [isKoreanPartner, user?.id])

  // 필터링된 파트너 목록
  // 자기 자신은 목록에서 제외
  const availablePartners = allPartners.filter(partner => partner.id !== user?.id)  // 자기 자신 제외

  return (
    <>
      {/* AI 화상 채팅 화면 */}
      {isCallActive && (
        <VideoCall 
          channelName={channelName} 
          onEndCall={handleEndCall} 
        />
      )}

      {/* 메인 화면 */}
      {/* 한국인 파트너인 경우 대시보드 표시 */}
      {isKoreanPartner ? (
        <KoreanPartnerDashboard 
          bookings={bookings}
          mySchedules={mySchedules}
          onRefresh={fetchMyBookings}
          onScheduleRefresh={fetchMySchedules}
        />
      ) : (
      <div className="space-y-4 md:space-y-6 px-1 md:px-0">
        {/* 빠른 시작 */}
        <div className="w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-blue-100 dark:border-gray-600 p-3 md:p-6 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700" data-tutorial="quick-start">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('videoCall.quickStart')}</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('videoCall.quickStartDescription')}</p>
            </div>
            <Button 
              onClick={() => {
                // 로그인하지 않은 사용자는 로그인 페이지로 이동
                if (!user) {
                  router.push('/sign-in')
                  return
                }
                
                // 인증 체크 - 화상채팅 시작은 인증이 필요
                if (!checkAuthAndRedirect(user, router, '화상채팅 시작')) {
                  return
                }
                
                // 인증된 사용자는 화상채팅 시작 다이얼로그 표시
                setShowStartDialog(true)
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2 text-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Phone className="w-4 h-4 mr-2" />
              {t('videoCall.startCall')}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg border border-blue-100 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Video className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('videoCall.oneOnOne')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('videoCall.oneOnOneDescription').split('\n').map((line, index) => (
                  <span key={index}>
                    {line}
                    {index < t('videoCall.oneOnOneDescription').split('\n').length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg border border-blue-100 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('videoCall.languageExchange')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('videoCall.languageExchangeDescription').split('\n').map((line, index) => (
                  <span key={index}>
                    {line}
                    {index < t('videoCall.languageExchangeDescription').split('\n').length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg border border-blue-100 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('videoCall.sessionTime')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('videoCall.sessionTimeDescription').split('\n').map((line, index) => (
                  <span key={index}>
                    {line}
                    {index < t('videoCall.sessionTimeDescription').split('\n').length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>

        {/* 대화 상대 목록 */}
        <div className="w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-purple-100 dark:border-gray-600 p-3 md:p-6 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-700" data-tutorial="partner-section">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100" data-tutorial="partner-title">{t('videoCall.partners')}</h3>
            </div>
          </div>
          <div className="space-y-4">
            {availablePartners.length > 0 ? (
              availablePartners.map((partner) => (
                <div 
                  key={partner.id}
                  className="bg-white dark:bg-gray-700 border border-purple-100 dark:border-gray-600 rounded-xl hover:shadow-md transition-all duration-300"
                  data-tutorial="partner-card"
                >
                  {/* 데스크톱 레이아웃 */}
                  <div className="hidden md:flex items-center justify-between p-6 hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12 border-2 border-white shadow-md">
                          {partner.avatar ? (
                            <AvatarImage 
                              src={`${partner.avatar}?t=${Date.now()}`} 
                              alt={partner.name}
                            />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-gray-700 font-medium">
                            {partner.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          partner.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                        }`} data-tutorial="online-status" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg">{partner.name}</h4>
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">{getLanguageDisplay(partner)}</p>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <TranslatedInterests 
                            interests={partner.interests} 
                            maxDisplay={5}
                            showCount={false}
                            className="text-xs"
                          />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 italic">
                          "{partner.bio}"
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUserId(partner.id)
                          setShowProfileDialog(true)
                        }}
                        className="border-purple-200 text-purple-600 hover:bg-purple-50"
                      >
                        {t('videoCall.viewInfo')}
                      </Button>
                      <Button 
                        variant={partner.status === 'online' ? 'default' : 'outline'}
                        size="sm"
                        disabled={partner.status === 'offline'}
                        onClick={() => {
                          if (partner.status === 'online') {
                            // 로그인하지 않은 사용자는 로그인 페이지로 이동
                            if (!user) {
                              router.push('/sign-in')
                              return
                            }
                            
                            // 예약 페이지로 이동
                            router.push(`/booking/create?partnerId=${partner.id}`)
                          }
                        }}
                        className={partner.status === 'online' 
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white' 
                          : ''
                        }
                        data-tutorial="start-conversation"
                      >
                        {partner.status === 'online' ? t('videoCall.startConversation') : t('videoCall.offline')}
                      </Button>
                    </div>
                  </div>

                  {/* 모바일 레이아웃 */}
                  <div className="md:hidden p-2">
                    {/* 상단: 아바타와 기본 정보 */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10 border-2 border-white shadow-md">
                          {partner.avatar ? (
                            <AvatarImage 
                              src={`${partner.avatar}?t=${Date.now()}`} 
                              alt={partner.name}
                            />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-gray-700 font-medium text-sm">
                            {partner.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                          partner.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                        }`} data-tutorial="online-status-mobile" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-base truncate">{partner.name}</h4>
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">{getLanguageDisplay(partner)}</p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          partner.status === 'online' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {partner.status === 'online' ? t('videoCall.online') : t('videoCall.offline')}
                        </div>
                      </div>
                    </div>

                    {/* 중간: 관심사와 자기소개 */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <TranslatedInterests 
                          interests={partner.interests} 
                          maxDisplay={2}
                          showCount={true}
                          className="text-xs"
                        />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 italic line-clamp-2">
                        "{partner.bio}"
                      </p>
                    </div>

                    {/* 하단: 버튼들 */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUserId(partner.id)
                          setShowProfileDialog(true)
                        }}
                        className="flex-1 border-purple-200 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900 text-xs py-2"
                      >
                        {t('videoCall.viewInfo')}
                      </Button>
                      <Button 
                        variant={partner.status === 'online' ? 'default' : 'outline'}
                        size="sm"
                        disabled={partner.status === 'offline'}
                        onClick={() => {
                          if (partner.status === 'online') {
                            // 로그인하지 않은 사용자는 로그인 페이지로 이동
                            if (!user) {
                              router.push('/sign-in')
                              return
                            }
                            
                            // 예약 페이지로 이동 (partnerId 포함)
                            router.push(`/booking/create?partnerId=${partner.id}`)
                          }
                        }}
                        className={`flex-1 text-xs py-2 ${
                          partner.status === 'online' 
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white' 
                            : ''
                        }`}
                        data-tutorial="start-conversation-mobile"
                      >
                        {partner.status === 'online' ? t('videoCall.startChat') : t('videoCall.offline')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-3">{t('videoCall.noPartnersTitle')}</h3>
                <p className="text-gray-500 text-lg">{t('videoCall.noPartnersDescription')}</p>
              </div>
            )}
          </div>
        </div>

      </div>
      )}

      {/* 채팅 시작 다이얼로그 */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent className="max-w-md bg-gradient-to-br from-white to-blue-50 border border-blue-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Video className="w-4 h-4 text-white" />
              </div>
{t('videoCall.startCall')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">{t('videoCall.channelName')}</label>
              <Input
                placeholder="예: korea-mexico-001"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="border-2 border-blue-200 focus:border-blue-500 rounded-lg"
              />
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">
                💡 {t('videoCall.channelShareTip')}
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowStartDialog(false)}
                className="border-2 border-gray-300 hover:border-gray-400"
              >
                취소
              </Button>
              <Button 
                onClick={handleStartCall}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6"
              >
                채팅 시작
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 프로필 상세보기 - UserProfileModal 사용 */}
      <div style={{ zIndex: 99999 }}>
        <UserProfileModal
          userId={selectedUserId}
          isOpen={showProfileDialog}
          onClose={() => {
            setShowProfileDialog(false)
            setSelectedUserId(null)
          }}
        />
      </div>
    </>
  )
}
