'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useLocale } from '@/hooks/useLocale'

interface SplashSequenceProps {
  onComplete: () => void
}

const copy = {
  ko: {
    keywords: ['한국과', '중남미를', '잇는 다리'],
    slogan1: '검증된 한국인과 함께,',
    slogan2: '문화를 나누는 진짜 커뮤니티',
    cultureLine: '함께, 문화를 나누다.',
    bridgeText: '"한국과 중남미를 잇는 다리"',
  },
  es: {
    keywords: ['Corea', 'y Latinoamérica', 'conectadas'],
    slogan1: 'Comparte con coreanos verificados,',
    slogan2: 'una comunidad real de K-Culture',
    cultureLine: 'Compartiendo cultura.',
    bridgeText: '"Un puente que conecta Corea y Latinoamérica"',
  },
}

export default function SplashSequence({ onComplete }: SplashSequenceProps) {
  const locale = useLocale()
  const t = copy[locale]
  const [mounted, setMounted] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 2초 후 자동으로 완료
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, 2000)

    return () => clearTimeout(timer)
  }, [onComplete])

  // 애니메이션 variants 정의
  const logoVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.8, 
      y: 20
    },
    animate: { 
      opacity: 1, 
      scale: 1.0, 
      y: 0
    },
    exit: { 
      opacity: 0, 
      scale: 1.1,
      y: -10
    }
  }

  const textVariants = {
    initial: { 
      opacity: 0, 
      y: 10,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1.0
    },
    exit: { 
      opacity: 0, 
      y: -5,
      scale: 1.05
    }
  }

  const containerVariants = {
    initial: { opacity: 1 },
    exit: { opacity: 0 }
  }

  const splashContent = (
    <motion.div
      variants={containerVariants}
      initial="initial"
      exit="exit"
      className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-[99999]"
      style={{ 
        position: 'fixed', 
        zIndex: 99999,
        backgroundColor: 'white' // 명시적으로 배경색 설정
      }}
    >
      {/* 로고와 텍스트 표시 */}
      <div className="flex flex-col items-center -mt-32 md:-mt-64">
        {/* 로고 */}
        <motion.div
          variants={logoVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ 
            delay: 0.1, 
            duration: 0.8, 
            ease: [0.25, 0.46, 0.45, 0.94] // 부드러운 cubic-bezier
          }}
          className="flex items-center justify-center"
        >
          {/* 라이트 모드 로고 */}
          <Image
            src="/logos/amiko-logo.png"
            alt="Amiko Logo"
            width={500}
            height={500}
            className="block dark:hidden w-40 h-40 md:w-56 md:h-56 lg:w-[500px] lg:h-[500px]"
            priority
            unoptimized={process.env.NODE_ENV === 'development'}
            onLoad={() => {
              setImageLoaded(true)
              console.log('[Splash] 로고 이미지 로드 완료')
            }}
            onError={(e) => {
              console.error('[Splash] 로고 이미지 로드 실패:', e)
              setImageLoaded(true) // 에러가 나도 계속 진행
            }}
          />
          {/* 다크 모드 로고 */}
          <Image
            src="/logos/amiko-logo-dark.png"
            alt="Amiko Logo"
            width={500}
            height={500}
            className="hidden dark:block w-40 h-40 md:w-56 md:h-56 lg:w-[500px] lg:h-[500px]"
            priority
            unoptimized={process.env.NODE_ENV === 'development'}
            onLoad={() => {
              setImageLoaded(true)
              console.log('[Splash] 다크 모드 로고 이미지 로드 완료')
            }}
            onError={(e) => {
              console.error('[Splash] 다크 모드 로고 이미지 로드 실패:', e)
              setImageLoaded(true) // 에러가 나도 계속 진행
            }}
          />
        </motion.div>

        {/* 텍스트 */}
        <motion.div
          variants={textVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ 
            delay: 0.4, 
            duration: 0.6, 
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className="text-center -mt-8 md:-mt-8 lg:-mt-20"
        >
          <h1 
            className="text-base md:text-lg lg:text-xl font-bold text-gray-700 dark:text-white tracking-wide"
            style={{ 
              fontStyle: 'italic !important',
              transform: 'skewX(-10deg)',
              fontFamily: 'Nanum Gothic, sans-serif'
            }}
          >
            {t.bridgeText}
          </h1>
        </motion.div>
      </div>
    </motion.div>
  )

  if (!mounted) {
    // mounted 전에도 배경은 표시
    return createPortal(
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[99999]" style={{ position: 'fixed', zIndex: 99999 }} />,
      document.body
    )
  }

  return createPortal(splashContent, document.body)
}
