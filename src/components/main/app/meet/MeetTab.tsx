'use client'

import VideoCallStarter from '@/components/video/VideoCallStarter'
import VerificationGuard from '@/components/common/VerificationGuard'

export default function MeetTab() {
  const handleStartCall = (channelName: string) => {
    console.log('Starting video call with channel:', channelName)
    // TODO: 실제 Agora 채팅 시작 로직
  }

  return (
    <div className="w-full">
      <VerificationGuard requiredLevel="sms">
        <VideoCallStarter onStartCall={handleStartCall} />
      </VerificationGuard>
    </div>
  )
}
