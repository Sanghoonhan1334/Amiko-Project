'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRight, User, Mail, Lock, Phone, Globe } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
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

  const countries = [
    { code: 'KR', name: '대한민국', isKorean: true, phoneCode: '+82' },
    { code: 'BR', name: '브라질', isKorean: false, phoneCode: '+55' },
    { code: 'MX', name: '멕시코', isKorean: false, phoneCode: '+52' },
    { code: 'AR', name: '아르헨티나', isKorean: false, phoneCode: '+54' },
    { code: 'CO', name: '콜롬비아', isKorean: false, phoneCode: '+57' },
    { code: 'PE', name: '페루', isKorean: false, phoneCode: '+51' },
    { code: 'CL', name: '칠레', isKorean: false, phoneCode: '+56' },
    { code: 'US', name: '미국', isKorean: false, phoneCode: '+1' },
    { code: 'CA', name: '캐나다', isKorean: false, phoneCode: '+1' },
    { code: 'JP', name: '일본', isKorean: false, phoneCode: '+81' },
    { code: 'CN', name: '중국', isKorean: false, phoneCode: '+86' }
  ]

  const handleInputChange = (field: string, value: string) => {
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
      isKorean: selectedCountry?.isKorean || false
    }))
  }


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
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
          isKorean: selectedCountry?.isKorean || false
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '회원가입에 실패했습니다.')
      }

      console.log('회원가입 성공:', result)
      alert('회원가입이 완료되었습니다! 바로 로그인하실 수 있습니다.')
      
      // 회원가입 성공 후 로그인 페이지로 이동
      router.push('/sign-in')
      
    } catch (error) {
      console.error('회원가입 오류:', error)
      alert(error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pt-44">
      <div className="flex justify-center">
      <Card className="w-full max-w-md bg-white border shadow-lg">
        <CardHeader className="text-center space-y-4 pb-6">
          <CardTitle className="text-2xl font-semibold text-slate-900">
            회원가입
          </CardTitle>
          <CardDescription className="text-slate-600">
            한국 문화 교류 플랫폼에 가입하고 새로운 경험을 시작하세요!
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                이름
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                이메일
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
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                비밀번호
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 ${
                    formData.password && !isPasswordValid ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : ''
                  }`}
                  required
                />
              </div>
              
              {/* 비밀번호 강도 표시 */}
              {formData.password && (
                <div className="space-y-1 text-xs">
                  <div className={`flex items-center gap-2 ${passwordChecks.length ? 'text-green-600' : 'text-red-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordChecks.length ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    8자 이상
                  </div>
                  <div className={`flex items-center gap-2 ${passwordChecks.hasNumber ? 'text-green-600' : 'text-red-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordChecks.hasNumber ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    숫자 포함
                  </div>
                  <div className={`flex items-center gap-2 ${passwordChecks.hasSpecial ? 'text-green-600' : 'text-red-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordChecks.hasSpecial ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    특수문자 포함
                  </div>
                  <div className={`flex items-center gap-2 ${passwordChecks.noRepeated ? 'text-green-600' : 'text-red-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordChecks.noRepeated ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    연속된 문자 없음
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                비밀번호 확인
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : ''
                  }`}
                  required
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                전화번호
              </Label>
              <div className="flex gap-2">
                <Select value={formData.country} onValueChange={handleCountryChange} required>
                  <SelectTrigger className="w-32 border-slate-200 focus:border-slate-400 focus:ring-slate-400">
                    <SelectValue placeholder="국가번호" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 rounded-md shadow-lg z-50">
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code} className="hover:bg-slate-50">
                        {country.phoneCode} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="10-1234-5678"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium text-slate-700">
                국가
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Select value={formData.country} onValueChange={handleCountryChange} required>
                  <SelectTrigger className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400">
                    <SelectValue placeholder="국가를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 rounded-md shadow-lg z-50">
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code} className="hover:bg-slate-50">
                        {country.name}
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
                  가입 중...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>회원가입</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>


          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              이미 계정이 있으신가요?{' '}
              <a href="/sign-in" className="text-slate-900 hover:text-slate-700 font-medium">
                로그인하기
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
