'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function HelpPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50">
      <div className="container mx-auto px-4 pt-32 md:pt-40 lg:pt-48 pb-12 max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-['Inter']">
            {t('help.title')}
          </h1>
          <p className="text-lg text-gray-600 font-['Inter']">
            {t('help.subtitle')}
          </p>
        </div>

        {/* 본문 */}
        <div className="bg-white/80 rounded-2xl shadow-lg p-8 space-y-8">
          {/* 도움말 섹션들 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('help.sections.gettingStarted.title')}
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>{t('help.sections.gettingStarted.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {(() => {
                  const items = t('help.sections.gettingStarted.items');
                  if (!Array.isArray(items)) return null;
                  return items.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ));
                })()}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('help.sections.videoChat.title')}
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>{t('help.sections.videoChat.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {(() => {
                  const items = t('help.sections.videoChat.items');
                  if (!Array.isArray(items)) return null;
                  return items.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ));
                })()}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('help.sections.community.title')}
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>{t('help.sections.community.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {(() => {
                  const items = t('help.sections.community.items');
                  if (!Array.isArray(items)) return null;
                  return items.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ));
                })()}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('help.sections.points.title')}
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>{t('help.sections.points.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {(() => {
                  const items = t('help.sections.points.items');
                  if (!Array.isArray(items)) return null;
                  return items.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ));
                })()}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              {t('help.sections.troubleshooting.title')}
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>{t('help.sections.troubleshooting.content')}</p>
              <ul className="list-disc pl-6 space-y-2">
                {(() => {
                  const items = t('help.sections.troubleshooting.items');
                  if (!Array.isArray(items)) return null;
                  return items.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
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
