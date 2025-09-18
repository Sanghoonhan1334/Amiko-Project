'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function TermsOfService() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-['Inter']">
            {t('footer.terms')}
          </h1>
          <p className="text-lg text-gray-600 font-['Inter']">
            {t('terms.lastUpdated')}: 2025년 1월 17일
          </p>
        </div>

        {/* 본문 */}
        <div className="bg-white/80 rounded-2xl shadow-lg p-8 space-y-8">
          {/* 1. 서비스 정의 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              1. 서비스 정의
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>AMIKO는 한국과 남미를 연결하는 문화 교류 플랫폼으로, 다음과 같은 서비스를 제공합니다:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>AI 화상 채팅 서비스</li>
                <li>커뮤니티 서비스 (게시판, 스토리, Q&A)</li>
                <li>포인트 시스템 (AKO)</li>
                <li>VIP 멤버십 서비스</li>
                <li>이벤트 및 특별 프로그램</li>
              </ul>
            </div>
          </section>

          {/* 2. 회원 가입 및 계정 관리 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              2. 회원 가입 및 계정 관리
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div>
                <h3 className="text-lg font-semibold mb-2">가입 조건</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>만 14세 이상 (미성년자는 법정대리인 동의 필요)</li>
                  <li>실명 인증 완료</li>
                  <li>유효한 이메일 주소 보유</li>
                  <li>서비스 이용약관에 동의</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">계정 관리</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>회원은 자신의 계정 정보를 정확하게 유지해야 합니다</li>
                  <li>계정 정보 변경 시 즉시 업데이트해야 합니다</li>
                  <li>계정 도용 시 즉시 고객센터에 신고해야 합니다</li>
                  <li>1인 1계정 원칙을 준수해야 합니다</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. 서비스 이용 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              3. 서비스 이용
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div>
                <h3 className="text-lg font-semibold mb-2">화상채팅 서비스</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>AKO 포인트를 사용하여 화상채팅를 이용할 수 있습니다</li>
                  <li>1 AKO = 20분 화상채팅</li>
                  <li>상대방과의 상호 존중을 바탕으로 이용해야 합니다</li>
                  <li>부적절한 행위 시 서비스 이용이 제한될 수 있습니다</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">커뮤니티 서비스</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>다양한 주제의 게시판에 참여할 수 있습니다</li>
                  <li>스토리 업로드 및 공유가 가능합니다</li>
                  <li>Q&A를 통한 정보 교환이 가능합니다</li>
                  <li>커뮤니티 가이드라인을 준수해야 합니다</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. 금지 행위 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              4. 금지 행위
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>다음과 같은 행위는 엄격히 금지되며, 계정 제재의 대상이 됩니다:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>욕설, 비방, 차별적 발언</li>
                <li>스팸, 광고성 게시물</li>
                <li>불법적인 내용의 게시</li>
                <li>타인의 개인정보 무단 수집 및 이용</li>
                <li>계정 공유 및 양도</li>
                <li>시스템 해킹 및 악성 프로그램 사용</li>
                <li>상업적 목적의 서비스 이용</li>
                <li>성인 콘텐츠 및 부적절한 행위</li>
              </ul>
            </div>
          </section>

          {/* 5. 결제 및 환불 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              5. 결제 및 환불
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div>
                <h3 className="text-lg font-semibold mb-2">결제 정책</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>AKO 포인트는 현금으로 구매할 수 있습니다</li>
                  <li>VIP 멤버십은 월간/연간 구독 방식입니다</li>
                  <li>결제는 신용카드, 페이팔 등으로 가능합니다</li>
                  <li>결제 후 즉시 서비스 이용이 가능합니다</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">환불 정책</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>구매 후 7일 이내 미사용 시 100% 환불 가능</li>
                  <li>사용한 AKO 포인트는 환불 불가</li>
                  <li>VIP 멤버십은 이용 기간에 따라 비례 환불</li>
                  <li>환불 요청은 고객센터를 통해 접수</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 6. 서비스 중단 및 변경 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              6. 서비스 중단 및 변경
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div>
                <h3 className="text-lg font-semibold mb-2">서비스 중단 사유</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>정기 점검 및 시스템 업데이트</li>
                  <li>기술적 장애 및 서버 문제</li>
                  <li>자연재해 및 불가항력적 사유</li>
                  <li>법적 요구사항 및 정부 정책 변경</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">서비스 변경</h3>
                <p>AMIKO는 서비스 개선을 위해 서비스 내용을 변경할 수 있으며, 중요한 변경사항은 사전에 공지합니다.</p>
              </div>
            </div>
          </section>

          {/* 7. 면책 조항 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              7. 면책 조항
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>회원의 서비스 이용 중 발생한 손해에 대해 AMIKO는 고의 또는 중대한 과실이 없는 한 책임지지 않습니다</li>
                <li>제3자와의 분쟁에 대해 AMIKO는 책임지지 않습니다</li>
                <li>회원의 개인정보 관리 소홀로 인한 손해에 대해 책임지지 않습니다</li>
                <li>서비스 이용 중 발생한 정신적 피해에 대해 책임지지 않습니다</li>
              </ul>
            </div>
          </section>

          {/* 8. 약관 변경 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              8. 약관 변경
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>이 약관은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>
            </div>
          </section>

          {/* 9. 분쟁 해결 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              9. 분쟁 해결
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>관할 법원:</strong> 서울중앙지방법원</p>
                <p><strong>준거법:</strong> 대한민국 법률</p>
                <p><strong>분쟁 해결:</strong> 우선적으로 협의를 통해 해결하며, 협의가 불가능한 경우 법적 절차를 따릅니다.</p>
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
