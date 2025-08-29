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





export default function LoungePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // 다음 4주 계산
  const next4Weeks = Array.from({ length: 28 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date
  })



  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    return format(date, 'M월 d일 (E)', { locale: ko })
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
              ZEP 주말 라운지
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              운영자와 함께하는 즐거운 한국 문화 수다타임!<br />
              매주 토요일 저녁, 여러분을 기다리고 있어요
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center gap-2 text-lg text-gray-700">
                <Clock className="w-5 h-5 text-brand-500" />
                <span>매주 토요일 20:00 (KST)</span>
              </div>
              <div className="flex items-center gap-2 text-lg text-gray-700">
                <Users className="w-5 h-5 text-mint-500" />
                <span>최대 30명 참여</span>
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
              다음 세션
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-brand-100 text-brand-700 border-brand-300">
                    토요일
                  </Badge>
                  <Badge className="bg-mint-100 text-mint-700 border-mint-300">
                    20:00 (KST)
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-800">
                    ZEP 주말 라운지
                  </h3>
                  <p className="text-gray-600">
                    운영자와 함께하는 특별한 시간
                  </p>
                  <p className="text-sm text-gray-500">
                    한국 문화에 대한 자유로운 대화와 Q&A 시간
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
                  ZEP 입장하기
                </Button>
                <div className="text-sm text-gray-500 mt-3">
                  🎯 매주 토요일 저녁에 운영자와 함께하는 특별한 시간
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
              {format(new Date(), 'M월')} 일정
            </CardTitle>
            <CardDescription>
              이번 달 ZEP 라운지 일정을 확인하고 원하는 날짜를 선택하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* 달력 - 왼쪽 */}
              <div className="flex justify-center">
                <div className="bg-white/90 rounded-2xl p-6 shadow-lg border border-mint-200 max-w-sm">
                  <div className="text-sm text-mint-600 font-medium mb-3 text-center">
                    {format(new Date(), 'M월 yyyy')}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-xs text-gray-400 mb-2">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                      <div key={day} className="text-center">{day}</div>
                    ))}
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
                        {formatDate(selectedDate)} 상세 정보
                      </h4>
                      <p className="text-xs text-mint-600">
                        이 날의 ZEP 라운지 일정을 확인하고 참여해보세요!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 라운지에서 하는 일 - 오른쪽 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-mint-800 text-lg mb-4">라운지에서 하는 일</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-purple-800 text-sm">자유로운 대화</h5>
                      <p className="text-xs text-purple-600">
                        한국 문화, 여행, 음식 등 다양한 주제로 대화를 나눕니다
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Coffee className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-purple-800 text-sm">문화 체험</h5>
                      <p className="text-xs text-purple-600">
                        한국 전통 문화와 현대 문화를 체험할 수 있습니다
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Gift className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-purple-800 text-sm">특별 이벤트</h5>
                      <p className="text-xs text-purple-600">
                        정기적으로 특별한 이벤트와 선물을 제공합니다
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
              지금 바로 ZEP 라운지에 참여하세요!
            </h3>
            <p className="text-lg mb-6 opacity-90">
              한국 문화를 배우고 새로운 친구들을 만날 수 있는 특별한 시간
            </p>
            <div className="text-white/80 text-sm">
              🎈 위의 "ZEP 입장하기" 버튼을 클릭하여 라운지에 참여하세요
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
