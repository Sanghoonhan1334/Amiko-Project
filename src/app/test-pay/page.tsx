'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestPayRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // /test-pay로 접속하면 /payments/test로 리다이렉트
    router.replace('/payments/test');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold mb-2">페이지 이동 중...</h1>
        <p className="text-gray-600">결제 테스트 페이지로 이동합니다.</p>
        <p className="text-sm text-gray-500 mt-2">
          자동으로 이동되지 않는다면{' '}
          <a href="/payments/test" className="text-blue-600 hover:underline">
            여기를 클릭
          </a>
          하세요.
        </p>
      </div>
    </div>
  );
} 
