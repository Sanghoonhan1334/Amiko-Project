'use client';

import ChatBanManagement from '@/components/admin/ChatBanManagement';
import { useLanguage } from '@/context/LanguageContext';

export default function ChatBansPage() {
  const { language } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {language === 'ko' ? '채팅금지 관리' : 'Gestión de Prohibiciones de Chat'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'ko'
            ? '채팅금지 및 영구 추방 사용자 관리'
            : 'Gestionar usuarios con prohibición de chat y expulsión permanente'}
        </p>
      </div>
      <ChatBanManagement />
    </div>
  );
}
