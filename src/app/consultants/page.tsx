'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ConsultantsPage() {
  // 타입 정의
  interface Consultant {
    id: number;
    name: string;
    specialty: string;
    experience: string;
    rating: number;
    totalSessions: number;
    languages: string[];
    description: string;
    price: string;
    available: boolean;
  }

  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // 내부 API 호출 - CORS 프리
  const fetchConsultants = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/consultants')
      if (!response.ok) {
        throw new Error('상담사 목록을 불러올 수 없습니다.')
      }
      const data = await response.json()
      setConsultants(data.consultants || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConsultants();
  }, [fetchConsultants]);



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p>상담사 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 mb-2">상담사 목록</h1>
            <p className="text-xl text-zinc-600">전문적이고 경험이 풍부한 멘토들을 만나보세요</p>
          </div>

          {/* 필터 옵션 */}
          <div className="mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-2 block">
                      전문 분야
                    </label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">전체</Button>
                      <Button variant="outline" size="sm">문화 교류</Button>
                      <Button variant="outline" size="sm">발음 교정</Button>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-2 block">
                      언어
                    </label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">전체</Button>
                      <Button variant="outline" size="sm">영어</Button>
                      <Button variant="outline" size="sm">중국어</Button>
                      <Button variant="outline" size="sm">일본어</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 상담사 목록 */}
          <div className="grid md:grid-cols-2 gap-6">
            {consultants.map((consultant) => (
              <Card key={consultant.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-zinc-800 mb-2">
                        {consultant.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{consultant.specialty}</Badge>
                        <Badge variant="outline">{consultant.experience}</Badge>
                        {!consultant.available && (
                          <Badge variant="destructive">예약 불가</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-zinc-900">
                        {consultant.price}
                      </div>
                      <div className="text-sm text-zinc-500">/회</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-600 mb-4">{consultant.description}</p>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-700">평점:</span>
                      <span className="text-yellow-600 font-semibold">★ {consultant.rating}</span>
                      <span className="text-sm text-zinc-500">({consultant.totalSessions}회)</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-700">언어:</span>
                      <div className="flex gap-1">
                        {consultant.languages.map((lang, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      disabled={!consultant.available}
                    >
                      프로필 보기
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      disabled={!consultant.available}
                    >
                      예약하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
