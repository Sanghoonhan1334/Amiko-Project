import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "Amiko는 어떤 서비스를 제공하나요?",
            answer: "Amiko는 한국 문화와 언어를 배우고 싶은 전 세계 학습자들을 위한 온라인 멘토링 플랫폼입니다. 1:1 화상 만남, 발음 교정, 문화 교류 등 다양한 서비스를 제공합니다."
  },
  {
    question: "멘토는 어떻게 선정되나요?",
    answer: "모든 멘토는 엄격한 심사 과정을 거쳐 선정됩니다. 한국어 교육 자격증, 경험, 인성 등을 종합적으로 평가하여 최고의 품질을 보장합니다."
  },
  {
    question: "수업은 어떤 방식으로 진행되나요?",
            answer: "AI 화상 채팅을 통해 진행됩니다. 화면 공유, 채팅, 녹화 등 다양한 기능을 활용하여 효과적인 학습이 가능합니다."
  },
  {
    question: "수업 시간은 언제든지 예약할 수 있나요?",
    answer: "네, 24시간 언제든지 예약 가능합니다. 멘토의 일정에 맞춰 원하는 시간에 수업을 예약할 수 있습니다."
  },
  {
    question: "한국어를 전혀 모르는데도 수업을 들을 수 있나요?",
    answer: "물론입니다! 초보자를 위한 기초 과정부터 고급 과정까지 모든 레벨에 맞는 커리큘럼을 제공합니다. 영어, 일본어, 중국어 등 다양한 언어로 설명이 가능합니다."
  },
  {
    question: "수업료는 어떻게 되나요?",
    answer: "수업 시간과 멘토의 경험에 따라 차등 적용됩니다. 기본 30분 수업부터 시작하며, 패키지 할인도 제공합니다. 정확한 가격은 예약 시 확인할 수 있습니다."
  },
  {
    question: "수업 후 후기나 평가를 남길 수 있나요?",
    answer: "네, 수업 후 멘토와 수업 품질에 대한 후기와 평점을 남길 수 있습니다. 이를 통해 다른 학습자들이 참고할 수 있고, 서비스 품질 향상에도 도움이 됩니다."
  },
  {
    question: "환불 정책은 어떻게 되나요?",
    answer: "수업 시작 24시간 전까지는 100% 환불이 가능합니다. 수업 시작 후에는 사정에 따라 부분 환불을 고려할 수 있습니다. 자세한 내용은 고객센터에 문의해주세요."
  }
]

export default function Faq() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container max-w-4xl mx-auto px-4">
        {/* 섹션 제목 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            자주 묻는 질문
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Amiko 서비스에 대해 궁금한 점들을 확인해보세요
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
            더 궁금한 점이 있으시다면 언제든지 문의해주세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="mailto:hello@amiko.com" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              이메일 문의
            </a>
            <span className="text-gray-400">|</span>
            <a 
              href="tel:+82-2-1234-5678" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              전화 문의
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
