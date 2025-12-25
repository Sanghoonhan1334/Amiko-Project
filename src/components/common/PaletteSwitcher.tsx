'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Paintbrush } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/lib/analytics'

type PaletteKey = 'default' | 'tropical' | 'sunset' | 'mexican'

const PALETTES: PaletteKey[] = ['default', 'tropical', 'sunset', 'mexican']
const STORAGE_KEY = 'amiko-palette'

export default function PaletteSwitcher() {
  const [mounted, setMounted] = useState(false)
  const [palette, setPalette] = useState<PaletteKey>('default')
  const pathname = usePathname()

  // Read initial palette early on mount
  useEffect(() => {
    setMounted(true)
    try {
      const saved = (localStorage.getItem(STORAGE_KEY) as PaletteKey) || 'default'
      applyPalette(saved)
      setPalette(saved)
    } catch {
      applyPalette('default')
      setPalette('default')
    }
  }, [])

  const nextPalette = useMemo<PaletteKey>(() => {
    const idx = PALETTES.indexOf(palette)
    const nextIdx = (idx + 1) % PALETTES.length
    return PALETTES[nextIdx]
  }, [palette])
  
  // 인증센터 페이지에서는 플로팅 버튼 숨김
  if (pathname?.startsWith('/verification')) {
    return null
  }

  function applyPalette(p: PaletteKey) {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-palette', p)
  }

  function handleTogglePalette() {
    const target = nextPalette
    applyPalette(target)
    setPalette(target)
    try {
      localStorage.setItem(STORAGE_KEY, target)
    } catch {}
    // GA4 event
    trackEvent('select_palette', { palette: target })
  }

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-36 right-2 z-40 h-11 w-11 sm:h-14 sm:w-14 md:h-14 md:w-14 rounded-full shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 sm:bottom-24 sm:right-8 md:bottom-36 md:right-16"
        disabled
      >
        <div className="h-5 w-5 animate-pulse bg-gray-300 dark:bg-gray-600 rounded" />
      </Button>
    )
  }

  // Default palette: no colored border/icon, just neutral gray
  const isDefault = palette === 'default'
  
  return (
    <Button
      onClick={handleTogglePalette}
      variant="outline"
      size="icon"
      className={`fixed bottom-36 right-2 z-40 pointer-events-auto h-11 w-11 sm:h-14 sm:w-14 md:h-14 md:w-14 rounded-full shadow-lg hover:opacity-95 transition-all duration-300 sm:bottom-24 sm:right-8 md:bottom-36 md:right-16 ${
        isDefault
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
          : ''
      }`}
      style={
        isDefault
          ? {
              borderWidth: 1,
            }
          : {
              borderColor: 'hsl(var(--primary))',
              backgroundColor: 'hsl(var(--muted))',
              color: 'hsl(var(--primary))',
              borderWidth: 2,
            }
      }
      title={`Palette: ${palette}`}
    >
      <Paintbrush className={`h-5 w-5 sm:h-6 sm:w-6 md:h-6 md:w-6 ${isDefault ? 'text-gray-500 dark:text-gray-400' : ''}`} />
    </Button>
  )
}


