'use client'

import VideoCallStarter from '@/components/video/VideoCallStarter'

export default function MeetTab() {
  const handleStartCall = (channelName: string) => {
    console.log('Starting video call with channel:', channelName)
    // TODO: 실제 Agora 채팅 시작 로직
  }

  return (
    <div className="w-full">
      {/* VerificationGuard 제거 - VideoCallStarter 내부에서 인증 체크 처리 */}
      <VideoCallStarter onStartCall={handleStartCall} />
    </div>
  )
}
