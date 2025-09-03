'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/context/LanguageContext'

interface Participant {
  id: string
  name: string
  avatar?: string
  country: string
  isVerified: boolean
}

interface ParticipantAvatarsProps {
  participants: Participant[]
  maxVisible?: number
  size?: 'sm' | 'md' | 'lg'
}

export default function ParticipantAvatars({ 
  participants, 
  maxVisible = 5, 
  size = 'sm' 
}: ParticipantAvatarsProps) {
  const { t } = useLanguage()
  
  const visibleParticipants = participants.slice(0, maxVisible)
  const remainingCount = Math.max(0, participants.length - maxVisible)
  
  const avatarSize = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-10 h-10'
  }[size]
  
  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size]

  // 국가별 플래그 이모지
  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      KR: '🇰🇷',
      US: '🇺🇸',
      MX: '🇲🇽',
      CO: '🇨🇴',
      PE: '🇵🇪',
      BR: '🇧🇷',
      AR: '🇦🇷',
      CL: '🇨🇱',
      EC: '🇪🇨',
      UY: '🇺🇾',
      PY: '🇵🇾',
      BO: '🇧🇴',
      VE: '🇻🇪',
      CR: '🇨🇷',
      GT: '🇬🇹',
      HN: '🇭🇳',
      NI: '🇳🇮',
      PA: '🇵🇦',
      SV: '🇸🇻',
      DO: '🇩🇴'
    }
    return flags[country] || '🌎'
  }

  // 이름의 첫 글자 추출 (한국어/영어 대응)
  const getInitials = (name: string) => {
    if (!name) return '?'
    
    // 한국어 이름인 경우 (완전한 한글 문자)
    if (/^[가-힣]+$/.test(name)) {
      return name.charAt(name.length - 1) // 마지막 글자 (이름)
    }
    
    // 영어 이름인 경우
    const words = name.trim().split(' ')
    if (words.length >= 2) {
      return words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }

  if (participants.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <div className={`${avatarSize} bg-gray-100 rounded-full flex items-center justify-center border-2 border-white`}>
          <span className="text-gray-400 text-xs">👥</span>
        </div>
        <span className={`text-gray-500 ${textSize}`}>
          {t('loungeParticipants.noParticipants')}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visibleParticipants.map((participant, index) => (
          <div key={participant.id} className="relative">
            <Avatar className={`${avatarSize} border-2 border-white shadow-sm`}>
              <AvatarImage 
                src={participant.avatar} 
                alt={participant.name}
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-gray-700 font-medium">
                {getInitials(participant.name)}
              </AvatarFallback>
            </Avatar>
            
            {/* 국가 플래그 배지 */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
              <span className="text-xs">{getCountryFlag(participant.country)}</span>
            </div>
            
            {/* 인증 배지 */}
            {participant.isVerified && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white">
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* 남은 참여자 수 표시 */}
        {remainingCount > 0 && (
          <div className={`${avatarSize} bg-gray-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm`}>
            <span className={`text-gray-600 font-medium ${textSize}`}>
              +{remainingCount}
            </span>
          </div>
        )}
      </div>
      
      {/* 참여자 수 텍스트 */}
      <div className="flex items-center gap-1">
        <span className={`text-gray-700 font-medium ${textSize}`}>
          {participants.length}
        </span>
        <span className={`text-gray-500 ${textSize}`}>
          {t('loungeParticipants.participants')}
        </span>
      </div>
    </div>
  )
}

// 목업 참여자 데이터 생성 함수
export const generateMockParticipants = (count: number): Participant[] => {
  const names = [
    { name: '김민지', country: 'KR', isVerified: true },
    { name: '박지훈', country: 'KR', isVerified: true },
    { name: 'Maria Rodriguez', country: 'MX', isVerified: true },
    { name: 'Carlos Silva', country: 'BR', isVerified: false },
    { name: '이서연', country: 'KR', isVerified: true },
    { name: 'Ana Lopez', country: 'CO', isVerified: true },
    { name: 'Diego Martinez', country: 'PE', isVerified: false },
    { name: '최예원', country: 'KR', isVerified: true },
    { name: 'Sofia Gonzalez', country: 'AR', isVerified: true },
    { name: 'Lucas Santos', country: 'BR', isVerified: false },
    { name: '정하늘', country: 'KR', isVerified: true },
    { name: 'Camila Torres', country: 'CL', isVerified: true },
    { name: 'Sebastian Kim', country: 'US', isVerified: true },
    { name: '윤지우', country: 'KR', isVerified: false },
    { name: 'Valentina Cruz', country: 'EC', isVerified: true }
  ]
  
  return Array.from({ length: Math.min(count, names.length) }, (_, i) => ({
    id: `participant-${i}`,
    name: names[i].name,
    country: names[i].country,
    isVerified: names[i].isVerified,
    avatar: undefined // 실제로는 프로필 이미지 URL
  }))
}
