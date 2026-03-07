'use client'

import { useCallback } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { educationKo } from '@/i18n/education/ko'
import { educationEs } from '@/i18n/education/es'

const educationTranslations = {
  ko: educationKo,
  es: educationEs
}

export function useEducationTranslation() {
  const { language } = useLanguage()
  const lang = language === 'ko' ? 'ko' : 'es'

  const te = useCallback((key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = educationTranslations[lang]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key // Return key if not found
      }
    }

    if (typeof value === 'string' && params) {
      return Object.entries(params).reduce(
        (str, [paramKey, paramValue]) => str.replace(`{${paramKey}}`, String(paramValue)),
        value
      )
    }

    return typeof value === 'string' ? value : key
  }, [lang])

  return { te, language: lang }
}
