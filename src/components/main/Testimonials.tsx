import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    country: '미국',
    avatar: 'https://picsum.photos/60/60?random=1',
    rating: 5,
    content: 'Amiko를 통해 한국 문화를 깊이 있게 배울 수 있었어요. 멘토들이 정말 친절하고 전문적이에요!',
    tags: ['문화교류', '발음교정'],
    date: '2024년 1월'
  },
  {
    id: 2,
    name: 'Carlos Rodriguez',
    country: '스페인',
    avatar: 'https://picsum.photos/60/60?random=2',
    rating: 5,
    content: '한국어를 배우고 싶었는데, Amiko가 최고의 선택이었습니다. 체계적인 커리큘럼과 실용적인 수업이 인상적이에요.',
    tags: ['언어학습', '체계적'],
    date: '2024년 2월'
  },
  {
    id: 3,
    name: 'Yuki Tanaka',
    country: '일본',
    avatar: 'https://picsum.photos/60/60?random=3',
    rating: 5,
    content: '일본에서도 쉽게 한국 문화를 배울 수 있어서 정말 좋아요. 멘토들과의 소통이 즐거워요!',
    tags: ['커뮤니티', '소통'],
    date: '2024년 3월'
  },
  {
    id: 4,
    name: 'Maria Silva',
    country: '브라질',
    avatar: 'https://picsum.photos/60/60?random=4',
    rating: 5,
    content: '한국 드라마를 보면서 한국어를 배우고 싶었는데, Amiko가 그 꿈을 실현시켜주었어요. 정말 감사합니다!',
    tags: ['미디어', '재미있음'],
    date: '2024년 3월'
  },
  {
    id: 5,
    name: 'Alex Chen',
    country: '캐나다',
    avatar: 'https://picsum.photos/60/60?random=5',
    rating: 5,
    content: '비즈니스 한국어를 배우고 싶었는데, 전문적인 멘토를 통해 실무에 바로 적용할 수 있는 내용을 배웠어요.',
    tags: ['비즈니스', '실용적'],
    date: '2024년 2월'
  },
  {
    id: 6,
    name: 'Emma Wilson',
    country: '영국',
    avatar: 'https://picsum.photos/60/60?random=6',
    rating: 5,
    content: '한국 여행을 계획하고 있는데, Amiko를 통해 기본적인 한국어와 문화를 미리 배울 수 있어서 정말 도움이 되었어요.',
    tags: ['여행', '문화'],
    date: '2024년 1월'
  }
]

export default function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container max-w-6xl mx-auto px-4">
        {/* 섹션 제목 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            실제 사용자들의 생생한 후기
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Amiko를 통해 한국 문화를 배운 전 세계 학습자들의 솔직한 경험담을 들어보세요
          </p>
        </div>
        
        {/* 후기 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="group hover:-translate-y-2 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                        {testimonial.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                      <p className="text-sm text-gray-500">{testimonial.country}</p>
                    </div>
                  </div>
                  <Quote className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors" />
                </div>
                
                {/* 평점 */}
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, index) => (
                    <Star key={index} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-sm text-gray-500 ml-2">({testimonial.rating}.0)</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-600 mb-4">
                  &ldquo;Amiko를 통해 한국어를 배우면서 한국 문화에 대한 이해도가 깊어졌어요.&rdquo;
                </p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {testimonial.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <p className="text-sm text-gray-400 text-right">
                  {testimonial.date}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* 통계 정보 */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">1,000+</div>
              <div className="text-gray-600">만족한 학습자</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">4.9/5</div>
              <div className="text-gray-600">평균 평점</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-gray-600">전문 멘토</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600">지원 가능</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
