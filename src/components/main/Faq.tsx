import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useLanguage } from '@/hooks/useLanguage'

const getFaqs = (t: any) => [
  {
    question: t('mainFaq.questions.service'),
    answer: t('mainFaq.answers.service')
  },
  {
    question: t('mainFaq.questions.mentorSelection'),
    answer: t('mainFaq.answers.mentorSelection')
  },
  {
    question: t('mainFaq.questions.classFormat'),
    answer: t('mainFaq.answers.classFormat')
  },
  {
    question: t('mainFaq.questions.scheduling'),
    answer: t('mainFaq.answers.scheduling')
  },
  {
    question: t('mainFaq.questions.beginner'),
    answer: t('mainFaq.answers.beginner')
  },
  {
    question: t('mainFaq.questions.pricing'),
    answer: t('mainFaq.answers.pricing')
  },
  {
    question: t('mainFaq.questions.reviews'),
    answer: t('mainFaq.answers.reviews')
  },
  {
    question: t('mainFaq.questions.refund'),
    answer: t('mainFaq.answers.refund')
  }
]

export default function Faq() {
  const { t } = useLanguage()
  const faqs = getFaqs(t)
  
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container max-w-4xl mx-auto px-4">
        {/* 섹션 제목 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('mainFaq.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('mainFaq.subtitle')}
          </p>
        </div>
        
        {/* FAQ 아코디언 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200 last:border-b-0">
                <AccordionTrigger className="text-left py-6 hover:no-underline group">
                  <span className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <p className="text-gray-600 leading-relaxed pr-8">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        
        {/* 추가 문의 안내 */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            {t('mainFaq.moreQuestions')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="mailto:hello@amiko.com" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {t('mainFaq.emailContact')}
            </a>
            <span className="text-gray-400">|</span>
            <a 
              href="tel:+82-2-1234-5678" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {t('mainFaq.phoneContact')}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
