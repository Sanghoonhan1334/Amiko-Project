'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Sun, Moon } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export default function DarkModeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-32 right-4 z-50 h-11 w-11 rounded-full shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
        disabled
      >
        <div className="h-5 w-5 animate-pulse bg-gray-300 dark:bg-gray-600 rounded"></div>
      </Button>
    )
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="icon"
      className="fixed bottom-32 right-4 z-50 h-11 w-11 rounded-full shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
      title={theme === 'dark' ? t('theme.lightMode') : t('theme.darkMode')}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      )}
    </Button>
  )
}
