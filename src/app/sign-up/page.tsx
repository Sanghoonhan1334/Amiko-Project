'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRight, ArrowLeft, User, Mail, Lock, Phone, Globe } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import EmailVerification from '@/components/auth/EmailVerification'
import PhoneVerification from '@/components/auth/PhoneVerification'

export default function SignUpPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<'form' | 'email' | 'sms' | 'complete'>('form')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    country: '',
    isKorean: false
  })
  
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    hasNumber: false,
    hasSpecial: false,
    noRepeated: false
  })
  
  const [authData, setAuthData] = useState({
    email: '',
    phoneNumber: '',
    verificationCode: '',
    isEmailVerified: false,
    isSMSVerified: false,
    biometricEnabled: false
  })

  const countries = [
    { code: 'KR', isKorean: true, phoneCode: '+82' },
    { code: 'MX', isKorean: false, phoneCode: '+52' },
    { code: 'CO', isKorean: false, phoneCode: '+57' },
    { code: 'AR', isKorean: false, phoneCode: '+54' },
    { code: 'PE', isKorean: false, phoneCode: '+51' },
    { code: 'VE', isKorean: false, phoneCode: '+58' },
    { code: 'CL', isKorean: false, phoneCode: '+56' },
    { code: 'EC', isKorean: false, phoneCode: '+593' },
    { code: 'GT', isKorean: false, phoneCode: '+502' },
    { code: 'HN', isKorean: false, phoneCode: '+504' },
    { code: 'NI', isKorean: false, phoneCode: '+505' },
    { code: 'PA', isKorean: false, phoneCode: '+507' },
    { code: 'PY', isKorean: false, phoneCode: '+595' },
    { code: 'UY', isKorean: false, phoneCode: '+598' },
    { code: 'BO', isKorean: false, phoneCode: '+591' },
    { code: 'CR', isKorean: false, phoneCode: '+506' },
    { code: 'DO', isKorean: false, phoneCode: '+1' },
    { code: 'SV', isKorean: false, phoneCode: '+503' },
    { code: 'CU', isKorean: false, phoneCode: '+53' },
    { code: 'PR', isKorean: false, phoneCode: '+1' },
    { code: 'BR', isKorean: false, phoneCode: '+55' },
    { code: 'US', isKorean: false, phoneCode: '+1' },
    { code: 'CA', isKorean: false, phoneCode: '+1' },
    { code: 'JP', isKorean: false, phoneCode: '+81' },
    { code: 'CN', isKorean: false, phoneCode: '+86' }
  ]

  const handleInputChange = (field: string, value: string) => {
    // 전화번호 입력 시 국가별 형식으로 변환
    if (field === 'phone') {
      const selectedCountry = countries.find(c => c.code === formData.country)
      
      // 한국인 경우에만 010- 형식 적용
      if (selectedCountry?.isKorean) {
        // 숫자만 추출
        const digits = value.replace(/\D/g, '')
        
        // 숫자가 없으면 완전히 빈 문자열
        if (digits.length === 0) {
          value = ''
        } else {
          // 010으로 시작하지 않으면 010 추가
          let phoneDigits = digits
          if (!digits.startsWith('010')) {
            if (digits.startsWith('10')) {
              phoneDigits = '010' + digits.substring(2)
            } else {
              phoneDigits = '010' + digits
            }
          }
          
          // 하이픈 추가 (010-XXXX-XXXX)
          if (phoneDigits.length >= 7) {
            value = phoneDigits.substring(0, 3) + '-' + phoneDigits.substring(3, 7) + '-' + phoneDigits.substring(7, 11)
          } else if (phoneDigits.length >= 3) {
            value = phoneDigits.substring(0, 3) + '-' + phoneDigits.substring(3)
          } else {
            value = phoneDigits
          }
        }
        
        // 최대 13자리 (010-1234-5678)
        if (value.length > 13) {
          value = value.substring(0, 13)
        }
      } else {
        // 한국이 아닌 경우 숫자만 허용하고 특별한 포맷팅 없음
        const digits = value.replace(/\D/g, '')
        value = digits
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 비밀번호 검증
    if (field === 'password') {
      validatePassword(value)
    }
  }
  
  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noRepeated: !/(.)\1{2,}/.test(password) // 3개 이상 연속된 문자 방지
    }
    setPasswordChecks(checks)
  }
  
  const isPasswordValid = Object.values(passwordChecks).every(check => check)

  const handleCountryChange = (countryCode: string) => {
    const selectedCountry = countries.find(c => c.code === countryCode)
    setFormData(prev => ({
      ...prev,
      country: countryCode,
      isKorean: selectedCountry?.isKorean || false,
      phone: '' // 국가 변경 시 전화번호 필드 초기화
    }))
  }

  // 뒤로가기 함수
  const handleGoBack = () => {
    switch (currentStep) {
      case 'email':
        setCurrentStep('form')
        break
      case 'sms':
        setCurrentStep('email')
        break
      case 'complete':
        setCurrentStep('sms')
        break
      default:
        // form 단계에서는 메인 페이지로 이동
        router.push('/')
    }
  }

  // 전화번호 백스페이스 처리
  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const selectedCountry = countries.find(c => c.code === formData.country)
      
      if (selectedCountry?.isKorean && formData.phone) {
        // 한국인 경우: 백스페이스 시 하이픈과 함께 삭제
        const currentValue = formData.phone
        const digits = currentValue.replace(/\D/g, '')
        
        if (digits.length > 0) {
          // 마지막 숫자 하나 삭제
          const newDigits = digits.slice(0, -1)
          
          if (newDigits.length === 0) {
            // 모든 숫자가 삭제되면 빈 문자열
            setFormData(prev => ({ ...prev, phone: '' }))
            e.preventDefault()
          } else {
            // 하이픈 다시 적용
            let phoneDigits = newDigits
            if (!newDigits.startsWith('010')) {
              if (newDigits.startsWith('10')) {
                phoneDigits = '010' + newDigits.substring(2)
              } else if (newDigits.length > 0 && !newDigits.startsWith('01') && !newDigits.startsWith('0')) {
                // 01, 0으로 시작하는 경우는 010 추가하지 않음
                phoneDigits = '010' + newDigits
              }
            }
            
            let newValue = ''
            if (phoneDigits.length >= 7) {
              newValue = phoneDigits.substring(0, 3) + '-' + phoneDigits.substring(3, 7) + '-' + phoneDigits.substring(7, 11)
            } else if (phoneDigits.length >= 3) {
              newValue = phoneDigits.substring(0, 3) + '-' + phoneDigits.substring(3)
            } else {
              newValue = phoneDigits
            }
            
            setFormData(prev => ({ ...prev, phone: newValue }))
            e.preventDefault()
          }
        }
      }
    }
  }

  // 인증 관련 함수들
  const handleEmailAuth = async (email: string, nationality?: string) => {
    // 이메일만 저장하고 페이지 이동 (자동 발송 없음)
    setAuthData(prev => ({ ...prev, email }))
    setCurrentStep('email')
  }

  // 이메일 재발송 전용 함수
  const handleEmailResend = async () => {
    if (!authData.email) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: authData.email, 
          type: 'email',
          nationality: formData.country 
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      console.log('이메일 인증코드 발송 성공')
    } catch (error) {
      console.error('이메일 인증 발송 실패:', error)
      alert('이메일 인증코드 발송에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }


  const handleEmailVerify = async (code: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/verification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: authData.email, 
          code, 
          type: 'email' 
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      setAuthData(prev => ({ ...prev, isEmailVerified: true }))
      // 이메일 인증 완료 후 SMS 인증으로 이동
      setCurrentStep('sms')
    } catch (error) {
      console.error('이메일 인증 실패:', error)
      alert('인증코드가 올바르지 않습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 인증 방식별 발송 함수
  const handlePhoneAuth = async (method: string) => {
    console.log('🔍 [DEBUG] handlePhoneAuth 호출됨:', {
      method,
      phoneNumber: formData.phone,
      nationality: formData.country
    })
    
    setIsLoading(true)
    try {
      const requestBody = { 
        phoneNumber: formData.phone, 
        type: method,
        nationality: formData.country
      }
      
      console.log('📤 [DEBUG] API 요청 데이터:', requestBody)
      
      const response = await fetch('/api/auth/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()
      console.log('📥 [DEBUG] API 응답:', JSON.stringify(result, null, 2))
      
      if (!response.ok) throw new Error(result.error)

      setAuthData(prev => ({ ...prev, phoneNumber: formData.phone }))
      console.log(`✅ ${method} 인증코드 발송 성공:`, result)
      return result
    } catch (error) {
      console.error(`❌ ${method} 인증 발송 실패:`, error)
      alert(`${method} 인증코드 발송에 실패했습니다.`)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleSMSVerify = async (code: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: authData.phoneNumber, 
          code, 
          type: 'verify' 
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      setAuthData(prev => ({ ...prev, isSMSVerified: true }))
      // SMS 인증 완료 후 회원가입 처리
      handleSignUp()
    } catch (error) {
      console.error('SMS 인증 실패:', error)
      alert('인증코드가 올바르지 않습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsLoading(true)

    try {
      // 실제 회원가입 API 호출
      const selectedCountry = countries.find(c => c.code === formData.country)
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          country: formData.country,
          isKorean: selectedCountry?.isKorean || false,
          emailVerified: authData.isEmailVerified,
          phoneVerified: authData.isSMSVerified,
          biometricEnabled: authData.biometricEnabled
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || t('auth.signUpFailed'))
      }

      console.log('회원가입 성공:', result)
      alert(t('auth.signUpSuccess'))
      
      // 회원가입 성공 후 로그인 페이지로 이동
      router.push('/sign-in')
      
    } catch (error) {
      console.error('회원가입 오류:', error)
      
      // 중복 이메일 에러 처리
      if (error instanceof Error && error.message.includes('이미 가입된 이메일')) {
        alert('이미 가입된 이메일입니다. 다른 이메일을 사용하거나 로그인해주세요.')
        setCurrentStep('form') // 폼으로 돌아가기
        return
      }
      
      alert(error instanceof Error ? error.message : t('auth.signUpError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isPasswordValid || formData.password !== formData.confirmPassword) {
      return
    }

    setIsLoading(true)
    
    try {
      // 중복 이메일 체크
      const emailResponse = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })
      
      const emailResult = await emailResponse.json()
      
      if (!emailResponse.ok) {
        throw new Error(emailResult.error || '이메일 확인 중 오류가 발생했습니다.')
      }
      
      if (emailResult.exists) {
        alert('이미 가입된 이메일입니다. 다른 이메일을 사용하거나 로그인해주세요.')
        return
      }

      // 중복 전화번호 체크
      const phoneResponse = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone })
      })
      
      const phoneResult = await phoneResponse.json()
      
      if (!phoneResponse.ok) {
        throw new Error(phoneResult.error || '전화번호 확인 중 오류가 발생했습니다.')
      }
      
      if (phoneResult.exists) {
        alert('이미 가입된 전화번호입니다. 다른 전화번호를 사용하거나 로그인해주세요.')
        return
      }
      
      // 중복이 아닌 경우 폼 데이터를 authData에 저장하고 다음 단계로
      setAuthData(prev => ({
        ...prev,
        email: formData.email,
        phoneNumber: formData.phone,
        name: formData.name,
        country: formData.country
      }))
      
      setCurrentStep('email')
      
    } catch (error) {
      console.error('중복 체크 오류:', error)
      alert(error instanceof Error ? error.message : '확인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 단계별 렌더링
  const renderStep = () => {
    switch (currentStep) {
      case 'email':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4" />
                뒤로가기
              </Button>
            </div>
            <EmailVerification
              email={authData.email}
              onVerify={handleEmailVerify}
              onResend={handleEmailResend}
              isLoading={isLoading}
            />
          </div>
        )
      
      case 'sms':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4" />
                뒤로가기
              </Button>
            </div>
            <PhoneVerification
              phoneNumber={formData.phone}
              nationality={formData.country}
              onVerify={handleSMSVerify}
              onResend={handlePhoneAuth}
              isLoading={isLoading}
            />
          </div>
        )
      
      default:
        return (
          <form onSubmit={handleFormSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                {t('auth.name')}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder={t('auth.namePlaceholder')}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                {t('auth.email')}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                  title="올바른 이메일 주소를 입력해주세요"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                {t('auth.password')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`border-slate-200 focus:border-slate-400 focus:ring-slate-400 ${
                    formData.password && !isPasswordValid ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : ''
                  }`}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
              
              {/* 비밀번호 강도 표시 */}
              {formData.password && (
                <div className="space-y-1 text-xs">
                  <div className={`flex items-center gap-2 ${passwordChecks.length ? 'text-green-600' : 'text-red-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordChecks.length ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    {t('auth.passwordMinLength')}
                  </div>
                  <div className={`flex items-center gap-2 ${passwordChecks.hasNumber ? 'text-green-600' : 'text-red-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordChecks.hasNumber ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    {t('auth.passwordHasNumber')}
                  </div>
                  <div className={`flex items-center gap-2 ${passwordChecks.hasSpecial ? 'text-green-600' : 'text-red-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordChecks.hasSpecial ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    {t('auth.passwordHasSpecial')}
                  </div>
                  <div className={`flex items-center gap-2 ${passwordChecks.noRepeated ? 'text-green-600' : 'text-red-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordChecks.noRepeated ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    {t('auth.passwordNoRepeated')}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                {t('auth.confirmPassword')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`border-slate-200 focus:border-slate-400 focus:ring-slate-400 ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : ''
                  }`}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500">{t('auth.passwordMismatch')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                {t('auth.phone')}
              </Label>
              <div className="flex gap-2">
                <Select value={formData.country} onValueChange={handleCountryChange} required>
                  <SelectTrigger className="w-32 border-slate-200 focus:border-slate-400 focus:ring-slate-400">
                    <SelectValue placeholder={t('auth.countryCode')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code} className="hover:bg-slate-50">
                        {country.phoneCode} {t(`auth.countries.${country.code}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={countries.find(c => c.code === formData.country)?.isKorean ? "10-1234-5678" : "123456789"}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    onKeyDown={handlePhoneKeyDown}
                    className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium text-slate-700">
                {t('auth.nationality')}
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Select value={formData.country} onValueChange={handleCountryChange} required>
                  <SelectTrigger className="pl-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400">
                    <SelectValue placeholder={t('auth.selectNationality')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code} className="hover:bg-slate-50">
                        {t(`auth.countries.${country.code}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 text-lg font-medium transition-colors"
              disabled={isLoading || !formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.phone || !formData.country || !isPasswordValid || formData.password !== formData.confirmPassword}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('auth.checking')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{t('auth.nextStep')}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>
        )
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 pt-32 sm:pt-44">
      <div className="flex justify-center">
        <Card className="w-full max-w-md bg-white border shadow-lg">
          {currentStep === 'form' && (
            <>
              <CardHeader className="text-center space-y-3 sm:space-y-4 pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-semibold text-slate-900">
                  {t('auth.signUp')}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-slate-600">
                  {t('auth.signUpDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderStep()}
                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-600">
                    {t('auth.alreadyHaveAccount')}{' '}
                    <a href="/sign-in" className="text-slate-900 hover:text-slate-700 font-medium">
                      {t('auth.signIn')}
                    </a>
                  </p>
                </div>
              </CardContent>
            </>
          )}
          
          {currentStep !== 'form' && (
            <CardContent className="p-6">
              {renderStep()}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
