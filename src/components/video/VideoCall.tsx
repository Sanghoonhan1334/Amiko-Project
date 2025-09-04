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
import { useLanguage } from '@/context/LanguageContext'

interface VideoCallProps {
  channelName: string
  onEndCall: () => void
}

export default function VideoCall({ channelName, onEndCall }: VideoCallProps) {
  const { t } = useLanguage()
  const [isJoined, setIsJoined] = useState(false)
  const [isMuted, setIsMuted] = useState(true) // 초기값을 true로 변경
  const [isVideoEnabled, setIsVideoEnabled] = useState(false) // 초기값을 false로 변경
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null)
  const [remoteUsers, setRemoteUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const localVideoRef = useRef<HTMLDivElement>(null)
  const localVideoElementRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)
  const agoraClientRef = useRef<any>(null)

  // Agora 클라이언트 초기화
  useEffect(() => {
    try {
      // 서버사이드 렌더링 체크
      if (typeof window === 'undefined') {
        return
      }
      
      agoraClientRef.current = initializeAgoraClient()
      if (!agoraClientRef.current) {
        console.error('Agora 클라이언트 초기화 실패')
        return
      }
      
      console.log('Agora 클라이언트 초기화 완료')
      
      // 원격 사용자 이벤트 리스너
      agoraClientRef.current.on('user-published', async (user: any, mediaType: string) => {
        console.log('원격 사용자 발행됨:', mediaType)
        await agoraClientRef.current.subscribe(user, mediaType)
        
        if (mediaType === 'video') {
          setRemoteUsers((prev) => [...prev, user])
          // 원격 비디오 렌더링 (화면에 맞춤)
          if (remoteVideoRef.current) {
            user.videoTrack.play(remoteVideoRef.current, { fit: 'contain' })
          }
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
    }
  }, [channelName])

  const handleJoinChannel = async () => {
    try {
      // 이미 연결된 상태인지 확인
      if (isJoined) {
        console.log('이미 채널에 연결되어 있습니다.')
        return
      }
      
      setIsLoading(true)
      console.log('채널 참여 시작:', channelName)
      
      // 브라우저 지원 확인
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('이 브라우저는 카메라를 지원하지 않습니다.')
        setIsLoading(false)
        return
      }
      
      // 권한 상태 확인
      try {
        const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName })
        console.log('카메라 권한 상태:', permissions.state)
        
        if (permissions.state === 'denied') {
          alert('카메라 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.')
          return
        }
      } catch (error) {
        console.log('권한 API를 지원하지 않는 브라우저입니다. 직접 권한 요청을 시도합니다.')
      }
      
      // 사용 가능한 카메라 목록 확인
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(device => device.kind === 'videoinput')
        console.log('사용 가능한 카메라:', videoDevices.map(d => d.label))
        
        if (videoDevices.length === 0) {
          alert('사용 가능한 카메라가 없습니다.')
          return
        }
      } catch (error) {
        console.log('디바이스 목록을 가져올 수 없습니다:', error)
      }
      
      // 토큰 생성
      const uid = Math.floor(Math.random() * 100000)
      const token = await generateToken(channelName, uid.toString())
      console.log('토큰 생성 완료')
      
      // 로컬 트랙 생성
      console.log('로컬 트랙 생성 시작...')
      const { audioTrack, videoTrack } = await createLocalTracks()
      console.log('로컬 트랙 생성 완료:', { audioTrack: !!audioTrack, videoTrack: !!videoTrack })
      
      // 트랙 설정
      setLocalVideoTrack(videoTrack)
      setLocalAudioTrack(audioTrack)
      
              // 실제 비디오 렌더링 (화면에 맞춤)
        // 카메라가 꺼진 상태에서는 렌더링하지 않음
        console.log('로컬 비디오 렌더링 건너뜀 (카메라 꺼짐 상태)')
      
      // 채널 참여
      try {
        await joinChannel(
          agoraClientRef.current,
          '53d0f6b5a94c43d4a5e61e2ee50e0c52',
          channelName,
          token,
          uid.toString()
        )
        
        // 활성화된 트랙만 발행
        const tracksToPublish = []
        if (audioTrack && !isMuted) {
          tracksToPublish.push(audioTrack)
        }
        if (videoTrack && isVideoEnabled) {
          tracksToPublish.push(videoTrack)
        }
        
        if (tracksToPublish.length > 0) {
          await agoraClientRef.current.publish(tracksToPublish)
        }
        
        console.log('채널 참여 완료')
      } catch (channelError) {
        console.error('채널 참여 실패:', channelError)
        alert('채널 참여에 실패했습니다. 다시 시도해주세요.')
        setIsLoading(false)
        return
      }
      
      setIsJoined(true)
    } catch (error) {
      console.error('Failed to join channel:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      alert(`채널 참여에 실패했습니다: ${error.message}`)
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
      console.error('Failed to leave channel:', error)
    }
  }

  const toggleMute = async () => {
    if (localAudioTrack && agoraClientRef.current) {
      if (isMuted) {
        // 마이크 켜기
        localAudioTrack.setEnabled(true)
        
        // 트랙이 활성화될 때까지 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 100))
        
        try {
          await agoraClientRef.current.publish(localAudioTrack)
          console.log('마이크 발행됨')
        } catch (error) {
          console.error('마이크 발행 실패:', error)
          // 발행 실패 시 트랙 비활성화
          localAudioTrack.setEnabled(false)
          return
        }
      } else {
        // 마이크 끄기
        localAudioTrack.setEnabled(false)
        await agoraClientRef.current.unpublish(localAudioTrack)
        console.log('마이크 발행 해제됨')
      }
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = async () => {
    if (localVideoTrack && agoraClientRef.current) {
      if (isVideoEnabled) {
        // 카메라 끄기
        localVideoTrack.setEnabled(false)
        await agoraClientRef.current.unpublish(localVideoTrack)
        setIsVideoEnabled(false)
        console.log('카메라 끄기 완료')
      } else {
        // 카메라 켜기
        try {
          // 트랙 활성화
          localVideoTrack.setEnabled(true)
          console.log('카메라 트랙 활성화됨')
          
          // 상태 업데이트
          setIsVideoEnabled(true)
          
          // 비디오 렌더링을 위한 대기
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // 비디오 렌더링
          if (localVideoElementRef.current) {
            localVideoTrack.play(localVideoElementRef.current, { 
              fit: 'contain',
              mirror: true 
            })
            console.log('카메라 렌더링 완료')
          } else {
            console.error('localVideoElementRef.current가 없습니다')
          }
          
          // 채널 발행
          await agoraClientRef.current.publish(localVideoTrack)
          console.log('카메라 발행 완료')
          
        } catch (error) {
          console.error('카메라 켜기 실패:', error)
          localVideoTrack.setEnabled(false)
          setIsVideoEnabled(false)
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center z-50">
      <Card className="w-full max-w-[95vw] h-full max-h-[95vh] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t('videoCall.title')}</h2>
                <span className="text-sm text-blue-200">#{channelName}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Users className="w-4 h-4 mr-2" />
                {t('videoCall.participants')}
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Settings className="w-4 h-4" />
              </Button>
              {isJoined && (
                <Button
                  onClick={handleLeaveChannel}
                  variant="ghost"
                  size="sm"
                  className="bg-red-500/20 border-2 border-red-500 text-white hover:bg-red-500/30 transition-all duration-300 rounded-lg px-3 py-1"
                >
                  <PhoneOff className="w-4 h-4 mr-1" />
                  통화 종료
                </Button>
              )}
            </div>
          </div>

          {/* 비디오 영역 */}
          <div className="flex-1 p-4 lg:p-6 relative">
            {/* 데스크톱 레이아웃 (lg 이상) - 양쪽으로 나누기 */}
            <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6 h-full">
              {/* 로컬 비디오 (왼쪽) */}
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                <div 
                  ref={localVideoRef}
                  className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center overflow-hidden"
                >
                  {!isVideoEnabled ? (
                    <div className="text-white text-center">
                      <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <VideoOff className="w-10 h-10 text-red-400" />
                      </div>
                      <p className="text-lg font-medium">카메라가 꺼져있습니다</p>
                      <p className="text-sm text-gray-400 mt-1">카메라를 켜서 상대방과 소통하세요</p>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <video 
                        ref={localVideoElementRef}
                        id="local-video"
                        className="w-full h-full object-contain"
                        autoPlay
                        playsInline
                        muted
                      />
                    </div>
                  )}
                </div>
                                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm font-medium border border-white/20">
                    {t('videoCall.me')}
                  </div>
                                  {isMuted && (
                    <div className="absolute top-4 right-4 bg-red-500/80 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm font-medium border border-red-300/20">
                      <MicOff className="w-4 h-4 inline mr-1" />
                      {t('videoCall.muted')}
                    </div>
                  )}
              </div>

              {/* 원격 비디오 (오른쪽) */}
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                <div 
                  ref={remoteVideoRef}
                  className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center"
                >
                  <div className="text-white text-center">
                    <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Users className="w-12 h-12 text-blue-400" />
                    </div>
                    <p className="text-xl font-medium mb-2">상대방을 기다리는 중...</p>
                    <p className="text-sm text-gray-400">다른 사용자가 같은 채널에 접속하면</p>
                    <p className="text-sm text-gray-400">자동으로 연결됩니다</p>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm font-medium border border-white/20">
                  상대방
                </div>
              </div>
            </div>

            {/* 모바일 레이아웃 (lg 미만) - 현재 형식 */}
            <div className="lg:hidden relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden border border-white/10 shadow-xl h-full">
              <div 
                ref={remoteVideoRef}
                className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center"
              >
                <div className="text-white text-center">
                  <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-12 h-12 text-blue-400" />
                  </div>
                  <p className="text-xl font-medium mb-2">상대방을 기다리는 중...</p>
                  <p className="text-sm text-gray-400">다른 사용자가 같은 채널에 접속하면</p>
                  <p className="text-sm text-gray-400">자동으로 연결됩니다</p>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm font-medium border border-white/20">
                상대방
              </div>
              
              {/* 로컬 비디오 작은 창 (오른쪽 위) */}
              {isVideoEnabled && (
                <div className="absolute top-4 right-4 w-48 h-36 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-white/20 shadow-2xl overflow-hidden">
                  <div 
                    ref={localVideoRef}
                    className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-700"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium border border-white/20">
                    나 (로컬)
                  </div>
                  {isMuted && (
                    <div className="absolute top-2 right-2 bg-red-500/80 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium border border-red-300/20">
                      <MicOff className="w-3 h-3 inline mr-1" />
                      음소거
                    </div>
                  )}
                </div>
              )}

              {/* 카메라 꺼짐 전체 화면 오버레이 (모바일) */}
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-10">
                  {/* 상대방 비디오 작은 창 (오른쪽 위) */}
                  <div className="absolute top-6 right-6 w-64 h-48 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-white/20 shadow-2xl overflow-hidden">
                    <div 
                      ref={remoteVideoRef}
                      className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center"
                    >
                      <div className="text-white text-center">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Users className="w-8 h-8 text-blue-400" />
                        </div>
                        <p className="text-sm font-medium mb-1">상대방</p>
                        <p className="text-xs text-gray-400">연결 대기 중...</p>
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium border border-white/20">
                      상대방
                    </div>
                  </div>

                  {/* 메인 메시지 */}
                  <div className="text-white text-center max-w-md">
                    <div className="w-32 h-32 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-red-500/30">
                      <VideoOff className="w-16 h-16 text-red-400" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">카메라가 꺼져있습니다</h2>
                    <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                      카메라를 켜서 상대방과 소통하세요
                    </p>
                    <Button
                      onClick={toggleVideo}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Video className="w-6 h-6 mr-2" />
                      카메라 켜기
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 컨트롤 버튼 */}
          <div className="flex items-center justify-center gap-4 lg:gap-6 p-6 lg:p-8 border-t border-white/20 bg-white/5">
            {!isJoined ? (
              <Button 
                onClick={handleJoinChannel}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-12 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Phone className="w-6 h-6 mr-3" />
                {isLoading ? '연결 중...' : '통화 시작'}
              </Button>
            ) : (
              <>
                <Button
                  onClick={toggleMute}
                  variant="ghost"
                  size="lg"
                  className={`w-16 h-16 rounded-full border-2 transition-all duration-300 ${
                    isMuted 
                      ? 'bg-gray-500/20 border-gray-500 text-gray-400 hover:bg-gray-500/30' 
                      : 'bg-green-500/20 border-green-500 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </Button>
                
                <Button
                  onClick={toggleVideo}
                  variant="ghost"
                  size="lg"
                  className={`w-16 h-16 rounded-full border-2 transition-all duration-300 ${
                    !isVideoEnabled 
                      ? 'bg-gray-500/20 border-gray-500 text-gray-400 hover:bg-gray-500/30' 
                      : 'bg-green-500/20 border-green-500 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {!isVideoEnabled ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </Button>
              </>
            )}
          </div>
          

        </div>
      </Card>
    </div>
  )
}
