'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function TermsOfService() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="container mx-auto px-4 pt-32 md:pt-40 lg:pt-48 pb-12 max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
            {t('terms.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-['Inter']">
            {t('terms.lastUpdated')}: {t('terms.lastUpdatedDate')}
          </p>
        </div>

        {/* 본문 */}
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg p-8 space-y-8">
          {/* 서비스 소개 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('terms.sections.introduction.title')}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-['Inter']">
              <p>{t('terms.sections.introduction.content')}</p>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('terms.sections.introduction.services.title')}</h3>
                <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                  {(() => {
                    const items = t('terms.sections.introduction.services.items');
                    if (!Array.isArray(items)) return null;
                    return items.map((item: string, index: number) => (
                      <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                    ));
                  })()}
                </ul>
              </div>
            </div>
          </section>

          {/* 약관의 효력 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('terms.sections.effectiveness.title')}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-['Inter']">
              <p>{t('terms.sections.effectiveness.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {(() => {
                  const items = t('terms.sections.effectiveness.items');
                  if (!Array.isArray(items)) return null;
                  return items.map((item: string, index: number) => (
                    <li key={index} className="dark:text-gray-400">{item}</li>
                  ));
                })()}
              </ul>
            </div>
          </section>

          {/* 회원가입 및 관리 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('terms.sections.membership.title')}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-['Inter']">
              <p>{t('terms.sections.membership.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {(() => {
                  const items = t('terms.sections.membership.items');
                  if (!Array.isArray(items)) return null;
                  return items.map((item: string, index: number) => (
                    <li key={index} className="dark:text-gray-400"><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                  ));
                })()}
              </ul>
            </div>
          </section>

          {/* 서비스 이용 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('terms.sections.service.title')}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-['Inter']">
              <p>{t('terms.sections.service.content')}</p>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-red-500">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('terms.sections.service.prohibited.title')}</h3>
                <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                  {(() => {
                    const items = t('terms.sections.service.prohibited.items');
                    if (!Array.isArray(items)) return null;
                    return items.map((item: string, index: number) => (
                      <li key={index} className="dark:text-gray-400">{item}</li>
                    ));
                  })()}
                </ul>
              </div>
            </div>
          </section>

          {/* 책임의 한계 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('terms.sections.liability.title')}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-['Inter']">
              <p>{t('terms.sections.liability.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {(() => {
                  const items = t('terms.sections.liability.items');
                  if (!Array.isArray(items)) return null;
                  return items.map((item: string, index: number) => (
                    <li key={index} className="dark:text-gray-400">{item}</li>
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