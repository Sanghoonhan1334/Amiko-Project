import SMSTest from '@/components/test/SMSTest'

export default function TestSMSPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SMS 발송 테스트
          </h1>
          <p className="text-gray-600">
            Twilio를 통한 실제 SMS 발송 테스트 페이지
          </p>
        </div>
        
        <SMSTest />
      </div>
    </div>
  )
}
