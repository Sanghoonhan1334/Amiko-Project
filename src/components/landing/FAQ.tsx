'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { ChevronDown, Shield, Users, Clock, MessageCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface FAQItem {
  question: string
  answer: string
  icon: React.ReactNode
  category: string
}

const getFaqData = (t: any): FAQItem[] => [
  {
    question: t('landingFaq.questions.safety'),
    answer: t('landingFaq.answers.safety'),
    icon: <Shield className="w-5 h-5" />,
    category: t('landingFaq.categories.safety')
  },
  {
    question: t('landingFaq.questions.howToStart'),
    answer: t('landingFaq.answers.howToStart'),
    icon: <Users className="w-5 h-5" />,
    category: t('landingFaq.categories.usage')
  },
  {
    question: t('landingFaq.questions.availability'),
    answer: t('landingFaq.answers.availability'),
    icon: <Clock className="w-5 h-5" />,
    category: t('landingFaq.categories.time')
  },
  {
    question: t('landingFaq.questions.community'),
    answer: t('landingFaq.answers.community'),
    icon: <MessageCircle className="w-5 h-5" />,
    category: t('landingFaq.categories.community')
  },
  {
    question: t('landingFaq.questions.verification'),
    answer: t('landingFaq.answers.verification'),
    icon: <Shield className="w-5 h-5" />,
    category: t('landingFaq.categories.safety')
  }
]

export default function FAQ() {
  const { t } = useLanguage()
  const [openItems, setOpenItems] = useState<number[]>([])
  const router = useRouter()

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const faqData = getFaqData(t)
  const categories = Array.from(new Set(faqData.map(item => item.category)))

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="heading-primary mb-6">
            {t('landingFaq.title')}
          </h2>
          <p className="text-body text-lg max-w-3xl mx-auto">
            {t('landingFaq.description')}
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
              {t('landingFaq.moreQuestions')}
            </h3>
            <p className="text-white/90 text-lg mb-6">
              {t('landingFaq.moreQuestionsDescription')}
            </p>
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-brand-600 transition-all duration-300"
              onClick={() => router.push('/main')}
            >
              {t('landingFaq.contactUs')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
