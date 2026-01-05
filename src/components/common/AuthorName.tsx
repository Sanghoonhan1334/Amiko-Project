'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import VerificationBadge from './VerificationBadge'

type AuthorNameProps = {
  userId?: string | null
  name?: string | null
  profileImage?: string | null
  className?: string
  children?: ReactNode
  disableLink?: boolean
  showBadge?: boolean
  showAvatar?: boolean
  avatarSize?: 'sm' | 'md' | 'lg'
}

const NON_LINKABLE_NAMES = new Set([
  '익명',
  'Anónimo',
  '익명 사용자',
  'Usuario',
  '운영자',
  'Administrador',
  'Admin',
  'Administrator',
  '시스템',
  'System'
])

export default function AuthorName({
  userId,
  name,
  profileImage,
  className,
  children,
  disableLink = false,
  showBadge = true,
  showAvatar = true,
  avatarSize = 'sm'
}: AuthorNameProps) {
  const [hasBadge, setHasBadge] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profileImage || null)

  useEffect(() => {
    setAvatarUrl(profileImage || null)
  }, [profileImage])

  useEffect(() => {
    if (!userId || !showBadge) {
      setHasBadge(false)
      return
    }

    // 사용자 뱃지 정보 확인
    const checkBadge = async () => {
      try {
        const response = await fetch(`/api/profile?userId=${userId}`)
        if (response.ok) {
          const result = await response.json()
          setHasBadge(result.user?.verified_badge || false)
          
          // 프로필 이미지가 없고 userId가 있으면 프로필에서 가져오기
          if (!avatarUrl && showAvatar) {
            const profileImage = result.user?.profile_image || result.user?.avatar_url
            if (profileImage) {
              setAvatarUrl(profileImage)
            }
          }
        }
      } catch (error) {
        console.error('뱃지 확인 실패:', error)
      }
    }

    checkBadge()
  }, [userId, showBadge, avatarUrl, showAvatar])

  const displayName = (name || '').trim() || '익명'
  const shouldLink = Boolean(
    !disableLink &&
      userId &&
      !NON_LINKABLE_NAMES.has(displayName)
  )

  // 아바타 크기 설정
  const avatarSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  // 아바타 렌더링
  const renderAvatar = () => {
    if (!showAvatar) return null

    const size = avatarSizeClasses[avatarSize]
    const initial = displayName.charAt(0).toUpperCase()

    if (avatarUrl) {
      return (
        <div className={cn('relative flex-shrink-0 rounded-full overflow-hidden bg-gray-200', size)}>
          <Image
            src={avatarUrl}
            alt={displayName}
            fill
            className="object-cover"
            sizes={avatarSize === 'sm' ? '20px' : avatarSize === 'md' ? '24px' : '32px'}
          />
        </div>
      )
    }

    return (
      <div className={cn(
        'flex-shrink-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium',
        size,
        avatarSize === 'sm' ? 'text-xs' : avatarSize === 'md' ? 'text-sm' : 'text-base'
      )}>
        {initial}
      </div>
    )
  }

  const content = (
    <>
      {renderAvatar()}
      <span>{displayName}</span>
      {hasBadge && <VerificationBadge size="sm" />}
      {children}
    </>
  )

  if (shouldLink) {
    return (
      <Link
        href={`/users/${userId}`}
        className={cn('inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors', className)}
        prefetch={false}
        onClick={(event) => {
          // 행 클릭 등의 부모 이벤트로부터 분리
          event.stopPropagation()
        }}
      >
        {content}
      </Link>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      {content}
    </span>
  )
}

