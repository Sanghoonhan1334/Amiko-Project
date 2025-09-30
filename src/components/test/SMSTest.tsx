'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send, CheckCircle, XCircle } from 'lucide-react'

export default function SMSTest() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('[Amiko] 테스트 SMS입니다. 인증코드: 123456')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSendSMS = async () => {
    if (!phoneNumber.trim() || !message.trim()) {
      alert('전화번호와 메시지를 입력해주세요.')
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message: message
        })
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        console.log('✅ SMS 발송 성공:', data.data)
      } else {
        console.error('❌ SMS 발송 실패:', data.error)
      }
    } catch (error) {
      console.error('❌ 요청 오류:', error)
      setResult({
        success: false,
        error: '네트워크 오류가 발생했습니다.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckStatus = async () => {
    try {
      const response = await fetch('/api/send-sms')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('❌ 상태 확인 오류:', error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            SMS 발송 테스트
          </CardTitle>
          <CardDescription>
            Twilio를 통한 실제 SMS 발송 테스트
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">전화번호</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="010-1234-5678 또는 +82-10-1234-5678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              한국 번호는 010-1234-5678 형식으로 입력하세요
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">메시지</Label>
            <Textarea
              id="message"
              placeholder="발송할 메시지를 입력하세요"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSendSMS} 
              disabled={isLoading || !phoneNumber.trim() || !message.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  발송 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  SMS 발송
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleCheckStatus} 
              variant="outline"
            >
              설정 확인
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">상태:</span>
                <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                  {result.success ? '성공' : '실패'}
                </span>
              </div>
              
              {result.message && (
                <div>
                  <span className="font-medium">메시지:</span>
                  <p className="text-sm text-gray-600">{result.message}</p>
                </div>
              )}
              
              {result.error && (
                <div>
                  <span className="font-medium">오류:</span>
                  <p className="text-sm text-red-600">{result.error}</p>
                </div>
              )}
              
              {result.data && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <h4 className="font-medium mb-2">상세 정보:</h4>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
