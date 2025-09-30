'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function FeedbackPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-['Inter']">
            {t('footer.feedback')}
          </h1>
          <p className="text-lg text-gray-600 font-['Inter']">
            {t('feedback.subtitle')}
          </p>
        </div>

        {/* 본문 */}
        <div className="bg-white/80 rounded-2xl shadow-lg p-8 space-y-8">
          {/* 피드백 안내 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('feedback.sections.guidelines.title')}
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>{t('feedback.sections.guidelines.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {t('feedback.sections.guidelines.items').map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* 피드백 유형 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('feedback.sections.types.title')}
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>{t('feedback.sections.types.content')}</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">{t('feedback.sections.types.bug.title')}</h3>
                  <p className="text-green-700">{t('feedback.sections.types.bug.content')}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">{t('feedback.sections.types.feature.title')}</h3>
                  <p className="text-blue-700">{t('feedback.sections.types.feature.content')}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">{t('feedback.sections.types.ux.title')}</h3>
                  <p className="text-purple-700">{t('feedback.sections.types.ux.content')}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">{t('feedback.sections.types.general.title')}</h3>
                  <p className="text-orange-700">{t('feedback.sections.types.general.content')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* 피드백 제출 방법 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('feedback.sections.submission.title')}
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>{t('feedback.sections.submission.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {t('feedback.sections.submission.items').map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* 피드백 처리 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('feedback.sections.process.title')}
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>{t('feedback.sections.process.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {t('feedback.sections.process.items').map((item: string, index: number) => (
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
