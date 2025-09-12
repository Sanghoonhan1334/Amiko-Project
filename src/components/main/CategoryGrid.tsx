import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  MessageCircle, 
  Globe, 
  BookOpen, 
  Camera, 
  Heart,
  Star,
  Zap
} from 'lucide-react'

const categories = [
  {
    icon: Users,
    title: '소통멘토',
    description: '한국인 멘토와 1:1 소통',
    color: 'bg-blue-100 text-blue-600',
    badge: '인기'
  },
  {
    icon: MessageCircle,
    title: '발음 교정',
    description: '정확한 한국어 발음 학습',
    color: 'bg-purple-100 text-purple-600',
    badge: '추천'
  },
  {
    icon: Globe,
    title: '문화 교류',
    description: '한국 문화 깊이 있게 이해',
    color: 'bg-green-100 text-green-600'
  },
  {
    icon: BookOpen,
    title: '언어 학습',
    description: '체계적인 한국어 교육',
    color: 'bg-orange-100 text-orange-600'
  },
  {
    icon: Camera,
    title: 'AI 화상 채팅',
    description: '언제 어디서나 편리하게',
    color: 'bg-pink-100 text-pink-600'
  },
  {
    icon: Heart,
    title: '커뮤니티',
    description: '전 세계 학습자들과 소통',
    color: 'bg-red-100 text-red-600'
  },
  {
    icon: Star,
    title: '맞춤형 교육',
    description: '개인 수준에 맞는 커리큘럼',
    color: 'bg-yellow-100 text-yellow-600'
  },
  {
    icon: Zap,
    title: '빠른 진행',
    description: '효율적인 학습 진행',
    color: 'bg-indigo-100 text-indigo-600'
  }
]

export default function CategoryGrid() {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6">
        {/* 섹션 제목 */}
        <div className="text-center mb-12 sm:mb-14 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Amiko의 특별한 서비스
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            한국 문화와 언어를 배우는 다양한 방법을 제공합니다
          </p>
        </div>
        
        {/* 카테고리 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category, index) => {
            const IconComponent = category.icon
            return (
              <Card key={index} className="group hover:-translate-y-2 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="text-center pb-3 sm:pb-4">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-2 sm:mb-3 text-sm sm:text-base">
                    {category.description}
                  </p>
                  {category.badge && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs sm:text-sm">
                      {category.badge}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
