'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Plus, 
  MessageSquare, 
  Users, 
  Calendar,
  BookOpen,
  Gift,
  Star,
  Zap
} from 'lucide-react'

// 이모지와 메시지 조합 타입
type EmptyStateType = 
  | 'community'    // 커뮤니티 (Q&A)
  | 'meet'         // 만남 (영상)
  | 'my'           // 마이 (프로필)
  | 'lounge'       // 라운지
  | 'notifications' // 알림
  | 'bookings'     // 예약
  | 'payments'     // 결제
  | 'rewards'      // 리워드
  | 'custom'       // 커스텀

interface EmptyCuteProps {
  type?: EmptyStateType
  title?: string
  description?: string
  buttonText?: string
  buttonAction?: () => void
  buttonHref?: string
  customEmoji?: string
  customIcon?: React.ReactNode
  showSparkles?: boolean
  className?: string
}

// 타입별 기본 설정
const getEmptyStateConfig = (type: EmptyStateType) => {
  const configs = {
    community: {
      emoji: '🫶',
      title: '아직 질문이 없어요!',
      description: '첫 번째 질문을 작성해보세요. 함께 배우고 성장할 수 있어요!',
      buttonText: '질문 작성하기',
      buttonHref: '/community',
      icon: <MessageSquare className="w-6 h-6" />
    },
    meet: {
      emoji: '🫧',
      title: '아직 만남이 없어요!',
              description: '한국인 친구와의 첫 만남을 시작해보세요. 특별한 경험이 기다리고 있어요!',
        buttonText: '친구 찾기',
      buttonHref: '/main/meet',
      icon: <Users className="w-6 h-6" />
    },
    my: {
      emoji: '🧋',
      title: '아직 활동이 없어요!',
      description: '커뮤니티에 참여하고 포인트를 모아보세요. 다양한 혜택이 기다리고 있어요!',
      buttonText: '활동 시작하기',
      buttonHref: '/main',
      icon: <BookOpen className="w-6 h-6" />
    },
    lounge: {
      emoji: '🎈',
      title: '아직 라운지 일정이 없어요!',
      description: 'ZEP 라운지에서 새로운 친구들을 만나고 문화를 교류해보세요!',
      buttonText: '라운지 참여하기',
      buttonHref: '/lounge',
      icon: <Calendar className="w-6 h-6" />
    },
    notifications: {
      emoji: '🔔',
      title: '아직 알림이 없어요!',
      description: '새로운 활동과 업데이트 소식을 받아보세요!',
      buttonText: '알림 설정하기',
      buttonHref: '/main/me',
      icon: <Zap className="w-6 h-6" />
    },
    bookings: {
      emoji: '📅',
      title: '아직 예약이 없어요!',
                      description: '친구와의 만남을 예약하고 한국어를 배워보세요!',
        buttonText: '만남 예약하기',
      buttonHref: '/main/meet',
      icon: <Calendar className="w-6 h-6" />
    },
    payments: {
      emoji: '💳',
      title: '아직 결제 내역이 없어요!',
      description: '쿠폰을 구매하고 더 많은 상담을 받아보세요!',
      buttonText: '쿠폰 구매하기',
      buttonHref: '/main/me',
      icon: <Gift className="w-6 h-6" />
    },
    rewards: {
      emoji: '🏆',
      title: '아직 리워드가 없어요!',
      description: '활동을 통해 포인트를 모이고 특별한 혜택을 받아보세요!',
      buttonText: '활동 참여하기',
      buttonHref: '/main',
      icon: <Star className="w-6 h-6" />
    },
    custom: {
      emoji: '✨',
      title: '아직 내용이 없어요!',
      description: '새로운 내용을 추가해보세요!',
      buttonText: '작성하기',
      buttonHref: '/',
      icon: <Plus className="w-6 h-6" />
    }
  }
  
  return configs[type] || configs.custom
}

export default function EmptyCute({
  type = 'custom',
  title,
  description,
  buttonText,
  buttonAction,
  buttonHref,
  customEmoji,
  customIcon,
  showSparkles = true,
  className = ''
}: EmptyCuteProps) {
  const config = getEmptyStateConfig(type)
  
  // 사용자 정의 값이 있으면 우선 적용
  const finalTitle = title || config.title
  const finalDescription = description || config.description
  const finalButtonText = buttonText || config.buttonText
  const finalEmoji = customEmoji || config.emoji
  const finalIcon = customIcon || config.icon

  // 버튼 클릭 핸들러
  const handleButtonClick = () => {
    if (buttonAction) {
      buttonAction()
    }
  }

  // 버튼 렌더링
  const renderButton = () => {
    if (buttonHref) {
      return (
        <Button 
          asChild
          className="bg-gradient-to-r from-brand-500 to-mint-500 hover:from-brand-600 hover:to-mint-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-3 text-lg rounded-2xl"
        >
          <a href={buttonHref}>
            {finalIcon}
            <span className="ml-2">{finalButtonText}</span>
          </a>
        </Button>
      )
    }

    return (
      <Button 
        onClick={handleButtonClick}
        className="bg-gradient-to-r from-brand-500 to-mint-500 hover:from-brand-600 hover:to-mint-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-3 text-lg rounded-2xl"
      >
        {finalIcon}
        <span className="ml-2">{finalButtonText}</span>
      </Button>
    )
  }

  return (
    <Card className={`p-12 bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50 border-2 border-brand-200/50 rounded-3xl text-center relative overflow-hidden ${className}`}>
      {/* 배경 장식 요소들 */}
      {showSparkles && (
        <>
          <div className="absolute top-4 left-6 text-2xl text-brand-200/60 animate-pulse">
            ✨
          </div>
          <div className="absolute top-8 right-8 text-xl text-mint-200/60 animate-pulse delay-1000">
            💫
          </div>
          <div className="absolute bottom-6 left-8 text-lg text-yellow-200/60 animate-pulse delay-2000">
            🌟
          </div>
          <div className="absolute bottom-8 right-6 text-xl text-brand-200/60 animate-pulse delay-1500">
            ✨
          </div>
        </>
      )}

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 space-y-6">
        {/* 큰 이모지 */}
        <div className="text-8xl mb-4 animate-bounce">
          {finalEmoji}
        </div>

        {/* 제목 */}
        <h3 className="text-2xl font-bold text-gray-800 mb-3">
          {finalTitle}
        </h3>

        {/* 설명 */}
        <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
          {finalDescription}
        </p>

        {/* 액션 버튼 */}
        <div className="pt-4">
          {renderButton()}
        </div>

        {/* 추가 장식 요소 */}
        <div className="flex items-center justify-center gap-4 pt-6">
          <div className="w-2 h-2 bg-brand-300 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-mint-300 rounded-full animate-pulse delay-300"></div>
          <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse delay-600"></div>
        </div>
      </div>

      {/* 하단 장식 라인 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-200 via-mint-200 to-yellow-200"></div>
    </Card>
  )
}

// 사용 예시를 위한 추가 컴포넌트들
export const EmptyCommunity = (props: Omit<EmptyCuteProps, 'type'>) => (
  <EmptyCute type="community" {...props} />
)

export const EmptyMeet = (props: Omit<EmptyCuteProps, 'type'>) => (
  <EmptyCute type="meet" {...props} />
)

export const EmptyMy = (props: Omit<EmptyCuteProps, 'type'>) => (
  <EmptyCute type="my" {...props} />
)

export const EmptyLounge = (props: Omit<EmptyCuteProps, 'type'>) => (
  <EmptyCute type="lounge" {...props} />
)

export const EmptyNotifications = (props: Omit<EmptyCuteProps, 'type'>) => (
  <EmptyCute type="notifications" {...props} />
)

export const EmptyBookings = (props: Omit<EmptyCuteProps, 'type'>) => (
  <EmptyCute type="bookings" {...props} />
)

export const EmptyPayments = (props: Omit<EmptyCuteProps, 'type'>) => (
  <EmptyCute type="payments" {...props} />
)

export const EmptyRewards = (props: Omit<EmptyCuteProps, 'type'>) => (
  <EmptyCute type="rewards" {...props} />
)
