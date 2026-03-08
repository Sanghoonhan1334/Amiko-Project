'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

interface UserRanking {
  userId: string
  userName: string
  userEmail: string
  totalPoints: number
  monthlyPoints: number
  rank: number
}

export default function PointsRanking() {
  const { language } = useLanguage()
  const { token } = useAuth()
  const t = (ko: string, es: string) => language === 'ko' ? ko : es
  const [loading, setLoading] = useState(true)
  const [totalRanking, setTotalRanking] = useState<UserRanking[]>([])
  const [monthlyRanking, setMonthlyRanking] = useState<UserRanking[]>([])
  
  useEffect(() => {
    loadRankings()
  }, [])
  
  const loadRankings = async () => {
    setLoading(true)
    try {
      const [totalRes, monthlyRes] = await Promise.all([
        fetch('/api/admin/points/total-ranking', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/points/monthly-ranking', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      
      const totalData = await totalRes.json()
      const monthlyData = await monthlyRes.json()
      
      setTotalRanking(totalData.ranking || [])
      setMonthlyRanking(monthlyData.ranking || [])
    } catch (error) {
      console.error('랭킹 데이터 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400"></div>
      </div>
    )
  }
  
  return (
    <Tabs defaultValue="total" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="total">{t('누적 점수', 'Acumulado')}</TabsTrigger>
        <TabsTrigger value="monthly">{t('월별 점수', 'Mensual')}</TabsTrigger>
      </TabsList>
      
      <TabsContent value="total" className="space-y-2">
        {totalRanking.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('데이터가 없습니다.', 'No hay datos.')}</p>
        ) : (
          totalRanking.slice(0, 10).map((user) => (
            <div
              key={user.userId}
              className={`p-4 rounded-lg border ${
                user.rank <= 3
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-800'
                  : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    user.rank === 1 ? 'bg-yellow-500 text-white' :
                    user.rank === 2 ? 'bg-gray-400 text-white' :
                    user.rank === 3 ? 'bg-orange-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {user.rank}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{user.userName}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{user.userEmail}</div>
                  </div>
                </div>
                <Badge variant="outline">
                  {user.totalPoints.toLocaleString()} pts
                </Badge>
              </div>
            </div>
          ))
        )}
      </TabsContent>
      
      <TabsContent value="monthly" className="space-y-2">
        {monthlyRanking.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('데이터가 없습니다.', 'No hay datos.')}</p>
        ) : (
          monthlyRanking.slice(0, 10).map((user) => (
            <div
              key={user.userId}
              className={`p-4 rounded-lg border ${
                user.rank <= 3
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-800'
                  : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    user.rank === 1 ? 'bg-blue-500 text-white' :
                    user.rank === 2 ? 'bg-purple-500 text-white' :
                    user.rank === 3 ? 'bg-pink-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {user.rank}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{user.userName}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{user.userEmail}</div>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
                  {user.monthlyPoints.toLocaleString()} pts
                </Badge>
              </div>
            </div>
          ))
        )}
      </TabsContent>
    </Tabs>
  )
}

