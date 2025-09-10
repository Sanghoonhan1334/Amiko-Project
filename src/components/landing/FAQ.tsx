'use client'

import { useState } from 'react'
import { ChevronDown, Shield, Users, Clock, MessageCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface FAQItem {
  question: string
  answer: string
  icon: React.ReactNode
  category: string
}

const faqData: FAQItem[] = [
  {
    question: "Amiko는 안전한가요?",
    answer: "네, 매우 안전합니다. 모든 사용자는 인증된 대학생들로 시작하며, 나쁜 짓을 하면 인증 정보로 잡을 수 있어서 나쁜 사람들은 들어올 수 없습니다. 완벽한 인증 시스템으로 안전한 환경을 보장합니다.",
    icon: <Shield className="w-5 h-5" />,
    category: "안전성"
  },
  {
    question: "어떻게 시작하나요?",
    answer: "간단합니다! 먼저 회원가입 후 인증을 완료하시면, 15분 무료 상담으로 가볍게 시작할 수 있습니다. 한국인 친구와의 첫 만남을 통해 Amiko의 특별함을 경험해보세요.",
    icon: <Users className="w-5 h-5" />,
    category: "사용법"
  },
  {
    question: "언제든지 이용할 수 있나요?",
    answer: "네, 24시간 언제든지 이용 가능합니다. 원하는 시간에 상담을 예약하고 진행할 수 있어서 편리합니다.",
    icon: <Clock className="w-5 h-5" />,
    category: "이용시간"
  },
  {
    question: "커뮤니티에서는 무엇을 할 수 있나요?",
    answer: "질문하고 답변하며 포인트를 모을 수 있습니다. 5개 카테고리에서 다양한 주제로 소통하며 특별한 혜택을 받아보세요.",
    icon: <MessageCircle className="w-5 h-5" />,
    category: "커뮤니티"
  },

  {
    question: "인증은 어떻게 하나요?",
    answer: "대학생증이나 신분증을 통해 인증을 완료하시면 됩니다. 인증된 사용자만 서비스를 이용할 수 있어 안전합니다.",
    icon: <Shield className="w-5 h-5" />,
    category: "안전성"
  }
]

export default function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([])
  const router = useRouter()

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const categories = Array.from(new Set(faqData.map(item => item.category)))

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="heading-primary mb-6">
            자주 묻는 질문
          </h2>
          <p className="text-body text-lg max-w-3xl mx-auto">
            Amiko에 대해 궁금한 점들을 모았습니다. 
            <br />
            더 자세한 정보가 필요하시면 언제든 문의해주세요.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {categories.map((category, categoryIndex) => (
            <div key={category} className="mb-12">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                {category}
              </h3>
              <div className="space-y-4">
                {faqData
                  .filter(item => item.category === category)
                  .map((item, index) => {
                    const globalIndex = faqData.findIndex(faq => faq === item)
                    const isOpen = openItems.includes(globalIndex)
                    
                    return (
                      <div 
                        key={globalIndex}
                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
                      >
                        <button
                          onClick={() => toggleItem(globalIndex)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-brand-500">
                              {item.icon}
                            </div>
                            <span className="font-semibold text-gray-800">
                              {item.question}
                            </span>
                          </div>
                          <ChevronDown 
                            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        
                        {isOpen && (
                          <div className="px-6 pb-4 border-t border-gray-100">
                            <p className="text-gray-600 leading-relaxed pt-4">
                              {item.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>

        {/* 추가 문의 섹션 */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-3xl p-8 max-w-2xl mx-auto text-white">
            <h3 className="text-2xl font-bold mb-4">
              더 궁금한 점이 있으신가요?
            </h3>
            <p className="text-white/90 text-lg mb-6">
              위에서 답변을 찾지 못하셨다면, 
              <br />
              언제든지 문의해주세요!
            </p>
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-brand-600 transition-all duration-300"
              onClick={() => router.push('/main')}
            >
              문의하기
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
