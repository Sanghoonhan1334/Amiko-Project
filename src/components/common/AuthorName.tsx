'use client'

import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import VerificationBadge from './VerificationBadge'

type AuthorNameProps = {
  userId?: string | null
  name?: string | null
  className?: string
  children?: ReactNode
  disableLink?: boolean
  showBadge?: boolean
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
  className,
  children,
  disableLink = false,
  showBadge = true
}: AuthorNameProps) {
  const [hasBadge, setHasBadge] = useState(false)

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
        }
      } catch (error) {
        console.error('뱃지 확인 실패:', error)
      }
    }

    checkBadge()
  }, [userId, showBadge])

  const displayName = (name || '').trim() || '익명'
  const shouldLink = Boolean(
    !disableLink &&
      userId &&
      !NON_LINKABLE_NAMES.has(displayName)
  )

  if (shouldLink) {
    return (
      <Link
        href={`/users/${userId}`}
        className={cn('inline-flex items-center gap-1 hover:text-blue-600 transition-colors', className)}
        prefetch={false}
        onClick={(event) => {
          // 행 클릭 등의 부모 이벤트로부터 분리
          event.stopPropagation()
        }}
      >
        <span>{displayName}</span>
        {hasBadge && <VerificationBadge size="sm" />}
        {children}
      </Link>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span>{displayName}</span>
      {hasBadge && <VerificationBadge size="sm" />}
      {children}
    </span>
  )
}

