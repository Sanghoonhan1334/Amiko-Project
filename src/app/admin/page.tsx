'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Gift, TrendingUp, Video } from 'lucide-react';

interface DashboardStats {
  totalPayments: number;
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  recentPayments: Record<string, unknown>[];
  recentBookings: Record<string, unknown>[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPayments: 0,
    totalRevenue: 0,
    totalBookings: 0,
    totalUsers: 0,
    recentPayments: [],
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 통계 데이터 조회
      const [paymentsRes, bookingsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats/payments'),
        fetch('/api/admin/stats/bookings'),
        fetch('/api/admin/stats/users')
      ]);

      const paymentsData = await paymentsRes.json();
      const bookingsData = await bookingsRes.json();
      const usersData = await usersRes.json();

      // API 응답 구조에 맞게 데이터 매핑
      setStats({
        totalPayments: paymentsData.stats?.totalPayments || 0,
        totalRevenue: paymentsData.stats?.totalAmount || 0,
        totalBookings: bookingsData.total || 0,
        totalUsers: usersData.stats?.totalUsers || 0,
        recentPayments: paymentsData.recent || [],
        recentBookings: bookingsData.recent || []
      });
    } catch (error) {
      console.error('대시보드 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 안전한 숫자 포맷팅 함수
  const safeToLocaleString = (value: number | undefined) => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600">결제 및 예약 현황을 한눈에 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 결제 건수</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeToLocaleString(stats.totalPayments)}</div>
            <p className="text-xs text-muted-foreground">전체 결제 건수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩{safeToLocaleString(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">전체 매출액</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 예약</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeToLocaleString(stats.totalBookings)}</div>
            <p className="text-xs text-muted-foreground">전체 예약 건수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeToLocaleString(stats.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">전체 사용자 수</p>
          </CardContent>
        </Card>
      </div>

      {/* 포인트 랭킹 & 이벤트 관리 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 포인트 랭킹 링크 */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/admin/points'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-500" />
              포인트 랭킹
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">사용자 포인트 순위 및 통계 확인</p>
            <Button variant="outline" className="w-full">랭킹 확인하기</Button>
          </CardContent>
        </Card>

        {/* 이벤트 관리 링크 */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/admin/events'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-purple-500" />
              이벤트 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">추천인 이벤트 및 월별 포인트 이벤트 관리</p>
            <Button variant="outline" className="w-full">이벤트 관리하기</Button>
          </CardContent>
        </Card>
      </div>

      {/* 화상 채팅 관리 추가 */}
      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/admin/conversation-partners'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Video className="w-6 h-6 text-blue-500" />
            화상 채팅 파트너 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">AI 화상 채팅 대화상대 등록 및 관리</p>
          <Button variant="outline" className="w-full">파트너 관리하기</Button>
        </CardContent>
      </Card>

      {/* 최근 결제 및 예약 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 결제 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              최근 결제
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/payments'}>
                전체보기
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentPayments.length > 0 ? (
                stats.recentPayments.map((payment: Record<string, unknown>) => (
                  <div key={String(payment.id)} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{typeof payment.order_id === 'string' ? payment.order_id : 'N/A'}</p>
                      <p className="text-xs text-gray-500">{typeof payment.method === 'string' ? payment.method : 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">₩{safeToLocaleString(typeof payment.amount === 'number' ? payment.amount : 0)}</p>
                      <p className={`text-xs px-2 py-1 rounded-full ${
                        payment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {typeof payment.status === 'string' ? payment.status : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">최근 결제 내역이 없습니다</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 최근 예약 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              최근 예약
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/bookings'}>
                전체보기
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentBookings.length > 0 ? (
                stats.recentBookings.map((booking: Record<string, unknown>) => (
                  <div key={String(booking.id)} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{typeof booking.topic === 'string' ? booking.topic : 'N/A'}</p>
                      <p className="text-xs text-gray-500">
                        {typeof booking.start_at === 'string' ? new Date(booking.start_at).toLocaleDateString() : '날짜 없음'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">₩{safeToLocaleString(typeof booking.price === 'number' ? booking.price : 0)}</p>
                      <p className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {typeof booking.status === 'string' ? booking.status : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">최근 예약 내역이 없습니다</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
