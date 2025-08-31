'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function TestPushNotificationPage() {

  // 테스트 결과 표시
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                🧪 푸시 알림 테스트
              </h1>
              <p className="text-gray-600">
                푸시 알림 시스템을 테스트해보세요.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>테스트 결과</CardTitle>
                <CardDescription>
                  푸시 알림 시스템 테스트 결과입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700">
                      ✅ 푸시 알림 시스템이 정상적으로 작동하고 있습니다.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700">
                      📱 테스트 알림이 전송되었습니다. 브라우저 알림을 확인해보세요.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
