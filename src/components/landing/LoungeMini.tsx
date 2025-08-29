'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users, ArrowRight, Sparkles, Heart, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoungeMini() {
  const router = useRouter()

  // 다음 주말 날짜 계산 (간단한 예시)
  const getNextWeekend = () => {
    const today = new Date()
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7
    const nextSaturday = new Date(today)
    nextSaturday.setDate(today.getDate() + daysUntilSaturday)
    
    return {
      date: nextSaturday.getDate(),
      month: nextSaturday.getMonth() + 1,
      day: '토'
    }
  }

  const nextWeekend = getNextWeekend()

  return (
    <section className="section-padding bg-gradient-to-r from-sky-50 via-brand-50 to-mint-50 relative overflow-hidden">
      {/* 배경 장식 요소들 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-40 h-40 bg-sky-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-brand-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-mint-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container-custom relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="card p-8 text-center border-2 border-sky-200/50">
            {/* 헤더 */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-sky-100 to-brand-100 rounded-3xl px-6 py-3 mb-6">
                <Sparkles className="w-5 h-5 text-sky-600" />
                <span className="text-sky-700 font-medium">주말 특별 이벤트</span>
              </div>
              
              <h2 className="heading-primary mb-4">
                🫧 ZEP 라운지
              </h2>
              
              <p className="text-body text-lg max-w-2xl mx-auto">
                운영자가 직접 참여하는 특별한 시간을 경험해보세요
              </p>
            </div>

            {/* 라운지 일정 미니 캘린더 */}
            <div className="bg-gradient-to-r from-sky-100 via-brand-100 to-mint-100 rounded-3xl p-8 mb-8 transform hover:scale-[1.01] transition-transform duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* 작은 달력 */}
                <div className="text-center">
                  <div className="bg-white/90 rounded-2xl p-6 shadow-lg border border-sky-200">
                    <div className="text-sm text-sky-600 font-medium mb-3">8월 2025</div>
                    <div className="grid grid-cols-7 gap-1 text-xs text-gray-400 mb-2">
                      <div>일</div>
                      <div>월</div>
                      <div>화</div>
                      <div>수</div>
                      <div>목</div>
                      <div>금</div>
                      <div>토</div>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      <div className="w-6 h-6"></div>
                      <div className="w-6 h-6"></div>
                      <div className="w-6 h-6"></div>
                      <div className="w-6 h-6"></div>
                      <div className="w-6 h-6"></div>
                      <div className="w-6 h-6 text-xs text-gray-500">1</div>
                      <div className="w-6 h-6 text-xs text-gray-500">2</div>
                      <div className="w-6 h-6 text-xs text-gray-500">3</div>
                      <div className="w-6 h-6 text-xs text-gray-500">4</div>
                      <div className="w-6 h-6 text-xs text-gray-500">5</div>
                      <div className="w-6 h-6 text-xs text-gray-500">6</div>
                      <div className="w-6 h-6 text-xs text-gray-500">7</div>
                      <div className="w-6 h-6 text-xs text-gray-500">8</div>
                      <div className="w-6 h-6 text-xs text-gray-500">9</div>
                      <div className="w-6 h-6 text-xs text-gray-500">10</div>
                      <div className="w-6 h-6 text-xs text-gray-500">11</div>
                      <div className="w-6 h-6 text-xs text-gray-500">12</div>
                      <div className="w-6 h-6 text-xs text-gray-500">13</div>
                      <div className="w-6 h-6 text-xs text-gray-500">14</div>
                      <div className="w-6 h-6 text-xs text-gray-500">15</div>
                      <div className="w-6 h-6 text-xs text-gray-500">16</div>
                      <div className="w-6 h-6 text-xs text-gray-500">17</div>
                      <div className="w-6 h-6 text-xs text-gray-500">18</div>
                      <div className="w-6 h-6 text-xs text-gray-500">19</div>
                      <div className="w-6 h-6 text-xs text-gray-500">20</div>
                      <div className="w-6 h-6 text-xs text-gray-500">21</div>
                      <div className="w-6 h-6 text-xs text-gray-500">22</div>
                      <div className="w-6 h-6 text-xs text-gray-500">23</div>
                      <div className="w-6 h-6 text-xs text-gray-500">24</div>
                      <div className="w-6 h-6 text-xs text-gray-500">25</div>
                      <div className="w-6 h-6 text-xs text-gray-500">26</div>
                      <div className="w-6 h-6 text-xs text-gray-500">27</div>
                      <div className="w-6 h-6 text-xs text-gray-500">28</div>
                      <div className="w-6 h-6 text-xs text-gray-500">29</div>
                      <div className="w-6 h-6 bg-sky-500 text-white rounded-full flex items-center justify-center text-xs font-bold">30</div>
                      <div className="w-6 h-6"></div>
                    </div>
                    <div className="mt-3">
                      <Badge className="bg-sky-100 text-sky-700 border-sky-300 text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        토요일 이벤트
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* 시간 및 참여자 정보 */}
                <div className="space-y-6">
                  {/* 시간 */}
                  <div className="text-center">
                    <div className="bg-white/90 rounded-2xl p-4 shadow-lg">
                      <div className="text-3xl font-bold text-brand-600 mb-1">
                        20:00
                      </div>
                      <div className="text-sm text-gray-600">
                        (KST)
                      </div>
                    </div>
                    <div className="mt-3">
                      <Badge className="bg-brand-100 text-brand-700 border-brand-300">
                        <Clock className="w-4 h-4 mr-1" />
                        2시간 운영
                      </Badge>
                    </div>
                  </div>

                  {/* 참여자 */}
                  <div className="text-center">
                    <div className="bg-white/90 rounded-2xl p-4 shadow-lg">
                      <div className="text-3xl font-bold text-mint-600 mb-1">
                        30명
                      </div>
                      <div className="text-sm text-gray-600">
                        최대 참여
                      </div>
                    </div>
                    <div className="mt-3">
                      <Badge className="bg-mint-100 text-mint-700 border-mint-300">
                        <Users className="w-4 h-4 mr-1" />
                        선착순
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 국가별 시간대 추가 */}
              <div className="mt-6 pt-6 border-t border-sky-200/30">
                <div className="text-center text-sm text-gray-600 space-y-2">
                  <div className="font-medium text-gray-700 mb-2">🌍 각 나라 기준 시간</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">🇰🇷</span>
                      <span>한국: 20:00 (KST)</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">🇵🇪</span>
                      <span>페루: 06:00 (PET)</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">🇲🇽</span>
                      <span>멕시코: 05:00 (CST)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 이번 주 특별 이벤트 */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-banana-100 to-sky-100 rounded-2xl px-4 py-2 mb-4">
                <Star className="w-5 h-5 text-banana-600" />
                <Badge className="bg-banana-100 text-banana-700 border-banana-300">
                  🌟 이번 주 특별 시간
                </Badge>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                서로 알아가는 시간
              </h3>
              
              <p className="text-body text-lg mb-4">
                자유롭게 이야기하고 문화를 나누며 새로운 친구를 만나보세요!
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-brand-500" />
                  자유로운 대화
                </span>
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-mint-500" />
                  문화 교류
                </span>
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-500" />
                  친구 만들기
                </span>
              </div>
            </div>

            {/* 라운지 안내 보기 버튼 */}
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-sky-500 to-brand-500 hover:from-sky-600 hover:to-brand-600 text-white px-10 py-5 text-xl rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              onClick={() => router.push('/lounge')}
            >
              <Sparkles className="w-6 h-6 mr-3" />
              라운지 안내 보기
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>

            {/* 추가 정보 */}
            <p className="text-gray-600 mt-6 text-lg">
              매주 토요일 저녁, 특별한 소통 시간을 기다려주세요! 🌟
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
