'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { useUser } from '@/context/UserContext'
import { useLanguage } from '@/context/LanguageContext'
import { ArrowLeft, MessageSquare, Smartphone, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'

function SimpleVerificationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { user: userContext } = useUser()
  const { t } = useLanguage()
  
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCheckComplete, setAdminCheckComplete] = useState(false)
  
  const method = searchParams.get('method') // 'whatsapp' or 'sms'
  const currentUser = user || userContext

  // 운영자 체크 로직
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser?.id && !currentUser?.email) {
        setAdminCheckComplete(true)
        return
      }

      try {
        const params = new URLSearchParams()
        if (currentUser?.id) params.append('userId', currentUser.id)
        if (currentUser?.email) params.append('email', currentUser.email)
        
        const response = await fetch(`/api/admin/check?${params.toString()}`)
        
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAdmin || false)
          
          // 운영자라면 메인 페이지로 리다이렉트
          if (data.isAdmin) {
            console.log('운영자 확인됨, 메인 페이지로 리다이렉트 (simple)')
            router.push('/main?tab=me')
            return
          }
        }
      } catch (error) {
        console.error('운영자 상태 확인 실패 (simple):', error)
      } finally {
        setAdminCheckComplete(true)
      }
    }

    checkAdminStatus()
  }, [currentUser?.id, currentUser?.email, router])

  // 운영자라면 로딩 중 표시
  if (!adminCheckComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">운영자 상태 확인 중...</p>
        </div>
      </div>
    )
  }

  // 운영자가 이미 리다이렉트되었는지 확인 (추가 안전장치)
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-green-600">메인 페이지로 이동 중...</p>
        </div>
      </div>
    )
  }
  
  const [step, setStep] = useState<'method' | 'phone' | 'verify' | 'complete'>('method')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(300) // 5분

  // URL 파라미터로 method가 있으면 바로 해당 단계로
  useEffect(() => {
    if (method === 'whatsapp' || method === 'sms') {
      setStep('phone')
    }
  }, [method])

  // 타이머
  useEffect(() => {
    if (step === 'verify' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [step, timeLeft])

  const handlePhoneSubmit = async () => {
    if (!phoneNumber.trim()) {
      setError('전화번호를 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: method === 'whatsapp' ? 'whatsapp' : 'sms',
          phone: phoneNumber,
          userId: currentUser?.id
        })
      })

      const result = await response.json()

      if (response.ok) {
        setStep('verify')
        setTimeLeft(300) // 5분 타이머 시작
      } else {
        setError(result.error || '인증번호 발송에 실패했습니다.')
      }
    } catch (error) {
      console.error('인증번호 발송 오류:', error)
      setError('인증번호 발송 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationSubmit = async () => {
    if (!verificationCode.trim()) {
      setError('인증번호를 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'verify',
          phone: phoneNumber,
          code: verificationCode,
          userId: currentUser?.id
        })
      })

      const result = await response.json()

      if (response.ok) {
        setStep('complete')
      } else {
        setError(result.error || '인증에 실패했습니다.')
      }
    } catch (error) {
      console.error('인증 오류:', error)
      setError('인증 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    await handlePhoneSubmit()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>로그인이 필요합니다</CardTitle>
            <CardDescription>
              전화번호 인증을 위해 먼저 로그인해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/sign-in')}
              className="w-full"
            >
              로그인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 p-4">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">전화번호 인증</h1>
            <p className="text-gray-600">게시판 참여을 위해 전화번호 인증이 필요합니다</p>
          </div>
        </div>

        {/* 인증 방법 선택 */}
        {step === 'method' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>인증 방법을 선택하세요</CardTitle>
              <CardDescription>
                서로를 지켜주기 위해 전화번호 인증이 필요합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => {
                  router.push('/verification-simple?method=whatsapp')
                }}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-6 px-4 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0 h-auto min-h-[80px]"
              >
                <div className="flex items-center w-full">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-bold text-lg mb-1">WhatsApp으로 인증</div>
                    <div className="text-sm opacity-90 font-medium leading-relaxed">WhatsApp 메시지로 인증번호 받기</div>
                  </div>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Button>
              
              <Button 
                onClick={() => {
                  router.push('/verification-simple?method=sms')
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-6 px-4 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0 h-auto min-h-[80px]"
              >
                <div className="flex items-center w-full">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-bold text-lg mb-1">SMS로 인증</div>
                    <div className="text-sm opacity-90 font-medium leading-relaxed">문자 메시지로 인증번호 받기</div>
                  </div>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 전화번호 입력 */}
        {step === 'phone' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                {method === 'whatsapp' ? (
                  <>
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    WhatsApp 인증
                  </>
                ) : (
                  <>
                    <Smartphone className="w-5 h-5 text-blue-600" />
                    SMS 인증
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {method === 'whatsapp' 
                  ? 'WhatsApp으로 인증번호를 받을 전화번호를 입력하세요'
                  : 'SMS로 인증번호를 받을 전화번호를 입력하세요'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="예: +82 10-1234-5678"
                  className="text-center text-lg"
                />
                <p className="text-xs text-gray-500 text-center">
                  국가번호를 포함한 전체 전화번호를 입력하세요
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button 
                onClick={handlePhoneSubmit}
                disabled={loading || !phoneNumber.trim()}
                className="w-full"
              >
                {loading ? '발송 중...' : '인증번호 발송'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 인증번호 입력 */}
        {step === 'verify' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                인증번호 입력
              </CardTitle>
              <CardDescription>
                {phoneNumber}로 발송된 인증번호를 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">인증번호</Label>
                <Input
                  id="code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="6자리 인증번호"
                  className="text-center text-2xl font-bold tracking-widest"
                  maxLength={6}
                />
                
                {/* 타이머 */}
                <div className="text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    timeLeft > 60 ? 'bg-green-100 text-green-800' :
                    timeLeft > 30 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    ⏰ {formatTime(timeLeft)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {timeLeft === 0 ? '인증번호가 만료되었습니다' : '남은 시간'}
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Button 
                  onClick={handleVerificationSubmit}
                  disabled={loading || !verificationCode.trim() || timeLeft === 0}
                  className="w-full"
                >
                  {loading ? '인증 중...' : '인증하기'}
                </Button>
                
                <Button 
                  onClick={handleResendCode}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  인증번호 다시 받기
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 인증 완료 */}
        {step === 'complete' && (
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <CardTitle className="text-green-600">인증 완료!</CardTitle>
              <CardDescription>
                전화번호 인증이 완료되었습니다. 이제 게시판에 참여할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push('/main')}
                className="w-full"
              >
                메인으로 돌아가기
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function SimpleVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">로딩 중...</p>
        </div>
      </div>
    }>
      <SimpleVerificationContent />
    </Suspense>
  )
}
