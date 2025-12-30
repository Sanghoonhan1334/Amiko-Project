'use client'

import { useMemo, useEffect } from 'react'

import { useLanguage } from '@/context/LanguageContext'
import { translations } from '@/lib/translations'

type SectionContent = {
  title: string
  content?: string
  items?: string[]
  notes?: string[]
  subSections?: Array<{
    title: string
    content?: string
    items?: string[]
  }>
}

const renderParagraphs = (content?: string) => {
  if (!content) return null
  return content
    .split('\n')
    .filter((paragraph) => paragraph.trim().length > 0)
    .map((paragraph, idx) => (
      <p key={idx} className="text-gray-700 dark:text-gray-300 font-['Inter'] leading-relaxed">
        {paragraph.trim()}
      </p>
    ))
}

const renderItems = (items?: string[]) => {
  if (!items || items.length === 0) return null

  return (
    <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 font-['Inter']">
      {items.map((item, index) => {
        const [label, ...rest] = item.split(':')
        const value = rest.join(':').trim()

        if (value) {
          return (
            <li key={index}>
              <strong>{label.trim()}:</strong> {value}
            </li>
          )
        }

        return <li key={index}>{label.trim()}</li>
      })}
    </ul>
  )
}

export default function PrivacyPolicy() {
  const { language, setLanguage } = useLanguage()

  // 정책 페이지 진입 시 기본 언어를 스페인어로 설정
  useEffect(() => {
    // 페이지 진입 시 한국어로 되어 있으면 스페인어로 변경
    // 사용자가 드롭박스로 변경하면 그대로 유지됨
    if (language === 'ko') {
      setLanguage('es')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 마운트 시 한 번만 실행

  const privacy = useMemo(() => translations[language]?.privacy, [language])

  if (!privacy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300 text-lg">
          Privacy policy content is not available in the selected language.
        </p>
      </div>
    )
  }

  const sectionOrder =
    privacy.sectionOrder && Array.isArray(privacy.sectionOrder)
      ? privacy.sectionOrder
      : Object.keys(privacy.sections || {})

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="container mx-auto px-4 pt-32 md:pt-40 lg:pt-48 pb-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 font-['Inter']">
            {privacy.title || 'Privacy Policy'}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-['Inter']">
            {privacy.lastUpdated}: {privacy.lastUpdatedDate}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white/85 dark:bg-gray-800/80 rounded-2xl shadow-lg divide-y divide-gray-200/70 dark:divide-gray-700/60 overflow-hidden">
          {sectionOrder.map((key) => {
            const section = privacy.sections?.[key] as SectionContent | undefined
            if (!section) return null

            return (
              <section key={key} className="p-6 md:p-8 space-y-4">
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-['Inter']">
                    {section.title}
                  </h2>
                  {renderParagraphs(section.content)}
                  {renderItems(section.items)}
                </div>

                {section.subSections?.map((subSection, idx) => (
                  <div
                    key={idx}
                    className="space-y-2 rounded-xl bg-brand-50/60 dark:bg-gray-900/40 border border-brand-200/60 dark:border-brand-400/30 p-4"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-['Inter']">
                      {subSection.title}
                    </h3>
                    {renderParagraphs(subSection.content)}
                    {renderItems(subSection.items)}
                  </div>
                ))}

                {renderItems(section.notes)}
              </section>
            )
          })}
        </div>

        {/* Footer Contact */}
        <div className="mt-10 text-sm text-gray-600 dark:text-gray-400 text-center font-['Inter']">
          <p>
            {privacy.contactEmail && (
              <>
                Email: <a href={`mailto:${privacy.contactEmail}`} className="underline">{privacy.contactEmail}</a>
              </>
            )}
            {privacy.supportEmail && (
              <>
                {'  '}| Support:{' '}
                <a href={`mailto:${privacy.supportEmail}`} className="underline">
                  {privacy.supportEmail}
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
