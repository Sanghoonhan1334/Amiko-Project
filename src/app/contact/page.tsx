'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function ContactPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50">
      <div className="container mx-auto px-2 pt-24 md:pt-32 lg:pt-40 pb-8 max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 font-['Inter']">
            {t('contact.title')}
          </h1>
          <p className="text-sm md:text-base text-gray-600 font-['Inter']">
            {t('contact.subtitle')}
          </p>
        </div>

        {/* 본문 */}
        <div className="bg-white/80 rounded-2xl shadow-lg p-4 md:p-6 space-y-6">
          {/* 연락처 정보 */}
          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 font-['Inter']">
              {t('contact.sections.info.title')}
            </h2>
            <div className="space-y-3 text-gray-700 font-['Inter']">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-1 text-sm">{t('contact.sections.info.email.title')}</h3>
                  <p className="text-blue-700 text-xs">{t('contact.sections.info.email.content')}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-1 text-sm">{t('contact.sections.info.hours.title')}</h3>
                  <p className="text-green-700 text-xs">{t('contact.sections.info.hours.content')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* 문의 유형 */}
          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 font-['Inter']">
              {t('contact.sections.types.title')}
            </h2>
            <div className="space-y-3 text-gray-700 font-['Inter']">
              <p className="text-sm">{t('contact.sections.types.content')}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-1 text-sm">{t('contact.sections.types.technical.title')}</h3>
                  <p className="text-purple-700 text-xs">{t('contact.sections.types.technical.content')}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-1 text-sm">{t('contact.sections.types.billing.title')}</h3>
                  <p className="text-orange-700 text-xs">{t('contact.sections.types.billing.content')}</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-indigo-800 mb-1 text-sm">{t('contact.sections.types.general.title')}</h3>
                  <p className="text-indigo-700 text-xs">{t('contact.sections.types.general.content')}</p>
                </div>
                <div className="bg-pink-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-pink-800 mb-1 text-sm">{t('contact.sections.types.partnership.title')}</h3>
                  <p className="text-pink-700 text-xs">{t('contact.sections.types.partnership.content')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* 응답 시간 */}
          <section>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 font-['Inter']">
              {t('contact.sections.response.title')}
            </h2>
            <div className="space-y-3 text-gray-700 font-['Inter']">
              <p className="text-sm">{t('contact.sections.response.content')}</p>
              <ul className="list-disc pl-4 space-y-1">
                {(() => {
                  const items = t('contact.sections.response.items');
                  if (!Array.isArray(items)) return null;
                  return items.map((item: string, index: number) => (
                    <li key={index} className="text-xs">{item}</li>
                  ));
                })()}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
