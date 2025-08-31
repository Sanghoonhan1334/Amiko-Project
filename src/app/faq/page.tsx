'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Sparkles, Users } from 'lucide-react'

export default function FaqPage() {
  const faqs = [
    {
      category: 'ZEP 라운지',
      questions: [
        {
          question: 'ZEP 라운지에서는 무엇을 하나요?',
          answer: '한국 문화에 대한 자유로운 대화, 문화 체험, 특별 이벤트 등 다양한 활동을 할 수 있습니다. 매주 토요일 저녁에 운영자와 함께 즐거운 시간을 보냅니다.'
        },
        {
          question: '포인트도 받을 수 있나요?',
          answer: '네! 라운지 참여 시 포인트를 받을 수 있으며, 특별 이벤트 참여 시 추가 포인트를 제공합니다. 정기 참여자에게는 특별 혜택도 있습니다.'
        },
        {
          question: '언제 열리나요?',
          answer: '매주 토요일 저녁 8시(KST)에 정기적으로 열립니다. 특별 이벤트는 별도 공지되며, 원하는 날에 자유롭게 참여할 수 있습니다.'
        },
        {
          question: '언어가 달라도 참여할 수 있나요?',
          answer: '네! 한국어, 영어, 스페인어, 포르투갈어 등 다양한 언어로 소통할 수 있습니다. 언어 장벽 없이 한국 문화를 즐길 수 있어요.'
        }
      ]
    },
    {
      category: '만남 (영상)',
      questions: [
        {
          question: '한국인 친구와 어떻게 만나나요?',
          answer: '앱에서 한국인 친구를 선택하고 15분 무료 화상 만남을 예약할 수 있습니다. 통역 모드를 켜면 언어 장벽 없이 대화할 수 있어요.'
        },
        {
          question: '통역 모드가 무엇인가요?',
          answer: '통역 모드를 켜면 실시간으로 한국어를 번역해드립니다. 끄면 보너스 포인트를 받을 수 있어요. 본인 인증이 완료되어야 이용 가능합니다.'
        },
        {
          question: '쿠폰은 어떻게 사용하나요?',
          answer: '15분 만남 쿠폰을 구매하여 사용할 수 있습니다. 1장, 2장, 3장 묶음으로 구매 가능하며, 포인트로도 구매할 수 있어요.'
        }
      ]
    },
    {
      category: '커뮤니티',
      questions: [
        {
          question: '포인트는 어떻게 얻나요?',
          answer: '질문 작성 시 +3점, 답변 작성 시 +3점을 받을 수 있습니다. 한국인은 더 많은 포인트를 받으며, 채택이나 좋아요를 받으면 추가 포인트를 받을 수 있어요.'
        },
        {
          question: '일일 포인트 상한이 있나요?',
          answer: '네, 스팸 방지를 위해 일일 포인트 획득 상한이 있습니다. 한국인과 라틴 사용자에게는 다른 상한이 적용됩니다.'
        },
        {
          question: '커뮤니티 규칙이 있나요?',
          answer: '친근하고 존중하는 분위기에서 활동해주세요. 부적절한 내용이나 스팸은 제재를 받을 수 있으며, 쿨타임이 적용됩니다.'
        }
      ]
    },
    {
      category: '계정 및 인증',
      questions: [
        {
          question: '본인 인증이 왜 필요한가요?',
          answer: '안전하고 신뢰할 수 있는 서비스를 위해 필요합니다. 인증 완료 시 영상 매칭, 쿠폰 사용, 커뮤니티 활동이 모두 가능해집니다.'
        },
        {
          question: '인증 방법은 어떤 것이 있나요?',
          answer: '한국인은 카카오 연동과 SMS 인증, 다른 국가 사용자는 WhatsApp, SMS, 이메일 인증을 선택할 수 있습니다.'
        },
        {
          question: '인증이 안 되면 어떻게 하나요?',
          answer: '인증 코드 123456을 사용하여 테스트할 수 있습니다. 문제가 지속되면 고객센터에 문의해주세요.'
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50">
      {/* Hero Section */}
      <div className="text-center py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-6xl mb-4">❓</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            자주 묻는 질문
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Amiko 서비스에 대한 궁금한 점들을 모았습니다
          </p>
          <Badge className="bg-gradient-to-r from-brand-100 to-mint-100 text-brand-700 border-brand-200 text-lg px-6 py-3">
            <MessageSquare className="w-5 h-5 mr-2" />
            총 {faqs.reduce((acc, cat) => acc + cat.questions.length, 0)}개의 질문
          </Badge>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-8">
        {faqs.map((category, catIndex) => (
          <Card key={catIndex} className="bg-white/80 backdrop-blur-sm border-2 border-brand-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Sparkles className="w-6 h-6 text-brand-600" />
                {category.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {category.questions.map((faq, faqIndex) => (
                  <div key={faqIndex} className="border-l-4 border-brand-200 pl-6 py-4">
                    <h4 className="font-semibold text-gray-800 text-lg mb-3">
                      Q. {faq.question}
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      A. {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Contact CTA */}
        <Card className="bg-gradient-to-r from-brand-500 to-mint-500 text-white border-0">
          <CardContent className="text-center py-12">
            <h3 className="text-2xl font-bold mb-4">
              더 궁금한 점이 있나요?
            </h3>
            <p className="text-lg mb-6 opacity-90">
              FAQ에서 답을 찾지 못했다면 언제든 문의해주세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@amiko.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-brand-600 hover:bg-gray-100 rounded-xl font-medium transition-all duration-300"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                이메일 문의
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-white/20 text-white hover:bg-white/30 rounded-xl font-medium transition-all duration-300"
              >
                <Users className="w-5 h-5 mr-2" />
                고객센터
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
