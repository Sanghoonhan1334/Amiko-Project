'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function PrivacyPolicy() {
  const { t } = useLanguage()
  
  console.log('privacy.title:', t('privacy.title'))
  console.log('privacy.lastUpdated:', t('privacy.lastUpdated'))
  console.log('privacy.lastUpdatedDate:', t('privacy.lastUpdatedDate'))

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="container mx-auto px-4 pt-32 md:pt-40 lg:pt-48 pb-12 max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
            {t('privacy.title') || '개인정보처리방침'}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-['Inter']">
            {t('privacy.lastUpdated')}: {t('privacy.lastUpdatedDate')}
          </p>
        </div>

        {/* 본문 */}
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg p-8 space-y-8">
          {/* 1. 개인정보 수집 및 이용 목적 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('privacy.sections.purpose.title')}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-['Inter']">
              <p>{t('privacy.sections.purpose.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {(() => {
                  const items = t('privacy.sections.purpose.items');
                  console.log('purpose.items:', items, typeof items, Array.isArray(items));
                  if (!Array.isArray(items)) return null;
                  return items.map((item: string, index: number) => (
                    <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                  ));
                })()}
              </ul>
            </div>
          </section>

          {/* 2. 수집하는 개인정보 항목 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('privacy.sections.collection.title')}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-['Inter']">
              <p>{t('privacy.sections.collection.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {(() => {
                  const items = t('privacy.sections.collection.items');
                  if (!Array.isArray(items)) return null;
                  return items.map((item: string, index: number) => (
                    <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                  ));
                })()}
              </ul>
            </div>
          </section>

          {/* 3. 개인정보 보유 및 이용기간 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('privacy.sections.retention.title')}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-['Inter']">
              <p>{t('privacy.sections.retention.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {(() => {
                  const items = t('privacy.sections.retention.items');
                  if (!Array.isArray(items)) return null;
                  return items.map((item: string, index: number) => (
                    <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                  ));
                })()}
              </ul>
            </div>
          </section>

          {/* 4. 개인정보 주체의 권리 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('privacy.sections.rights.title')}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-['Inter']">
              <p>{t('privacy.sections.rights.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {(() => {
                  const items = t('privacy.sections.rights.items');
                  if (!Array.isArray(items)) return null;
                  return items.map((item: string, index: number) => (
                    <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
                  ));
                })()}
              </ul>
            </div>
          </section>

          {/* 5. 개인정보 보호책임자 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('privacy.sections.contactInfo.title')}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-['Inter']">
              <p>{t('privacy.sections.contactInfo.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {(() => {
                  const items = t('privacy.sections.contactInfo.items');
                  if (!Array.isArray(items)) return null;
                  return items.map((item: string, index: number) => (
                    <li key={index}><strong>{item.split(':')[0]}:</strong>{item.split(':')[1]}</li>
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