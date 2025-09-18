'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function PrivacyPolicy() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-['Inter']">
            {t('footer.privacy')}
          </h1>
          <p className="text-lg text-gray-600 font-['Inter']">
            {t('privacy.lastUpdated')}: 2025년 1월 17일
          </p>
        </div>

        {/* 본문 */}
        <div className="bg-white/80 rounded-2xl shadow-lg p-8 space-y-8">
          {/* 1. 개인정보 수집 및 이용 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              1. 개인정보 수집 및 이용
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div>
                <h3 className="text-lg font-semibold mb-2">수집하는 개인정보</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>회원가입 시: 이메일 주소, 비밀번호, 닉네임</li>
                  <li>프로필 설정 시: 프로필 사진, 자기소개, 관심사</li>
                  <li>결제 시: 결제 정보, 배송 주소 (필요한 경우)</li>
                  <li>서비스 이용 시: 화상채팅 기록, 커뮤니티 활동 내역</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">수집 목적</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>회원 식별 및 본인 확인</li>
                  <li>서비스 제공 및 개선</li>
                  <li>고객 지원 및 문의 응답</li>
                  <li>결제 처리 및 환불</li>
                  <li>마케팅 및 이벤트 안내</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. 개인정보 보관 및 이용기간 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              2. 개인정보 보관 및 이용기간
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>회원의 개인정보는 원칙적으로 개인정보 수집 및 이용목적이 달성되면 지체없이 파기합니다.</p>
              <div>
                <h3 className="text-lg font-semibold mb-2">보관 기간</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>회원 정보: 회원 탈퇴 시까지</li>
                  <li>결제 정보: 관련 법령에 따라 5년간 보관</li>
                  <li>서비스 이용 기록: 1년간 보관</li>
                  <li>문의 및 고객 지원 기록: 3년간 보관</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. 개인정보 제3자 제공 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              3. 개인정보 제3자 제공
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>AMIKO는 원칙적으로 회원의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>회원이 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                <li>결제 처리 및 환불을 위한 결제 대행업체</li>
                <li>서비스 제공을 위한 기술적 지원 업체</li>
              </ul>
            </div>
          </section>

          {/* 4. 개인정보 보호를 위한 기술적/관리적 대책 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              4. 개인정보 보호를 위한 기술적/관리적 대책
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>개인정보 암호화 저장 및 전송</li>
                <li>접근 권한 관리 및 접근 로그 기록</li>
                <li>정기적인 보안 점검 및 업데이트</li>
                <li>개인정보 처리 직원의 최소화 및 교육</li>
                <li>개인정보 보호 전담 조직 운영</li>
              </ul>
            </div>
          </section>

          {/* 5. 개인정보 처리방침 변경 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              5. 개인정보 처리방침 변경
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>이 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>
            </div>
          </section>

          {/* 6. 개인정보 보호책임자 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              6. 개인정보 보호책임자
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>개인정보 보호책임자:</strong> AMIKO 개인정보보호팀</p>
                <p><strong>연락처:</strong> privacy@amiko.com</p>
                <p><strong>주소:</strong> 서울특별시 강남구 테헤란로 123, AMIKO 빌딩</p>
              </div>
            </div>
          </section>
        </div>

        {/* 하단 버튼 */}
        <div className="text-center mt-8">
          <button 
            onClick={() => window.history.back()}
            className="bg-gradient-to-r from-brand-500 to-mint-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 font-['Inter']"
          >
            이전 페이지로
          </button>
        </div>
      </div>
    </div>
  )
}
