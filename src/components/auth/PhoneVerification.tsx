'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, MessageSquare, Smartphone, Clock, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

// 카카오톡, 토스, SMS 아이콘 컴포넌트
const KakaoIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.52 1.44 4.8 3.72 6.24L4.8 20.4c-.12.24.12.48.36.36L8.4 18.24c.48.12 1.08.24 1.68.24.24 0 .48 0 .72-.12C11.52 18.84 11.76 18.96 12 18.96s.48-.12.72-.12c.24.12.48.12.72.12.6 0 1.2-.12 1.68-.24l3.24 2.52c.24.12.48-.12.36-.36L18.28 17.04C20.56 15.6 22 13.32 22 10.8 22 6.48 17.52 3 12 3z"/>
  </svg>
)


const MessageIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
import { useLanguage } from '@/context/LanguageContext'

interface PhoneVerificationProps {
  phoneNumber: string
  nationality: string
  onVerify: (code: string) => void
  onResend: (method: string) => void
  isLoading?: boolean
}

interface AuthMethod {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  color: string
  isAvailable: boolean
}

const COOLDOWN_SECONDS = 180 // 3분

export default function PhoneVerification({ 
  phoneNumber, 
  nationality, 
  onVerify, 
  onResend, 
  isLoading = false 
}: PhoneVerificationProps) {
  const { t } = useLanguage()
  const [verificationCode, setVerificationCode] = useState('')
  
  // localStorage에서 쿨다운 복원
  const getInitialTimeLeft = () => {
    if (typeof window === 'undefined' || !phoneNumber) return COOLDOWN_SECONDS
    
    try {
      const lastSendKey = `verification_cooldown_${phoneNumber}`
      const lastSendTime = localStorage.getItem(lastSendKey)
      
      if (lastSendTime) {
        const elapsed = Math.floor((Date.now() - parseInt(lastSendTime)) / 1000)
        const remaining = Math.max(0, COOLDOWN_SECONDS - elapsed)
        return remaining
      }
    } catch (error) {
      console.error('쿨다운 복원 실패:', error)
    }
    
    return COOLDOWN_SECONDS // 기본값
  }
  
  const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft())
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [codeSent, setCodeSent] = useState(false)
  const [isWaitingForCode, setIsWaitingForCode] = useState(false)
  const [hasAutoSent, setHasAutoSent] = useState(false) // 자동 발송 여부
  const [isSending, setIsSending] = useState(false) // 인증코드 발송 중 상태 (중복 클릭 방지)
  const [isVerifying, setIsVerifying] = useState(false) // 인증 확인 중 상태 (중복 클릭 방지)

  // 국적별 인증 방식 정의
  const getAuthMethods = (nationality: string): AuthMethod[] => {
    const isKorean = nationality === 'KR'
    
    if (isKorean) {
      return [
        {
          id: 'kakao',
          name: '카카오톡 인증',
          icon: <KakaoIcon />,
          description: '카카오톡으로 간편 인증',
          color: 'bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-300 hover:to-gray-400 shadow-lg hover:shadow-lg transform hover:scale-100 transition-all duration-200 text-black font-black opacity-95',
          isAvailable: false
        },
        {
          id: 'sms',
          name: t('auth.smsAuth'),
          icon: <MessageIcon />,
          description: t('auth.smsCodeSend'),
          color: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-white',
          isAvailable: true
        }
      ]
    } else {
      return [
        {
          id: 'whatsapp',
          name: t('auth.whatsappAuth'),
          icon: <MessageSquare className="w-5 h-5" />,
          description: t('auth.whatsappCodeSend'),
          color: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-white',
          isAvailable: true
        },
        {
          id: 'sms',
          name: t('auth.smsAuth'),
          icon: <MessageIcon />,
          description: t('auth.smsCodeSend'),
          color: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-white',
          isAvailable: true
        }
      ]
    }
  }

  const authMethods = getAuthMethods(nationality)
  const isKorean = nationality === 'KR'

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  // phoneNumber가 변경되면 쿨다운 재계산
  useEffect(() => {
    if (phoneNumber) {
      const remaining = getInitialTimeLeft()
      setTimeLeft(remaining)
    }
  }, [phoneNumber])

  const handleMethodSelect = (methodId: string) => {
    // 카카오톡은 아직 사용 불가
    if (methodId === 'kakao') {
      alert(t('auth.kakaoAuthAlert'))
      return
    }
    
    // WhatsApp은 이제 사용 가능
    // if (methodId === 'whatsapp') {
    //   alert(t('auth.whatsappAuthAlert'))
    //   return
    // }
    
    setSelectedMethod(methodId)
    setCodeSent(true)
    // 자동 발송하지 않음 - 사용자가 "인증코드 보내기" 버튼을 눌러야 함
  }

  const handleSendCode = async () => {
    // 중복 클릭 방지: 이미 발송 중이면 무시
    if (isSending || isLoading) {
      console.log('🔍 [DEBUG] 이미 발송 중이므로 무시')
      return
    }
    
    // 쿨다운 체크
    if (timeLeft > 0) {
      console.log('🔍 [DEBUG] 쿨다운 중:', timeLeft)
      return
    }
    
    console.log('🔍 [DEBUG] handleSendCode 호출됨:', {
      selectedMethod,
      phoneNumber,
      nationality
    })
    
    if (selectedMethod) {
      setIsSending(true) // 발송 시작 - 버튼 비활성화
      setIsWaitingForCode(true)
      setTimeLeft(COOLDOWN_SECONDS) // 3분 타이머 시작
      
      // localStorage에 발송 시간 저장
      if (typeof window !== 'undefined' && phoneNumber) {
        try {
          const lastSendKey = `verification_cooldown_${phoneNumber}`
          localStorage.setItem(lastSendKey, Date.now().toString())
        } catch (error) {
          console.error('쿨다운 저장 실패:', error)
        }
      }
      
      // 재전송 시 입력창 리셋
      setVerificationCode('')
      
      try {
        console.log('📤 [DEBUG] onResend 호출:', selectedMethod)
        await onResend(selectedMethod)
        setHasAutoSent(true)
        console.log('✅ [DEBUG] 인증코드 발송 완료')
        
        // 최소 2초 대기 (중복 클릭 방지)
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error('❌ [DEBUG] 인증코드 발송 실패:', error)
        setIsWaitingForCode(false)
        setTimeLeft(0)
        
        // 발송 실패 시 localStorage에서 쿨다운 제거
        if (typeof window !== 'undefined' && phoneNumber) {
          try {
            const lastSendKey = `verification_cooldown_${phoneNumber}`
            localStorage.removeItem(lastSendKey)
          } catch (error) {
            console.error('쿨다운 제거 실패:', error)
          }
        }
        
        // 최소 2초 대기 (중복 클릭 방지)
        await new Promise(resolve => setTimeout(resolve, 2000))
      } finally {
        setIsSending(false) // 발송 완료 - 버튼 활성화
      }
    }
  }

  const handleVerify = async () => {
    // 중복 클릭 방지: 이미 인증 중이면 무시
    if (isVerifying || isLoading || verificationCode.length !== 6 || timeLeft === 0) {
      console.log('🔍 [DEBUG] 인증 중이거나 조건 불만족, 무시')
      return
    }
    
    if (verificationCode.length === 6) {
      setIsVerifying(true) // 인증 시작 - 버튼 비활성화
      
      try {
        await onVerify(verificationCode)
        // 인증 성공 시 최소 1초 대기 (중복 클릭 방지)
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error('❌ [DEBUG] 인증 실패:', error)
        // 인증 실패 시에도 최소 1초 대기
        await new Promise(resolve => setTimeout(resolve, 1000))
      } finally {
        setIsVerifying(false) // 인증 완료 - 버튼 활성화
      }
    }
  }

  const handleResend = async () => {
    if (selectedMethod && timeLeft === 0) {
      setTimeLeft(COOLDOWN_SECONDS) // 3분 타이머 시작
      
      // localStorage에 발송 시간 저장
      if (typeof window !== 'undefined' && phoneNumber) {
        try {
          const lastSendKey = `verification_cooldown_${phoneNumber}`
          localStorage.setItem(lastSendKey, Date.now().toString())
        } catch (error) {
          console.error('쿨다운 저장 실패:', error)
        }
      }
      
      setVerificationCode('')
      setIsWaitingForCode(true)
      await onResend(selectedMethod)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center justify-center gap-2">
          <Phone className="w-5 h-5 text-blue-600" />
          {t('phoneVerification.title')}
        </h3>
        <p className="text-gray-600 break-words">
          <strong className="text-blue-600">{phoneNumber}</strong>{t('phoneVerification.proceedWith')}
        </p>
        <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-blue-50 rounded-full">
          <div className={`w-2 h-2 rounded-full ${isKorean ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
          <span className="text-xs font-medium text-blue-700">
            {isKorean ? t('phoneVerification.koreanUser') : t('phoneVerification.overseasUser')}{t('phoneVerification.selectMethod')}
          </span>
        </div>
      </div>
      
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="text-center pb-3">
          <CardTitle className="text-lg font-bold text-gray-800">
            {codeSent ? t('phoneVerification.codeInput') : t('phoneVerification.selectMethodTitle')}
          </CardTitle>
          {!codeSent && (
            <CardDescription className="text-gray-600 text-sm">
              {isKorean 
                ? t('phoneVerification.koreanDescription')
                : t('phoneVerification.overseasDescription')
              }
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {!codeSent ? (
            // 인증 방식 선택
            <div className="grid grid-cols-1 gap-3">
              {authMethods.map((method) => (
                <div key={method.id} className="relative">
                  {/* 준비중인 서비스에 배지 표시 - 버튼 위쪽에 위치 */}
                  {method.id === 'kakao' && (
                    <div className="absolute -top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-20">
                      {t('auth.kakaoComingSoon')}
                    </div>
                  )}
                  {/* WhatsApp은 이제 활성화됨 - 배지 제거 */}
                  {/* {method.id === 'whatsapp' && (
                    <div className="absolute -top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-20">
                      {t('auth.comingSoon')}
                    </div>
                  )} */}
                  
                  <Button
                    key={method.id}
                    onClick={() => handleMethodSelect(method.id)}
                    disabled={!method.isAvailable || isLoading}
                    style={{ height: '80px', minHeight: '80px' }}
                    className={`${method.color} ${method.id === 'kakao' ? 'text-black font-black' : 'text-white font-semibold'} w-full !h-[80px] !min-h-[80px] py-2.5 px-4 flex items-center justify-start gap-3 rounded-xl border-0 relative overflow-hidden`}
                  >
                    <div className={`flex-shrink-0 p-1 rounded-lg backdrop-blur-sm ${method.id === 'kakao' ? 'bg-gray-600/30' : 'bg-white/20'}`}>
                      <div className="w-5 h-5 flex items-center justify-center">
                        {method.icon}
                      </div>
                    </div>
                    <div className="text-left flex-1 pr-8 min-w-0 overflow-hidden">
                      <div className={`font-bold text-sm leading-tight mb-0.5 truncate ${method.id === 'kakao' ? '!text-black !font-black' : ''}`}>{method.name}</div>
                      <div className={`text-xs leading-snug font-medium ${method.id === 'kakao' ? '!text-black !opacity-100' : 'opacity-90'}`} style={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        textOverflow: 'ellipsis'
                      }}>{method.description}</div>
                    </div>
                    <div className="flex-shrink-0 absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className={`w-4 h-4 ${method.id === 'kakao' ? 'text-black opacity-80' : 'text-white opacity-70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Button>
                </div>
              ))}
            </div>
          ) : !hasAutoSent ? (
            // 인증코드 보내기 버튼
            <Button 
              onClick={handleSendCode}
              disabled={isLoading || isSending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
            >
              {(isLoading || isSending) ? (
                <div className="flex items-center justify-center gap-2 truncate">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  <span className="truncate">{t('phoneVerification.sending')}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 truncate">
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{t('phoneVerification.sendCode')}</span>
                </div>
              )}
            </Button>
          ) : (
            // 인증코드 입력
            <div className="space-y-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-blue-700 font-medium text-sm">
                  <CheckCircle className="w-4 h-4" />
                  {authMethods.find(m => m.id === selectedMethod)?.name}{t('phoneVerification.codeSent')}
                </div>
              </div>
              
              <div>
                <Label htmlFor="verification-code" className="text-sm font-semibold text-gray-700">
                  {t('phoneVerification.verificationCode')}
                </Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder={t('phoneVerification.codePlaceholder')}
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => {
                    // 만료된 경우 입력 불가
                    if (timeLeft === 0) {
                      return
                    }
                    const value = e.target.value.replace(/\D/g, '')
                    setVerificationCode(value)
                    // 6자리 입력 시 대기 상태 해제
                    if (value.length === 6) {
                      setIsWaitingForCode(false)
                    }
                  }}
                  disabled={timeLeft === 0}
                  className={`text-center text-xl font-bold tracking-widest border-2 py-3 h-12 ${
                    timeLeft === 0 
                      ? 'border-red-300 bg-gray-100 cursor-not-allowed opacity-60' 
                      : 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                  autoComplete="one-time-code"
                />
                {timeLeft === 0 && (
                  <div className="mt-1 text-center">
                    <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                      <AlertCircle className="w-3 h-3" />
                      {t('phoneVerification.codeExpired')} - {t('phoneVerification.resendCode')}
                    </span>
                  </div>
                )}
                {verificationCode.length === 6 && timeLeft > 0 && (
                  <div className="mt-1 text-center">
                    <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      {t('phoneVerification.codeComplete')}
                    </span>
                  </div>
                )}
              </div>
              
              {/* 타이머 */}
              <div className="text-center">
                <div className={`flex items-center justify-center gap-2 text-sm font-medium px-3 py-2 rounded-lg ${
                  timeLeft > 60 ? 'bg-green-50 text-green-700' : 
                  timeLeft > 30 ? 'bg-yellow-50 text-yellow-700' : 
                  timeLeft > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span>
                    {timeLeft > 0 ? `${t('phoneVerification.timeLeft')} ${formatTime(timeLeft)}` : t('phoneVerification.codeExpired')}
                  </span>
                </div>
              </div>
              
              {/* 스팸함 확인 안내 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="text-yellow-600 mt-0.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-yellow-800 leading-relaxed">
                      {isKorean ? (
                        <>
                          📱 <strong>메시지가 도착하지 않았나요?</strong><br/>
                          스팸 메시지함 또는 차단된 메시지를 확인해주세요.<br/>
                          발신번호: <span className="font-mono">+1 747-349-1465</span>
                        </>
                      ) : (
                        <>
                          📱 <strong>¿No recibiste el código?</strong><br/>
                          Revisa tu carpeta de <strong>SPAM</strong> o mensajes bloqueados.<br/>
                          Número remitente: <span className="font-mono">+1 747-349-1465</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 메인 버튼 - 상태별로 다르게 표시 */}
              {isWaitingForCode ? (
                // 2단계: 코드 입력 대기 (회색 비활성화)
                <Button 
                  disabled={true}
                  className="w-full bg-gray-400 text-white font-semibold py-2.5 text-base overflow-hidden"
                >
                  <div className="flex items-center justify-center gap-2 truncate">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{t('phoneVerification.enterCode')}</span>
                  </div>
                </Button>
              ) : (
                // 3단계: 인증하기 버튼 (6자리 입력 후 활성화, 만료 시 비활성화)
                <Button 
                  onClick={handleVerify}
                  disabled={verificationCode.length !== 6 || isLoading || isVerifying || timeLeft === 0}
                  className={`w-full font-semibold py-2.5 text-base shadow-lg transition-all duration-200 overflow-hidden ${
                    timeLeft === 0 || isVerifying
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl transform hover:scale-105'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                >
                  {(isLoading || isVerifying) ? (
                    <div className="flex items-center justify-center gap-2 truncate">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                      <span className="truncate">{t('phoneVerification.verifying')}</span>
                    </div>
                  ) : timeLeft === 0 ? (
                    <div className="flex items-center justify-center gap-2 truncate">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{t('phoneVerification.codeExpired')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 truncate">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{t('auth.verifyButton')}</span>
                    </div>
                  )}
                </Button>
              )}
              
              {/* 재발송 버튼 */}
              <div className="text-center border-t pt-3">
                <p className="text-xs text-gray-600 mb-2">
                  {t('phoneVerification.didntReceive')}
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleResend}
                  disabled={isLoading || timeLeft > 0}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden break-words whitespace-normal"
                >
                  <div className="flex items-center justify-center gap-1 break-words">
                    <RefreshCw className="w-3 h-3 flex-shrink-0" />
                    <span className="break-words text-center">
                      {timeLeft > 0 
                        ? `${t('phoneVerification.timeLeft')} ${formatTime(timeLeft)}`
                        : t('phoneVerification.resendCode')
                      }
                    </span>
                  </div>
                </Button>
              </div>
              
              {/* 인증 방식 변경 */}
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setCodeSent(false)
                    setSelectedMethod('')
                    setVerificationCode('')
                  }}
                  className="text-gray-500 hover:text-gray-700 break-words whitespace-normal"
                >
                  <span className="break-words">{t('phoneVerification.changeMethod')}</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 인증 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">{t('phoneVerification.guide')}</h4>
            <p className="text-sm text-blue-700">
              {isKorean ? (
                <>
                  {t('phoneVerification.kakaoGuide')}<br/>
                  {t('phoneVerification.smsGuide')}<br/>
                  {t('phoneVerification.completeGuide')}
                </>
              ) : (
                <>
                  {t('phoneVerification.whatsappGuide')}<br/>
                  {t('phoneVerification.smsGuide')}<br/>
                  {t('phoneVerification.completeGuide')}
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
