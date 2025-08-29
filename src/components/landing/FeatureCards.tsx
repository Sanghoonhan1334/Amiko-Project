'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Video, MessageCircle, Sparkles, ArrowRight, Gift, Trophy, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function FeatureCards() {
  const router = useRouter()

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-brand-100 to-mint-100 rounded-3xl px-6 py-3 mb-6">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <span className="text-brand-700 font-medium">Amiko만의 특별한 서비스</span>
          </div>
          
          <h2 className="heading-primary mb-6">
            🎯 세 가지 핵심 기능으로
            <span className="block text-brand-600 mt-2">한국 문화를 경험하세요</span>
          </h2>
          
          <p className="text-body text-lg max-w-3xl mx-auto">
            가볍게 시작하고, 포인트를 모으며, 특별한 라운지에서 소통하는
            <br className="hidden md:block" />
            완벽한 한국 문화 교류 플랫폼
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* 만남(영상) — 15분 쿠폰 */}
          <div className="group">
            <div className="card p-8 text-center h-full transform hover:scale-[1.01] transition-all duration-300 hover:shadow-2xl border-2 border-transparent hover:border-brand-200">
              {/* 이모지 아이콘 */}
              <div className="w-24 h-24 bg-gradient-to-br from-brand-100 to-brand-200 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-4xl">🎥</span>
              </div>
              
              {/* 배지 */}
              <Badge className="bg-brand-100 text-brand-700 mb-4">
                <Gift className="w-4 h-4 mr-1" />
                15분 쿠폰
              </Badge>
              
              <h3 className="heading-secondary mb-4 text-brand-800">
                만남 (영상)
              </h3>
              
              <p className="text-body mb-6 leading-relaxed">
                한국인 친구와 15분 무료 상담으로
                <br />
                <span className="font-medium text-brand-700">가볍게 시작</span>할 수 있어요
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Video className="w-4 h-4 text-brand-500" />
                  <span>화상 상담 지원</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4 text-brand-500" />
                  <span>검증된 한국인 친구</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-brand-300 text-brand-700 hover:bg-brand-50 hover:border-brand-400 transition-all duration-300"
                onClick={() => router.push('/main')}
              >
                쿠폰 받기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* 커뮤니티(Q&A) — 포인트 리워드 */}
          <div className="group">
            <div className="card p-8 text-center h-full transform hover:scale-[1.01] transition-all duration-300 hover:shadow-2xl border-2 border-transparent hover:border-mint-200">
              {/* 이모지 아이콘 */}
              <div className="w-24 h-24 bg-gradient-to-br from-mint-100 to-mint-200 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-4xl">💬</span>
              </div>
              
              {/* 배지 */}
              <Badge className="bg-mint-100 text-mint-700 mb-4">
                <Trophy className="w-4 h-4 mr-1" />
                포인트 리워드
              </Badge>
              
              <h3 className="heading-secondary mb-4 text-mint-800">
                커뮤니티 (Q&A)
              </h3>
              
              <p className="text-body mb-6 leading-relaxed">
                질문하고 답변하며 포인트를 모아
                <br />
                <span className="font-medium text-mint-700">특별한 혜택</span>을 받아보세요
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <MessageCircle className="w-4 h-4 text-mint-500" />
                  <span>5개 카테고리</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Trophy className="w-4 h-4 text-mint-500" />
                  <span>일일 포인트 상한</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-mint-300 text-mint-700 hover:bg-mint-50 hover:border-mint-400 transition-all duration-300"
                onClick={() => router.push('/main')}
              >
                커뮤니티 가기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* ZEP 라운지 — 주말 1회 운영자 */}
          <div className="group">
            <div className="card p-8 text-center h-full transform hover:scale-[1.01] transition-all duration-300 hover:shadow-2xl border-2 border-transparent hover:border-sky-200">
              {/* 이모지 아이콘 */}
              <div className="w-24 h-24 bg-gradient-to-br from-sky-100 to-sky-200 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-4xl">🫧</span>
              </div>
              
              {/* 배지 */}
              <Badge className="bg-sky-100 text-sky-700 mb-4">
                <Sparkles className="w-4 h-4 mr-1" />
                주말 특별 운영
              </Badge>
              
              <h3 className="heading-secondary mb-4 text-sky-800">
                ZEP 라운지
              </h3>
              
              {/* 미니 달력 */}
              <div className="bg-gradient-to-r from-sky-50 to-brand-50 rounded-2xl p-4 mb-4 border border-sky-200">
                <div className="text-center mb-3">
                  <div className="text-2xl font-bold text-sky-700">30</div>
                  <div className="text-sm text-sky-600">8월</div>
                  <div className="mt-2">
                    <Badge className="bg-sky-100 text-sky-700 border-sky-300 text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      토요일
                    </Badge>
                  </div>
                </div>
                <div className="text-center text-xs text-gray-600 space-y-1">
                  <div>🇰🇷 한국: 20:00 (KST)</div>
                  <div>🇵🇪 페루: 06:00 (PET)</div>
                  <div>🇲🇽 멕시코: 05:00 (CST)</div>
                </div>
              </div>
              
              <p className="text-body mb-6 leading-relaxed">
                주말 1회 운영자와 함께하는
                <br />
                <span className="font-medium text-sky-700">서로 알아가는 시간</span>을 경험해보세요
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4 text-sky-500" />
                  <span>최대 30명 참여</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Sparkles className="w-4 h-4 text-sky-500" />
                  <span>자유로운 소통 시간</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 transition-all duration-300"
                onClick={() => router.push('/lounge')}
              >
                라운지 안내
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
