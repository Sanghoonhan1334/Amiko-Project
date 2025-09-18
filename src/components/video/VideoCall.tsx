'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Settings,
  Users
} from 'lucide-react'
import { 
  initializeAgoraClient, 
  generateToken, 
  joinChannel, 
  createLocalTracks, 
  leaveChannel 
} from '@/lib/agora'
import { diagnoseMediaDevices } from '@/lib/media-devices'
import { useLanguage } from '@/context/LanguageContext'

interface VideoCallProps {
  channelName: string
  onEndCall: () => void
}

export default function VideoCall({ channelName, onEndCall }: VideoCallProps) {
  const { t } = useLanguage()
  const [isJoined, setIsJoined] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null)
  const [remoteUsers, setRemoteUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const agoraClientRef = useRef<any>(null)
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    const initializeCall = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // 서버사이드 렌더링 체크
        if (typeof window === 'undefined') {
          return
        }
        
        agoraClientRef.current = initializeAgoraClient()
        if (!agoraClientRef.current) {
          throw new Error('Agora 클라이언트 초기화 실패')
        }
        
        console.log('Agora 클라이언트 초기화 완료')
        
        // 원격 사용자 이벤트 리스너
        agoraClientRef.current.on('user-published', async (user: any, mediaType: string) => {
          console.log('원격 사용자 참여됨:', user.uid, mediaType)
          await agoraClientRef.current.subscribe(user, mediaType)
          
          if (mediaType === 'video') {
            const remoteVideoTrack = user.videoTrack
            setRemoteUsers((prev) => {
              const existing = prev.find(u => u.uid === user.uid)
              if (existing) {
                return prev.map(u => u.uid === user.uid ? { ...u, videoTrack: remoteVideoTrack } : u)
              }
              return [...prev, { uid: user.uid, videoTrack: remoteVideoTrack }]
            })
          }
          
          if (mediaType === 'audio') {
            const remoteAudioTrack = user.audioTrack
            remoteAudioTrack.play()
          }
        })

        agoraClientRef.current.on('user-unpublished', (user: any) => {
          console.log('원격 사용자 해제됨')
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid))
        })

        return () => {
          if (agoraClientRef.current) {
            leaveChannel(agoraClientRef.current)
          }
        }
      } catch (error) {
        console.error('Agora 클라이언트 초기화 실패:', error)
        setError('화상 채팅 초기화에 실패했습니다.')
      }
    }

    initializeCall()
  }, [channelName])

  const handleJoinChannel = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // 미디어 디바이스 진단
      try {
        await diagnoseMediaDevices()
      } catch (error) {
        console.log('미디어 디바이스 진단 실패:', error)
        // 에러가 발생해도 계속 진행
      }
      
      // 토큰 생성
      const uid = Math.floor(Math.random() * 100000)
      console.log('토큰 생성 시도 중...')
      const token = await generateToken(channelName, uid.toString())
      console.log('토큰 생성 완료')
      
      // 로컬 트랙 생성
      console.log('로컬 트랙 생성 시작...')
      const { audioTrack, videoTrack } = await createLocalTracks()
      console.log('로컬 트랙 생성 완료:', { audioTrack: !!audioTrack, videoTrack: !!videoTrack })
      
      // 트랙 설정
      setLocalVideoTrack(videoTrack)
      setLocalAudioTrack(audioTrack)
      
      // 로컬 비디오 렌더링
      if (videoTrack && localVideoRef.current) {
        videoTrack.play(localVideoRef.current)
        console.log('로컬 비디오 렌더링 완료')
      } else {
        // 실제 비디오 렌더링 (화면에 맞춤)
        // 카메라가 꺼진 상태에서는 렌더링하지 않음
        console.log('로컬 비디오 렌더링 건너뜀 (카메라 꺼짐 상태)')
      }
      
      // 채널 참여
      try {
        await joinChannel(
          agoraClientRef.current,
          '53d0f6b5a94c43d4a5e61e2ee50e0c52',
          channelName,
          token,
          uid.toString()
        )
        console.log('채널 참여 완료')
        setIsJoined(true)
      } catch (error) {
        console.error('채널 참여 실패:', error)
        setError('채널 참여에 실패했습니다.')
      }
    } catch (error) {
      console.error('채팅 시작 실패:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMessage.includes('Agora credentials not configured')) {
        setError('Agora 설정이 필요합니다. 관리자에게 문의하세요.')
      } else if (errorMessage.includes('Failed to generate token')) {
        setError('토큰 생성에 실패했습니다. 네트워크를 확인해주세요.')
      } else {
        setError(`채팅 시작에 실패했습니다: ${errorMessage}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeaveChannel = async () => {
    try {
      if (localAudioTrack) {
        localAudioTrack.close()
      }
      if (localVideoTrack) {
        localVideoTrack.close()
      }
      
      await leaveChannel(agoraClientRef.current)
      setIsJoined(false)
      onEndCall()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to leave channel:', errorMessage)
    }
  }

  const toggleVideo = () => {
    if (localVideoTrack) {
      localVideoTrack.setEnabled(!isVideoOn)
      setIsVideoOn(!isVideoOn)
    }
  }

  const toggleAudio = () => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(!isAudioOn)
      setIsAudioOn(!isAudioOn)
    }
  }

  // 원격 비디오 렌더링
  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.videoTrack && remoteVideoRefs.current[user.uid]) {
        user.videoTrack.play(remoteVideoRefs.current[user.uid])
      }
    })
  }, [remoteUsers])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500 p-6">
        <h3 className="text-lg font-semibold mb-2">오류 발생</h3>
        <p className="text-sm mb-4">{error}</p>
        <button 
          onClick={onEndCall}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          채팅 종료
        </button>
      </div>
    )
  }

  if (!isJoined) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6">
        <h3 className="text-lg font-semibold mb-4">화상 채팅 준비 중</h3>
        <p className="text-sm mb-4">채널: {channelName}</p>
        <div className="space-y-2">
          <button 
            onClick={handleJoinChannel}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? '연결 중...' : '채팅 시작'}
          </button>
          <button 
            onClick={onEndCall}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            채팅 종료
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* 비디오 영역 */}
      <div className="flex-1 relative">
        {/* 원격 비디오들 */}
        <div className="absolute inset-0 grid grid-cols-1 gap-2 p-2">
          {remoteUsers.map((user) => (
            <div
              key={user.uid}
              ref={(el) => (remoteVideoRefs.current[user.uid] = el)}
              className="bg-gray-800 rounded-lg flex items-center justify-center"
            >
              <span>원격 사용자 {user.uid}</span>
            </div>
          ))}
          
          {/* 로컬 비디오 */}
          <div
            ref={localVideoRef}
            className="bg-gray-800 rounded-lg flex items-center justify-center"
          >
            <span>로컬 비디오</span>
          </div>
        </div>
      </div>

      {/* 컨트롤 바 */}
      <div className="flex justify-center items-center space-x-4 p-4 bg-gray-800">
        <Button
          onClick={toggleAudio}
          variant={isAudioOn ? "default" : "destructive"}
          size="lg"
          className="rounded-full"
        >
          {isAudioOn ? <Mic /> : <MicOff />}
        </Button>
        
        <Button
          onClick={toggleVideo}
          variant={isVideoOn ? "default" : "destructive"}
          size="lg"
          className="rounded-full"
        >
          {isVideoOn ? <Video /> : <VideoOff />}
        </Button>
        
        <Button
          onClick={handleLeaveChannel}
          variant="destructive"
          size="lg"
          className="rounded-full"
        >
          <PhoneOff />
        </Button>
      </div>
    </div>
  )
}
