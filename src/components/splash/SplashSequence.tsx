'use client'

import { useEffect } from 'react'
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
    bridgeText: '한국과 중남미를 잇는 다리',
  },
  es: {
    keywords: ['Corea', 'y Latinoamérica', 'conectadas'],
    slogan1: 'Comparte con coreanos verificados,',
    slogan2: 'una comunidad real de K-Culture',
    cultureLine: 'Compartiendo cultura.',
    bridgeText: 'Un puente que conecta Corea y Latinoamérica',
  },
}

export default function SplashSequence({ onComplete }: SplashSequenceProps) {
  const locale = useLocale()
  const t = copy[locale]

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
      y: 20,
      filter: 'drop-shadow(0 0 0px rgba(232,74,95,0))'
    },
    animate: { 
      opacity: 1, 
      scale: 1.0, 
      y: 0,
      filter: 'drop-shadow(0 0 15px rgba(232,74,95,0.4))'
    },
    exit: { 
      opacity: 0, 
      scale: 1.1,
      y: -10,
      filter: 'drop-shadow(0 0 0px rgba(232,74,95,0))'
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

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      exit="exit"
      className="fixed inset-0 bg-white flex items-center justify-center z-50"
    >
      {/* 로고와 텍스트 표시 */}
      <div className="flex flex-col items-center justify-center space-y-6">
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
          <Image
            src="/amiko-logo.png"
            alt="Amiko Logo"
            width={300}
            height={300}
            className="w-30 h-30 md:w-40 md:h-40 lg:w-[300px] lg:h-[300px]"
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
          className="text-center"
        >
          <h1 className="text-lg md:text-xl lg:text-2xl font-medium text-gray-700 tracking-wide">
            {t.bridgeText}
          </h1>
        </motion.div>
      </div>
    </motion.div>
  )
}
