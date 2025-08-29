'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';
import PaymentButton from '@/components/payments/PaymentButton';

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
  const fetchServiceInfo = async () => {
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
  };

  useEffect(() => {
    fetchServiceInfo();
  }, [service]);

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

  const handlePaymentSuccess = async () => {
    try {
      console.log('🔍 [CHECKOUT] 결제 성공 후 예약 정보 저장:');
      console.log('📍 요청 URL:', '/api/payments/create');
      console.log('📍 Origin:', window.location.origin);
      console.log('📍 Same-Origin:', true);
      
      // 결제 성공 후 내부 API로 예약 정보 저장
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          service: selectedService, 
          ...formData,
          status: 'paid'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 예약 정보 저장 성공:', result.data);
        // 성공 페이지로 리다이렉트
        window.location.href = `/payments/success?orderId=${result.data.orderId}`;
      } else {
        throw new Error(result.message || '예약 생성 실패');
      }
      
    } catch (error) {
      console.error('예약 정보 저장 실패:', error);
      alert('예약 정보 저장에 실패했습니다. 고객센터로 문의해주세요.');
    }
  };

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

                  {/* 결제 버튼 */}
                  <PaymentButton
                    amount={selectedService.price}
                    orderName={`${selectedService.name} - ${formData.name || '고객'}`}
                    customerName={formData.name || '고객'}
                    customerEmail={formData.email}
                    className="w-full"
                    disabled={!isFormValid}
                  />
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
