// YouTube Data API v3 연동

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
const AMIKO_CHANNEL_HANDLE = '@AMIKO_Officialstudio'
// 채널 ID는 동적으로 가져오거나 검색어로 대체

export interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  duration: string
  publishedAt: string
  viewCount?: string
  url: string
}

/**
 * YouTube 영상 길이를 "MM:SS" 형식으로 변환
 * ISO 8601 duration (예: PT3M29S) → "3:29"
 */
function formatDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  
  if (!match) return '0:00'
  
  const hours = (match[1] || '').replace('H', '')
  const minutes = (match[2] || '').replace('M', '')
  const seconds = (match[3] || '').replace('S', '')
  
  let result = ''
  
  if (hours) {
    result += `${hours}:`
    result += minutes.padStart(2, '0') + ':'
  } else {
    result += `${minutes || '0'}:`
  }
  
  result += seconds.padStart(2, '0')
  
  return result
}

/**
 * AMIKO 채널의 최근 영상 가져오기
 */
export async function getAmikoRecentVideos(maxResults: number = 6): Promise<YouTubeVideo[]> {
  // API 키가 없으면 빈 배열 반환 (프로덕션에서는 에러 표시)
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API 키가 설정되지 않았습니다.')
    return []
  }

  try {
    // 1단계: 채널 ID 먼저 찾기
    console.log('🔍 AMIKO 채널 검색 시작...')
    const channelSearchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    channelSearchUrl.searchParams.set('key', YOUTUBE_API_KEY)
    channelSearchUrl.searchParams.set('q', 'AMIKO Official')  // 채널명으로 검색
    channelSearchUrl.searchParams.set('type', 'channel')
    channelSearchUrl.searchParams.set('part', 'snippet')
    channelSearchUrl.searchParams.set('maxResults', '1')

    const channelResponse = await fetch(channelSearchUrl.toString())
    if (!channelResponse.ok) {
      throw new Error(`채널 검색 실패: ${channelResponse.status}`)
    }

    const channelData = await channelResponse.json()
    console.log('📺 채널 검색 결과:', channelData)

    if (!channelData.items || channelData.items.length === 0) {
      console.error('⚠️ AMIKO 채널을 찾을 수 없습니다.')
      return []
    }

    const channelId = channelData.items[0].snippet.channelId
    console.log('✅ 채널 ID 찾음:', channelId)

    // 2단계: 채널의 최근 업로드 영상 검색
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    searchUrl.searchParams.set('key', YOUTUBE_API_KEY)
    searchUrl.searchParams.set('channelId', channelId)
    searchUrl.searchParams.set('part', 'snippet')
    searchUrl.searchParams.set('order', 'date')
    searchUrl.searchParams.set('type', 'video')
    searchUrl.searchParams.set('maxResults', maxResults.toString())

    console.log('🔍 YouTube API 요청 URL:', searchUrl.toString())
    const searchResponse = await fetch(searchUrl.toString())
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error('YouTube API 오류 응답:', errorText)
      throw new Error(`YouTube API 오류: ${searchResponse.status}`)
    }

    const searchData = await searchResponse.json()
    console.log('📺 YouTube API 응답:', searchData)
    console.log('📺 검색된 영상 개수:', searchData.items?.length || 0)
    
    if (!searchData.items || searchData.items.length === 0) {
      console.log('⚠️ AMIKO 채널에 영상이 없습니다.')
      console.log('📺 전체 응답 데이터:', JSON.stringify(searchData, null, 2))
      return []
    }

    // 3단계: 영상 상세 정보 가져오기 (duration 포함)
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')
    console.log('🎬 영상 ID들:', videoIds)
    
    const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    videosUrl.searchParams.set('key', YOUTUBE_API_KEY)
    videosUrl.searchParams.set('id', videoIds)
    videosUrl.searchParams.set('part', 'contentDetails,statistics')

    const videosResponse = await fetch(videosUrl.toString())
    
    if (!videosResponse.ok) {
      throw new Error(`YouTube Video API 오류: ${videosResponse.status}`)
    }

    const videosData = await videosResponse.json()
    console.log('📊 영상 상세 정보:', videosData)
    
    // 4단계: 데이터 병합
    const videos: YouTubeVideo[] = searchData.items.map((item: any, index: number) => {
      const videoDetails = videosData.items?.[index]
      const videoId = item.id.videoId
      
      return {
        id: videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        duration: videoDetails ? formatDuration(videoDetails.contentDetails.duration) : '0:00',
        publishedAt: item.snippet.publishedAt,
        viewCount: videoDetails?.statistics?.viewCount,
        url: `https://www.youtube.com/watch?v=${videoId}`
      }
    })

    console.log('✅ 최종 영상 목록:', videos.length, '개')
    console.log('🎬 영상들:', videos)
    return videos
  } catch (error) {
    console.error('YouTube API 호출 실패:', error)
    return []
  }
}

/**
 * 채널 ID를 handle(@username)로 가져오기
 * 참고: 이 함수는 필요 시 사용
 */
export async function getChannelIdByHandle(handle: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API 키가 설정되지 않았습니다.')
    return null
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.searchParams.set('key', YOUTUBE_API_KEY)
    url.searchParams.set('q', handle)
    url.searchParams.set('type', 'channel')
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('maxResults', '1')

    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`YouTube API 오류: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.items && data.items.length > 0) {
      return data.items[0].id.channelId || data.items[0].snippet.channelId
    }

    return null
  } catch (error) {
    console.error('채널 ID 조회 실패:', error)
    return null
  }
}

