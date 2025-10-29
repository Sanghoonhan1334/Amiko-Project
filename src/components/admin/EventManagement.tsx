'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Gift, Users, Trophy, Sparkles } from 'lucide-react'

interface ReferralParticipant {
  id: string
  userId: string
  userName: string
  userEmail: string
  isWinner: boolean
  prizeType: string | null
  prizeRank: number | null
  referralCode: string
}

interface MonthlyPointsParticipant {
  id: string
  userId: string
  userName: string
  userEmail: string
  monthlyPoints: number
  totalPointsRank: number | null
  isWinner: boolean
  prizeType: string | null
  rank: number
}

export default function EventManagement() {
  const [referralParticipants, setReferralParticipants] = useState<ReferralParticipant[]>([])
  const [monthlyParticipants, setMonthlyParticipants] = useState<MonthlyPointsParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('january-2026')
  
  useEffect(() => {
    loadData()
  }, [selectedPeriod])
  
  const loadData = async () => {
    setLoading(true)
    try {
      const [referralRes, monthlyRes] = await Promise.all([
        fetch(`/api/admin/events/referral?period=${selectedPeriod}`),
        fetch(`/api/admin/events/monthly-points?period=${selectedPeriod}`)
      ])
      
      const referralData = await referralRes.json()
      const monthlyData = await monthlyRes.json()
      
      setReferralParticipants(referralData.participants || [])
      setMonthlyParticipants(monthlyData.participants || [])
    } catch (error) {
      console.error('데이터 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleDrawReferral = async () => {
    if (!confirm('추천인 이벤트 추첨을 실행하시겠습니까?')) return
    
    try {
      const res = await fetch('/api/admin/events/draw/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: selectedPeriod })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        alert('추첨이 완료되었습니다!')
        loadData()
      } else {
        alert(`오류: ${data.error}`)
      }
    } catch (error) {
      alert('추첨 중 오류가 발생했습니다.')
    }
  }
  
  const handleDrawMonthly = async () => {
    if (!confirm('월별 포인트 이벤트 추첨을 실행하시겠습니까?')) return
    
    try {
      const res = await fetch('/api/admin/events/draw/monthly-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: selectedPeriod })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        alert('추첨이 완료되었습니다!')
        loadData()
      } else {
        alert(`오류: ${data.error}`)
      }
    } catch (error) {
      alert('추첨 중 오류가 발생했습니다.')
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }
  
  const referralWinners = referralParticipants.filter(p => p.isWinner)
  const monthlyWinners = monthlyParticipants.filter(p => p.isWinner)
  
  return (
    <Tabs defaultValue="referral" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="referral">
          <Users className="w-4 h-4 mr-2" />
          추천인 이벤트
        </TabsTrigger>
        <TabsTrigger value="monthly">
          <Trophy className="w-4 h-4 mr-2" />
          월별 포인트 이벤트
        </TabsTrigger>
      </TabsList>
      
      {/* 추천인 이벤트 */}
      <TabsContent value="referral" className="space-y-4">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-lg text-gray-900">추천인 이벤트</h3>
            </div>
            <Badge variant="outline" className="bg-purple-100 text-purple-800">
              참가자 {referralParticipants.length}명
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            1등: 한국 스킨케어 | 추첨 10명: 마스크팩
          </p>
          <Button 
            onClick={handleDrawReferral}
            disabled={referralParticipants.length === 0}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            추첨 실행
          </Button>
        </div>
        
        {/* 당첨자 */}
        {referralWinners.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
            <h4 className="font-bold text-lg text-yellow-900 mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              당첨자 ({referralWinners.length}명)
            </h4>
            <div className="space-y-2">
              {referralWinners.map((winner) => (
                <div key={winner.id} className="bg-white rounded-lg p-3 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{winner.userName}</div>
                      <div className="text-xs text-gray-600">{winner.userEmail}</div>
                    </div>
                    <Badge className="bg-yellow-500 text-white">
                      {winner.prizeRank === 1 ? '1등 - 스킨케어' : `${winner.prizeRank}등 - 마스크팩`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 참가자 목록 */}
        <div>
          <h4 className="font-bold text-lg text-gray-900 mb-3">전체 참가자</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {referralParticipants.length === 0 ? (
              <p className="text-center text-gray-500 py-8">참가자가 없습니다.</p>
            ) : (
              referralParticipants.slice(0, 20).map((participant) => (
                <div 
                  key={participant.id} 
                  className={`p-3 rounded-lg border ${
                    participant.isWinner 
                      ? 'bg-yellow-50 border-yellow-300' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{participant.userName}</div>
                      <div className="text-xs text-gray-600">
                        {participant.userEmail} • 코드: {participant.referralCode}
                      </div>
                    </div>
                    {participant.isWinner && (
                      <Badge className="bg-yellow-500 text-white">당첨</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </TabsContent>
      
      {/* 월별 포인트 이벤트 */}
      <TabsContent value="monthly" className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-lg text-gray-900">월별 포인트 이벤트</h3>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              참가자 {monthlyParticipants.length}명
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            1등: 고가 선크림 + 마스크팩 | 추첨 3명: 스킨케어 + 마스크팩
          </p>
          <Button 
            onClick={handleDrawMonthly}
            disabled={monthlyParticipants.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            추첨 실행
          </Button>
        </div>
        
        {/* 당첨자 */}
        {monthlyWinners.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
            <h4 className="font-bold text-lg text-yellow-900 mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              당첨자 ({monthlyWinners.length}명)
            </h4>
            <div className="space-y-2">
              {monthlyWinners.map((winner) => (
                <div key={winner.id} className="bg-white rounded-lg p-3 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{winner.userName}</div>
                      <div className="text-xs text-gray-600">{winner.userEmail}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-blue-600">{winner.monthlyPoints} pts</div>
                      <Badge className="bg-yellow-500 text-white mt-1">
                        {winner.rank === 1 ? '1등 - 선크림' : '추첨 - 스킨케어'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 참가자 목록 (포인트 순위) */}
        <div>
          <h4 className="font-bold text-lg text-gray-900 mb-3">포인트 순위</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {monthlyParticipants.length === 0 ? (
              <p className="text-center text-gray-500 py-8">참가자가 없습니다.</p>
            ) : (
              monthlyParticipants.slice(0, 20).map((participant) => (
                <div 
                  key={participant.id} 
                  className={`p-3 rounded-lg border ${
                    participant.isWinner 
                      ? 'bg-yellow-50 border-yellow-300' 
                      : participant.rank <= 3
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        participant.rank === 1 ? 'bg-blue-500 text-white' :
                        participant.rank === 2 ? 'bg-purple-500 text-white' :
                        participant.rank === 3 ? 'bg-pink-500 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {participant.rank}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{participant.userName}</div>
                        <div className="text-xs text-gray-600">{participant.userEmail}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-blue-50">
                        {participant.monthlyPoints.toLocaleString()} pts
                      </Badge>
                      {participant.isWinner && (
                        <Badge className="bg-yellow-500 text-white ml-2">당첨</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

