'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Sparkles, Heart, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Hero() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const router = useRouter()

  return (
    <section className="min-h-screen relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/hanok-bg.png)' }}>
      {/* 반투명 검정 오버레이 */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      {/* 배경 장식 요소들 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container-custom text-center relative z-10 flex items-center justify-center min-h-screen px-4">
        {/* 메인 슬로건 */}
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-3xl px-6 py-3 mb-8 shadow-2xl border border-white/30">
            <Sparkles className="w-5 h-5 text-white" />
            <span className="text-white font-medium">한국-라틴 청년 소통 플랫폼</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 drop-shadow-2xl">
            <span className="block">Amiko</span>
            <span className="block text-indigo-200 mt-2">✨</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed mb-8 drop-shadow-lg">
            <span className="inline-flex items-center gap-2">
              <Heart className="w-6 h-6 text-pink-300" />
              한국 문화를 사랑하는
            </span>
            <br />
            <span className="inline-flex items-center gap-2">
              <Globe className="w-6 h-6 text-indigo-300" />
              전 세계 친구들과 소통하는 특별한 공간
            </span>
          </p>

          {/* 대표자 영상 썸네일 */}
          <div className="max-w-3xl mx-auto mb-8">
            <div 
              className="relative group cursor-pointer transform hover:scale-[1.02] transition-transform duration-300"
              onClick={() => setIsVideoModalOpen(true)}
            >
              <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/30">
                <div className="aspect-video bg-gradient-to-br from-indigo-100/20 via-pink-100/20 to-purple-100/20 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-2xl border border-white/30">
                      <Play className="w-12 h-12 text-white ml-1 drop-shadow-lg" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-white font-semibold text-lg drop-shadow-lg">대표자 소개 영상</p>
                      <p className="text-white/80 text-sm drop-shadow">클릭해서 영상 보기</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 호버 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent group-hover:from-black/40 transition-all duration-300 rounded-3xl"></div>
              
              {/* 재생 버튼 장식 */}
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-2 shadow-2xl border border-white/30">
                <Play className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* CTA 버튼 */}
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-indigo-400 to-pink-400 hover:from-indigo-500 hover:to-pink-500 text-white px-12 py-6 text-xl rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border border-white/30 backdrop-blur-sm"
            onClick={() => router.push('/sign-up')}
          >
            <Sparkles className="w-6 h-6 mr-3" />
            시작하기
          </Button>

          {/* 추가 설명 */}
          <p className="text-white/90 mt-8 text-lg drop-shadow-lg">
            지금 가입하고 한국 문화의 첫걸음을 시작해보세요! 🚀
          </p>
        </div>
      </div>

      {/* 비디오 모달 */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-5xl">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute -top-16 right-0 text-white hover:text-gray-300 text-3xl bg-white/20 rounded-full w-12 h-12 flex items-center justify-center backdrop-blur-sm"
            >
              ✕
            </button>
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                src="https://www.youtube.com/embed/6BdrKjSMBJY?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1"
                title="Amiko 대표자 소개 영상"
                className="absolute top-0 left-0 w-full h-full rounded-2xl shadow-2xl"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
