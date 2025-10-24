'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import ShareBar from '@/components/quiz/ShareBar'

// 이미지 경로 매핑 헬퍼 함수
function roleImg(slug?: string, provided?: string) {
  if (provided && provided.trim() !== '') return provided
  if (!slug || slug.trim() === '') {
    console.warn('[roleImg] slug is missing or empty:', { slug, provided })
    return '/quizzes/idol-roles/default.png' // 기본 이미지 경로
  }
  return `/quizzes/idol-roles/${slug}.png`
}

interface CompatibleData {
  slug: string
  titulo: string
  imagen?: string
}

interface QuizResult {
  slug: string
  titulo: string
  descripcion: string
  cuidado: string
  imagen?: string
  compatible: CompatibleData | null
  incompatible: CompatibleData | null
}

function IdolPositionResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [result, setResult] = useState<QuizResult | null>(null)
  const [compatibleResult, setCompatibleResult] = useState<QuizResult | null>(null)
  const [incompatibleResult, setIncompatibleResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const resultType = searchParams.get('type')

  useEffect(() => {
    if (!resultType) {
      router.push('/quiz/idol-position')
      return
    }

    fetchResult()
  }, [resultType])

  const fetchResult = async () => {
    try {
      // 결과 데이터 가져오기
      const response = await fetch(`/api/quizzes/idol-position/result?type=${resultType}`)
      const data = await response.json()
      
      console.debug("[idol-position] result =", data.result)
      console.debug("compatible =", data.result?.compatible)
      console.debug("incompatible =", data.result?.incompatible)
      
      if (data.success && data.result) {
        setResult(data.result)
        setCompatibleResult(data.result.compatible)
        setIncompatibleResult(data.result.incompatible)
      } else {
        setError('No se pudo cargar el resultado')
      }
    } catch (err) {
      console.error('Error fetching result:', err)
      setError('Ha ocurrido un error al cargar el resultado')
    } finally {
      setLoading(false)
    }
  }

  const hasPairs = useMemo(
    () => Boolean(compatibleResult || incompatibleResult),
    [compatibleResult, incompatibleResult]
  )

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#6C8FCC] to-[#9DB7E3]">
        <div className="text-white text-lg font-medium">Determinando tu posición…</div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#6C8FCC] to-[#9DB7E3]">
        <div className="bg-white/90 text-[#143861] px-5 py-4 rounded-xl shadow">
          {error}
        </div>
      </div>
    )
  }

  // 결과 없음
  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#6C8FCC] to-[#9DB7E3]">
        <div className="bg-white/90 text-[#143861] px-5 py-4 rounded-xl shadow">
          Resultado no disponible.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#4B74B7] to-[#6FA0D9]" style={{ paddingTop: '120px' }}>
      <div className="pb-8">

        {/* 헤더 영역 - 이미지 */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
          className="relative mx-auto mt-8 sm:mt-10 w-full sm:max-w-[600px] md:max-w-[700px]"
        >
          {/* 메인 이미지 */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative w-full aspect-[16/9]"
          >
            <Image
              src={roleImg(result.slug, result.imagen)}
              alt={result.titulo}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 500px, (max-width: 768px) 600px, 700px"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </motion.div>
        </motion.div>

        {/* 본문 섹션 1 - "¿Mi posición?" */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
          className="mt-8 sm:mt-10 max-w-2xl mx-auto bg-[#244A86] text-white p-4 sm:p-5 ring-1 ring-white/10 mx-4"
        >
          <div className="text-lg sm:text-xl font-bold mb-3 text-center">¿Mi posición?</div>
          {result.descripcion && (
            <div className="text-sm sm:text-base leading-relaxed opacity-95">
              {result.descripcion}
            </div>
          )}
        </motion.div>

        {/* 본문 섹션 2 - "Puntos a tener en cuenta" */}
        {result.cuidado && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}
            className="mt-6 sm:mt-8 max-w-2xl mx-auto bg-[#244A86] text-white p-4 sm:p-5 ring-1 ring-white/10 mx-4"
          >
            <div className="text-lg sm:text-xl font-bold mb-3 text-center">Puntos a tener en cuenta</div>
            <div className="text-sm sm:text-base leading-relaxed opacity-95">
              {result.cuidado}
            </div>
          </motion.div>
        )}

        {/* 궁합 카드 섹션 */}
        {hasPairs && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.2 }}
            className="max-w-2xl mx-auto mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mx-4"
          >
            {/* 잘 맞는 멤버 */}
            {compatibleResult && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 220 }}
                className="bg-[#335C97] text-white p-4 ring-1 ring-white/10"
              >
                <div className="text-sm font-semibold opacity-90 mb-2">Me llevo bien con</div>
                <div className="flex items-center gap-3">
                  <div className="relative w-24 h-24">
                    <Image
                      src={roleImg(compatibleResult.slug, compatibleResult.imagen)}
                      alt={compatibleResult.titulo}
                      fill
                      className="object-contain ring-2 ring-white/20 shadow-md"
                      sizes="96px"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                  <div className="mt-2 text-sm sm:text-base font-medium">
                    {compatibleResult.titulo}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 안 맞는 멤버 */}
            {incompatibleResult && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 220 }}
                className="bg-[#335C97] text-white p-4 ring-1 ring-white/10"
              >
                <div className="text-sm font-semibold opacity-90 mb-2">Me llevo mal con</div>
                <div className="flex items-center gap-3">
                  <div className="relative w-24 h-24 opacity-80">
                    <Image
                      src={roleImg(incompatibleResult.slug, incompatibleResult.imagen)}
                      alt={incompatibleResult.titulo}
                      fill
                      className="object-contain ring-2 ring-white/20 shadow-md"
                      sizes="96px"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                  <div className="mt-2 text-sm sm:text-base font-medium">
                    {incompatibleResult.titulo}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

            {/* 하단 링크들 */}
            <div className="mt-8 text-center mx-4">
              <button
                className="text-white/80 hover:text-white underline underline-offset-4 transition"
                onClick={() => {
                  router.push('/quiz/idol-position/result/all');
                }}
              >
                Ver todos los tipos →
              </button>
            </div>

            {/* 공유바: 결과 타이틀과 이미지 전달 */}
            <ShareBar title={result?.titulo ?? "Mi resultado"} imageUrl={result?.imagen} />
      </div>
    </div>
  )
}

export default function IdolPositionResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#6C8FCC] to-[#9DB7E3]">
        <div className="text-white text-lg font-medium">Cargando...</div>
      </div>
    }>
      <IdolPositionResultContent />
    </Suspense>
  )
}
