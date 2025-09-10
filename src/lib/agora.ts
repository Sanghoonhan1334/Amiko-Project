import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng'

// 환경변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Agora 클라이언트 인스턴스
let agoraClient: IAgoraRTCClient | null = null

// Agora 클라이언트 초기화
export const initializeAgoraClient = () => {
  // 서버사이드 렌더링 체크
  if (typeof window === 'undefined') {
    return null
  }
  
  if (!agoraClient) {
    agoraClient = AgoraRTC.createClient({ 
      mode: 'rtc', 
      codec: 'vp8'
    })
    
    // 경고 메시지 필터링
    agoraClient.on('exception', (event) => {
      // 비트레이트 관련 경고는 무시
      if (event.code === 2003) {
        console.log('오디오 비트레이트 경고 (정상적인 현상)')
        return
      }
      console.warn('Agora 경고:', event)
    })
  }
  return agoraClient
}

// 토큰 생성 (서버 사이드에서 실행)
export const generateToken = async (channelName: string, uid: string) => {
  try {
    const response = await fetch('/api/agora/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channelName,
        uid,
      }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate token')
    }
    
    const { token } = await response.json()
    return token
  } catch (error) {
    console.error('Token generation failed:', error)
    throw error
  }
}

// 채널 참여
export const joinChannel = async (
  client: IAgoraRTCClient,
  appId: string,
  channelName: string,
  token: string,
  uid: string
) => {
  try {
    // 이미 연결된 상태인지 확인
    if (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
      console.log('Client already connected or connecting, skipping join')
      return true
    }
    
    await client.join(appId, channelName, token, uid)
    console.log('Successfully joined channel:', channelName)
    return true
  } catch (error) {
    console.error('Failed to join channel:', error)
    throw error
  }
}

// 로컬 비디오/오디오 트랙 생성
export const createLocalTracks = async () => {
  try {
    // 브라우저 환경이 아니면 에러
    if (typeof window === 'undefined') {
      throw new Error('SSR 환경에서는 카메라를 사용할 수 없습니다.')
    }
    
    // 실제 카메라 사용
    console.log('[AGORA] Creating real camera tracks...')
    
    // 사용 가능한 카메라 목록 확인
    const devices = await AgoraRTC.getCameras()
    console.log('사용 가능한 카메라:', devices.map(d => d.label))
    
    // 사용 가능한 마이크 목록 확인
    const mics = await AgoraRTC.getMicrophones()
    console.log('사용 가능한 마이크:', mics.map(m => m.label))
    
    const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
    
    // 초기 상태를 비활성화로 설정
    audioTrack.setEnabled(false)
    videoTrack.setEnabled(false)
    
    console.log('[AGORA] Real camera tracks created successfully (disabled)')
    return { audioTrack, videoTrack }
  } catch (error) {
    console.error('[AGORA] Failed to create camera tracks:', error)
    throw error
  }
}

// 채널 나가기
export const leaveChannel = async (client: IAgoraRTCClient) => {
  try {
    await client.leave()
    console.log('Successfully left channel')
  } catch (error) {
    console.error('Failed to leave channel:', error)
  }
}

// 클라이언트 정리
export const cleanupAgoraClient = () => {
  if (agoraClient) {
    agoraClient.leave()
    agoraClient = null
  }
}
