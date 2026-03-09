'use client'

import ConversationPartnerManagement from '@/components/admin/ConversationPartnerManagement'
import { useLanguage } from '@/context/LanguageContext'

export default function ConversationPartnersPage() {
  const { language } = useLanguage()
  const t = (ko: string, es: string) => language === 'ko' ? ko : es

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('화상 채팅 파트너 관리', 'Gestión de Compañeros de Videollamada')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('화상 채팅 대화상대를 등록하고 관리합니다', 'Registra y gestiona los compañeros de videollamada')}
        </p>
      </div>
      <ConversationPartnerManagement />
    </div>
  )
}

