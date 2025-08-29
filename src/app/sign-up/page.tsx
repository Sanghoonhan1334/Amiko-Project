'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRight, User, Mail, Phone, Globe } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    isKorean: false
  })

  const countries = [
    { code: 'KR', name: '대한민국', isKorean: true },
    { code: 'BR', name: '브라질', isKorean: false },
    { code: 'MX', name: '멕시코', isKorean: false },
    { code: 'AR', name: '아르헨티나', isKorean: false },
    { code: 'CO', name: '콜롬비아', isKorean: false },
    { code: 'PE', name: '페루', isKorean: false },
    { code: 'CL', name: '칠레', isKorean: false },
    { code: 'US', name: '미국', isKorean: false },
    { code: 'CA', name: '캐나다', isKorean: false },
    { code: 'JP', name: '일본', isKorean: false },
    { code: 'CN', name: '중국', isKorean: false }
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

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
      // TODO: 실제 회원가입 API 호출
      console.log('회원가입 데이터:', formData)
      
      // 회원가입 성공 후 인증 페이지로 이동
      setTimeout(() => {
        router.push(`/verify?country=${formData.country}`)
      }, 1000)
    } catch (error) {
      console.error('회원가입 오류:', error)
      alert('회원가입 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-2 border-brand-200/50 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-brand-500 to-mint-500 bg-clip-text text-transparent">
              Amiko
            </div>
            <div className="text-xl animate-pulse">✨</div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            회원가입
          </CardTitle>
          <CardDescription className="text-gray-600">
            한국 문화 교류 플랫폼에 가입하고 새로운 경험을 시작하세요!
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm text-gray-600">
                이름
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="pl-10 border-brand-200 focus:border-brand-500 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-600">
                이메일
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10 border-brand-200 focus:border-brand-500 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm text-gray-600">
                전화번호
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+82-10-1234-5678"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="pl-10 border-brand-200 focus:border-brand-500 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm text-gray-600">
                국가
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Select value={formData.country} onValueChange={handleCountryChange} required>
                  <SelectTrigger className="pl-10 border-brand-200 focus:border-brand-500 focus:ring-brand-500">
                    <SelectValue placeholder="국가를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-500 to-mint-500 hover:from-brand-600 hover:to-mint-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 py-3 text-lg"
              disabled={isLoading || !formData.name || !formData.email || !formData.phone || !formData.country}
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
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <a href="/sign-in" className="text-brand-600 hover:text-brand-700 font-medium">
                로그인하기
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
