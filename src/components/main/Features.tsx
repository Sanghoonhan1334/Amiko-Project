import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Shield, 
  Clock, 
  Users, 
  Globe,
  Award,
  Zap
} from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: '안전한 환경',
    description: '검증된 멘토와 안전한 화상 상담 환경을 제공합니다',
    color: 'bg-green-100 text-green-600'
  },
  {
    icon: Clock,
    title: '24/7 지원',
    description: '언제든지 원하는 시간에 상담을 예약하고 진행할 수 있습니다',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    icon: Users,
    title: '전문 멘토',
    description: '각 분야의 전문가들이 체계적이고 재미있는 수업을 제공합니다',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    icon: Globe,
    title: '글로벌 커뮤니티',
    description: '전 세계 학습자들과 소통하며 다양한 문화를 경험할 수 있습니다',
    color: 'bg-orange-100 text-orange-600'
  },
  {
    icon: Award,
    title: '인증된 서비스',
    description: '품질이 검증된 교육 서비스로 만족도를 보장합니다',
    color: 'bg-pink-100 text-pink-600'
  },
  {
    icon: Zap,
    title: '빠른 진행',
    description: '효율적인 학습 시스템으로 빠르게 목표를 달성할 수 있습니다',
    color: 'bg-indigo-100 text-indigo-600'
  }
]

export default function Features() {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6">
        {/* 섹션 제목 */}
        <div className="text-center mb-12 sm:mb-14 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            왜 Amiko를 선택해야 할까요?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            한국과 남미를 잇는 진정한 문화 교류 플랫폼
          </p>
        </div>
        
        {/* 특징 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card key={index} className="group hover:-translate-y-2 transition-all duration-300 hover:shadow-lg bg-white">
                <CardHeader className="text-center pb-3 sm:pb-4">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 ${feature.color} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        {/* 추가 정보 */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-8 shadow-lg max-w-4xl mx-auto text-white">
            <h3 className="text-2xl font-bold mb-4">
              지금 시작해보세요
            </h3>
            <p className="text-white/90 text-lg">
              안전하고 신뢰할 수 있는 환경에서 진정한 한국 문화를 경험하세요. 
              <br />
              Amiko와 함께 한국과 남미를 잇는 특별한 여정을 시작하세요.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
