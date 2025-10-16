'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function ChargingHeader() {
  const { t } = useLanguage()

  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-12 h-12 rounded-3xl flex items-center justify-center overflow-hidden">
        <img
          src="/charging-title.png"
          alt="충전소"
          className="w-full h-full object-contain"
        />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('storeTab.title')}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('storeTab.subtitle')}</p>
        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">{t('mainPage.akoExplanation')}</p>
      </div>
    </div>
  )
}
