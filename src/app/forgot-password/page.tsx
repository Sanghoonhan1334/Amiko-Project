'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || t('auth.forgotPassword.requestFailed'))
      }

      setIsEmailSent(true)
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error)
      alert(error instanceof Error ? error.message : t('auth.forgotPassword.resetError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 pt-44">
        <div className="flex justify-center">
          <Card className="w-full max-w-md bg-white border shadow-lg">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-semibold text-slate-900">
                {t('auth.forgotPassword.checkEmail')}
              </CardTitle>
              <CardDescription className="text-slate-600">
                {t('auth.forgotPassword.emailSent', { email })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-slate-600">
                  {t('auth.forgotPassword.checkSpam')}
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setIsEmailSent(false)
                      setEmail('')
                    }}
                    variant="outline"
                    className="w-full"
                  >
{t('auth.forgotPassword.tryAgain')}
                  </Button>
                  <Button
                    onClick={() => router.push('/sign-in')}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                  >
{t('auth.forgotPassword.backToLogin')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pt-44">
      <div className="flex justify-center">
        <Card className="w-full max-w-md bg-white border shadow-lg">
          <CardHeader className="text-center space-y-4 pb-6">
            <CardTitle className="text-2xl font-semibold text-slate-900">
              {t('auth.forgotPassword.title')}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {t('auth.forgotPassword.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  {t('auth.forgotPassword.emailAddress')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 text-lg font-medium transition-colors"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('auth.forgotPassword.sending')}
                  </div>
                ) : (
                  t('auth.forgotPassword.sendResetLink')
                )}
              </Button>
            </form>

            <div className="space-y-3 text-center">
              <div className="flex items-center justify-center gap-6 text-sm">
                <a href="/help" className="text-slate-900 hover:text-slate-700 font-medium transition-colors">
                  {t('footer.help')}
                </a>
                <span className="text-slate-400">•</span>
                <a href="/faq" className="text-slate-900 hover:text-slate-700 font-medium transition-colors">
                  {t('footer.faq')}
                </a>
                <span className="text-slate-400">•</span>
                <a href="/contact" className="text-slate-900 hover:text-slate-700 font-medium transition-colors">
                  {t('footer.contact')}
                </a>
              </div>
              <p className="text-sm text-slate-600">
                {t('auth.forgotPassword.rememberAccount')}{' '}
                <a href="/sign-in" className="text-slate-900 hover:text-slate-700 font-medium">
                  {t('auth.forgotPassword.login')}
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
