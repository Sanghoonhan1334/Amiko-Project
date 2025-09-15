// 미디어 디바이스 접근을 위한 안전한 헬퍼 함수들

export interface MediaDeviceInfo {
  deviceId: string
  label: string
  kind: MediaDeviceKind
}

/**
 * 안전하게 미디어 디바이스를 열거합니다
 */
export const safeEnumerateDevices = async (): Promise<MediaDeviceInfo[]> => {
  try {
    // 브라우저 환경 확인
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      console.warn('미디어 디바이스 API가 지원되지 않습니다.')
      return []
    }

    // enumerateDevices 함수 존재 확인
    if (typeof navigator.mediaDevices.enumerateDevices !== 'function') {
      console.warn('enumerateDevices 함수가 지원되지 않습니다.')
      return []
    }

    // HTTPS 또는 localhost 확인
    const isSecureContext = window.isSecureContext || 
                           location.hostname === 'localhost' || 
                           location.hostname === '127.0.0.1'
    
    if (!isSecureContext) {
      console.warn('보안 컨텍스트가 아닙니다. HTTPS 또는 localhost를 사용하세요.')
      return []
    }

    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.map(device => ({
      deviceId: device.deviceId,
      label: device.label || `Unknown ${device.kind}`,
      kind: device.kind
    }))
  } catch (error) {
    console.error('미디어 디바이스 열거 실패:', error)
    return []
  }
}

/**
 * 카메라 디바이스만 필터링합니다
 */
export const getVideoDevices = async (): Promise<MediaDeviceInfo[]> => {
  const devices = await safeEnumerateDevices()
  return devices.filter(device => device.kind === 'videoinput')
}

/**
 * 마이크 디바이스만 필터링합니다
 */
export const getAudioDevices = async (): Promise<MediaDeviceInfo[]> => {
  const devices = await safeEnumerateDevices()
  return devices.filter(device => device.kind === 'audioinput')
}

/**
 * 미디어 디바이스 접근 권한을 확인합니다
 */
export const checkMediaPermissions = async (): Promise<{
  camera: PermissionState | 'unknown'
  microphone: PermissionState | 'unknown'
}> => {
  try {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      return { camera: 'unknown', microphone: 'unknown' }
    }

    const [cameraPermission, microphonePermission] = await Promise.allSettled([
      navigator.permissions.query({ name: 'camera' as PermissionName }),
      navigator.permissions.query({ name: 'microphone' as PermissionName })
    ])

    return {
      camera: cameraPermission.status === 'fulfilled' ? cameraPermission.value.state : 'unknown',
      microphone: microphonePermission.status === 'fulfilled' ? microphonePermission.value.state : 'unknown'
    }
  } catch (error) {
    console.error('미디어 권한 확인 실패:', error)
    return { camera: 'unknown', microphone: 'unknown' }
  }
}

/**
 * 미디어 스트림을 안전하게 생성합니다
 */
export const createMediaStream = async (constraints: MediaStreamConstraints = {}): Promise<MediaStream | null> => {
  try {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('getUserMedia가 지원되지 않습니다.')
      return null
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    return stream
  } catch (error) {
    console.error('미디어 스트림 생성 실패:', error)
    return null
  }
}

/**
 * 개발 환경에서 미디어 디바이스 문제를 진단합니다
 */
export const diagnoseMediaDevices = async (): Promise<{
  isSecureContext: boolean
  hasMediaDevices: boolean
  hasEnumerateDevices: boolean
  hasGetUserMedia: boolean
  deviceCount: number
  permissions: { camera: PermissionState | 'unknown', microphone: PermissionState | 'unknown' }
}> => {
  const isSecureContext = typeof window !== 'undefined' && window.isSecureContext
  const hasMediaDevices = typeof navigator !== 'undefined' && !!navigator.mediaDevices
  const hasEnumerateDevices = hasMediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function'
  const hasGetUserMedia = hasMediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function'
  
  const devices = await safeEnumerateDevices()
  const permissions = await checkMediaPermissions()

  return {
    isSecureContext,
    hasMediaDevices,
    hasEnumerateDevices,
    hasGetUserMedia,
    deviceCount: devices.length,
    permissions
  }
}
