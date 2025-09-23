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
          {/* 서비스 소개 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              제1조 (서비스 소개)
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>Amiko는 한국과 남미를 잇는 언어 교환 및 문화 교류 플랫폼입니다.</p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">주요 서비스</h3>
                <ul className="list-disc pl-6 space-y-1 text-blue-700">
                  <li><strong>화상채팅:</strong> 한국인과의 1:1 화상채팅을 통한 언어 교환</li>
                  <li><strong>커뮤니티:</strong> 한국 문화, K-POP, 라이프스타일 공유 커뮤니티</li>
                  <li><strong>포인트 시스템:</strong> 활동에 따른 포인트 적립 및 사용</li>
                  <li><strong>이벤트:</strong> 다양한 한국 문화 체험 이벤트</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 약관의 효력 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              제2조 (약관의 효력 및 변경)
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <p>본 약관은 서비스를 이용하는 모든 사용자에게 적용됩니다.</p>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">약관 변경 시</h3>
                <ul className="list-disc pl-6 space-y-1 text-yellow-700">
                  <li>중요한 변경사항은 서비스 공지사항으로 사전 안내</li>
                  <li>이메일을 통한 개별 안내 (필요시)</li>
                  <li>변경된 약관은 공지 후 7일 후부터 효력 발생</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 회원가입 및 관리 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              제3조 (회원가입 및 관리)
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">회원가입 조건</h3>
                <ul className="list-disc pl-6 space-y-1 text-green-700">
                  <li>만 14세 이상 (미성년자는 법정대리인 동의 필요)</li>
                  <li>실명 인증 및 본인 확인</li>
                  <li>한국인 또는 한국어 학습자</li>
                  <li>서비스 이용 목적이 명확한 경우</li>
                </ul>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">가입 제한 사유</h3>
                <ul className="list-disc pl-6 space-y-1 text-red-700">
                  <li>타인의 정보를 도용한 경우</li>
                  <li>허위 정보를 제공한 경우</li>
                  <li>서비스 이용 목적이 불분명한 경우</li>
                  <li>이전에 서비스 이용 제한을 받은 경우</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 서비스 이용 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              제4조 (서비스 이용)
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">이용자의 의무</h3>
                  <ul className="list-disc pl-6 space-y-1 text-blue-700 text-sm">
                    <li>정확한 정보 제공</li>
                    <li>서비스 이용 규칙 준수</li>
                    <li>다른 이용자에 대한 존중</li>
                    <li>불법적 행위 금지</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">회사의 의무</h3>
                  <ul className="list-disc pl-6 space-y-1 text-purple-700 text-sm">
                    <li>안정적인 서비스 제공</li>
                    <li>개인정보 보호</li>
                    <li>고객 지원</li>
                    <li>서비스 개선</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 금지 행위 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              제5조 (금지 행위)
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">절대 금지 행위</h3>
                <ul className="list-disc pl-6 space-y-1 text-red-700">
                  <li><strong>성적 내용:</strong> 성적인 대화, 사진, 동영상 공유</li>
                  <li><strong>상업적 목적:</strong> 상품 판매, 광고, 홍보 활동</li>
                  <li><strong>개인정보 수집:</strong> 다른 이용자의 개인정보 무단 수집</li>
                  <li><strong>허위 정보:</strong> 거짓 정보 유포 또는 사기 행위</li>
                  <li><strong>욕설 및 괴롭힘:</strong> 비방, 욕설, 괴롭힘 행위</li>
                  <li><strong>불법적 행위:</strong> 법률에 위반되는 모든 행위</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">제한 행위</h3>
                <ul className="list-disc pl-6 space-y-1 text-yellow-700">
                  <li>과도한 친구 요청 또는 메시지 전송</li>
                  <li>서비스 이용 목적과 무관한 활동</li>
                  <li>시스템 부하를 유발하는 행위</li>
                  <li>다른 이용자의 서비스 이용을 방해하는 행위</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 포인트 시스템 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              제6조 (포인트 시스템)
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">포인트 획득</h3>
                <ul className="list-disc pl-6 space-y-1 text-green-700">
                  <li><strong>커뮤니티 활동:</strong> 게시글 작성, 댓글, 좋아요 (+5점)</li>
                  <li><strong>화상채팅 완료:</strong> 20분 화상채팅 완료 (+40점)</li>
                  <li><strong>이벤트 참여:</strong> 특별 이벤트 참여 시 추가 포인트</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">포인트 사용</h3>
                <ul className="list-disc pl-6 space-y-1 text-blue-700">
                  <li><strong>화상채팅:</strong> 1회 화상채팅 (20분) = 1 AKO</li>
                  <li><strong>쿠폰 구매:</strong> 포인트로 다양한 쿠폰 구매 가능</li>
                  <li><strong>특별 혜택:</strong> 포인트 랭킹에 따른 특별 혜택</li>
                </ul>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">포인트 정책</h3>
                <ul className="list-disc pl-6 space-y-1 text-red-700">
                  <li>포인트는 현금으로 환불되지 않습니다</li>
                  <li>계정 탈퇴 시 포인트는 소멸됩니다</li>
                  <li>부정한 방법으로 획득한 포인트는 회수됩니다</li>
                  <li>포인트 정책은 사전 공지 후 변경될 수 있습니다</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 계정 정지 및 제재 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              제7조 (계정 정지 및 제재)
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-left">위반 유형</th>
                      <th className="border border-gray-300 p-3 text-left">1차 경고</th>
                      <th className="border border-gray-300 p-3 text-left">2차 제재</th>
                      <th className="border border-gray-300 p-3 text-left">3차 제재</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-3">경미한 위반</td>
                      <td className="border border-gray-300 p-3">경고</td>
                      <td className="border border-gray-300 p-3">7일 정지</td>
                      <td className="border border-gray-300 p-3">30일 정지</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">중간 위반</td>
                      <td className="border border-gray-300 p-3">3일 정지</td>
                      <td className="border border-gray-300 p-3">30일 정지</td>
                      <td className="border border-gray-300 p-3">영구 정지</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">심각한 위반</td>
                      <td className="border border-gray-300 p-3">30일 정지</td>
                      <td className="border border-gray-300 p-3">영구 정지</td>
                      <td className="border border-gray-300 p-3">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">제재 해제</h3>
                <ul className="list-disc pl-6 space-y-1 text-yellow-700">
                  <li>제재 사유에 대한 충분한 설명과 함께 이의제기 가능</li>
                  <li>이의제기는 고객지원팀으로 접수</li>
                  <li>검토 후 부당한 제재인 경우 해제</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 서비스 중단 및 변경 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              제8조 (서비스 중단 및 변경)
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">서비스 중단 사유</h3>
                <ul className="list-disc pl-6 space-y-1 text-blue-700">
                  <li>시스템 점검 및 업데이트</li>
                  <li>기술적 장애 발생</li>
                  <li>법적 문제 발생</li>
                  <li>기타 불가피한 사유</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">사전 공지</h3>
                <ul className="list-disc pl-6 space-y-1 text-green-700">
                  <li><strong>정기 점검:</strong> 최소 24시간 전 공지</li>
                  <li><strong>긴급 중단:</strong> 가능한 한 사전 공지</li>
                  <li><strong>서비스 변경:</strong> 변경 내용 및 시기 사전 안내</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 손해배상 및 면책 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              제9조 (손해배상 및 면책)
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">회사의 면책 사항</h3>
                <ul className="list-disc pl-6 space-y-1 text-red-700">
                  <li>천재지변, 전쟁, 파업 등 불가항력적 사유로 인한 서비스 중단</li>
                  <li>이용자의 귀책사유로 인한 서비스 이용 장애</li>
                  <li>제3자가 제공하는 서비스의 장애</li>
                  <li>이용자 간의 분쟁으로 인한 손해</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">이용자의 책임</h3>
                <ul className="list-disc pl-6 space-y-1 text-yellow-700">
                  <li>본인의 계정 정보 관리 책임</li>
                  <li>서비스 이용 중 발생한 모든 행위에 대한 책임</li>
                  <li>다른 이용자에게 발생한 손해에 대한 배상 책임</li>
                  <li>법령 위반으로 인한 모든 법적 책임</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 분쟁 해결 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['Inter']">
              제10조 (분쟁 해결)
            </h2>
            <div className="space-y-4 text-gray-700 font-['Inter']">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">분쟁 해결 절차</h3>
                <ol className="list-decimal pl-6 space-y-1 text-blue-700">
                  <li><strong>1단계:</strong> 고객지원팀을 통한 상담 및 조정</li>
                  <li><strong>2단계:</strong> 분쟁조정위원회 조정 (필요시)</li>
                  <li><strong>3단계:</strong> 관할 법원에서의 소송</li>
                </ol>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">준거법 및 관할</h3>
                <ul className="list-disc pl-6 space-y-1 text-green-700">
                  <li><strong>준거법:</strong> 대한민국 법률</li>
                  <li><strong>관할법원:</strong> 서울중앙지방법원</li>
                  <li><strong>언어:</strong> 한국어 (번역본은 참고용)</li>
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
              <p><strong>고객지원:</strong> support@amiko.com</p>
              <p><strong>법무팀:</strong> legal@amiko.com</p>
              <p><strong>웹사이트:</strong> https://amiko.com</p>
              <p><strong>운영시간:</strong> 평일 09:00 - 18:00 (한국시간)</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}