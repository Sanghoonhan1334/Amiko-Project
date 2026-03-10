'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  ArrowRight,
  Shield,
  Clock,
  Zap,
  MessageSquare,
  Check,
  AlertCircle
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, language } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [target, setTarget] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  

  
  // URL 파라미터에서 사용자 정보 가져오기
  const userCountry = searchParams.get('country') || 'KR'
  const isKorean = userCountry === 'KR'

  // 프로덕션 환경 체크 (Vercel 배포 환경)
  const isProduction = typeof window !== 'undefined' && (
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1' &&
    !window.location.hostname.includes('localhost')
  )

  // 인증 채널 설정
  const authChannels = isKorean 
    ? [
        {
          id: 'kakao',
          name: '카카오톡',
          description: '카카오 계정으로 빠르게 인증',
          icon: '💬',
          priority: 'primary',
          color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
          placeholder: '카카오톡 계정'
        },
        {
          id: 'sms',
          name: 'SMS 인증',
          description: '휴대폰 번호로 인증번호 전송',
          icon: '📱',
          priority: 'secondary',
          color: 'bg-blue-100 text-blue-700 border-blue-300',
          placeholder: '+82-10-1234-5678'
        }
      ]
    : [
        {
          id: 'wa',
          name: 'WhatsApp',
          description: isProduction 
            ? '점검 중입니다. SMS 인증을 이용해주세요.'
            : 'WhatsApp으로 인증번호 전송',
          icon: '💚',
          priority: 'primary',
          color: isProduction 
            ? 'bg-gray-100 text-gray-500 border-gray-300 opacity-50 cursor-not-allowed'
            : 'bg-green-100 text-green-700 border-green-300',
          placeholder: '+82-10-1234-5678',
          isMaintenance: isProduction
        },
        {
          id: 'sms',
          name: 'SMS 인증',
          description: '휴대폰 번호로 인증번호 전송',
          icon: '📱',
          priority: 'secondary',
          color: 'bg-blue-100 text-blue-700 border-blue-300',
          placeholder: '+82-10-1234-5678'
        },
        {
          id: 'email',
          name: '이메일 인증',
          description: '이메일로 인증번호 전송',
          icon: '📧',
          priority: 'tertiary',
          color: 'bg-purple-100 text-purple-700 border-purple-300',
          placeholder: 'example@email.com'
        }
      ]

  // 카운트다운 타이머
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  // 인증 채널 선택
  const handleChannelSelect = (channelId: string) => {
    // WhatsApp이 점검중이면 선택 불가
    if (channelId === 'wa' && isProduction) {
      alert(language === 'ko' 
        ? 'WhatsApp 인증은 현재 점검 중입니다. SMS 인증을 이용해주세요.' 
        : 'La verificación de WhatsApp está en mantenimiento. Por favor, use la verificación por SMS.')
      return
    }
    
    setSelectedChannel(channelId)
    setTarget('')
    setIsOtpSent(false)
    setOtpCode('')
    setError('')
  }

  // OTP 전송
  const handleSendOtp = async () => {
    if (!target.trim()) {
      setError('인증 대상을 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/verify/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: selectedChannel,
          target: target.trim()
        })
      })

      const result = await response.json()
      
      if (result.ok) {
        setIsOtpSent(true)
        setCountdown(300) // 5분 카운트다운
        setError('')
      } else {
        setError(result.error || 'OTP 전송에 실패했습니다.')
      }
    } catch (error) {
      console.error('OTP 전송 오류:', error)
      setError('OTP 전송 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // OTP 검증
  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setError('인증번호를 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: selectedChannel,
          target: target.trim(),
          code: otpCode.trim()
        })
      })

      const result = await response.json()
      
      if (result.ok) {
        setIsVerified(true)
        setError('')
      } else {
        setError(result.error === 'INVALID_CODE' ? '인증번호가 올바르지 않습니다.' : '인증에 실패했습니다.')
      }
    } catch (error) {
      console.error('OTP 검증 오류:', error)
      setError('인증 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 메인으로 이동
  const handleGoToMain = () => {
    router.push('/main')
  }

  // 뒤로가기
  const handleBack = () => {
    // 로컬 스토리지에서 세션 확인
    const savedSession = localStorage.getItem('amiko_session')
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession)
        const now = Math.floor(Date.now() / 1000)
        
        if (sessionData.expires_at > now) {
          console.log('[VERIFY] 뒤로가기: 유효한 세션 발견, 메인 페이지로 이동')
          router.push('/main')
        } else {
          console.log('[VERIFY] 뒤로가기: 세션 만료됨, 로그인 페이지로 이동')
          router.push('/sign-in')
        }
      } catch (error) {
        console.error('[VERIFY] 세션 파싱 오류:', error)
        router.push('/sign-in')
      }
    } else {
      console.log('[VERIFY] 뒤로가기: 세션 없음, 로그인 페이지로 이동')
      router.push('/sign-in')
    }
  }

  // 카카오 인증 (placeholder)
  const handleKakaoAuth = () => {
    alert(t('auth.kakaoAuthNotReady'))
  }

  // 카운트다운 포맷팅
  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-2 border-brand-200/50 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-brand-500 to-mint-500 bg-clip-text text-transparent">
              AMIKO
            </div>
            <div className="text-xl animate-pulse">✨</div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            계정 인증
          </CardTitle>
          <CardDescription className="text-gray-600">
            {isKorean 
              ? '한국인 사용자님, 안전한 인증을 진행해주세요!'
              : '계정 보안을 위해 인증을 진행해주세요!'
            }
          </CardDescription>
          
          {/* 사용자 정보 표시 */}
          <div className="p-3 bg-brand-50 rounded-lg border border-brand-200">
            <div className="flex items-center gap-2 text-brand-700">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isKorean ? '한국인 사용자' : `${userCountry} 사용자`}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 인증 완료 배너 */}
          {isVerified && (
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h4 className="font-semibold text-green-800">인증 완료!</h4>
              </div>
              <p className="text-sm text-green-700 mb-4">
                이제 영상 매칭과 쿠폰 사용이 가능합니다!
              </p>
              <Button
                onClick={handleGoToMain}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                메인으로 이동
              </Button>
            </div>
          )}

          {/* 인증 채널 선택 */}
          {!isVerified && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 text-lg">
                인증 방법 선택
              </h3>
              
              {authChannels.map((channel) => {
                const isMaintenance = (channel as any).isMaintenance === true
                return (
                  <div key={channel.id}>
                    <div
                      className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                        isMaintenance
                          ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
                          : selectedChannel === channel.id
                          ? 'border-brand-400 bg-gradient-to-r from-brand-50 to-brand-100 shadow-xl shadow-brand-200/50 cursor-pointer transform hover:scale-105'
                          : 'border-gray-200 hover:border-brand-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-brand-50/50 shadow-lg hover:shadow-xl cursor-pointer transform hover:scale-105'
                      }`}
                      onClick={() => !isMaintenance && handleChannelSelect(channel.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all duration-300 ${
                          isMaintenance
                            ? 'bg-gray-200'
                            : selectedChannel === channel.id
                            ? 'bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg'
                            : 'bg-gradient-to-br from-gray-100 to-gray-200'
                        }`}>
                          {channel.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`font-bold text-lg ${isMaintenance ? 'text-gray-500' : 'text-gray-800'}`}>
                              {channel.name}
                            </span>
                            {isMaintenance && (
                              <Badge className="bg-yellow-500 text-white border-0 text-xs px-3 py-1 rounded-full shadow-md">
                                ⚠️ 점검중
                              </Badge>
                            )}
                            {!isMaintenance && channel.priority === 'primary' && (
                              <Badge className="bg-gradient-to-r from-orange-400 to-orange-500 text-white border-0 text-xs px-3 py-1 rounded-full shadow-md">
                                ✨ 추천
                              </Badge>
                            )}
                          </div>
                          <p className={`text-sm leading-relaxed ${isMaintenance ? 'text-gray-500' : 'text-gray-600'}`}>
                            {channel.description}
                          </p>
                        </div>
                        {!isMaintenance && selectedChannel === channel.id && (
                          <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    {isMaintenance && (
                      <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
                          {language === 'ko' 
                            ? '⚠️ WhatsApp 인증은 현재 점검 중입니다. SMS 인증을 이용해주세요.' 
                            : '⚠️ La verificación de WhatsApp está en mantenimiento. Por favor, use la verificación por SMS.'}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* 카카오 인증 (한국인만) */}
          {isKorean && selectedChannel === 'kakao' && !isVerified && (
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="text-center space-y-3">
                <div className="text-2xl">💬</div>
                <h4 className="font-medium text-yellow-800">카카오톡 본인 확인</h4>
                <p className="text-sm text-yellow-700">
                  카카오톡으로 빠르게 본인 확인을 진행할 수 있습니다.
                </p>
                <Button
                  onClick={handleKakaoAuth}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  카카오로 본인 확인
                </Button>
              </div>
            </div>
          )}

          {/* 인증 대상 입력 */}
          {selectedChannel && selectedChannel !== 'kakao' && !isVerified && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">인증 대상 입력</h4>
              
              <div className="space-y-2">
                <Label htmlFor="target" className="text-sm text-gray-600">
                  {selectedChannel === 'email' ? '이메일 주소' : '전화번호'}
                </Label>
                <Input
                  id="target"
                  type={selectedChannel === 'email' ? 'email' : 'tel'}
                  placeholder={authChannels.find(c => c.id === selectedChannel)?.placeholder}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="border-brand-200 focus:border-brand-500 focus:ring-brand-500"
                />
              </div>

              <Button
                onClick={handleSendOtp}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white"
                disabled={isLoading || !target.trim()}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    전송 중...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    코드 받기
                  </div>
                )}
              </Button>
            </div>
          )}

          {/* OTP 코드 입력 */}
          {isOtpSent && selectedChannel && selectedChannel !== 'kakao' && !isVerified && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">인증번호 입력</h4>
                {countdown > 0 && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <Clock className="w-4 h-4" />
                    {formatCountdown(countdown)}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otpCode" className="text-sm text-gray-600">
                  인증번호 6자리
                </Label>
                <Input
                  id="otpCode"
                  type="text"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength={6}
                  className="border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-center text-lg tracking-widest"
                />
                <p className="text-xs text-gray-500 text-center">
                  테스트용 인증번호: <span className="font-mono font-bold">123456</span>
                </p>
              </div>

              <Button
                onClick={handleVerifyOtp}
                className="w-full bg-mint-500 hover:bg-mint-600 text-white"
                disabled={isLoading || !otpCode.trim() || otpCode.length !== 6}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    인증 중...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    인증하기
                  </div>
                )}
              </Button>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* 인증 안내 */}
          {!isVerified && (
            <div className="p-4 bg-mint-50 rounded-lg border border-mint-200">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-mint-600 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-mint-800">인증 안내</h4>
                  <ul className="text-xs text-mint-700 space-y-1">
                    <li>• 선택한 채널로 인증번호가 전송됩니다</li>
                    <li>• 인증번호는 5분간 유효합니다</li>
                    <li>• 보안을 위해 인증 완료 후 로그인됩니다</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 뒤로가기 */}
          {!isVerified && (
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-800"
              >
{t('auth.back')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  )
}
