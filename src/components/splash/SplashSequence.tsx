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

  // 3.5초 후 자동으로 완료
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, 3500)

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
      className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50"
    >
      {/* 로고 */}
      <motion.div
        variants={logoVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ 
          delay: 0.5, 
          duration: 0.8, 
          ease: 'easeOut' 
        }}
        className="-mt-12 md:-mt-16 lg:-mt-20 -mb-4 md:-mb-6 lg:-mb-8"
      >
        <Image
          src="/amiko-logo.png"
          alt="Amiko Logo"
          width={160}
          height={160}
          className="w-40 h-40 md:w-80 md:h-80 lg:w-96 lg:h-96"
          style={{
            width: '160px',
            height: '160px',
            display: 'block',
            margin: '0 auto'
          }}
        />
      </motion.div>

      {/* 키워드 그룹 */}
      <motion.div 
        className="flex items-center gap-4 md:gap-8 lg:gap-12 -mt-4 md:-mt-6 lg:-mt-8 mb-8"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ 
          delay: 1.60, 
          duration: 0.8, 
          ease: 'easeOut' 
        }}
      >
        {/* 키워드 1: 한국과 / Corea */}
        <div 
          className="text-[22px] md:text-4xl lg:text-5xl font-medium text-[#111]"
          style={{
            fontSize: '22px',
            fontWeight: '500',
            color: '#111111',
            lineHeight: '1.2'
          }}
        >
          {t.keywords[0]}
        </div>

        {/* 키워드 2: 중남미를 / y Latinoamérica */}
        <div 
          className="text-[22px] md:text-4xl lg:text-5xl font-medium text-[#111]"
          style={{
            fontSize: '22px',
            fontWeight: '500',
            color: '#111111',
            lineHeight: '1.2'
          }}
        >
          {t.keywords[1]}
        </div>

        {/* 키워드 3: 잇는 다리 / conectadas */}
        <div 
          className="text-[22px] md:text-4xl lg:text-5xl font-medium text-[#111]"
          style={{
            fontSize: '22px',
            fontWeight: '500',
            color: '#111111',
            lineHeight: '1.2'
          }}
        >
          {t.keywords[2]}
        </div>
      </motion.div>

      {/* 슬로건 */}
      <motion.div 
        className="text-center mb-6"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ 
          delay: 2.20, 
          duration: 0.8, 
          ease: 'easeOut' 
        }}
      >
        <div 
          className="text-[14px] md:text-2xl lg:text-3xl text-[#444] mb-1"
          style={{
            fontSize: '14px',
            color: '#444444',
            lineHeight: '1.4'
          }}
        >
          {t.slogan1}
        </div>
        <div 
          className="text-[14px] md:text-2xl lg:text-3xl text-[#444]"
          style={{
            fontSize: '14px',
            color: '#444444',
            lineHeight: '1.4'
          }}
        >
          {t.slogan2}
        </div>
      </motion.div>

      {/* 문화 라인 */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ 
          delay: 2.50, 
          duration: 0.8, 
          ease: 'easeOut' 
        }}
        className="text-[13px] md:text-xl lg:text-2xl text-[#E84A5F] font-medium"
        style={{
          fontSize: '13px',
          color: '#E84A5F',
          fontWeight: '500',
          lineHeight: '1.2',
          filter: 'drop-shadow(0 0 8px rgba(232,74,95,0.2))'
        }}
      >
        {t.cultureLine}
      </motion.div>

    </motion.div>
  )
}
