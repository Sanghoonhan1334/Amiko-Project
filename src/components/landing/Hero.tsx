'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export default function Hero() {
  const router = useRouter()
  const { t } = useLanguage()
  const swiperRef = useRef<any>(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const [showVideo, setShowVideo] = useState(false)

  return (
    <section className="h-screen relative overflow-hidden bg-contain bg-no-repeat" style={{ backgroundImage: 'url(/hanok-bg.png)', backgroundPosition: 'center 30%' }}>
      {/* 반투명 검정 오버레이 */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      {/* 배경 장식 요소들 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container-custom text-center relative z-10 flex items-start justify-center h-screen px-4 pt-40">
        <div className="w-full">

          {/* 슬라이더 */}
          <Swiper
            ref={swiperRef}
            modules={[Navigation, Pagination]}
            spaceBetween={0}
            slidesPerView={1}
            navigation={false}
            allowTouchMove={true}
            mousewheel={true}
            pagination={{
              clickable: true,
              el: '.swiper-pagination',
              bulletClass: 'swiper-pagination-bullet',
              bulletActiveClass: 'swiper-pagination-bullet-active'
            }}

            className="w-full h-screen relative z-10"
            onInit={(swiper) => {
              // Swiper 초기화 시 전역 인스턴스 설정
              ;(window as any).swiperInstance = swiper
            }}
            onSlideChange={(swiper) => {
              setActiveSlide(swiper.activeIndex)
              // 전역 swiper 인스턴스 설정
              ;(window as any).swiperInstance = swiper
              // Header 컴포넌트에 슬라이드 변경 알림
              window.dispatchEvent(new CustomEvent('slideChanged', { 
                detail: { activeIndex: swiper.activeIndex } 
              }))
              // 네비게이션 버튼 활성화 상태 업데이트
              document.querySelectorAll('.swiper-pagination-bullet').forEach((bullet, index) => {
                if (index === swiper.activeIndex) {
                  bullet.classList.add('bg-white/30', 'text-white')
                  bullet.classList.remove('text-white/70')
                } else {
                  bullet.classList.remove('bg-white/30', 'text-white')
                  bullet.classList.add('text-white/70')
                }
              })
            }}
          >
            {/* 회사소개 섹션 */}
            <SwiperSlide>
              <div className="text-center h-screen overflow-y-auto pb-20">
          <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-3xl px-6 py-3 mb-8 shadow-2xl border border-white/30">
            <Sparkles className="w-5 h-5 text-white" />
                  <span className="text-white font-medium">한국과 남미를 잇는 다리</span>
                </div>
                
                <h2 className="text-4xl font-bold text-white mb-8 drop-shadow-2xl">Amiko를 만들게 된 배경</h2>

                {/* 대표자 영상 */}
                <div className="w-full mb-8">
                  <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/30">
                    {!showVideo ? (
                      <div className="h-96 bg-black relative group cursor-pointer" onClick={() => setShowVideo(true)}>
                        {/* 유튜브 썸네일 이미지 */}
                        <img 
                          src="https://img.youtube.com/vi/6BdrKjSMBJY/maxresdefault.jpg" 
                          alt="Amiko 소개 영상" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // 썸네일 로드 실패시 기본 이미지로 대체
                            e.currentTarget.src = "https://img.youtube.com/vi/6BdrKjSMBJY/hqdefault.jpg"
                          }}
                        />
                        
                        {/* 플레이 버튼 오버레이 */}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-all duration-300">
                          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300">
                            <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
                          </div>
          </div>
          
                        {/* 호버시 텍스트 */}
                        <div className="absolute bottom-4 left-4 right-4 text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="text-lg font-semibold drop-shadow-lg">클릭하여 영상 보기</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-96 relative">
                        <button 
                          onClick={() => setShowVideo(false)}
                          className="absolute top-4 right-4 z-10 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70 transition-colors duration-300"
                        >
                          ✕
                        </button>
                        <iframe
                          src="https://www.youtube.com/embed/6BdrKjSMBJY?autoplay=1"
                          title="Amiko 소개 영상"
                          className="w-full h-full rounded-3xl"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="max-w-4xl mx-auto mb-8">
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/30 mb-6">
                    <h3 className="text-2xl font-bold text-white mb-4">🌎 Amiko의 시작</h3>
                    <p className="text-white/80 text-lg leading-relaxed mb-4">
                      남미 여러 지역에서 봉사와 선교 활동을 하며, 저는 그곳 사람들을 진심으로 사랑하게 되었습니다.
            <br />
                      하지만 한국인들은 지구 반대편의 이 따뜻한 이웃들을 아직 잘 알지 못합니다.
                    </p>
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-yellow-300 font-semibold text-lg">
                        ✨ 그래서 다짐했습니다.
                      </p>
                      <p className="text-white/90 text-base mt-2">
                        남미의 좋은 사람들을 한국에 알리고,<br />
                        한국과 남미를 이어주는 다리가 되자.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/30">
                    <h3 className="text-2xl font-bold text-white mb-4">💡 Amiko의 목표</h3>
                    <p className="text-white/80 text-lg leading-relaxed mb-4">
                      제가 사랑하는 제 2의 고향, 남미를 위해 생각했습니다.
                      <br />
                      무엇보다 한국문화를 더 가까이 접하고, 사람과 사람을 잇는 커뮤니티가 필요했습니다.
                    </p>
                    <div className="bg-white/10 rounded-xl p-4 mb-4">
                      <p className="text-yellow-300 font-semibold text-lg">
                        🎯 그래서 만들었습니다.
                      </p>
                      <p className="text-white/90 text-base mt-2">
                        • 대화와 영상 연결로 한국인과 직접 만나고<br />
                        • 서로 배우며 교류하는 경험 속에서,<br />
                        한국인들의 관심 또한 남미로 이어집니다.
                      </p>
                    </div>
                    <p className="text-white/80 text-base leading-relaxed mb-4">
                      이 흐름을 통해 한국 음식과 패션, 그리고 K-pop 같은 라이프스타일로 교류를 넓히고,<br />
                      더 많은 한국인들이 남미를 찾고,<br />
                      연예인들도 이곳에 열정적인 팬이 있음을 인지해 더 자주 오게 되는 세상을 함께 만들어가고 싶습니다.
                    </p>
                    <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-xl p-4">
                      <p className="text-yellow-300 font-semibold text-lg">
                        ✨ Amiko는 그 변화를 반드시 현실로 만들겠습니다.
                      </p>
                      <p className="text-white/90 text-base mt-2">
                        그리고 그 길에 여러분이 함께해 주시길 바랍니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 추가 설명 */}
                <p className="text-white/90 mt-8 mb-8 text-lg drop-shadow-lg">
                  {t('landing.signupMessage')}
                </p>

                {/* 다음 섹션 안내 */}
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/30 mt-8">
                  <div className="flex items-center justify-center space-x-4">
                    <span className="text-white/80 text-lg">오른쪽으로 넘기시면</span>
                    <span className="text-yellow-300 font-semibold text-xl">대화 기능</span>
                    <span className="text-white/80 text-lg">에 대한 소개가 나옵니다</span>
                    <span className="text-white text-2xl animate-pulse">→</span>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* 대화 섹션 */}
            <SwiperSlide>
              <div className="text-center h-screen overflow-y-auto pb-20">
                <h2 className="text-4xl font-bold text-white mb-8 drop-shadow-2xl">대화</h2>
                <p className="text-xl text-white/90 mb-8">안전하고 신뢰할 수 있는 영상통화 연결 서비스</p>
                
                {/* 문제 제기 + Amiko의 해결책 */}
                <div className="max-w-4xl mx-auto mb-8">
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/30 mb-6">
                    <h3 className="text-2xl font-bold text-white mb-4">🤔 한국인을 만나기가 막막하셨나요?</h3>
                    <p className="text-white/80 text-lg leading-relaxed mb-4">
                      중남미에서 한국인을 만나 한국 문화를 배우고 싶지만,
                      <br />
                      어디서, 어떻게 시작해야 할지 막막하지 않으셨나요?
                    </p>
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-yellow-300 font-semibold text-lg mb-2">
                        👉 Amiko의 해결책:
                      </p>
                      <p className="text-white/90 text-base">
                        처음에는 대학 인증을 마친 한국 대학생들과 안전하게 연결하여
                        <br />
                        믿을 수 있는 첫 만남을 제공합니다.
                        <br />
                        그 후 점차 더 많은 한국인들이 참여할 수 있도록 확장해 나갑니다.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/30 mb-8">
                    <h3 className="text-2xl font-bold text-white mb-4">⚠️ 온라인에서의 신뢰가 걱정되시나요?</h3>
                    <p className="text-white/80 text-lg leading-relaxed mb-4">
                      인터넷에서 만나는 사람들이 정말 믿을 만한지,
                      <br />
                      혹시 사기나 불쾌한 경험을 당하지 않을까 걱정되시나요?
                    </p>
                    <div className="bg-white/10 rounded-xl p-6">
                      <p className="text-yellow-300 font-semibold text-lg mb-3">
                        👉 Amiko의 보안 시스템:
                      </p>
                      <p className="text-white/90 text-base leading-relaxed">
                        오직 인증된 사용자만 참여 가능하며,
                        <br />
                        부정 행위가 발생하면 즉시 인증 정보를 통해 차단됩니다.
                        <br />
                        따라서 악의적인 사람들은 들어올 수 없습니다.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/30 mb-8">
                    <h3 className="text-2xl font-bold text-white mb-4">🌍 언어 장벽 때문에 망설이셨나요?</h3>
                    <p className="text-white/80 text-lg leading-relaxed mb-4">
                      한국어를 잘 몰라서,
                      <br />
                      혹은 스페인어가 서툴러서 대화가 끊길까 걱정되시나요?
                    </p>
                    <div className="bg-white/10 rounded-xl p-6">
                      <p className="text-yellow-300 font-semibold text-lg mb-3">
                        👉 Amiko의 AI 통역 기능:
                      </p>
                      <ul className="text-white/90 text-base space-y-3">
                        <li>• 영상통화 중 실시간 AI 통역 제공</li>
                        <li>• 한국어 ↔ 스페인어가 자동 변환되어<br />
                        &nbsp;&nbsp;&nbsp;언어 실력이 부족해도 원활한 소통이 가능합니다.</li>
                        <li>• 필요에 따라 영어 통역도 지원 예정</li>
                      </ul>
                  </div>
                </div>
              </div>
              
                {/* 신뢰 시스템 & 차별화 포인트 */}
                <div className="max-w-4xl mx-auto">
                  <div className="bg-gradient-to-r from-green-400/20 to-blue-400/20 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-green-300/30 mb-6">
                    <h3 className="text-3xl font-bold text-white mb-6">✨ Amiko가 해결해드립니다! ✨</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-white text-3xl">🎓</span>
                        </div>
                        <h4 className="text-xl font-bold text-white mb-2">단계별 확장 전략</h4>
                        <p className="text-white/80 mb-3">1단계: 인증된 대학생들과 시작</p>
                        <p className="text-white/80">2단계: 더 많은 한국인 참여 확대</p>
                      </div>
                      <div className="text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-white text-3xl">🔒</span>
                        </div>
                        <h4 className="text-xl font-bold text-white mb-2">완벽한 인증 시스템</h4>
                        <ul className="text-white/80 text-sm space-y-1">
                          <li>• 모든 대화는 안전하게 암호화</li>
                          <li>• 인증된 사람만 참여 가능</li>
                          <li>• 악의적 시도 발생 시 즉시 차단</li>
                        </ul>
                      </div>
                      <div className="text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-white text-3xl">🤖</span>
                        </div>
                        <h4 className="text-xl font-bold text-white mb-2">AI 통역 지원</h4>
                        <ul className="text-white/80 text-sm space-y-1">
                          <li>• 한국어 ↔ 스페인어 실시간 통역</li>
                          <li>• 언어 걱정 없이 누구나 대화 가능</li>
                        </ul>
              </div>
            </div>
          </div>

                  {/* Amiko의 약속 */}
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/30">
                    <h3 className="text-2xl font-bold text-white mb-4">💬 Amiko의 약속:</h3>
                    <p className="text-white/90 text-lg leading-relaxed italic">
                      "Amiko는 여러분의 첫 만남이 안전하고, 언어 장벽 없이 이루어질 수 있도록,<br />
                      철저한 인증과 AI 통역 기술로 지원합니다."
                    </p>
                  </div>
                </div>

                {/* 다음 섹션 안내 */}
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/30 mt-8 mb-12">
                  <div className="flex items-center justify-center space-x-4">
                    <span className="text-white/80 text-lg">오른쪽으로 넘기시면</span>
                    <span className="text-yellow-300 font-semibold text-xl">커뮤니티 기능</span>
                    <span className="text-white/80 text-lg">에 대한 소개가 나옵니다</span>
                    <span className="text-white text-2xl animate-pulse">→</span>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* 커뮤니티 섹션 */}
            <SwiperSlide>
              <div className="text-center h-full overflow-y-auto scrollbar-hide">
                <h2 className="text-4xl font-bold text-white mb-8 drop-shadow-2xl">커뮤니티</h2>
                <p className="text-xl text-white/90 mb-8">함께 성장하는 한국 문화 커뮤니티</p>
                
                {/* 커뮤니티 헤드라인 */}
                <div className="max-w-4xl mx-auto mb-8">
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/30">
                    <p className="text-white/90 text-lg leading-relaxed">
                      "Amiko 커뮤니티는 단순한 게시판이 아닙니다.<br />
                      언어 장벽 없는 문화 교류 공간에서<br />
                      한국과 중남미 청년들이 함께 성장하고 소통합니다."
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/30">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-3xl">📰</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">최신 한국 뉴스</h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      한국의 트렌드와 최신 소식을 빠르게 확인하세요.<br />
                      언어 걱정 없이, 스페인어 번역과 함께 제공됩니다.
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/30">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-3xl">❓</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Q&A (질문과 답변)</h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      궁금한 점을 자유롭게 묻고 답하며,<br />
                      포인트와 뱃지를 얻을 수 있습니다.<br />
                      AI 번역이 지원되어 한국인·중남미 청년 모두 참여 가능!
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/30">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-3xl">💬</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">자유게시판</h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      누구나 자유롭게 의견과 생각을 공유하는 공간입니다.<br />
                      한국어 ↔ 스페인어 번역 버튼을 눌러,<br />
                      언어가 달라도 편하게 소통해보세요.
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/30">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-3xl">📸</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">스토리</h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      나의 일상, 한국 문화 경험담, 여행기 등을 공유하세요.<br />
                      사진과 짧은 영상도 올릴 수 있으며,<br />
                      서로의 삶을 가까이 느낄 수 있는 교류의 장입니다.
          </p>
        </div>
      </div>

                {/* 다음 섹션 안내 */}
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/30 mt-8">
                  <div className="flex items-center justify-center space-x-4">
                    <span className="text-white/80 text-lg">오른쪽으로 넘기시면</span>
                    <span className="text-yellow-300 font-semibold text-xl">이벤트 정보</span>
                    <span className="text-white/80 text-lg">를 확인할 수 있습니다</span>
                    <span className="text-white text-2xl animate-pulse">→</span>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* 이벤트 섹션 */}
            <SwiperSlide>
              <div className="text-center h-full overflow-y-auto scrollbar-hide">
                <h2 className="text-4xl font-bold text-white mb-8 drop-shadow-2xl">🎁 Amiko 특별 이벤트</h2>
                <p className="text-xl text-white/90 mb-8">상담과 커뮤니티 활동으로 포인트를 모아보세요!<br />활동이 많을수록 한국과 가까워질 기회가 열립니다.</p>
                


                {/* 포인트 프로그램 */}
                <div className="max-w-4xl mx-auto mb-8">
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/30 mb-6">
                    <h3 className="text-2xl font-bold text-white mb-4">포인트 프로그램</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-white text-3xl">💬</span>
                        </div>
                        <h4 className="text-xl font-bold text-white mb-2">영상 소통</h4>
                        <p className="text-white/80 text-sm">15분 당 30점 포인트 적립</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-white text-3xl">🌐</span>
                        </div>
                        <h4 className="text-xl font-bold text-white mb-2">커뮤니티 활동</h4>
                        <p className="text-white/80 text-sm">글/댓글/좋아요<br />하루 최대 20점 포인트 적립</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 보상 강조 */}
                <div className="max-w-4xl mx-auto mb-8">
                  <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-yellow-300/30">
                    <div className="flex items-center justify-center mb-6">
                      <span className="text-white text-4xl mr-4">✈️</span>
                      <h3 className="text-3xl font-bold text-white">1등에게 비행기 티켓 지원</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="text-center">
                        <h4 className="text-xl font-bold text-white mb-2">🏆 포인트 랭킹 1등</h4>
                        <p className="text-white/80 text-sm">한국인 / 남미인 각 1명</p>
                        <p className="text-yellow-300 font-semibold">→ 왕복 비행기 티켓 지원</p>
                      </div>
                      <div className="text-center">
                        <h4 className="text-xl font-bold text-white mb-2">🌍 현지인 1등 당첨자</h4>
                        <p className="text-white/80 text-sm">한국으로 오면 운영자가 직접 가이드!</p>
                        <p className="text-yellow-300 font-semibold">서로 만나고, 함께 문화를 경험</p>
                      </div>
                    </div>
                    <div className="mt-6 text-center">
                      <p className="text-white font-semibold text-lg">
                        🔗 "Amiko가 연결해드립니다: 한국 ↔ 남미"
                      </p>
                    </div>
                  </div>
                </div>

                {/* 참여 CTA 버튼 */}
                <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button className="bg-gradient-to-r from-green-400 to-blue-400 text-white px-8 py-4 text-lg hover:scale-105 transition-all duration-300">
                      💬 영상 소통하고 포인트 쌓기
                    </Button>
                    <Button className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-8 py-4 text-lg hover:scale-105 transition-all duration-300">
                      🌐 커뮤니티 활동하고 포인트 쌓기
                    </Button>
                  </div>
                </div>

                {/* 메인페이지 이동 안내 */}
                <div 
                  className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/30 mt-8 cursor-pointer hover:bg-white/30 transition-all duration-300"
                  onClick={() => {
                    // 메인페이지 버튼 하이라이트 효과 트리거
                    window.dispatchEvent(new CustomEvent('highlightMainButton', { 
                      detail: { highlight: true } 
                    }))
                    
                    // 3초 후 하이라이트 효과 제거
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('highlightMainButton', { 
                        detail: { highlight: false } 
                      }))
                    }, 3000)
                  }}
                >
                  <div className="flex items-center justify-center space-x-4">
                    <span className="text-white/80 text-lg">이 기능들이 있는</span>
                    <span className="text-yellow-300 font-semibold text-xl">메인페이지</span>
                    <span className="text-white/80 text-lg">로 이동하시려면</span>
                    <span className="text-yellow-300 font-semibold text-lg">클릭하세요</span>
                    <span className="text-white text-2xl animate-pulse">→</span>
                  </div>
            </div>
          </div>
            </SwiperSlide>

          </Swiper>

          {/* 커스텀 페이지네이션 */}
          <div className="swiper-pagination flex justify-center mt-6"></div>
        </div>
      </div>
    </section>
  )
}

