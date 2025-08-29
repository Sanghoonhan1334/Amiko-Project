'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowRight, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  MessageCircle,
  Mail,
  Apple,
  HelpCircle,
  ArrowLeft
} from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  })
  


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 실제 Supabase 로그인
      const { error } = await signIn(formData.identifier, formData.password)
      
      if (error) {
        console.error('로그인 실패:', error)
        alert('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.')
        return
      }
      
      console.log('로그인 성공!')
      
      // 로그인 성공 후 메인 앱으로 이동
      router.push('/main')
    } catch (error) {
      console.error('로그인 오류:', error)
      alert('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = (provider: string) => {
    // TODO: 소셜 로그인 구현
    alert(`${provider} 로그인 기능은 준비 중입니다!`)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
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
            로그인
          </CardTitle>
          <CardDescription className="text-gray-600">
            계정에 로그인하고 한국 문화 교류를 시작하세요!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm text-gray-600">
                이메일 또는 전화번호
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder="example@email.com 또는 +82-10-1234-5678"
                  value={formData.identifier}
                  onChange={(e) => handleInputChange('identifier', e.target.value)}
                  className="pl-10 border-brand-200 focus:border-brand-500 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-gray-600">
                비밀번호
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pl-10 pr-10 border-brand-200 focus:border-brand-500 focus:ring-brand-500"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-500 to-mint-500 hover:from-brand-600 hover:to-mint-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 py-3 text-lg"
              disabled={isLoading || !formData.identifier || !formData.password}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  로그인 중...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>로그인</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>

          {/* 소셜 로그인 */}
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('Kakao')}
                className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('Google')}
                className="bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
              >
                <Mail className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('Apple')}
                className="bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                <Apple className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 추가 링크 */}
          <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-4 text-sm">
              <a href="#" className="text-brand-600 hover:text-brand-700 font-medium">
                비밀번호 찾기
              </a>
              <span className="text-gray-400">•</span>
              <a href="#" className="text-brand-600 hover:text-brand-700 font-medium">
                도움말
              </a>
            </div>
            
            <p className="text-sm text-gray-600">
              계정이 없으신가요?{' '}
              <a href="/sign-up" className="text-brand-600 hover:text-brand-700 font-medium">
                회원가입하기
              </a>
            </p>
          </div>

          {/* 뒤로가기 */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
