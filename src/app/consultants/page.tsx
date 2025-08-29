'use client';

import React, { useEffect, useState } from 'react';
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

  // 내부 API 호출 - CORS 프리
  const fetchConsultants = async () => {
    try {
      console.log('🔍 [CONSULTANTS] 네트워크 요청 Origin 확인:');
      console.log('📍 요청 URL:', '/api/consultants');
      console.log('📍 Origin:', window.location.origin);
      console.log('📍 Same-Origin:', true);
      
      // 실제 API 호출
      const response = await fetch('/api/consultants');
      const result = await response.json();
      
      if (result.success) {
        setConsultants(result.data);
        console.log('✅ 상담사 데이터 로드 성공:', result.data.length, '명');
      } else {
        console.error('❌ 상담사 데이터 로드 실패:', result.message);
        // 실패 시 더미 데이터 사용
        setConsultants(dummyConsultants);
      }
    } catch (error) {
      console.error('상담사 데이터 조회 실패:', error);
      // 오류 시 더미 데이터 사용
      setConsultants(dummyConsultants);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultants();
  }, []);

  // 더미 상담사 데이터
  const dummyConsultants = [
    {
      id: 1,
      name: '김멘토',
      specialty: '문화 교류',
      experience: '5년',
      rating: 4.8,
      totalSessions: 127,
      languages: ['한국어', '영어', '일본어'],
      description: '한국 문화와 언어를 가르치는 것을 좋아하는 따뜻한 멘토입니다.',
      price: '50,000원',
      available: true
    },
    {
      id: 2,
      name: '이멘토',
      specialty: '발음 교정',
      experience: '3년',
      rating: 4.9,
      totalSessions: 89,
      languages: ['한국어', '중국어'],
      description: '정확한 한국어 발음과 자연스러운 회화를 가르치는 전문가입니다.',
      price: '45,000원',
      available: true
    },
    {
      id: 3,
      name: '박멘토',
      specialty: '문화 교류',
      experience: '7년',
      rating: 4.7,
      totalSessions: 203,
      languages: ['한국어', '영어', '프랑스어'],
      description: '다양한 문화적 배경을 가진 학생들과 소통하는 것을 즐깁니다.',
      price: '55,000원',
      available: false
    },
    {
      id: 4,
      name: '최멘토',
      specialty: '발음 교정',
      experience: '4년',
      rating: 4.6,
      totalSessions: 156,
      languages: ['한국어', '러시아어'],
      description: '체계적이고 효과적인 한국어 학습 방법을 제공합니다.',
      price: '48,000원',
      available: true
    }
  ];

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
