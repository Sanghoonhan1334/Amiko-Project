import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, CreditCard, Video } from 'lucide-react'

const steps = [
  {
    step: 1,
    icon: Clock,
    title: '시간 선택',
    description: '원하는 시간과 멘토를 선택하세요',
    details: '24시간 언제든지 예약 가능하며, 멘토의 프로필과 리뷰를 확인할 수 있습니다.',
    color: 'bg-blue-100 text-blue-600',
    badge: '1분'
  },
  {
    step: 2,
    icon: CreditCard,
    title: '결제',
    description: '안전하고 간편한 결제',
    details: 'Toss Payments를 통한 안전한 결제 시스템으로 즉시 예약이 확정됩니다.',
    color: 'bg-green-100 text-green-600',
    badge: '2분'
  },
  {
    step: 3,
    icon: Video,
    title: 'AI 화상 채팅',
    description: '실시간 1:1 AI 화상 채팅',
    details: '고화질 AI 화상 채팅을 진행하며, 화면 공유와 채팅 기능을 제공합니다.',
    color: 'bg-purple-100 text-purple-600',
    badge: '30분'
  }
]

export default function HowItWorks() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container max-w-6xl mx-auto px-4">
        {/* 섹션 제목 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            간단한 3단계로 시작하세요
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            복잡한 절차 없이 빠르고 쉽게 한국 문화를 배워보세요
          </p>
        </div>
        
        {/* 단계별 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon
            return (
              <Card key={index} className="group hover:-translate-y-2 transition-all duration-300 hover:shadow-lg relative">
                {/* 단계 번호 */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {step.step}
                </div>
                
                <CardHeader className="text-center pt-8 pb-4">
                  <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 mb-2">
                    {step.title}
                  </CardTitle>
                  <p className="text-gray-600 text-sm">
                    {step.description}
                  </p>
                </CardHeader>
                
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                    {step.details}
                  </p>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    {step.badge}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        {/* 연결선 (데스크탑에서만 표시) */}
        <div className="hidden md:block mt-8">
          <div className="flex justify-center items-center">
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="w-4 h-4 bg-blue-600 rounded-full mx-4"></div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="w-4 h-4 bg-blue-600 rounded-full mx-4"></div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
