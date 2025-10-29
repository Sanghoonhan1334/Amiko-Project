'use client'

import ConversationPartnerManagement from '@/components/admin/ConversationPartnerManagement'

export default function ConversationPartnersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">화상 채팅 파트너 관리</h1>
        <p className="text-gray-600">AI 화상 채팅 대화상대를 등록하고 관리합니다</p>
      </div>
      <ConversationPartnerManagement />
    </div>
  )
}

