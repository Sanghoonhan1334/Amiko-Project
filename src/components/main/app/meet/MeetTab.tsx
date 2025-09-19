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
    <div className="p-3 sm:p-4 md:p-6">
      <VideoCallStarter onStartCall={handleStartCall} />
    </div>
  )
}
