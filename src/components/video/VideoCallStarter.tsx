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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import TranslatedInterests from '@/components/common/TranslatedInterests'

// Agora 관련 컴포넌트를 동적 임포트로 처리 (SSR 방지)
const VideoCall = dynamic(() => import('./VideoCall'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64">AI 화상 채팅 로딩 중...</div>
})

interface VideoCallStarterProps {
  onStartCall?: (channelName: string) => void
}

export default function VideoCallStarter({ onStartCall }: VideoCallStarterProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const [isCallActive, setIsCallActive] = useState(false)
  const [channelName, setChannelName] = useState('')
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [showOnlyKoreans, setShowOnlyKoreans] = useState(true)
  const [selectedPartner, setSelectedPartner] = useState<any>(null)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'verified' | 'unverified'>('loading')
  
  // 헤더와 동일한 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!user?.id) {
        setVerificationStatus('unverified')
        return
      }
      try {
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
    checkAuthStatus()
  }, [user?.id])



  const handleStartCall = () => {
    if (!channelName.trim()) {
      alert(t('videoCall.enterChannelName'))
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


  // 목업 파트너 데이터
  const allPartners: any[] = [
    {
      id: '1',
      name: '김민수',
      language: '스페인어 중급',
      country: '대한민국',
      status: 'online',
        interests: ['영화', '음악', '여행', '요리', '댄스'],
      bio: '안녕하세요! 한국어를 가르치고 싶은 김민수입니다. 다양한 문화에 관심이 많아요!',
      avatar: '/celebs/jin.webp'
    },
    {
      id: '2',
      name: '이지은',
      language: '스페인어 초급',
      country: '대한민국',
      status: 'online',
        interests: ['K-POP', '드라마', '패션', '맛집', '애니메이션'],
      bio: 'K-POP과 한국 드라마를 좋아하는 이지은이에요. 함께 한국 문화를 나눠요!',
      avatar: '/celebs/rm.jpg'
    },
    {
      id: '3',
      name: '박준호',
      language: '스페인어 고급',
      country: '대한민국',
      status: 'offline',
        interests: ['스포츠', '게임', '기술', '독서', '사진'],
      bio: '스포츠와 게임을 좋아하는 박준호입니다. 활발한 대화를 좋아해요!',
      avatar: '/celebs/suga.jpg'
    },
    {
      id: '4',
      name: 'Carlos Rodriguez',
      language: '한국어 중급',
      country: '멕시코',
      status: 'online',
      interests: ['한국어', 'K-POP', '요리', '여행', '커피'],
      bio: '한국어를 배우고 있는 카를로스입니다. 한국 문화에 매료되었어요!',
      avatar: null
    },
    {
      id: '5',
      name: 'Ana Martinez',
      language: '한국어 초급',
      country: '스페인',
      status: 'online',
      interests: ['한국 드라마', 'K-POP', '패션', '언어교환', '뷰티'],
      bio: '한국 드라마를 사랑하는 아나입니다. 언어교환을 통해 소통하고 싶어요!',
      avatar: null
    }
  ]

  // 필터링된 파트너 목록
  const availablePartners = showOnlyKoreans 
    ? allPartners.filter(partner => partner.country === '대한민국')
    : allPartners

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
                
                // 로그인한 사용자는 인증 상태에 따라 처리
                if (verificationStatus === 'verified') {
                  setShowStartDialog(true)
                } else {
                  router.push('/verification')
                }
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
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('videoCall.onlyKoreans')}</span>
              <button
                onClick={() => setShowOnlyKoreans(!showOnlyKoreans)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showOnlyKoreans ? 'bg-purple-600' : 'bg-gray-200'
                }`}
                data-tutorial="korean-filter"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showOnlyKoreans ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
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
                            <AvatarImage src={partner.avatar} alt={partner.name} />
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
                        {!showOnlyKoreans && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                            {partner.country}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPartner(partner)
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
                            <AvatarImage src={partner.avatar} alt={partner.name} />
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
                      {!showOnlyKoreans && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                          {partner.country}
                        </p>
                      )}
                    </div>

                    {/* 하단: 버튼들 */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPartner(partner)
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

      {/* 프로필 상세보기 다이얼로그 */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-white to-purple-50 border border-purple-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${
                selectedPartner?.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
              {selectedPartner?.name} 프로필
            </DialogTitle>
          </DialogHeader>
          
          {selectedPartner && (
            <div className="space-y-6">
              {/* 프로필 사진 및 기본 정보 */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                    <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-gray-700 font-medium text-xl">
                      {selectedPartner.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-3 border-white ${
                    selectedPartner.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedPartner.name}</h3>
                  <p className="text-lg text-purple-600 font-medium">{getLanguageDisplay(selectedPartner)}</p>
                  <p className="text-sm text-gray-500">{selectedPartner.country} • {selectedPartner.age}세 • {selectedPartner.occupation}</p>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">이름</label>
                    <p className="text-gray-900 font-medium">{selectedPartner.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">국가</label>
                    <p className="text-gray-900">{selectedPartner.country}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">나이</label>
                    <p className="text-gray-900">{selectedPartner.age}세</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">직업</label>
                    <p className="text-gray-900">{selectedPartner.occupation}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">언어</label>
                    <p className="text-gray-900">{getLanguageDisplay(selectedPartner)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">레벨</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedPartner.level === '초급' ? 'bg-green-100 text-green-800' :
                      selectedPartner.level === '중급' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedPartner.level}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">평점</label>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">★</span>
                      <span className="text-gray-900 font-medium">{selectedPartner.rating}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">가입일</label>
                    <p className="text-gray-900">{selectedPartner.joinDate}</p>
                  </div>
                </div>
              </div>

              {/* 한줄소개 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">한줄소개</label>
                <div className="bg-white p-4 rounded-lg border border-purple-100">
                  <p className="text-gray-800 italic">"{selectedPartner.bio}"</p>
                </div>
              </div>

              {/* 관심사 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">관심사</label>
                <div className="flex flex-wrap gap-2">
                  {selectedPartner.interests.map((interest: string, index: number) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              {/* 통계 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">채팅 통계</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-purple-100 text-center">
                    <div className="text-2xl font-bold text-purple-600">{selectedPartner.totalCalls}</div>
                    <div className="text-sm text-gray-600">총 채팅 횟수</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-purple-100 text-center">
                    <div className="text-2xl font-bold text-purple-600">{selectedPartner.rating}</div>
                    <div className="text-sm text-gray-600">평균 평점</div>
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowProfileDialog(false)}
                  className="border-2 border-gray-300 hover:border-gray-400"
                >
                  닫기
                </Button>
                {selectedPartner.status === 'online' && (
                  <Button 
                    onClick={() => {
                      setShowProfileDialog(false)
                      setShowStartDialog(true)
                    }}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    대화 시작
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </>
  )
}
