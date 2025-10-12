'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function CookiePolicy() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="container mx-auto px-4 pt-32 md:pt-40 lg:pt-48 pb-12 max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
            {t('cookies.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-['Inter']">
            {t('cookies.lastUpdated')}: {t('cookies.lastUpdatedDate')}
          </p>
        </div>

        {/* 본문 */}
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg p-8 space-y-8">
          {/* 1. 쿠키란? */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('cookies.sections.definition.title')}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-['Inter']">
              <p>{t('cookies.sections.definition.content')}</p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-gray-800 dark:text-gray-200 font-medium">💡 {t('cookies.sections.definition.note')}</p>
              </div>
            </div>
          </section>

          {/* 2. Amiko에서 사용하는 쿠키 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('cookies.sections.types.title')}
            </h2>
            <div className="space-y-6 text-gray-700 dark:text-gray-300 font-['Inter']">
              {/* 필수 쿠키 */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-green-500">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('cookies.sections.types.essential.title')}</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">{t('cookies.sections.types.essential.content')}</p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                  {(() => {
                    const items = t('cookies.sections.types.essential.items');
                    if (!Array.isArray(items)) return null;
                    return items.map((item: string, index: number) => (
                      <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                    ));
                  })()}
                </ul>
              </div>

              {/* 기능 쿠키 */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('cookies.sections.types.functional.title')}</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">{t('cookies.sections.types.functional.content')}</p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                  {(() => {
                    const items = t('cookies.sections.types.functional.items');
                    if (!Array.isArray(items)) return null;
                    return items.map((item: string, index: number) => (
                      <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                    ));
                  })()}
                </ul>
              </div>

              {/* 분석 쿠키 */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-purple-500">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('cookies.sections.types.analytics.title')}</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">{t('cookies.sections.types.analytics.content')}</p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                  {(() => {
                    const items = t('cookies.sections.types.analytics.items');
                    if (!Array.isArray(items)) return null;
                    return items.map((item: string, index: number) => (
                      <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                    ));
                  })()}
                </ul>
              </div>

              {/* 마케팅 쿠키 */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-orange-500">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('cookies.sections.types.marketing.title')}</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">{t('cookies.sections.types.marketing.content')}</p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                  {(() => {
                    const items = t('cookies.sections.types.marketing.items');
                    if (!Array.isArray(items)) return null;
                    return items.map((item: string, index: number) => (
                      <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                    ));
                  })()}
                </ul>
              </div>
            </div>
          </section>

          {/* 3. 쿠키 관리 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('cookies.sections.management.title')}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-['Inter']">
              <p>{t('cookies.sections.management.content')}</p>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-gray-500">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('cookies.sections.management.browser.title')}</h3>
                <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                  {(() => {
                    const items = t('cookies.sections.management.browser.items');
                    if (!Array.isArray(items)) return null;
                    return items.map((item: string, index: number) => (
                      <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                    ));
                  })()}
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-indigo-500">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('cookies.sections.management.service.title')}</h3>
                <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                  {(() => {
                    const items = t('cookies.sections.management.service.items');
                    if (!Array.isArray(items)) return null;
                    return items.map((item: string, index: number) => (
                      <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                    ));
                  })()}
                </ul>
              </div>
            </div>
          </section>

          {/* 4. 쿠키 사용 동의 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('cookies.sections.consent.title')}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-['Inter']">
              <p>{t('cookies.sections.consent.content')}</p>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-yellow-500">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('cookies.sections.consent.procedure.title')}</h3>
                <ol className="list-decimal pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                  {(() => {
                    const items = t('cookies.sections.consent.procedure.items');
                    if (!Array.isArray(items)) return null;
                    return items.map((item: string, index: number) => (
                      <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                    ));
                  })()}
                </ol>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('cookies.sections.consent.legal.title')}</h3>
                <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                  {(() => {
                    const items = t('cookies.sections.consent.legal.items');
                    if (!Array.isArray(items)) return null;
                    return items.map((item: string, index: number) => (
                      <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                    ));
                  })()}
                </ul>
              </div>
            </div>
          </section>

          {/* 5. 쿠키 정책 변경 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('cookies.sections.changes.title')}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-['Inter']">
              <p>{t('cookies.sections.changes.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {(() => {
                  const items = t('cookies.sections.changes.items');
                  if (!Array.isArray(items)) return null;
                  return items.map((item: string, index: number) => (
                    <li key={index} className="dark:text-gray-400"><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
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