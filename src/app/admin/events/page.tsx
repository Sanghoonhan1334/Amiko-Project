'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Gift, Users, Trophy, BarChart3, Calendar } from 'lucide-react'

interface EventParticipant {
  id: string
  userId: string
  userName: string
  userEmail: string
  monthlyPoints?: number
  totalPoints?: number
  isWinner: boolean
  prizeType?: string
  referralCode?: string
  createdAt: string
}

export default function EventsAdminPage() {
  const [loading, setLoading] = useState(true)
  const [referralParticipants, setReferralParticipants] = useState<EventParticipant[]>([])
  const [monthlyParticipants, setMonthlyParticipants] = useState<EventParticipant[]>([])
  const [currentPeriod, setCurrentPeriod] = useState<string>('january-2026')
  
  useEffect(() => {
    loadParticipants()
  }, [currentPeriod])
  
  const loadParticipants = async () => {
    setLoading(true)
    try {
      const [referralRes, monthlyRes] = await Promise.all([
        fetch(`/api/admin/events/referral?period=${currentPeriod}`),
        fetch(`/api/admin/events/monthly-points?period=${currentPeriod}`)
      ])
      
      const referralData = await referralRes.json()
      const monthlyData = await monthlyRes.json()
      
      setReferralParticipants(referralData.participants || [])
      setMonthlyParticipants(monthlyData.participants || [])
    } catch (error) {
      console.error('참가자 데이터 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleDrawReferral = async () => {
    if (!confirm('정말 추첨을 진행하시겠습니까?')) return
    
    try {
      const response = await fetch('/api/admin/events/draw/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: currentPeriod })
      })
      
      if (response.ok) {
        alert('추첨이 완료되었습니다!')
        loadParticipants()
      } else {
        alert('추첨 실패')
      }
    } catch (error) {
      console.error('추첨 오류:', error)
      alert('추첨 중 오류가 발생했습니다.')
    }
  }
  
  const handleDrawMonthly = async () => {
    if (!confirm('정말 추첨을 진행하시겠습니까?')) return
    
    try {
      const response = await fetch('/api/admin/events/draw/monthly-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: currentPeriod })
      })
      
      if (response.ok) {
        alert('추첨이 완료되었습니다!')
        loadParticipants()
      } else {
        alert('추첨 실패')
      }
    } catch (error) {
      console.error('추첨 오류:', error)
      alert('추첨 중 오류가 발생했습니다.')
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">이벤트 관리</h1>
        <p className="text-gray-600">추첨 관리 및 참가자 확인</p>
      </div>
      
      <Tabs defaultValue="referral" className="space-y-4">
        <TabsList>
          <TabsTrigger value="referral">추천인 이벤트</TabsTrigger>
          <TabsTrigger value="monthly">월별 포인트 이벤트</TabsTrigger>
        </TabsList>
        
        {/* 추천인 이벤트 */}
        <TabsContent value="referral" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>추천인 코드 이벤트</CardTitle>
                  <CardDescription>1등: 스킨케어 | 추첨 10명: 마스크팩</CardDescription>
                </div>
                <Button onClick={handleDrawReferral}>
                  <Gift className="w-4 h-4 mr-2" />
                  추첨 실행
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-4">
                <Badge variant="outline" className="text-lg">
                  <Users className="w-4 h-4 mr-1" />
                  총 {referralParticipants.length}명 참여
                </Badge>
                <Badge variant="outline" className="text-lg text-green-600">
                  <Trophy className="w-4 h-4 mr-1" />
                  당첨 {referralParticipants.filter(p => p.isWinner).length}명
                </Badge>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {referralParticipants.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">참가자가 없습니다.</p>
                ) : (
                  referralParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className={`p-3 rounded-lg border ${
                        participant.isWinner 
                          ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                          : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {participant.userName}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {participant.userEmail}
                          </div>
                          <div className="text-xs text-gray-500">
                            추천인 코드: {participant.referralCode}
                          </div>
                        </div>
                        {participant.isWinner && (
                          <Badge className={
                            participant.prizeType === 'skincare' 
                              ? 'bg-purple-500' 
                              : 'bg-blue-500'
                          }>
                            {participant.prizeType === 'skincare' ? '1등 (스킨케어)' : '추첨 당첨'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 월별 포인트 이벤트 */}
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>월별 포인트 이벤트</CardTitle>
                  <CardDescription>1등: 고가 선크림 + 마스크팩 | 추첨 3명: 스킨케어 + 마스크팩</CardDescription>
                </div>
                <Button onClick={handleDrawMonthly}>
                  <Gift className="w-4 h-4 mr-2" />
                  추첨 실행
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-4">
                <Badge variant="outline" className="text-lg">
                  <Users className="w-4 h-4 mr-1" />
                  총 {monthlyParticipants.length}명 참여
                </Badge>
                <Badge variant="outline" className="text-lg text-green-600">
                  <Trophy className="w-4 h-4 mr-1" />
                  당첨 {monthlyParticipants.filter(p => p.isWinner).length}명
                </Badge>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {monthlyParticipants.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">참가자가 없습니다.</p>
                ) : (
                  monthlyParticipants
                    .sort((a, b) => (b.monthlyPoints || 0) - (a.monthlyPoints || 0))
                    .map((participant, index) => (
                      <div
                        key={participant.id}
                        className={`p-3 rounded-lg border ${
                          participant.isWinner 
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                            : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {participant.userName}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {participant.userEmail}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-lg">
                              {participant.monthlyPoints || 0} pts
                            </Badge>
                            {participant.isWinner && (
                              <Badge className="mt-1 bg-purple-500">
                                {participant.prizeType === 'premium_sunscreen' ? '1등' : '추첨 당첨'}
                              </Badge>
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

