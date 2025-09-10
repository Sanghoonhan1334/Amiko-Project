'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { 
  Video,
  MessageSquare,
  Gift,
  ArrowRight,
  Star,
  Calendar,
  Users,
  Phone
} from 'lucide-react'

export default function HomeTab() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [pointsData, setPointsData] = useState({
    attendance: 0,
    community: 0,
    videoCall: 0,
    total: 0
  })

  useEffect(() => {
    // 포인트 데이터 로드
    const loadPointsData = () => {
      // 출석체크 포인트 (localStorage에서 가져오기)
      const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]')
      const attendancePoints = attendanceRecords.length * 10 // 출석체크당 10포인트

      // 커뮤니티 포인트 (목업 데이터)
      const communityPoints = 45 // 예시: 커뮤니티 활동으로 얻은 포인트

      // 영상대화 포인트 (목업 데이터)
      const videoCallPoints = 30 // 예시: 영상대화로 얻은 포인트

      const total = attendancePoints + communityPoints + videoCallPoints

      setPointsData({
        attendance: attendancePoints,
        community: communityPoints,
        videoCall: videoCallPoints,
        total: total
      })
    }

    loadPointsData()
    setLoading(false)
  }, [])

  return (
    <div className="relative py-20">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-pink-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        {/* 제목 섹션 */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">{t('mainPage.title')}</h2>
          <div className="w-24 h-1 bg-purple-300 mx-auto rounded-full"></div>
        </div>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 화상대화 카드 */}
          <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <div className="mb-6">
              {/* 노트북과 스탠션 이미지 */}
              <div className="relative w-32 h-24 mx-auto mb-4">
                {/* 노트북 */}
                <div className="absolute inset-0 bg-gray-300 rounded-lg shadow-lg">
                  <div className="absolute inset-1 bg-black rounded-md flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{t('mainPage.cbtText')}</span>
                  </div>
                </div>
                {/* 금색 스탠션들 */}
                <div className="absolute -bottom-2 -left-2 w-3 h-8 bg-yellow-400 rounded-full shadow-md"></div>
                <div className="absolute -bottom-2 -right-2 w-3 h-8 bg-yellow-400 rounded-full shadow-md"></div>
                {/* 금색 밧줄 */}
                <div className="absolute -bottom-1 left-0 right-0 h-1 bg-yellow-400 rounded-full transform -rotate-1"></div>
              </div>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 mb-2">
                {t('mainPage.cbtBadge')}
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{t('mainPage.videoCall')}</h3>
            <p className="text-gray-600">{t('mainPage.videoCallDescription')}</p>
          </Card>

          {/* 커뮤니티 카드 */}
          <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <div className="mb-6">
              {/* 두 개의 스마트폰 */}
              <div className="relative w-32 h-24 mx-auto mb-4">
                {/* 검은색 폰 (뒤쪽, 기울어진) */}
                <div className="absolute left-2 top-2 w-16 h-20 bg-black rounded-lg shadow-lg transform -rotate-12">
                  {/* 카메라 모듈 */}
                  <div className="absolute top-2 right-2 w-8 h-6 bg-gray-700 rounded-md">
                    <div className="absolute top-1 left-1 w-1 h-1 bg-gray-500 rounded-full"></div>
                    <div className="absolute top-1 left-3 w-1 h-1 bg-gray-500 rounded-full"></div>
                    <div className="absolute top-1 left-5 w-1 h-1 bg-gray-500 rounded-full"></div>
                  </div>
                </div>
                {/* 흰색 폰 (앞쪽, 똑바로) */}
                <div className="absolute right-2 top-4 w-16 h-20 bg-white rounded-lg shadow-lg border border-gray-200">
                  {/* 빈 화면 */}
                  <div className="absolute inset-1 bg-gray-50 rounded-md"></div>
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{t('mainPage.community')}</h3>
            <p className="text-gray-600">{t('mainPage.communityDescription')}</p>
          </Card>

          {/* 오픈 기념 이벤트 카드 */}
          <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm relative overflow-hidden">
            {/* 이벤트 리본 */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-pink-500"></div>
            <div className="absolute top-4 right-4">
              <Badge className="bg-red-500 text-white border-red-500">
                {t('mainPage.eventBadge')}
              </Badge>
            </div>
            
            <div className="mb-6">
              {/* 빨간색 리본 배너 */}
              <div className="relative w-32 h-20 mx-auto mb-4">
                {/* 리본 본체 */}
                <div className="absolute inset-0 bg-red-500 rounded-lg shadow-lg transform rotate-3">
                  {/* 3D 효과를 위한 그라데이션 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-lg"></div>
                  {/* 접힌 부분 */}
                  <div className="absolute top-0 right-0 w-8 h-8 bg-red-600 transform rotate-45 origin-top-right"></div>
                </div>
                {/* EVENT 텍스트 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg tracking-wider">{t('mainPage.eventBadge')}</span>
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{t('mainPage.openEvent')}</h3>
            <p className="text-gray-600">{t('mainPage.openEventDescription')}<br />
            <span className="text-sm text-gray-500">{t('mainPage.openEventNote')}</span></p>
          </Card>
        </div>

        {/* 내 포인트 섹션 */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{t('mainPage.myPoints')}</h3>
            <div className="w-20 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full"></div>
          </div>

          <Card className="p-8 bg-gradient-to-br from-white to-yellow-50 border border-yellow-100 shadow-lg">
            {/* 총 포인트 */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4 shadow-lg">
                <span className="text-2xl font-bold text-white">{pointsData.total}</span>
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">{t('mainPage.totalPoints')}</h4>
            </div>

            {/* 포인트 세부 내역 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 출석체크 포인트 */}
              <div className="text-center p-6 bg-white rounded-xl border border-yellow-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <h5 className="font-bold text-gray-800 mb-2">{t('mainPage.attendancePoints')}</h5>
                <p className="text-2xl font-bold text-blue-600 mb-1">{pointsData.attendance}</p>
                <p className="text-sm text-gray-600">{t('mainPage.points')}</p>
              </div>

              {/* 커뮤니티 포인트 */}
              <div className="text-center p-6 bg-white rounded-xl border border-yellow-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h5 className="font-bold text-gray-800 mb-2">{t('mainPage.communityPoints')}</h5>
                <p className="text-2xl font-bold text-green-600 mb-1">{pointsData.community}</p>
                <p className="text-sm text-gray-600">{t('mainPage.points')}</p>
              </div>

              {/* 영상대화 포인트 */}
              <div className="text-center p-6 bg-white rounded-xl border border-yellow-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-purple-600" />
                </div>
                <h5 className="font-bold text-gray-800 mb-2">{t('mainPage.videoCallPoints')}</h5>
                <p className="text-2xl font-bold text-purple-600 mb-1">{pointsData.videoCall}</p>
                <p className="text-sm text-gray-600">{t('mainPage.points')}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
