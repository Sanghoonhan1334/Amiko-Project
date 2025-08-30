'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language } from '@/lib/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ko')
  const [mounted, setMounted] = useState(false)

  // 컴포넌트가 마운트된 후에만 localStorage 접근
  useEffect(() => {
    setMounted(true)
    
    try {
      const savedLanguage = localStorage.getItem('amiko-language')
      if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'es')) {
        setLanguage(savedLanguage as Language)
        console.log('LanguageContext: Loaded language from localStorage:', savedLanguage)
      } else {
        // 브라우저 언어 감지
        const browserLang = navigator.language
        if (browserLang.startsWith('es')) {
          setLanguage('es')
          localStorage.setItem('amiko-language', 'es')
          console.log('LanguageContext: Set language to Spanish based on browser language')
        } else {
          setLanguage('ko')
          localStorage.setItem('amiko-language', 'ko')
          console.log('LanguageContext: Set language to Korean (default)')
        }
      }
    } catch (error) {
      console.error('LanguageContext: Error accessing localStorage:', error)
      setLanguage('ko')
    }
  }, [])

  const t = (key: string): string => {
    try {
      if (!mounted) {
        console.log('LanguageContext: Not mounted yet, returning key:', key)
        return key
      }

      console.log('LanguageContext: Translating key:', key, 'for language:', language)
      console.log('LanguageContext: Available languages:', Object.keys(translations))
      console.log('LanguageContext: Current language object:', translations[language])

      const keys = key.split('.')
      let value: any = translations[language]
      
      console.log('LanguageContext: Starting with value:', value)
      
      for (const k of keys) {
        console.log('LanguageContext: Processing key:', k)
        if (value && typeof value === 'object' && k in value) {
          value = value[k]
          console.log('LanguageContext: Found value for key', k, ':', value)
        } else {
          console.warn(`LanguageContext: Translation key not found: ${key} in language ${language}`)
          console.warn('LanguageContext: Available keys in current level:', value ? Object.keys(value) : 'undefined')
          return key
        }
      }
      
      if (typeof value === 'string') {
        console.log(`LanguageContext: Translation found for ${key}:`, value)
        return value
      } else {
        console.warn(`LanguageContext: Translation value is not a string for key: ${key}`, value)
        return key
      }
    } catch (error) {
      console.error(`LanguageContext: Error translating key ${key}:`, error)
      return key
    }
  }

  const toggleLanguage = () => {
    const newLanguage = language === 'ko' ? 'es' : 'ko'
    setLanguage(newLanguage)
    try {
      localStorage.setItem('amiko-language', newLanguage)
      console.log('LanguageContext: Language toggled to:', newLanguage)
    } catch (error) {
      console.error('LanguageContext: Error saving language to localStorage:', error)
    }
  }

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t,
    toggleLanguage
  }

  console.log('LanguageContext: Rendering with language:', language, 'mounted:', mounted)

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
