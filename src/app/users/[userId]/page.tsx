'use client'

import { useParams, useRouter } from 'next/navigation'
import UserProfileModal from '@/components/common/UserProfileModal'

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  return (
    <UserProfileModal
      userId={userId}
      isOpen={true}
      onClose={() => router.back()}
    />
  )
}

