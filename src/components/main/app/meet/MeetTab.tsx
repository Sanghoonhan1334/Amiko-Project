'use client'

import { useLanguage } from '@/context/LanguageContext'
import VideoCallStarter from '@/components/video/VideoCallStarter'



export default function MeetTab() {
  const { t } = useLanguage()

  const handleStartCall = (channelName: string) => {
    console.log('Starting video call with channel:', channelName)
    // TODO: 실제 Agora 채팅 시작 로직
  }



  return (
    <div className="p-0 sm:p-1 md:p-2">
      <VideoCallStarter onStartCall={handleStartCall} />
    </div>
  )
}
