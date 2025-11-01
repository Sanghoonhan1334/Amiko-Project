'use client'

import VideoCallStarter from '@/components/video/VideoCallStarter'

export default function MeetTab() {
  const handleStartCall = (channelName: string) => {
    console.log('Starting video call with channel:', channelName)
    // TODO: 실제 Agora 채팅 시작 로직
  }

  return (
    <div className="w-full space-y-6">
      {/* VideoCallStarter가 모든 것을 처리 (현지인: 파트너 목록, 한국인: 예약 관리 대시보드) */}
      <VideoCallStarter onStartCall={handleStartCall} />
    </div>
  )
}
