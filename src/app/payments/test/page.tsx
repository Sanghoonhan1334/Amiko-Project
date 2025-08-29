import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PaymentButton from "@/components/payments/PaymentButton";

export default function PaymentTestPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                🧪 결제 시스템 테스트
              </h1>
              <p className="text-gray-600">
                개발자용 결제 시스템 테스트 페이지입니다. 
                Toss Payments 연동 상태를 확인하고 결제 플로우를 테스트할 수 있습니다.
              </p>
            </div>

            {/* 개발자 전용 경고 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-yellow-800">
                  개발자 전용 페이지
                </span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                이 페이지는 개발 및 테스트 목적으로만 사용됩니다. 실제 고객은 사용하지 않습니다.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="grid gap-6">
                {/* 100원 테스트 */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">100원 테스트</h3>
                      <p className="text-sm text-gray-500">가장 작은 금액으로 결제 테스트</p>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">₩100</span>
                  </div>
                  <PaymentButton
                    amount={100}
                    orderName="[TEST] 100원 결제"
                    customerName="테스터"
                    customerEmail="test@example.com"
                    className="w-full"
                  />
                </div>

                {/* 500원 테스트 */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">500원 테스트</h3>
                      <p className="text-sm text-gray-500">중간 금액으로 결제 테스트</p>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">₩500</span>
                  </div>
                  <PaymentButton
                    amount={500}
                    orderName="[TEST] 500원 결제"
                    customerName="테스터"
                    customerEmail="test@example.com"
                    className="w-full"
                  />
                </div>

                {/* 1000원 테스트 */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">1000원 테스트</h3>
                      <p className="text-sm text-gray-500">큰 금액으로 결제 테스트</p>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">₩1,000</span>
                  </div>
                  <PaymentButton
                    amount={1000}
                    orderName="[TEST] 1000원 결제"
                    customerName="테스터"
                    customerEmail="test@example.com"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">🧪 테스트 가이드</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 각 버튼을 클릭하면 Toss Payments 결제창이 열립니다</li>
                  <li>• 테스트 모드에서는 실제 결제가 진행되지 않습니다</li>
                  <li>• 결제창을 닫거나 취소해도 안전합니다</li>
                  <li>• 성공 시 결제 확인 페이지로 이동합니다</li>
                  <li>• 실제 고객은 이 페이지를 사용하지 않습니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
