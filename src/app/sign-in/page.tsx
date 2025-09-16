'use client'

import { useState } from 'react'
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
  EyeOff
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
      // 실제 로그인 API 호출
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.identifier,
          password: formData.password
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '로그인에 실패했습니다.')
      }

      console.log('로그인 성공:', result)
      
      // AuthContext의 signIn 함수 사용하여 세션 업데이트
      const { error: signInError } = await signIn(formData.identifier, formData.password)
      
      if (signInError) {
        throw new Error('세션 업데이트에 실패했습니다.')
      }
      
      // 로그인 성공 후 메인 앱으로 이동
      router.push('/main')
      
    } catch (error) {
      console.error('로그인 오류:', error)
      
      // 사용자에게 더 친화적인 메시지 표시
      const errorMessage = error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.'
      
      if (errorMessage.includes('이메일 또는 비밀번호가 올바르지 않습니다')) {
        alert('입력하신 이메일 또는 비밀번호를 다시 확인해주세요.\n\n• 이메일 주소가 정확한지 확인\n• 비밀번호가 올바른지 확인\n• 대소문자 구분 확인')
      } else {
        alert(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pt-44">
      <div className="flex justify-center">
      <Card className="w-full max-w-md bg-white border shadow-lg">
        <CardHeader className="text-center space-y-4 pb-6">
          <CardTitle className="text-2xl font-semibold text-slate-900">
            로그인
          </CardTitle>
          <CardDescription className="text-slate-600">
            계정에 로그인하고 한국 문화 교류를 시작하세요!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium text-slate-700">
                이메일 또는 전화번호
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder="example@email.com 또는 +82-10-1234-5678"
                  value={formData.identifier}
                  onChange={(e) => handleInputChange('identifier', e.target.value)}
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pl-10 pr-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 text-lg font-medium transition-colors"
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

          {/* 추가 링크 */}
          <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-6 text-sm">
              <a href="/forgot-password" className="text-slate-900 hover:text-slate-700 font-medium transition-colors">
                {t('auth.forgotPassword')}
              </a>
              <span className="text-slate-400">•</span>
              <a href="/help" className="text-slate-900 hover:text-slate-700 font-medium transition-colors">
                {t('footer.help')}
              </a>
            </div>
            
            <p className="text-sm text-slate-600">
              계정이 없으신가요?{' '}
              <a href="/sign-up" className="text-slate-900 hover:text-slate-700 font-medium">
                회원가입하기
              </a>
            </p>
          </div>

        </CardContent>
      </Card>
      </div>
    </div>
  )
}
