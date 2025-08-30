'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  Users,
  MapPin, 
  MessageCircle,
  Coffee,
  Gift,
  ArrowRight,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { format, addWeeks, isSameDay, isToday, isFuture } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useLanguage } from '@/context/LanguageContext'





export default function LoungePage() {
  const { t } = useLanguage()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // 다음 4주 계산
  const next4Weeks = Array.from({ length: 28 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date
  })



  // 요일 번역 헬퍼 함수
  const translateDayOfWeek = (date: Date) => {
    const dayOfWeek = format(date, 'E', { locale: ko })
    const dayMap: { [key: string]: string } = {
      '일': t('calendar.days.sun'),
      '월': t('calendar.days.mon'),
      '화': t('calendar.days.tue'),
      '수': t('calendar.days.wed'),
      '목': t('calendar.days.thu'),
      '금': t('calendar.days.fri'),
      '토': t('calendar.days.sat')
    }
    return dayMap[dayOfWeek] || dayOfWeek
  }

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    const month = t('calendar.months.august')
    const day = format(date, 'd')
    const dayOfWeek = translateDayOfWeek(date)
    // 스페인어 모드일 때는 "30 de Agosto (Sáb)" 형식, 한국어 모드일 때는 "8월 30일 (토)" 형식
    const { language } = useLanguage()
    if (language === 'es') {
      return `${day} de ${month} (${dayOfWeek})`
    } else {
      return `${month} ${day}일 (${dayOfWeek})`
    }
  }

  // 시간 포맷팅
  const formatTime = (date: Date) => {
    return format(date, 'HH:mm')
  }

  // ZEP 입장하기 (외부 링크 placeholder)
  const handleEnterZep = () => {
    // TODO: 실제 ZEP 링크로 연결
    alert('ZEP 입장 기능은 준비 중입니다!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50">
      {/* Hero Section */}
      <div className="relative text-center py-16 px-4">
        <div className="max-w-6xl mx-auto relative">
          {/* 배경 이미지 */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 rounded-3xl"
            style={{ backgroundImage: 'url(/zep.jpg)' }}
          ></div>
          
          {/* 콘텐츠 */}
          <div className="relative z-10 py-16 px-8">
            <div className="text-6xl mb-4">🎈</div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
              {t('loungePage.title')}
            </h1>
                          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                {t('loungePage.subtitle')}<br />
                {t('loungePage.description')}
              </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center gap-2 text-lg text-gray-700">
                <Clock className="w-5 h-5 text-brand-500" />
                <span>{t('loungePage.time')}</span>
              </div>
              <div className="flex items-center gap-2 text-lg text-gray-700">
                <Users className="w-5 h-5 text-mint-500" />
                <span>{t('loungePage.maxParticipants')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16 space-y-8">
        {/* 다음 세션 상세 */}
        <Card className="bg-gradient-to-r from-brand-50 to-mint-50 border-2 border-brand-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Calendar className="w-6 h-6 text-brand-600" />
              {t('loungePage.nextSession')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-brand-100 text-brand-700 border-brand-300">
                    {t('loungePage.saturday')}
                  </Badge>
                  <Badge className="bg-mint-100 text-mint-700 border-mint-300">
                    20:00 (KST)
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {t('loungePage.title')}
                  </h3>
                  <p className="text-gray-600">
                    {t('loungePage.specialTime')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('loungePage.specialDescription')}
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <Button
                  onClick={handleEnterZep}
                  size="lg"
                  className="bg-gradient-to-r from-brand-500 to-mint-500 hover:from-brand-600 hover:to-mint-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  {t('loungePage.enterZep')}
                </Button>
                <div className="text-sm text-gray-500 mt-3">
                  {t('loungePage.specialEvent')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 8월 일정과 라운지 활동 */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-mint-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Calendar className="w-6 h-6 text-mint-600" />
              {t('calendar.scheduleTitle')}
            </CardTitle>
            <CardDescription>
              {t('loungePage.scheduleDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* 달력 - 왼쪽 */}
              <div className="flex justify-center">
                <div className="bg-white/90 rounded-2xl p-6 shadow-lg border border-mint-200 max-w-sm">
                  <div className="text-sm text-mint-600 font-medium mb-3 text-center">
                    {t('calendar.months.august')} 2025
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-xs text-gray-400 mb-2">
                    <div className="text-center">{t('calendar.days.sun')}</div>
                    <div className="text-center">{t('calendar.days.mon')}</div>
                    <div className="text-center">{t('calendar.days.tue')}</div>
                    <div className="text-center">{t('calendar.days.wed')}</div>
                    <div className="text-center">{t('calendar.days.thu')}</div>
                    <div className="text-center">{t('calendar.days.fri')}</div>
                    <div className="text-center">{t('calendar.days.sat')}</div>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {next4Weeks.map((date, index) => {
                      const isTodayDate = isToday(date)
                      const isFutureDate = isFuture(date)
                      
                      return (
                        <div
                          key={index}
                          className={`
                            w-6 h-6 text-center text-xs border rounded cursor-pointer transition-all duration-200 flex items-center justify-center
                            ${isTodayDate 
                              ? 'bg-brand-100 border-brand-300 text-brand-700 font-semibold' 
                              : isFutureDate 
                                ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50' 
                                : 'bg-gray-100 border-gray-200 text-gray-400'
                            }
                          `}
                          onClick={() => setSelectedDate(date)}
                        >
                          {format(date, 'd')}
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* 선택된 날짜 정보 */}
                  {selectedDate && (
                    <div className="mt-4 p-3 bg-mint-50 rounded-lg border border-mint-200">
                      <h4 className="font-medium text-mint-800 mb-2 text-sm">
                        {formatDate(selectedDate)} {t('loungePage.selectedDateInfo')}
                      </h4>
                      <p className="text-xs text-mint-600">
                        {t('loungePage.selectedDateDescription')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 라운지에서 하는 일 - 오른쪽 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-mint-800 text-lg mb-4">{t('loungePage.activities')}</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-purple-800 text-sm">{t('loungePage.freeConversation')}</h5>
                      <p className="text-xs text-purple-600">
                        {t('loungePage.freeConversationDescription')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Coffee className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-purple-800 text-sm">{t('loungePage.culturalExperience')}</h5>
                      <p className="text-xs text-purple-600">
                        {t('loungePage.culturalExperienceDescription')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Gift className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-purple-800 text-sm">{t('loungePage.specialEvents')}</h5>
                      <p className="text-xs text-purple-600">
                        {t('loungePage.specialEventsDescription')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>







        {/* CTA */}
        <Card className="bg-gradient-to-r from-brand-500 to-mint-500 text-white border-0">
          <CardContent className="text-center py-12">
            <h3 className="text-2xl font-bold mb-4">
              {t('loungePage.ctaTitle')}
            </h3>
            <p className="text-lg mb-6 opacity-90">
              {t('loungePage.ctaDescription')}
            </p>
            <div className="text-white/80 text-sm">
              {t('loungePage.ctaInstruction')}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
