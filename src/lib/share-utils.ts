/**
 * 공유 기능 유틸리티
 * 앱이 설치되어 있으면 앱으로, 아니면 웹으로 연결
 */

interface ShareOptions {
  title: string
  text?: string
  url: string
  deepLink?: string // 앱 deep link
}

/**
 * 디바이스가 모바일인지 확인
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/**
 * iOS 디바이스인지 확인
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/**
 * Android 디바이스인지 확인
 */
export function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return /Android/i.test(navigator.userAgent)
}

/**
 * 앱이 설치되어 있는지 확인
 * 
 * @param deepLink 앱 deep link URL
 * @returns Promise<boolean> 앱 설치 여부
 */
export async function checkAppInstalled(deepLink: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  return new Promise((resolve) => {
    const startTime = Date.now()
    const timeout = 1000 // 1초 타임아웃
    
    // hidden iframe으로 앱 실행 시도
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = deepLink
    
    iframe.onload = () => {
      // 빠르게 로드되면 앱이 없음 (웹 페이지로 리다이렉트)
      if (Date.now() - startTime < timeout) {
        resolve(false)
      }
    }
    
    iframe.onerror = () => {
      resolve(false)
    }
    
    document.body.appendChild(iframe)
    
    // 타임아웃 후 iframe 제거
    setTimeout(() => {
      document.body.removeChild(iframe)
      // 타임아웃이 지나도 실패 처리 없으면 앱이 설치되어 있는 것으로 간주
      if (Date.now() - startTime >= timeout) {
        resolve(true)
      }
    }, timeout)
  })
}

/**
 * 공유 기능 실행
 * 1. 앱이 설치되어 있으면 앱으로 연결
 * 2. 모바일이지만 앱이 없으면 웹으로 연결
 * 3. 네이티브 공유 API가 있으면 사용
 * 4. 그 외에는 클립보드에 복사
 * 
 * @param options 공유 옵션
 */
export async function shareContent(options: ShareOptions): Promise<void> {
  const { title, text, url, deepLink } = options
  
  // 네이티브 공유 API가 있으면 우선 사용
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text: text || title,
        url: deepLink || url
      })
      return
    } catch (error) {
      // 사용자가 공유를 취소한 경우
      if ((error as Error).name === 'AbortError') {
        return
      }
      console.log('Native share failed, trying alternative method:', error)
    }
  }
  
  // 모바일 디바이스에서 앱 deep link가 있으면 시도
  if (isMobileDevice() && deepLink) {
    // 앱 설치 여부 확인 시도
    const appInstalled = await checkAppInstalled(deepLink)
    
    if (appInstalled) {
      // 앱으로 연결
      window.location.href = deepLink
      return
    } else {
      // 앱이 없으면 웹으로 연결
      window.location.href = url
      return
    }
  }
  
  // 클립보드에 복사
  try {
    await navigator.clipboard.writeText(deepLink || url)
    
    // 토스트 메시지 표시 (이미 toast가 있는 경우)
    if (typeof window !== 'undefined' && (window as any).toast) {
      ;(window as any).toast.success('링크가 클립보드에 복사되었습니다!')
    } else {
      alert('링크가 클립보드에 복사되었습니다!')
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    alert('링크 복사에 실패했습니다. URL: ' + (deepLink || url))
  }
}

/**
 * 커뮤니티 게시물 공유
 * 
 * @param postId 게시물 ID
 * @param title 게시물 제목
 * @param text 게시물 내용 (선택)
 */
export async function shareCommunityPost(
  postId: string,
  title: string,
  text?: string
): Promise<void> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const webUrl = `${baseUrl}/community/post/${postId}`
  
  // 앱 deep link (실제 앱 URL scheme으로 변경 필요)
  const deepLink = `amiko://community/post/${postId}`
  
  await shareContent({
    title: `${title} - Amiko`,
    text: text || title,
    url: webUrl,
    deepLink
  })
}

/**
 * 아이돌 메모 공유
 * 
 * @param postId 게시물 ID
 * @param title 게시물 제목
 */
export async function shareIdolMeme(
  postId: string,
  title: string
): Promise<void> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const webUrl = `${baseUrl}/community/idol-photos/${postId}`
  
  // 앱 deep link
  const deepLink = `amiko://community/idol-photos/${postId}`
  
  await shareContent({
    title: `Fotos de Ídolos - ${title}`,
    text: `¡Mira esta foto de ${title} en Fotos de Ídolos!`,
    url: webUrl,
    deepLink
  })
}

/**
 * 스토리 공유
 * 
 * @param storyId 스토리 ID
 * @param title 스토리 제목
 */
export async function shareStory(
  storyId: string,
  title: string
): Promise<void> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const webUrl = `${baseUrl}/community/stories/${storyId}`
  
  // 앱 deep link
  const deepLink = `amiko://community/stories/${storyId}`
  
  await shareContent({
    title: `${title} - Amiko Stories`,
    text: title,
    url: webUrl,
    deepLink
  })
}

/**
 * 퀴즈 결과 공유
 * 
 * @param quizId 퀴즈 ID
 * @param resultTitle 결과 제목
 * @param resultText 결과 내용
 */
export async function shareQuizResult(
  quizId: string,
  resultTitle: string,
  resultText: string
): Promise<void> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const webUrl = `${baseUrl}/quiz/${quizId}/result`
  
  // 앱 deep link
  const deepLink = `amiko://quiz/${quizId}/result`
  
  await shareContent({
    title: resultTitle,
    text: resultText,
    url: webUrl,
    deepLink
  })
}

