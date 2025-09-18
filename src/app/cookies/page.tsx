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
              <p>쿠키(Cookie)는 웹사이트가 사용자의 컴퓨터나 모바일 기기에 저장하는 작은 텍스트 파일입니다. 쿠키는 웹사이트가 사용자를 기억하고, 사용자의 선호도를 저장하며, 웹사이트의 기능을 향상시키는 데 도움을 줍니다.</p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 font-medium">💡 쿠키는 개인을 식별할 수 있는 정보를 포함하지 않으며, 컴퓨터에 해를 끼치지 않습니다.</p>
              </div>
            </div>
          </section>

          {/* 2. 쿠키의 종류 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              2. 쿠키의 종류
            </h2>
            <div className="space-y-6 text-gray-700 font-['Inter']">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-600">🍪 필수 쿠키 (Essential Cookies)</h3>
                <p className="mb-2">웹사이트의 기본 기능을 위해 반드시 필요한 쿠키입니다.</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>로그인 상태 유지</li>
                  <li>보안 및 사이트 보호</li>
                  <li>장바구니 및 결제 정보</li>
                  <li>언어 설정</li>
                </ul>
                <p className="text-sm text-gray-600 mt-2">※ 이 쿠키들은 웹사이트의 기본 기능을 위해 필요하므로 비활성화할 수 없습니다.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-blue-600">⚙️ 기능 쿠키 (Functional Cookies)</h3>
                <p className="mb-2">사용자 경험을 향상시키는 기능을 제공하는 쿠키입니다.</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>사용자 선호도 저장</li>
                  <li>테마 및 디스플레이 설정</li>
                  <li>이전 방문 기록</li>
                  <li>사용자 맞춤 설정</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-purple-600">📊 분석 쿠키 (Analytics Cookies)</h3>
                <p className="mb-2">웹사이트 사용 방식을 분석하여 서비스를 개선하는 데 사용되는 쿠키입니다.</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Google Analytics</li>
                  <li>사용자 행동 분석</li>
                  <li>페이지 방문 통계</li>
                  <li>서비스 이용 패턴 분석</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-orange-600">🎯 마케팅 쿠키 (Marketing Cookies)</h3>
                <p className="mb-2">사용자에게 관련성 높은 광고를 제공하기 위한 쿠키입니다.</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>광고 타겟팅</li>
                  <li>사용자 관심사 기반 광고</li>
                  <li>광고 효과 측정</li>
                  <li>소셜 미디어 연동</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. 쿠키 사용 목적 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              3. 쿠키 사용 목적
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">🔐 보안 및 인증</h4>
                  <p>사용자 인증, 보안 강화, 부정 사용 방지</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">🎨 사용자 경험</h4>
                  <p>개인화된 서비스, 선호도 기억, 편의성 향상</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">📈 서비스 개선</h4>
                  <p>사용자 행동 분석, 서비스 최적화, 기능 개발</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">📢 마케팅</h4>
                  <p>관련성 높은 광고, 이벤트 안내, 맞춤형 콘텐츠</p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. 쿠키 보관 기간 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              4. 쿠키 보관 기간
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-left">쿠키 종류</th>
                      <th className="border border-gray-300 p-3 text-left">보관 기간</th>
                      <th className="border border-gray-300 p-3 text-left">설명</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-3">세션 쿠키</td>
                      <td className="border border-gray-300 p-3">브라우저 종료 시</td>
                      <td className="border border-gray-300 p-3">로그인 상태, 임시 설정</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">영구 쿠키</td>
                      <td className="border border-gray-300 p-3">1년</td>
                      <td className="border border-gray-300 p-3">사용자 선호도, 설정</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">분석 쿠키</td>
                      <td className="border border-gray-300 p-3">2년</td>
                      <td className="border border-gray-300 p-3">Google Analytics</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">마케팅 쿠키</td>
                      <td className="border border-gray-300 p-3">1년</td>
                      <td className="border border-gray-300 p-3">광고 타겟팅</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 5. 제3자 쿠키 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              5. 제3자 쿠키
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>AMIKO는 서비스 개선을 위해 다음과 같은 제3자 서비스의 쿠키를 사용할 수 있습니다:</p>
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Google Analytics</h4>
                  <p>웹사이트 사용 통계 및 분석을 위해 Google에서 제공하는 쿠키를 사용합니다.</p>
                  <p className="text-sm text-gray-600 mt-1">자세한 내용: <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google 개인정보처리방침</a></p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">소셜 미디어</h4>
                  <p>Facebook, Instagram, TikTok 등 소셜 미디어 연동을 위한 쿠키를 사용합니다.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">결제 서비스</h4>
                  <p>PayPal, 신용카드 결제를 위한 안전한 결제 처리를 위한 쿠키를 사용합니다.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 6. 쿠키 관리 방법 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              6. 쿠키 관리 방법
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>사용자는 브라우저 설정을 통해 쿠키를 관리할 수 있습니다:</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">🌐 Chrome</h4>
                  <p>설정 → 개인정보 보호 및 보안 → 쿠키 및 기타 사이트 데이터</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🦊 Firefox</h4>
                  <p>설정 → 개인정보 보호 및 보안 → 쿠키 및 사이트 데이터</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🧭 Safari</h4>
                  <p>환경설정 → 개인정보 보호 → 쿠키 및 웹사이트 데이터</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🌍 Edge</h4>
                  <p>설정 → 쿠키 및 사이트 권한 → 쿠키 및 저장된 데이터</p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-800 font-medium">⚠️ 쿠키를 비활성화하면 일부 서비스 기능이 제한될 수 있습니다.</p>
              </div>
            </div>
          </section>

          {/* 7. 쿠키 정책 변경 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              7. 쿠키 정책 변경
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>이 쿠키 정책은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>
            </div>
          </section>

          {/* 8. 문의처 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              8. 문의처
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>쿠키 정책 관련 문의:</strong> privacy@amiko.com</p>
                <p><strong>고객센터:</strong> support@amiko.com</p>
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
