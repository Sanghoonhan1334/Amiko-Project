'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function FeedbackPage() {
  const { t } = useLanguage()
  
  console.log('Current language:', t('language'))
  console.log('feedback.sections.guidelines.title:', t('feedback.sections.guidelines.title'))
  console.log('feedback.sections.guidelines.content:', t('feedback.sections.guidelines.content'))
  console.log('feedback.sections.types.title:', t('feedback.sections.types.title'))
  console.log('feedback.sections.types.content:', t('feedback.sections.types.content'))

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="container mx-auto px-4 pt-32 md:pt-40 lg:pt-48 pb-12 max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
            {t('feedback.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-['Inter']">
            {t('feedback.subtitle')}
          </p>
        </div>

        {/* 본문 */}
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg p-8 space-y-8">
          {/* 피드백 안내 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('feedback.sections.guidelines.title') || '피드백 가이드라인'}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-['Inter']">
              <p>{t('feedback.sections.guidelines.content') || '효과적인 피드백을 위한 가이드라인입니다.'}</p>
              <ul className="list-disc pl-6 space-y-2">
                {(() => {
                  const items = t('feedback.sections.guidelines.items');
                  if (!Array.isArray(items)) return null;
                  return items.map((item: string, index: number) => (
                    <li key={index} className="dark:text-gray-400">{item}</li>
                  ));
                })()}
              </ul>
            </div>
          </section>

          {/* 피드백 유형 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('feedback.sections.types.title') || '피드백 유형'}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-['Inter']">
              <p>{t('feedback.sections.types.content') || '다음과 같은 피드백을 받고 있습니다.'}</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-red-500">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('feedback.sections.types.bug.title') || '버그 신고'}</h3>
                  <p className="text-gray-700 dark:text-gray-300">{t('feedback.sections.types.bug.content') || '서비스에서 발견한 오류나 문제점'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('feedback.sections.types.feature.title')}</h3>
                  <p className="text-gray-700 dark:text-gray-300">{t('feedback.sections.types.feature.content')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-purple-500">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('feedback.sections.types.ux.title')}</h3>
                  <p className="text-gray-700 dark:text-gray-300">{t('feedback.sections.types.ux.content')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-orange-500">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('feedback.sections.types.general.title')}</h3>
                  <p className="text-gray-700 dark:text-gray-300">{t('feedback.sections.types.general.content')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* 피드백 제출 방법 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('feedback.sections.submission.title')}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-['Inter']">
              <p>{t('feedback.sections.submission.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {(() => {
                  const items = t('feedback.sections.submission.items');
                  if (!Array.isArray(items)) return null;
                  return items.map((item: string, index: number) => (
                    <li key={index} className="dark:text-gray-400">{item}</li>
                  ));
                })()}
              </ul>
            </div>
          </section>

          {/* 피드백 처리 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
              {t('feedback.sections.process.title')}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-['Inter']">
              <p>{t('feedback.sections.process.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {(() => {
                  const items = t('feedback.sections.process.items');
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
