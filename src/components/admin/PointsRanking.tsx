'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface UserRanking {
  userId: string
  userName: string
  userEmail: string
  totalPoints: number
  monthlyPoints: number
  rank: number
}

export default function PointsRanking() {
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
        fetch('/api/admin/points/total-ranking'),
        fetch('/api/admin/points/monthly-ranking')
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
    <Tabs defaultValue="total" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="total">누적 점수</TabsTrigger>
        <TabsTrigger value="monthly">월별 점수</TabsTrigger>
      </TabsList>
      
      <TabsContent value="total" className="space-y-2">
        {totalRanking.length === 0 ? (
          <p className="text-center text-gray-500 py-8">데이터가 없습니다.</p>
        ) : (
          totalRanking.slice(0, 10).map((user) => (
            <div
              key={user.userId}
              className={`p-4 rounded-lg border ${
                user.rank <= 3
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                  : 'bg-white border-gray-200'
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
                    <div className="font-semibold text-gray-900">{user.userName}</div>
                    <div className="text-xs text-gray-600">{user.userEmail}</div>
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
          <p className="text-center text-gray-500 py-8">데이터가 없습니다.</p>
        ) : (
          monthlyRanking.slice(0, 10).map((user) => (
            <div
              key={user.userId}
              className={`p-4 rounded-lg border ${
                user.rank <= 3
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
                  : 'bg-white border-gray-200'
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
                    <div className="font-semibold text-gray-900">{user.userName}</div>
                    <div className="text-xs text-gray-600">{user.userEmail}</div>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-50">
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

