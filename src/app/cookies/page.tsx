'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function CookiePolicy() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-['Inter']">
            {t('cookies.title')}
          </h1>
          <p className="text-lg text-gray-600 font-['Inter']">
            {t('cookies.lastUpdated')}: {t('cookies.lastUpdatedDate')}
          </p>
        </div>

        {/* 본문 */}
        <div className="bg-white/80 rounded-2xl shadow-lg p-8 space-y-8">
          {/* 1. 쿠키란? */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('cookies.sections.definition.title')}
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>{t('cookies.sections.definition.content')}</p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 font-medium">💡 {t('cookies.sections.definition.note')}</p>
              </div>
            </div>
          </section>

          {/* 2. Amiko에서 사용하는 쿠키 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('cookies.sections.types.title')}
            </h2>
            <div className="space-y-6 text-gray-700 font-['Inter']">
              {/* 필수 쿠키 */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">{t('cookies.sections.types.essential.title')}</h3>
                <p className="text-green-700 mb-2">{t('cookies.sections.types.essential.content')}</p>
                <ul className="list-disc pl-6 space-y-1 text-green-700">
                  {t('cookies.sections.types.essential.items').map((item: string, index: number) => (
                    <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                  ))}
                </ul>
              </div>

              {/* 기능 쿠키 */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">{t('cookies.sections.types.functional.title')}</h3>
                <p className="text-blue-700 mb-2">{t('cookies.sections.types.functional.content')}</p>
                <ul className="list-disc pl-6 space-y-1 text-blue-700">
                  {t('cookies.sections.types.functional.items').map((item: string, index: number) => (
                    <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                  ))}
                </ul>
              </div>

              {/* 분석 쿠키 */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">{t('cookies.sections.types.analytics.title')}</h3>
                <p className="text-purple-700 mb-2">{t('cookies.sections.types.analytics.content')}</p>
                <ul className="list-disc pl-6 space-y-1 text-purple-700">
                  {t('cookies.sections.types.analytics.items').map((item: string, index: number) => (
                    <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                  ))}
                </ul>
              </div>

              {/* 마케팅 쿠키 */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-800 mb-2">{t('cookies.sections.types.marketing.title')}</h3>
                <p className="text-orange-700 mb-2">{t('cookies.sections.types.marketing.content')}</p>
                <ul className="list-disc pl-6 space-y-1 text-orange-700">
                  {t('cookies.sections.types.marketing.items').map((item: string, index: number) => (
                    <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 3. 쿠키 관리 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('cookies.sections.management.title')}
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>{t('cookies.sections.management.content')}</p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">{t('cookies.sections.management.browser.title')}</h3>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  {t('cookies.sections.management.browser.items').map((item: string, index: number) => (
                    <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-semibold text-indigo-800 mb-2">{t('cookies.sections.management.service.title')}</h3>
                <ul className="list-disc pl-6 space-y-1 text-indigo-700">
                  {t('cookies.sections.management.service.items').map((item: string, index: number) => (
                    <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 4. 쿠키 사용 동의 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('cookies.sections.consent.title')}
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>{t('cookies.sections.consent.content')}</p>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">{t('cookies.sections.consent.procedure.title')}</h3>
                <ol className="list-decimal pl-6 space-y-1 text-yellow-700">
                  {t('cookies.sections.consent.procedure.items').map((item: string, index: number) => (
                    <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                  ))}
                </ol>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">{t('cookies.sections.consent.legal.title')}</h3>
                <ul className="list-disc pl-6 space-y-1 text-blue-700">
                  {t('cookies.sections.consent.legal.items').map((item: string, index: number) => (
                    <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 5. 쿠키 정책 변경 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('cookies.sections.changes.title')}
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>{t('cookies.sections.changes.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {t('cookies.sections.changes.items').map((item: string, index: number) => (
                  <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}