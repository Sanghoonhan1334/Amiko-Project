'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function TermsOfService() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-['Inter']">
            {t('terms.title')}
          </h1>
          <p className="text-lg text-gray-600 font-['Inter']">
            {t('terms.lastUpdated')}: {t('terms.lastUpdatedDate')}
          </p>
        </div>

        {/* 본문 */}
        <div className="bg-white/80 rounded-2xl shadow-lg p-8 space-y-8">
          {/* 서비스 소개 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('terms.sections.introduction.title')}
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>{t('terms.sections.introduction.content')}</p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">{t('terms.sections.introduction.services.title')}</h3>
                <ul className="list-disc pl-6 space-y-1 text-blue-700">
                  {t('terms.sections.introduction.services.items').map((item: string, index: number) => (
                    <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 약관의 효력 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('terms.sections.effectiveness.title')}
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>{t('terms.sections.effectiveness.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {t('terms.sections.effectiveness.items').map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* 회원가입 및 관리 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('terms.sections.membership.title')}
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>{t('terms.sections.membership.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {t('terms.sections.membership.items').map((item: string, index: number) => (
                  <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* 서비스 이용 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('terms.sections.service.title')}
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>{t('terms.sections.service.content')}</p>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">{t('terms.sections.service.prohibited.title')}</h3>
                <ul className="list-disc pl-6 space-y-1 text-red-700">
                  {t('terms.sections.service.prohibited.items').map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 책임의 한계 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('terms.sections.liability.title')}
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>{t('terms.sections.liability.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {t('terms.sections.liability.items').map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}