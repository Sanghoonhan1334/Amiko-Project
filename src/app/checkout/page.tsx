'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const service = searchParams.get('service') || 'culture';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    notes: ''
  });
  const [isFormValid, setIsFormValid] = useState(false);

  // 내부 API 호출 - CORS 프리
  const fetchServiceInfo = useCallback(async () => {
    try {
      console.log('🔍 [CHECKOUT] 네트워크 요청 Origin 확인:');
      console.log('📍 요청 URL:', `/api/services/${service}`);
      console.log('📍 Origin:', window.location.origin);
      console.log('📍 Same-Origin:', true);
      
      // 실제 API 호출
      const response = await fetch(`/api/services/${service}`);
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 서비스 정보 로드 성공:', result.data);
      } else {
        console.error('❌ 서비스 정보 로드 실패:', result.message);
      }
      
    } catch (error) {
      console.error('서비스 정보 조회 실패:', error);
    }
  }, [service]);

  useEffect(() => {
    fetchServiceInfo();
  }, [service, fetchServiceInfo]);

  // 폼 유효성 검사
  useEffect(() => {
    const isValid = Boolean(formData.name && formData.email && formData.phone && formData.date && formData.time);
    setIsFormValid(isValid);
  }, [formData]);

  const serviceInfo = {
    culture: {
      name: '문화 교류',
      price: 50000,
      description: '한국인 멘토와 함께하는 진정한 한국 문화 체험'
    },
    pronunciation: {
      name: '발음 교정',
      price: 45000,
      description: '전문적인 한국어 발음 교정 및 회화 연습'
    }
  };

  const selectedService = serviceInfo[service as keyof typeof serviceInfo];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // 폼 데이터 검증
      if (!isFormValid) {
        console.log('모든 필수 필드를 입력해주세요.')
        return
      }

      console.log('폼이 제출되었습니다!')
      console.log('폼 데이터:', formData)
      
    } catch (err: unknown) {
      console.error('오류 발생:', err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 mb-2">예약 확인 및 결제</h1>
            <p className="text-xl text-zinc-600">서비스 정보를 확인하고 예약을 완료하세요</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* 예약 폼 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-zinc-800">예약 정보 입력</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="name">이름 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="이름을 입력하세요"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">이메일 *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="이메일을 입력하세요"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">연락처 *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="연락처를 입력하세요"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">날짜 *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">시간 *</Label>
                      <Select value={formData.time} onValueChange={(value: string) => handleInputChange('time', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="시간 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="09:00">09:00</SelectItem>
                          <SelectItem value="10:00">10:00</SelectItem>
                          <SelectItem value="11:00">11:00</SelectItem>
                          <SelectItem value="14:00">14:00</SelectItem>
                          <SelectItem value="15:00">15:00</SelectItem>
                          <SelectItem value="16:00">16:00</SelectItem>
                          <SelectItem value="17:00">17:00</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">특별 요청사항</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="특별한 요청사항이 있다면 입력해주세요"
                    />
                  </div>

                  {/* 결제 안내 */}
                  <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700 font-medium">
                      결제 시스템이 준비 중입니다
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      PayPal 결제 시스템을 통해 안전하게 결제하실 수 있습니다
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* 주문 요약 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-zinc-800">주문 요약</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 서비스 정보 */}
                  <div className="p-4 bg-zinc-50 rounded-lg">
                    <h3 className="font-semibold text-zinc-800 mb-2">{selectedService.name}</h3>
                    <p className="text-zinc-600 text-sm mb-2">{selectedService.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-600">서비스 요금</span>
                      <span className="font-semibold text-zinc-800">{selectedService.price.toLocaleString()}원</span>
                    </div>
                  </div>

                  <Separator />

                  {/* 예약 정보 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-zinc-800">예약 정보</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">서비스</span>
                        <span className="text-zinc-800">{selectedService.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">소요시간</span>
                        <span className="text-zinc-800">60분</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">예약 가능 시간</span>
                        <span className="text-zinc-800">09:00 ~ 17:00</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* 결제 정보 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-zinc-800">결제 정보</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">서비스 요금</span>
                        <span className="text-zinc-800">{selectedService.price.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">수수료</span>
                        <span className="text-zinc-800">0원</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-semibold">
                        <span>총 결제 금액</span>
                        <span className="text-zinc-900">{selectedService.price.toLocaleString()}원</span>
                      </div>
                    </div>
                  </div>

                  {/* 결제 방법 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-zinc-800">결제 방법</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="radio" id="card" name="payment" defaultChecked />
                        <Label htmlFor="card">신용카드</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="radio" id="transfer" name="payment" />
                        <Label htmlFor="transfer">계좌이체</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="radio" id="kakao" name="payment" />
                        <Label htmlFor="kakao">카카오페이</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
