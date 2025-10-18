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
  },
  es: {
    keywords: ['Corea', 'y Latinoamérica', 'conectadas'],
    slogan1: 'Comparte con coreanos verificados,',
    slogan2: 'una comunidad real de K-Culture',
    cultureLine: 'Compartiendo cultura.',
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
      opacity: 1, 
      scale: 1.0, 
      y: 0,
      filter: 'drop-shadow(0 0 10px rgba(232,74,95,0.3))'
    },
    animate: { 
      opacity: 1, 
      scale: 1.0, 
      y: 0,
      filter: 'drop-shadow(0 0 10px rgba(232,74,95,0.3))'
    },
    exit: { opacity: 0 }
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
      {/* 로고만 표시 - 인스타그램 스타일 */}
      <motion.div
        variants={logoVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ 
          delay: 0.2, 
          duration: 0.6, 
          ease: 'easeOut' 
        }}
        className="flex items-center justify-center"
      >
        <Image
          src="/amiko-logo.png"
          alt="Amiko Logo"
          width={120}
          height={120}
          className="w-30 h-30 md:w-40 md:h-40 lg:w-48 lg:h-48"
          style={{
            width: '120px',
            height: '120px',
            display: 'block'
          }}
        />
      </motion.div>
    </motion.div>
  )
}
