'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users, ArrowRight, Sparkles, Heart, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function LoungeMini() {
  const router = useRouter()
  const { t } = useLanguage()

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
                <span className="text-sky-700 font-medium">{t('loungeMini.weekendEvent')}</span>
              </div>
              
              <h2 className="heading-primary mb-4">
                🫧 {t('loungeMini.title')}
              </h2>
              
              <p className="text-body text-lg max-w-2xl mx-auto">
                {t('loungeMini.subtitle')}
              </p>
            </div>

            {/* 라운지 일정 미니 캘린더 */}
            <div className="bg-gradient-to-r from-sky-100 via-brand-100 to-mint-100 rounded-3xl p-8 mb-8 transform hover:scale-[1.01] transition-transform duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* 작은 달력 */}
                <div className="text-center">
                  <div className="bg-white/90 rounded-2xl p-6 shadow-lg border border-sky-200">
                    <div className="text-sm text-sky-600 font-medium mb-3">{t('calendar.months.august')}</div>
                                          <div className="grid grid-cols-7 gap-1 text-xs text-gray-400 mb-2">
                        <div>{t('calendar.days.sun')}</div>
                        <div>{t('calendar.days.mon')}</div>
                        <div>{t('calendar.days.tue')}</div>
                        <div>{t('calendar.days.wed')}</div>
                        <div>{t('calendar.days.thu')}</div>
                        <div>{t('calendar.days.fri')}</div>
                        <div>{t('calendar.days.sat')}</div>
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
                        {t('loungeMini.saturdayEvent')}
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
                        {t('loungeMini.time')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {t('loungeMini.kst')}
                      </div>
                    </div>
                    <div className="mt-3">
                      <Badge className="bg-brand-100 text-brand-700 border-brand-300">
                        <Clock className="w-4 h-4 mr-1" />
                        {t('loungeMini.operationTime')}
                      </Badge>
                    </div>
                  </div>

                  {/* 참여자 */}
                  <div className="text-center">
                    <div className="bg-white/90 rounded-2xl p-4 shadow-lg">
                      <div className="text-3xl font-bold text-mint-600 mb-1">
                        {t('loungeMini.participants')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {t('loungeMini.maxParticipants')}
                      </div>
                    </div>
                    <div className="mt-3">
                      <Badge className="bg-mint-100 text-mint-700 border-mint-300">
                        <Users className="w-4 h-4 mr-1" />
                        {t('loungeMini.firstComeFirstServed')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 국가별 시간대 추가 */}
              <div className="mt-6 pt-6 border-t border-sky-200/30">
                <div className="text-center text-sm text-gray-600 space-y-2">
                  <div className="font-medium text-gray-700 mb-2">{t('loungeMini.timeByCountry')}</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">🇰🇷</span>
                      <span>{t('loungeMini.timeFormat.korea')}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">🇵🇪</span>
                      <span>{t('loungeMini.timeFormat.peru')}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">🇲🇽</span>
                      <span>{t('loungeMini.timeFormat.mexico')}</span>
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
                  {t('loungeMini.specialTime')}
                </Badge>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                {t('loungeMini.gettingToKnow')}
              </h3>
              
              <p className="text-body text-lg mb-4">
                {t('loungeMini.description')}
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-brand-500" />
                  {t('loungeMini.features.freeTalk')}
                </span>
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-mint-500" />
                  {t('loungeMini.features.culturalExchange')}
                </span>
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-500" />
                  {t('loungeMini.features.makeFriends')}
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
              {t('loungeMini.button')}
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>

            {/* 추가 정보 */}
            <p className="text-gray-600 mt-6 text-lg">
              {t('loungeMini.message')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
