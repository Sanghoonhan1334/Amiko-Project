'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Trophy, Medal, Users, TrendingUp, Search, Download } from 'lucide-react'

interface UserRanking {
  userId: string
  userName: string
  userEmail: string
  totalPoints: number
  monthlyPoints: number
  availablePoints: number
  rank: number
}

export default function PointsRankingPage() {
  const [loading, setLoading] = useState(true)
  const [totalRanking, setTotalRanking] = useState<UserRanking[]>([])
  const [monthlyRanking, setMonthlyRanking] = useState<UserRanking[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  
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
  
  const filteredTotalRanking = totalRanking.filter(user => 
    user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const filteredMonthlyRanking = monthlyRanking.filter(user =>
    user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">포인트 랭킹</h1>
        <p className="text-gray-600">사용자 포인트 현황 및 순위 관리</p>
      </div>
      
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 사용자 수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRanking.length}</div>
            <p className="text-xs text-muted-foreground">전체 가입자</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최고 누적 점수</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRanking[0]?.totalPoints || 0}</div>
            <p className="text-xs text-muted-foreground">1위 사용자</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최고 월별 점수</CardTitle>
            <Medal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyRanking[0]?.monthlyPoints || 0}</div>
            <p className="text-xs text-muted-foreground">이번 달 1위</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 점수</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(totalRanking.reduce((sum, user) => sum + user.totalPoints, 0) / totalRanking.length) || 0}
            </div>
            <p className="text-xs text-muted-foreground">전체 평균</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="total" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="total">누적 점수</TabsTrigger>
            <TabsTrigger value="monthly">월별 점수</TabsTrigger>
          </TabsList>
          
          {/* 검색 및 내보내기 */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="이름 또는 이메일 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
          </div>
        </div>
        
        {/* 누적 점수 랭킹 */}
        <TabsContent value="total" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>전체 누적 점수 랭킹</CardTitle>
              <CardDescription>가입부터 누적된 총 점수 기준</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredTotalRanking.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">사용자가 없습니다.</p>
                ) : (
                  filteredTotalRanking.map((user) => (
                    <div
                      key={user.userId}
                      className={`p-4 rounded-lg border transition-colors ${
                        user.rank <= 3
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-800'
                          : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                            user.rank === 1 ? 'bg-yellow-500 text-white' :
                            user.rank === 2 ? 'bg-gray-400 text-white' :
                            user.rank === 3 ? 'bg-orange-500 text-white' :
                            'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {user.rank}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {user.userName}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {user.userEmail}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="text-lg px-3 py-1">
                            {user.totalPoints.toLocaleString()} pts
                          </Badge>
                          {user.rank <= 3 && (
                            <span className="text-2xl">
                              {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 월별 점수 랭킹 */}
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>이번 달 점수 랭킹</CardTitle>
              <CardDescription>현재 월에 획득한 점수 기준 (2월 이벤트 참고용)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredMonthlyRanking.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">사용자가 없습니다.</p>
                ) : (
                  filteredMonthlyRanking.map((user) => (
                    <div
                      key={user.userId}
                      className={`p-4 rounded-lg border transition-colors ${
                        user.rank <= 3
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-800'
                          : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                            user.rank === 1 ? 'bg-blue-500 text-white' :
                            user.rank === 2 ? 'bg-purple-500 text-white' :
                            user.rank === 3 ? 'bg-pink-500 text-white' :
                            'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {user.rank}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {user.userName}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {user.userEmail}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="text-lg px-3 py-1 bg-blue-50 dark:bg-blue-900/20">
                            {user.monthlyPoints.toLocaleString()} pts
                          </Badge>
                          {user.rank <= 3 && (
                            <span className="text-2xl">
                              {user.rank === 1 ? '🏆' : user.rank === 2 ? '🥈' : '🥉'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

