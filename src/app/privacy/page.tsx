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
          {/* 1. 개인정보 수집 및 이용 목적 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              1. 개인정보 수집 및 이용 목적
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>Amiko는 다음과 같은 목적으로 개인정보를 수집 및 이용합니다:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>회원가입 및 관리:</strong> 서비스 이용자 식별, 본인 확인, 가입 의사 확인</li>
                <li><strong>서비스 제공:</strong> 한국어 학습, 문화 교류, 화상채팅 서비스 제공</li>
                <li><strong>고객 지원:</strong> 문의사항 처리, 서비스 개선을 위한 피드백 수집</li>
                <li><strong>보안 및 안전:</strong> 부정 이용 방지, 서비스 안정성 확보</li>
                <li><strong>마케팅:</strong> 맞춤형 서비스 제공, 이벤트 정보 안내 (동의 시)</li>
              </ul>
            </div>
          </section>

          {/* 2. 수집하는 개인정보 항목 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              2. 수집하는 개인정보 항목
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">필수 수집 정보</h3>
                <ul className="list-disc pl-6 space-y-1 text-blue-700">
                  <li>이메일 주소</li>
                  <li>이름 (실명)</li>
                  <li>전화번호</li>
                  <li>국가 정보</li>
                  <li>한국인 여부</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">선택 수집 정보</h3>
                <ul className="list-disc pl-6 space-y-1 text-green-700">
                  <li>프로필 사진</li>
                  <li>대학명, 전공, 학년 (학생인 경우)</li>
                  <li>직업, 회사명, 경력 (일반인인 경우)</li>
                  <li>한 줄 소개</li>
                  <li>관심사 및 취미</li>
                  <li>언어 수준 (한국어, 영어, 스페인어)</li>
                  <li>매칭 선호도</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">자동 수집 정보</h3>
                <ul className="list-disc pl-6 space-y-1 text-yellow-700">
                  <li>IP 주소 (보안 및 국가 확인용)</li>
                  <li>브라우저 정보 및 디바이스 정보</li>
                  <li>서비스 이용 기록 (게시글, 댓글, 좋아요 등)</li>
                  <li>접속 로그 및 쿠키</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. 개인정보 수집 방법 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              3. 개인정보 수집 방법
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>회원가입:</strong> 사용자가 직접 입력하는 정보</li>
                <li><strong>프로필 작성:</strong> 인증 과정에서 추가 정보 수집</li>
                <li><strong>서비스 이용:</strong> 자동으로 생성되는 이용 기록</li>
                <li><strong>고객 문의:</strong> 문의사항 처리 시 수집</li>
                <li><strong>쿠키:</strong> 웹사이트 이용 시 자동 수집</li>
              </ul>
            </div>
          </section>

          {/* 4. 개인정보 보유 및 이용 기간 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              4. 개인정보 보유 및 이용 기간
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">회원 탈퇴 시</h3>
                <p className="text-red-700">회원 탈퇴 요청 즉시 개인정보를 삭제합니다. 단, 다음의 경우는 예외로 합니다:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-red-600">
                  <li>관련 법령에 의해 보존 의무가 있는 경우</li>
                  <li>분쟁 해결을 위해 필요한 경우</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">법정 보존 기간</h3>
                <ul className="list-disc pl-6 space-y-1 text-purple-700">
                  <li><strong>계약 또는 청약철회 등에 관한 기록:</strong> 5년</li>
                  <li><strong>대금결제 및 재화 등의 공급에 관한 기록:</strong> 5년</li>
                  <li><strong>소비자의 불만 또는 분쟁처리에 관한 기록:</strong> 3년</li>
                  <li><strong>웹사이트 방문 기록:</strong> 3개월</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 5. 개인정보 제3자 제공 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              5. 개인정보 제3자 제공
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-800 font-medium">✅ Amiko는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.</p>
              </div>
              
              <p>다만, 다음의 경우는 예외로 합니다:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                <li>서비스 제공을 위해 필요한 최소한의 정보를 제공하는 경우 (예: 화상채팅 상대방에게 프로필 정보 제공)</li>
              </ul>
            </div>
          </section>

          {/* 6. 개인정보 처리 위탁 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              6. 개인정보 처리 위탁
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>Amiko는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다:</p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-left">위탁업체</th>
                      <th className="border border-gray-300 p-3 text-left">위탁업무</th>
                      <th className="border border-gray-300 p-3 text-left">보유기간</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-3">Supabase</td>
                      <td className="border border-gray-300 p-3">데이터베이스 관리 및 저장</td>
                      <td className="border border-gray-300 p-3">회원 탈퇴 시까지</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">Vercel</td>
                      <td className="border border-gray-300 p-3">웹 서비스 호스팅</td>
                      <td className="border border-gray-300 p-3">서비스 이용 기간</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 7. 개인정보 보호를 위한 기술적/관리적 대책 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              7. 개인정보 보호를 위한 기술적/관리적 대책
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">기술적 대책</h3>
                  <ul className="list-disc pl-6 space-y-1 text-blue-700">
                    <li>SSL/TLS 암호화 통신</li>
                    <li>데이터베이스 암호화</li>
                    <li>접근 권한 관리</li>
                    <li>정기적인 보안 점검</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">관리적 대책</h3>
                  <ul className="list-disc pl-6 space-y-1 text-green-700">
                    <li>개인정보보호 교육</li>
                    <li>접근 권한 최소화</li>
                    <li>정기적인 감사</li>
                    <li>사고 대응 절차 수립</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 8. 이용자의 권리 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              8. 이용자의 권리
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">📋 열람권</h3>
                  <p className="text-yellow-700">본인의 개인정보 처리 현황을 확인할 수 있습니다.</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">✏️ 정정/삭제권</h3>
                  <p className="text-blue-700">개인정보의 정정, 삭제를 요구할 수 있습니다.</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">⏸️ 처리정지권</h3>
                  <p className="text-green-700">개인정보 처리의 정지를 요구할 수 있습니다.</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">🚫 동의철회권</h3>
                  <p className="text-purple-700">개인정보 처리에 대한 동의를 철회할 수 있습니다.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 9. 개인정보보호책임자 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              9. 개인정보보호책임자
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">개인정보보호책임자</h3>
                <ul className="space-y-1 text-gray-700">
                  <li><strong>성명:</strong> Amiko 개인정보보호팀</li>
                  <li><strong>연락처:</strong> privacy@amiko.com</li>
                  <li><strong>업무:</strong> 개인정보보호 정책 수립 및 시행</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">개인정보보호 담당부서</h3>
                <ul className="space-y-1 text-blue-700">
                  <li><strong>부서명:</strong> 고객지원팀</li>
                  <li><strong>연락처:</strong> support@amiko.com</li>
                  <li><strong>업무:</strong> 개인정보 관련 문의 및 불만 처리</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 10. 개인정보처리방침 변경 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              10. 개인정보처리방침 변경
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>이 개인정보처리방침은 시행일로부터 변경될 수 있으며, 변경 시에는 웹사이트 공지사항을 통해 사전에 공지합니다.</p>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-800 font-medium">📢 중요한 변경사항이 있는 경우에는 이메일을 통해 별도로 안내드립니다.</p>
              </div>
            </div>
          </section>

          {/* 연락처 */}
          <section className="bg-gradient-to-r from-brand-50 to-mint-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              문의 및 연락처
            </h2>
            <div className="space-y-2 text-gray-700 font-['Inter']">
              <p><strong>이메일:</strong> privacy@amiko.com</p>
              <p><strong>고객지원:</strong> support@amiko.com</p>
              <p><strong>웹사이트:</strong> https://amiko.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}