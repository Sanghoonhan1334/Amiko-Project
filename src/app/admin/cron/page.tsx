'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CronTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    testResult?: Record<string, unknown>;
    results?: {
      total?: number;
      success?: number;
      failure?: number;
    };
  } | null>(null);
  const [error, setError] = useState<string>('');

  const testReminder = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('🧪 리마인더 테스트 시작...');
      
      const response = await fetch('/api/cron/test-reminder', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        console.log('✅ 리마인더 테스트 성공:', data);
      } else {
        setError(data.error || '테스트 실패');
        console.error('❌ 리마인더 테스트 실패:', data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      console.error('❌ 리마인더 테스트 중 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const runActualReminder = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('🕒 실제 리마인더 실행 시작...');
      
      const response = await fetch('/api/cron/reminder', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        console.log('✅ 실제 리마인더 실행 성공:', data);
      } else {
        setError(data.error || '실행 실패');
        console.error('❌ 실제 리마인더 실행 실패:', data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      console.error('❌ 실제 리마인더 실행 중 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">🕒 리마인더 스케줄러 테스트</h1>
        <p className="text-gray-600 mt-2">
          상담 리마인더 시스템을 테스트하고 수동으로 실행할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 테스트 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧪 테스트 모드
            </CardTitle>
            <CardDescription>
              리마인더 시스템의 동작을 테스트합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testReminder} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? '테스트 중...' : '🧪 리마인더 테스트'}
            </Button>
          </CardContent>
        </Card>

        {/* 실제 실행 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚀 실제 실행
            </CardTitle>
            <CardDescription>
              실제 리마인더를 발송합니다. (24시간 후 예약 대상)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runActualReminder} 
              disabled={loading}
              className="w-full"
            >
              {loading ? '실행 중...' : '🚀 리마인더 실행'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 오류 표시 */}
      {error && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              ❌ 오류 발생
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 결과 표시 */}
      {result && (
        <Card className="mt-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              ✅ 실행 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>성공:</strong> {result.success ? '✅' : '❌'}</p>
              <p><strong>메시지:</strong> {typeof result.message === 'string' ? result.message : '메시지 없음'}</p>
              
              {result.testResult && typeof result.testResult === 'object' && (
                <div className="mt-4 p-4 bg-white rounded border">
                  <h4 className="font-semibold mb-2">📊 상세 결과:</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(result.testResult, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.results && typeof result.results === 'object' && (
                <div className="mt-4 p-4 bg-white rounded border">
                  <h4 className="font-semibold mb-2">📊 통계:</h4>
                  <ul className="space-y-1">
                    <li><strong>전체:</strong> {typeof result.results.total === 'number' ? result.results.total : 0}건</li>
                    <li><strong>성공:</strong> {typeof result.results.success === 'number' ? result.results.success : 0}건</li>
                    <li><strong>실패:</strong> {typeof result.results.failure === 'number' ? result.results.failure : 0}건</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 설명 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📋 리마인더 시스템 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">🎯 동작 방식:</h4>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
              <li>상담 24시간 전에 자동 리마인더 발송</li>
              <li>고객과 상담사 모두에게 푸시 알림 + 이메일</li>
              <li>중복 발송 방지 (reminder_sent 플래그)</li>
              <li>개별 예약별 독립적 처리</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold">⚙️ 자동화 설정:</h4>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
              <li>매일 오전 9시 cron job 실행 권장</li>
              <li>Vercel: vercel.json에 cron 설정</li>
              <li>로컬: crontab 또는 npm 스크립트 사용</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold">🔍 모니터링:</h4>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
              <li>콘솔 로그에서 [CRON REMINDER] 태그 확인</li>
              <li>성공/실패 통계 제공</li>
              <li>개별 예약별 상세 로그</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
