'use client'

import MentorStatusManager from '@/components/admin/MentorStatusManager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Users, Activity } from 'lucide-react'

export default function MentorStatusPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
              <p className="text-gray-600">멘토 상태 관리 시스템</p>
            </div>
          </div>
        </div>

        {/* 기능 설명 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-blue-500" />
                멘토 상태 관리
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                멘토들의 현재 상태(온라인/다른 상담 중/오프라인)를 실시간으로 관리하고 모니터링할 수 있습니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-green-500" />
                자동 상태 변경
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                멘토가 상담을 시작하면 자동으로 '다른 상담 중'으로, 종료하면 '온라인'으로 상태가 변경됩니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5 text-purple-500" />
                상태 로그
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                모든 멘토 상태 변경 이력이 자동으로 기록되어 추후 분석 및 모니터링에 활용할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 멘토 상태 관리 컴포넌트 */}
        <MentorStatusManager />

        {/* 사용법 안내 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>사용법 안내</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">1. 멘토 상태 확인</h4>
                <p className="text-sm text-blue-700">
                  상단의 요약 카드에서 현재 온라인, 다른 상담 중, 오프라인 멘토 수를 한눈에 확인할 수 있습니다.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">2. 상태 변경</h4>
                <p className="text-sm text-green-700">
                  각 멘토의 상태 드롭다운에서 원하는 상태로 변경할 수 있습니다. 변경사항은 즉시 반영됩니다.
                </p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-2">3. 활성화/비활성화</h4>
                <p className="text-sm text-orange-700">
                  멘토를 일시적으로 비활성화할 수 있습니다. 비활성화된 멘토는 사용자에게 표시되지 않습니다.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">4. 자동 상태 관리</h4>
                <p className="text-sm text-purple-700">
                  멘토가 실제 상담을 시작하거나 종료하면 시스템이 자동으로 상태를 업데이트합니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
