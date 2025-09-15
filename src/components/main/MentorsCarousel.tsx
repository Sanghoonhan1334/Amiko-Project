'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

const mentors = [
  {
    id: 1,
    name: '김민수',
    jobTitle: '한국어 교사',
    avatar: 'https://picsum.photos/80/80?random=1',
    tags: ['발음교정', '문법', '문화'],
    rating: 4.9,
    reviewCount: 127,
    description: '10년 경력의 한국어 교사로, 체계적이고 재미있는 수업을 제공합니다.'
  },
  {
    id: 2,
    name: '이지영',
    jobTitle: '문화 컨설턴트',
    avatar: 'https://picsum.photos/80/80?random=2',
    tags: ['문화교류', '관광', '요리'],
    rating: 4.8,
    reviewCount: 89,
    description: '한국 문화의 다양한 면을 재미있게 소개해드립니다.'
  },
  {
    id: 3,
    name: '박준호',
    jobTitle: '언어학자',
    avatar: 'https://picsum.photos/80/80?random=3',
    tags: ['학술', '논문', '고급한국어'],
    rating: 4.7,
    reviewCount: 156,
    description: '학술적 접근으로 한국어의 깊이를 탐구합니다.'
  },
  {
    id: 4,
    name: '최수진',
    jobTitle: '비즈니스 컨설턴트',
    avatar: 'https://picsum.photos/80/80?random=4',
    tags: ['비즈니스', '회화', '네트워킹'],
    rating: 4.9,
    reviewCount: 203,
    description: '한국 비즈니스 문화와 한국어를 함께 배워보세요.'
  },
  {
    id: 5,
    name: '정현우',
    jobTitle: '미디어 전문가',
    avatar: 'https://picsum.photos/80/80?random=5',
    tags: ['미디어', '연예', '트렌드'],
    rating: 4.6,
    reviewCount: 78,
    description: '한국의 최신 트렌드와 미디어 문화를 소개합니다.'
  },
  {
    id: 6,
    name: '한소영',
    jobTitle: '전통문화 전문가',
    avatar: 'https://picsum.photos/80/80?random=6',
    tags: ['전통', '역사', '예술'],
    rating: 4.8,
    reviewCount: 134,
    description: '한국의 전통문화와 역사를 깊이 있게 다룹니다.'
  }
]

export default function MentorsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 3) % mentors.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 3 + mentors.length) % mentors.length)
  }

  const visibleMentors = mentors.slice(currentIndex, currentIndex + 3)

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container max-w-6xl mx-auto px-4">
        {/* 섹션 제목 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            검증된 멘토들과 함께하세요
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            다양한 분야의 전문가들이 여러분의 한국 문화 학습을 도와드립니다
          </p>
        </div>
        
        {/* 캐러셀 컨테이너 */}
        <div className="relative">
          {/* 이전/다음 버튼 */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-gray-50"
            onClick={prevSlide}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-gray-50"
            onClick={nextSlide}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
          
          {/* 멘토 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-12">
            {visibleMentors.map((mentor) => (
              <Card key={mentor.id} className="group hover:-translate-y-2 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="text-center pb-4">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage src={mentor.avatar} alt={mentor.name} />
                    <AvatarFallback className="text-2xl font-bold bg-blue-100 text-blue-600">
                      {mentor.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{mentor.name}</h3>
                    <p className="text-gray-600">{mentor.jobTitle}</p>
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-3">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-900">{mentor.rating}</span>
                    <span className="text-sm text-gray-500">({mentor.reviewCount})</span>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-4 text-sm">
                    {mentor.description}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {mentor.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* 인디케이터 */}
        <div className="flex justify-center mt-8">
          <div className="flex gap-2">
            {Array.from({ length: Math.ceil(mentors.length / 3) }).map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === Math.floor(currentIndex / 3) ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentIndex(index * 3)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
