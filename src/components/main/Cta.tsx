'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, Star, Users, Clock } from 'lucide-react'

export default function Cta() {
  const router = useRouter()

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 text-center">
        {/* 메인 CTA */}
        <div className="mb-8 sm:mb-10 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 max-w-2xl sm:max-w-3xl mx-auto mb-6 sm:mb-8">
            Amiko와 함께 한국 문화의 새로운 세계를 경험해보세요
          </p>
          
          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-10 lg:mb-12">
            <Button 
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-xl font-semibold w-full sm:w-auto"
              onClick={() => handleNavigation('/booking/create')}
            >
              지금 만남 예약하기
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-xl font-semibold w-full sm:w-auto"
              onClick={() => handleNavigation('/consultants')}
            >
              멘토 둘러보기
            </Button>
          </div>
        </div>
        
        {/* 신뢰 요소들 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">4.9/5 평점</h3>
            <p className="text-blue-100 text-sm sm:text-base">1,000+ 만족한 학습자</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Users className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">50+ 전문 멘토</h3>
            <p className="text-blue-100 text-sm sm:text-base">검증된 전문가들</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">24/7 지원</h3>
            <p className="text-blue-100 text-sm sm:text-base">언제든지 이용 가능</p>
          </div>
        </div>
        
        {/* 추가 안내 */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <p className="text-blue-100 mb-4">
                            첫 만남은 무료로 진행됩니다
          </p>
          <p className="text-sm text-blue-200">
            멘토와의 첫 만남을 통해 Amiko의 특별한 서비스를 경험해보세요
          </p>
        </div>
      </div>
    </section>
  )
}
