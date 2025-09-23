'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function CookiePolicy() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-['Inter']">
            {t('footer.cookies')}
          </h1>
          <p className="text-lg text-gray-600 font-['Inter']">
            {t('cookies.lastUpdated')}: 2025년 1월 17일
          </p>
        </div>

        {/* 본문 */}
        <div className="bg-white/80 rounded-2xl shadow-lg p-8 space-y-8">
          {/* 1. 쿠키란? */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              1. 쿠키란?
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>쿠키(Cookie)는 웹사이트가 사용자의 컴퓨터나 모바일 기기에 저장하는 작은 텍스트 파일입니다. Amiko는 서비스 제공을 위해 다음과 같은 쿠키를 사용합니다.</p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 font-medium">💡 쿠키는 개인을 식별할 수 있는 정보를 포함하지 않으며, 컴퓨터에 해를 끼치지 않습니다.</p>
              </div>
            </div>
          </section>

          {/* 2. Amiko에서 사용하는 쿠키 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              2. Amiko에서 사용하는 쿠키
            </h2>
            <div className="space-y-6 text-gray-700 font-['Inter']">
              
              {/* 필수 쿠키 */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-green-600">🍪 필수 쿠키 (Essential Cookies)</h3>
                <p className="mb-2">Amiko 서비스의 기본 기능을 위해 반드시 필요한 쿠키입니다.</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>인증 쿠키:</strong> 로그인 상태 유지 및 보안</li>
                  <li><strong>세션 쿠키:</strong> 사용자 세션 관리</li>
                  <li><strong>언어 설정:</strong> 한국어/스페인어 선택 기억</li>
                  <li><strong>보안 쿠키:</strong> CSRF 보호 및 사이트 보안</li>
                </ul>
                <div className="mt-3 p-2 bg-green-100 rounded text-green-800 text-sm">
                  <strong>보유기간:</strong> 브라우저 종료 시 자동 삭제 (세션 쿠키) 또는 30일 (영구 쿠키)
                </div>
              </div>

              {/* 기능 쿠키 */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-blue-600">⚙️ 기능 쿠키 (Functional Cookies)</h3>
                <p className="mb-2">사용자 경험 향상을 위한 선택적 쿠키입니다.</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>사용자 설정:</strong> 테마, 알림 설정 등</li>
                  <li><strong>화상채팅 설정:</strong> 카메라/마이크 권한 설정</li>
                  <li><strong>커뮤니티 설정:</strong> 게시글 필터, 정렬 옵션</li>
                  <li><strong>포인트 기록:</strong> 포인트 획득/사용 내역</li>
                </ul>
                <div className="mt-3 p-2 bg-blue-100 rounded text-blue-800 text-sm">
                  <strong>보유기간:</strong> 90일 또는 사용자가 직접 삭제할 때까지
                </div>
              </div>

              {/* 분석 쿠키 */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-purple-600">📊 분석 쿠키 (Analytics Cookies)</h3>
                <p className="mb-2">서비스 개선을 위한 사용 패턴 분석 쿠키입니다.</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>사용 통계:</strong> 페이지 방문, 체류 시간</li>
                  <li><strong>기능 사용률:</strong> 화상채팅, 커뮤니티 이용 현황</li>
                  <li><strong>오류 추적:</strong> 서비스 오류 및 개선점 파악</li>
                  <li><strong>성능 모니터링:</strong> 서비스 속도 및 안정성</li>
                </ul>
                <div className="mt-3 p-2 bg-purple-100 rounded text-purple-800 text-sm">
                  <strong>보유기간:</strong> 2년 (익명화된 데이터)
                </div>
              </div>

              {/* 마케팅 쿠키 */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-yellow-600">🎯 마케팅 쿠키 (Marketing Cookies)</h3>
                <p className="mb-2">맞춤형 서비스 제공을 위한 선택적 쿠키입니다.</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>관심사 분석:</strong> 사용자 관심사 및 선호도</li>
                  <li><strong>이벤트 추천:</strong> 맞춤형 이벤트 및 콘텐츠</li>
                  <li><strong>언어 교환 매칭:</strong> 최적의 파트너 추천</li>
                  <li><strong>서비스 개선:</strong> 새로운 기능 개발 참고</li>
                </ul>
                <div className="mt-3 p-2 bg-yellow-100 rounded text-yellow-800 text-sm">
                  <strong>보유기간:</strong> 1년 (사용자 동의 시에만)
                </div>
              </div>
            </div>
          </section>

          {/* 3. 제3자 쿠키 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              3. 제3자 쿠키
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>Amiko는 서비스 제공을 위해 다음과 같은 제3자 서비스의 쿠키를 사용할 수 있습니다:</p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-left">서비스</th>
                      <th className="border border-gray-300 p-3 text-left">목적</th>
                      <th className="border border-gray-300 p-3 text-left">쿠키 유형</th>
                      <th className="border border-gray-300 p-3 text-left">보유기간</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-3">Supabase</td>
                      <td className="border border-gray-300 p-3">데이터베이스 관리</td>
                      <td className="border border-gray-300 p-3">필수 쿠키</td>
                      <td className="border border-gray-300 p-3">세션 종료 시</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">Vercel</td>
                      <td className="border border-gray-300 p-3">웹 호스팅</td>
                      <td className="border border-gray-300 p-3">기능 쿠키</td>
                      <td className="border border-gray-300 p-3">30일</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">Google Analytics</td>
                      <td className="border border-gray-300 p-3">사용자 분석</td>
                      <td className="border border-gray-300 p-3">분석 쿠키</td>
                      <td className="border border-gray-300 p-3">2년</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 4. 쿠키 관리 방법 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              4. 쿠키 관리 방법
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              
              {/* 브라우저 설정 */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">🌐 브라우저 설정을 통한 쿠키 관리</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-blue-700 mb-1">Chrome</h4>
                    <p className="text-blue-600 text-sm">설정 → 개인정보 보호 및 보안 → 쿠키 및 기타 사이트 데이터</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-700 mb-1">Safari</h4>
                    <p className="text-blue-600 text-sm">환경설정 → 개인정보 보호 → 쿠키 및 웹사이트 데이터</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-700 mb-1">Firefox</h4>
                    <p className="text-blue-600 text-sm">설정 → 개인정보 보호 및 보안 → 쿠키 및 사이트 데이터</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-700 mb-1">Edge</h4>
                    <p className="text-blue-600 text-sm">설정 → 쿠키 및 사이트 권한 → 쿠키 및 저장된 데이터</p>
                  </div>
                </div>
              </div>

              {/* Amiko 내 설정 */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">⚙️ Amiko 내 쿠키 설정</h3>
                <ul className="list-disc pl-6 space-y-1 text-green-700">
                  <li><strong>언어 설정:</strong> 프로필에서 언어 변경 시 쿠키 업데이트</li>
                  <li><strong>알림 설정:</strong> 알림 허용/거부 설정 저장</li>
                  <li><strong>테마 설정:</strong> 다크/라이트 모드 선택 저장</li>
                  <li><strong>쿠키 동의:</strong> 쿠키 사용 동의/거부 설정</li>
                </ul>
              </div>

              {/* 쿠키 삭제 */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">🗑️ 쿠키 삭제 방법</h3>
                <ul className="list-disc pl-6 space-y-1 text-red-700">
                  <li><strong>전체 삭제:</strong> 브라우저 설정에서 모든 쿠키 삭제</li>
                  <li><strong>선택 삭제:</strong> 특정 사이트의 쿠키만 삭제</li>
                  <li><strong>자동 삭제:</strong> 브라우저 종료 시 자동 삭제 설정</li>
                  <li><strong>정기 삭제:</strong> 일정 기간 후 자동 삭제 설정</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 5. 쿠키 사용 동의 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              5. 쿠키 사용 동의
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">📋 동의 절차</h3>
                <ol className="list-decimal pl-6 space-y-1 text-yellow-700">
                  <li><strong>최초 방문:</strong> 쿠키 사용 안내 및 동의 요청</li>
                  <li><strong>선택적 동의:</strong> 필수/기능/분석/마케팅 쿠키별 개별 동의</li>
                  <li><strong>설정 변경:</strong> 언제든지 동의 철회 및 설정 변경 가능</li>
                  <li><strong>동의 기록:</strong> 동의/철회 내역 저장 및 관리</li>
                </ol>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">⚖️ 법적 근거</h3>
                <ul className="list-disc pl-6 space-y-1 text-blue-700">
                  <li><strong>필수 쿠키:</strong> 서비스 제공을 위한 정당한 이익</li>
                  <li><strong>기능 쿠키:</strong> 사용자 동의</li>
                  <li><strong>분석 쿠키:</strong> 사용자 동의</li>
                  <li><strong>마케팅 쿠키:</strong> 명시적 사용자 동의</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 6. 쿠키 정책 변경 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              6. 쿠키 정책 변경
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>이 쿠키 정책은 서비스 개선 및 법적 요구사항에 따라 변경될 수 있습니다.</p>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">📢 변경 사항 안내</h3>
                <ul className="list-disc pl-6 space-y-1 text-green-700">
                  <li><strong>중요한 변경:</strong> 서비스 공지사항 및 이메일 안내</li>
                  <li><strong>일반 변경:</strong> 웹사이트 공지사항 게시</li>
                  <li><strong>즉시 적용:</strong> 보안 관련 변경사항</li>
                  <li><strong>사전 안내:</strong> 30일 전 사전 공지 (가능한 경우)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 연락처 */}
          <section className="bg-gradient-to-r from-brand-50 to-mint-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              문의 및 연락처
            </h2>
            <div className="space-y-2 text-gray-700 font-['Inter']">
              <p><strong>쿠키 관련 문의:</strong> privacy@amiko.com</p>
              <p><strong>기술 지원:</strong> support@amiko.com</p>
              <p><strong>웹사이트:</strong> https://amiko.com</p>
              <p><strong>운영시간:</strong> 평일 09:00 - 18:00 (한국시간)</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}