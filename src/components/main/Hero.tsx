'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Play, ArrowRight } from 'lucide-react'

export default function Hero() {
  const router = useRouter()

  const handleNavigation = (path: string) => {
    if (path.startsWith('#')) {
      const element = document.querySelector(path)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      router.push(path)
    }
  }

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container max-w-6xl mx-auto px-4 text-center">
        {/* 메인 타이틀 */}
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          한국 문화를 배우는
          <span className="block text-blue-600 mt-2">가장 쉬운 방법</span>
        </h1>
        
        {/* 서브 텍스트 */}
        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12">
          한국인 멘토와 함께하는 문화 교류, 발음 교정, 커뮤니티를 통해 
          진정한 한국 문화를 경험하세요.
        </p>
        
        {/* CTA 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-xl"
            onClick={() => handleNavigation('/booking/create')}
          >
            상담 예약하기
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button 
            variant="outline"
            size="lg"
            className="border-2 border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 px-8 py-4 text-lg rounded-xl"
            onClick={() => handleNavigation('#video')}
          >
            <Play className="w-5 h-5 mr-2" />
            소개 영상 보기
          </Button>
        </div>
      </div>
    </section>
  )
}
