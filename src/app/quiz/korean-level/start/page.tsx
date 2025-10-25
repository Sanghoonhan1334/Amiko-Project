'use client'

import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

export default function KoreanLevelStartPage() {
  const router = useRouter()
  const { language } = useLanguage()

  const handleStart = () => {
    router.push('/quiz/korean-level/questions')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* 메인 이미지 */}
        <div className="relative mb-8">
          <img
            src="/quizzes/korean-level/cover/cover.png"
            alt="Korean Level Test"
            className="w-full h-[500px] object-contain rounded-xl shadow-2xl"
          />
          
          {/* 전체 이미지 클릭 가능 */}
          <div 
            className="absolute inset-0 cursor-pointer hover:bg-black/5 transition-colors duration-200 rounded-xl"
            onClick={handleStart}
          ></div>
        </div>

        {/* 설명 텍스트 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4" style={{ 
            fontFamily: 'serif',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}>
            {language === 'ko' ? '한국어 레벨 테스트 1' : 'Prueba de Nivel de Coreano 1'}
          </h1>
          <p className="text-gray-600 mb-6 text-lg">
            {language === 'ko' 
              ? '한국어 실력을 정확하게 측정해보세요!'
              : '¡Mide con precisión tu nivel de coreano!'
            }
          </p>
          <p className="text-sm text-gray-500">
            {language === 'ko' 
              ? '위 이미지를 클릭하여 테스트를 시작하세요'
              : 'Haz clic en la imagen de arriba para comenzar el test'
            }
          </p>
        </div>
      </div>
    </div>
  )
}
