'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import { Play, Pause, Music, Edit2, Volume2, VolumeX, Heart, MessageCircle, Eye } from 'lucide-react'
import DancePlaylistEditModal from './DancePlaylistEditModal'

interface DanceSong {
  id: string
  song_title: string
  artist_name: string
  youtube_video_id?: string
  display_order: number
}

interface DancePlaylist {
  id: string
  week_number: number
  week_label: string
  songs: DanceSong[]
}

interface DanceVideo {
  id: string
  user_id: string
  video_url: string
  thumbnail_url?: string
  title?: string
  like_count?: number
  comment_count?: number
  view_count?: number
  is_guide?: boolean // 가이드 영상 여부 (운영자 영상)
  user_display_name?: string // 업로드한 사용자 이름
  user_avatar_url?: string | null // 업로드한 사용자 프로필 사진
}

interface RandomPlayDanceSectionProps {
  playlist: DancePlaylist | null
  videos: DanceVideo[]
  loading: boolean
  onPlaylistUpdate?: () => void
  hideTitle?: boolean // 제목 섹션 숨기기 (댄스 탭에서 사용)
  hideCTA?: boolean // CTA 박스와 Participar 버튼 숨기기 (댄스 탭에서 사용)
  hideVideoGrid?: boolean // 비디오 그리드 숨기기 (댄스 탭에서 사용)
  hideCard?: boolean // Card 박스 숨기기 (댄스 탭에서 사용)
  hideRibbon?: boolean // 리본 숨기기 (댄스 탭에서 사용)
}

export default function RandomPlayDanceSection({
  playlist,
  videos,
  loading,
  onPlaylistUpdate,
  hideTitle = false,
  hideCTA = false,
  hideVideoGrid = false,
  hideCard = false,
  hideRibbon = false
}: RandomPlayDanceSectionProps) {
  const router = useRouter()
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set())
  const [videoCounts, setVideoCounts] = useState<Record<string, { likes: number; comments: number; views: number }>>({})
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null)
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0) // 0-100 사이의 진행도
  const [volume, setVolume] = useState(100) // 0-100 사이의 볼륨
  const [isMuted, setIsMuted] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [currentTime, setCurrentTime] = useState(0) // 현재 재생 시간 (초)
  const [duration, setDuration] = useState(0) // 전체 영상 길이 (초)
  const [isShuffle, setIsShuffle] = useState(false) // 셔플 모드
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none') // 반복 모드
  const shuffledIndicesRef = useRef<number[]>([]) // 셔플된 인덱스 배열
  const iframeRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({})
  const playerRefs = useRef<{ [key: string]: any }>({})
  const youtubeApiLoaded = useRef(false)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isClosingRef = useRef(false) // 아코디언이 닫히는 중인지 추적
  const isDraggingVolumeRef = useRef(false) // 볼륨 드래그 중인지 추적
  const songVolumesRef = useRef<{ [key: string]: number }>({}) // 각 노래별 볼륨 저장
  const songMutedRef = useRef<{ [key: string]: boolean }>({}) // 각 노래별 음소거 상태 저장
  const songPlaybackPositionsRef = useRef<{ [key: string]: number }>({}) // 각 노래별 재생 위치 저장 (초)
  
  // 리본 위치 드래그 조정 (모바일/데스크톱 분리)
  const [ribbonPosition, setRibbonPosition] = useState(() => {
    // localStorage에서 저장된 위치 불러오기 (모바일/데스크톱 구분)
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768
      const storageKey = isMobile ? 'danceRibbonPositionMobile' : 'danceRibbonPosition'
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const position = {
            top: parsed.top !== undefined ? parsed.top : -1,
            left: parsed.left !== undefined ? parsed.left : -1
          }
          console.log(`리본 위치 불러옴 (${isMobile ? '모바일' : '데스크톱'}):`, position, '원본 저장값:', parsed)
          return position
        } catch (e) {
          console.error('리본 위치 파싱 오류:', e)
          return { top: -1, left: -1 }
        }
      }
      // 데스크톱 기본값 설정
      if (!isMobile) {
        return { top: 113, left: -41 }
      }
      // 모바일 기본값 설정
      if (isMobile) {
        return { top: 81, left: -35 }
      }
      console.log(`저장된 리본 위치 없음 (${isMobile ? '모바일' : '데스크톱'}), 기본값 사용`)
    }
    return { top: -1, left: -1 }
  })

  // YouTube IFrame Player API 로드
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 이미 로드되어 있는지 확인
    if (window.YT && window.YT.Player) {
      youtubeApiLoaded.current = true
      return
    }

    // onYouTubeIframeAPIReady 콜백 설정
    window.onYouTubeIframeAPIReady = () => {
      youtubeApiLoaded.current = true
    }

    // 스크립트 태그가 이미 있는지 확인
    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]')
    if (existingScript) {
      // 스크립트가 있으면 로드 대기
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          youtubeApiLoaded.current = true
          clearInterval(checkInterval)
        }
      }, 100)

      return () => clearInterval(checkInterval)
    }

    // YouTube IFrame Player API 스크립트 로드
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.async = true
    const firstScriptTag = document.getElementsByTagName('script')[0]
    if (firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    }

    // API 로드 완료 대기
    const checkInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        youtubeApiLoaded.current = true
        clearInterval(checkInterval)
      }
    }, 100)

    return () => {
      clearInterval(checkInterval)
      window.onYouTubeIframeAPIReady = undefined
    }
  }, [])

  // 관리자 권한 확인
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.id && !user?.email) {
        setIsAdmin(false)
        setCheckingAdmin(false)
        return
      }

      try {
        const params = new URLSearchParams()
        if (user?.id) params.append('userId', user.id)
        if (user?.email) params.append('email', user.email)
        
        const response = await fetch(`/api/admin/check?${params.toString()}`)
        
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAdmin || false)
        }
      } catch (error) {
        console.error('관리자 권한 확인 실패:', error)
        setIsAdmin(false)
      } finally {
        setCheckingAdmin(false)
      }
    }

    checkAdmin()
  }, [user])

  const handlePlaylistUpdate = () => {
    if (onPlaylistUpdate) {
      onPlaylistUpdate()
    }
    setIsEditModalOpen(false)
  }

  // 비디오 좋아요 처리
  const handleVideoLike = async (videoId: string, isCurrentlyLiked: boolean) => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    // Optimistic UI 업데이트
    setLikedVideos(prev => {
      const newSet = new Set(prev)
      if (isCurrentlyLiked) {
        newSet.delete(videoId)
      } else {
        newSet.add(videoId)
      }
      return newSet
    })

    setVideoCounts(prev => {
      const current = prev[videoId] || { likes: 0, comments: 0, views: 0 }
      return {
        ...prev,
        [videoId]: {
          ...current,
          likes: Math.max(0, current.likes + (isCurrentlyLiked ? -1 : 1))
        }
      }
    })

    try {
      const method = isCurrentlyLiked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/dance/videos/${videoId}/like`, {
        method
      })

      if (!response.ok) {
        throw new Error('좋아요 처리 실패')
      }

      const data = await response.json()
      
      // 서버 응답으로 최종 동기화
      if (data.like_count !== undefined) {
        setVideoCounts(prev => ({
          ...prev,
          [videoId]: {
            ...(prev[videoId] || { likes: 0, comments: 0, views: 0 }),
            likes: data.like_count
          }
        }))
      }
    } catch (error) {
      console.error('[RandomPlayDanceSection] 좋아요 처리 오류:', error)
      // 롤백
      setLikedVideos(prev => {
        const newSet = new Set(prev)
        if (isCurrentlyLiked) {
          newSet.add(videoId)
        } else {
          newSet.delete(videoId)
        }
        return newSet
      })
      setVideoCounts(prev => {
        const current = prev[videoId] || { likes: 0, comments: 0, views: 0 }
        return {
          ...prev,
          [videoId]: {
            ...current,
            likes: Math.max(0, current.likes + (isCurrentlyLiked ? 1 : -1))
          }
        }
      })
    }
  }

  // 비디오 데이터 초기화 (videos prop 변경 시)
  useEffect(() => {
    if (videos && videos.length > 0) {
      // 카운터 초기화
      const initialCounts: Record<string, { likes: number; comments: number; views: number }> = {}
      videos.forEach(video => {
        initialCounts[video.id] = {
          likes: video.like_count || 0,
          comments: video.comment_count || 0,
          views: video.view_count || 0
        }
      })
      setVideoCounts(initialCounts)

      // 좋아요 상태 로드 (사용자가 로그인한 경우)
      if (user?.id) {
        // TODO: 사용자가 좋아요한 비디오 목록 가져오기
        // 현재는 빈 Set으로 시작
        setLikedVideos(new Set())
      }
    }
  }, [videos, user])

  // 현재 플레이리스트의 노래 목록
  const songs = playlist?.songs || []

  // 이전 곡 재생
  const handlePreviousSong = () => {
    if (!playlist || songs.length === 0) return
    
    // 현재 곡이 있다면 플레이어 정리
    if (expandedSongId) {
      const currentSong = songs.find(s => s.id === expandedSongId)
      if (currentSong && playerRefs.current[currentSong.id]) {
        try {
          playerRefs.current[currentSong.id].destroy()
        } catch (e) {
          // 무시
        }
        delete playerRefs.current[currentSong.id]
      }
    }
    
    let prevIndex: number
    
    if (isShuffle && shuffledIndicesRef.current.length > 0) {
      // 셔플 모드: 셔플된 인덱스에서 이전 곡 찾기
      const currentShuffledIndex = shuffledIndicesRef.current.findIndex(
        idx => idx === currentPlayingIndex
      )
      if (currentShuffledIndex > 0) {
        prevIndex = shuffledIndicesRef.current[currentShuffledIndex - 1]
      } else {
        // 셔플된 리스트의 처음이면 마지막 곡으로
        prevIndex = shuffledIndicesRef.current[shuffledIndicesRef.current.length - 1]
      }
    } else {
      // 일반 모드
      const currentIndex = currentPlayingIndex !== null ? currentPlayingIndex : 0
      if (repeatMode === 'all') {
        // 전체 반복: 첫 곡이면 마지막 곡으로
        prevIndex = currentIndex > 0 ? currentIndex - 1 : songs.length - 1
      } else {
        // 반복 없음: 첫 곡이면 종료
        if (currentIndex === 0) {
          return // 재생 종료
        }
        prevIndex = currentIndex - 1
      }
    }
    
    const prevSong = songs[prevIndex]
    
    if (prevSong?.youtube_video_id) {
      isClosingRef.current = false // 이전 곡 재생 시 플래그 리셋
      setExpandedSongId(prevSong.id)
      setCurrentPlayingIndex(prevIndex)
      setIsPlaying(true)
      setProgress(0)
    }
  }

  // 재생/일시정지 토글
  const handlePlayPause = () => {
    if (!playlist || songs.length === 0) return
    
    if (currentPlayingIndex === null) {
      // 아무것도 재생 중이 아니면 첫 곡 재생
      let firstIndex = 0
      if (isShuffle) {
        // 셔플 모드: 셔플된 인덱스가 없으면 생성
        if (shuffledIndicesRef.current.length === 0) {
          generateShuffledIndices()
        }
        firstIndex = shuffledIndicesRef.current[0]
      }
      const firstSong = songs[firstIndex]
      if (firstSong?.youtube_video_id) {
        setExpandedSongId(firstSong.id)
        setCurrentPlayingIndex(firstIndex)
        setIsPlaying(true)
      }
    } else {
      // 현재 재생 중인 곡 일시정지/재생
      const currentSong = songs[currentPlayingIndex]
      if (currentSong?.youtube_video_id) {
        const player = playerRefs.current[currentSong.id]
        if (player) {
          // YouTube Player API 사용
          try {
            if (isPlaying) {
              player.pauseVideo()
              setIsPlaying(false)
            } else {
              // 재생 시 플레이어 상태 확인 및 강제 재생
              try {
                const playerState = player.getPlayerState()
                console.log('[RandomPlayDance] 재생 버튼 클릭, 플레이어 상태:', playerState)
                
                // 플레이어가 준비되지 않았거나 오류 상태면 재생성 시도
                if (playerState === -1 || playerState === 5) {
                  console.log('[RandomPlayDance] 플레이어가 준비되지 않음, 재생성 시도')
                  // 플레이어 재생성
                  setExpandedSongId(null)
                  setTimeout(() => {
                    setExpandedSongId(currentSong.id)
                    setCurrentPlayingIndex(currentPlayingIndex)
                    setIsPlaying(true)
                  }, 200)
                  return
                }
                
                // 저장된 재생 위치 확인
                const savedPosition = songPlaybackPositionsRef.current[currentSong.id]
                if (savedPosition && savedPosition > 0) {
                  console.log('[RandomPlayDance] 저장된 위치로 이동:', savedPosition)
                  player.seekTo(savedPosition, true)
                }
                
                // 플레이어 상태에 관계없이 재생 시도
                player.playVideo()
                setIsPlaying(true)
                
                // 상태 확인 및 재시도
                setTimeout(() => {
                  try {
                    const newState = player.getPlayerState()
                    console.log('[RandomPlayDance] 재생 후 상태 확인:', newState)
                    if (newState === 1) {
                      // 재생 중
                      setIsPlaying(true)
                    } else if (newState === 2) {
                      // 여전히 일시정지 상태면 다시 시도
                      console.log('[RandomPlayDance] 여전히 일시정지 상태, 재시도')
                      player.playVideo()
                      setTimeout(() => setIsPlaying(true), 100)
                    } else if (newState === -1 || newState === 5) {
                      // 플레이어 오류, postMessage로 재시도
                      const iframe = iframeRefs.current[currentSong.id]
                      if (iframe?.contentWindow) {
                        iframe.contentWindow.postMessage(
                          JSON.stringify({
                            event: 'command',
                            func: 'playVideo',
                            args: []
                          }),
                          'https://www.youtube.com'
                        )
                        setIsPlaying(true)
                      }
                    }
                  } catch (stateError) {
                    console.error('[RandomPlayDance] 상태 확인 실패:', stateError)
                  }
                }, 200)
              } catch (playError) {
                console.error('[RandomPlayDance] playVideo 호출 실패:', playError)
                // postMessage로 재시도
                const iframe = iframeRefs.current[currentSong.id]
                if (iframe?.contentWindow) {
                  iframe.contentWindow.postMessage(
                    JSON.stringify({
                      event: 'command',
                      func: 'playVideo',
                      args: []
                    }),
                    'https://www.youtube.com'
                  )
                  setIsPlaying(true)
                } else {
                  // iframe도 없으면 플레이어 재생성
                  console.log('[RandomPlayDance] iframe도 없음, 플레이어 재생성')
                  setExpandedSongId(null)
                  setTimeout(() => {
                    setExpandedSongId(currentSong.id)
                    setCurrentPlayingIndex(currentPlayingIndex)
                    setIsPlaying(true)
                  }, 200)
                }
              }
            }
          } catch (error) {
            console.error('[RandomPlayDance] 재생/일시정지 실패:', error)
            // 오류 발생 시 postMessage로 재시도
            const iframe = iframeRefs.current[currentSong.id]
            if (iframe?.contentWindow) {
              iframe.contentWindow.postMessage(
                JSON.stringify({
                  event: 'command',
                  func: isPlaying ? 'pauseVideo' : 'playVideo',
                  args: []
                }),
                'https://www.youtube.com'
              )
              setIsPlaying(!isPlaying)
            }
          }
        } else {
          // Player API가 아직 로드되지 않았으면 postMessage 사용
          const iframe = iframeRefs.current[currentSong.id]
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(
              JSON.stringify({
                event: 'command',
                func: isPlaying ? 'pauseVideo' : 'playVideo',
                args: []
              }),
              'https://www.youtube.com'
            )
            setIsPlaying(!isPlaying)
          } else {
            // iframe도 없으면 곡 다시 열기 (플레이어 재생성)
            console.log('[RandomPlayDance] 플레이어와 iframe이 없음, 곡 다시 열기')
            // 현재 expandedSongId를 null로 설정했다가 다시 설정하여 플레이어 재생성
            setExpandedSongId(null)
            setTimeout(() => {
              setExpandedSongId(currentSong.id)
              setCurrentPlayingIndex(currentPlayingIndex)
              setIsPlaying(true)
            }, 100)
          }
        }
      }
    }
  }

  // 셔플 인덱스 생성
  const generateShuffledIndices = () => {
    const indices = Array.from({ length: songs.length }, (_, i) => i)
    // Fisher-Yates 셔플 알고리즘
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]]
    }
    shuffledIndicesRef.current = indices
  }

  // 셔플 모드 토글
  const handleShuffle = () => {
    setIsShuffle(!isShuffle)
    if (!isShuffle) {
      // 셔플 활성화 시 셔플된 인덱스 생성
      generateShuffledIndices()
    }
  }

  // 반복 모드 토글
  const handleRepeat = () => {
    if (repeatMode === 'none') {
      setRepeatMode('all')
    } else if (repeatMode === 'all') {
      setRepeatMode('one')
    } else {
      setRepeatMode('none')
    }
  }

  // 다음 곡 재생
  const handleNextSong = () => {
    if (!playlist || songs.length === 0) return
    
    // 현재 곡이 있다면 플레이어 정리
    if (expandedSongId) {
      const currentSong = songs.find(s => s.id === expandedSongId)
      if (currentSong && playerRefs.current[currentSong.id]) {
        try {
          playerRefs.current[currentSong.id].destroy()
        } catch (e) {
          // 무시
        }
        delete playerRefs.current[currentSong.id]
      }
    }
    
    let nextIndex: number
    
    if (isShuffle && shuffledIndicesRef.current.length > 0) {
      // 셔플 모드: 셔플된 인덱스에서 다음 곡 찾기
      const currentShuffledIndex = shuffledIndicesRef.current.findIndex(
        idx => idx === currentPlayingIndex
      )
      if (currentShuffledIndex !== -1 && currentShuffledIndex < shuffledIndicesRef.current.length - 1) {
        nextIndex = shuffledIndicesRef.current[currentShuffledIndex + 1]
      } else {
        // 셔플된 리스트의 끝에 도달하면 다시 셔플
        generateShuffledIndices()
        nextIndex = shuffledIndicesRef.current[0]
      }
    } else {
      // 일반 모드
      const currentIndex = currentPlayingIndex !== null ? currentPlayingIndex : -1
      if (repeatMode === 'all') {
        // 전체 반복: 마지막 곡이면 첫 곡으로
        nextIndex = currentIndex < songs.length - 1 ? currentIndex + 1 : 0
      } else {
        // 반복 없음: 마지막 곡이면 종료
        if (currentIndex >= songs.length - 1) {
          return // 재생 종료
        }
        nextIndex = currentIndex + 1
      }
    }
    
    const nextSong = songs[nextIndex]
    
    if (nextSong?.youtube_video_id) {
      isClosingRef.current = false // 다음 곡 재생 시 플래그 리셋
      setExpandedSongId(nextSong.id)
      setCurrentPlayingIndex(nextIndex)
      setIsPlaying(true)
      setProgress(0)
    }
  }

  // 영상 종료 처리 함수
  const handleVideoEnd = (songId: string) => {
    // 이미 닫히는 중이면 무시
    if (isClosingRef.current) {
      console.log('[RandomPlayDance] 이미 닫히는 중, 중복 호출 무시')
      return
    }
    
    console.log('[RandomPlayDance] 영상 종료 처리 시작:', songId)
    isClosingRef.current = true
    
    // 진행도 interval 정리
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    
    // 진행도를 100%로 설정
    setProgress(100)
    
    // 반복 모드에 따라 처리
    if (repeatMode === 'one') {
      // 1곡 반복: 현재 곡 다시 재생
      setTimeout(() => {
        console.log('[RandomPlayDance] 1곡 반복 재생')
        isClosingRef.current = false
        setProgress(0)
        setCurrentTime(0)
        
        const currentSong = songs.find(s => s.id === songId)
        if (currentSong && playerRefs.current[songId]) {
          try {
            const player = playerRefs.current[songId]
            player.seekTo(0, true)
            player.playVideo()
            setIsPlaying(true)
          } catch (e) {
            console.error('[RandomPlayDance] 반복 재생 실패:', e)
            // 재생 실패 시 아코디언 닫기
            setExpandedSongId(null)
            setCurrentPlayingIndex(null)
            setIsPlaying(false)
            setProgress(0)
            setCurrentTime(0)
            setDuration(0)
            isClosingRef.current = false
          }
        }
      }, 500)
      return
    }
    
    // 반복 없음 또는 전체 반복: 다음 곡 재생 또는 종료
    setTimeout(() => {
      console.log('[RandomPlayDance] 아코디언 닫기 실행')
      
      // 다음 곡이 있으면 재생
      if (repeatMode === 'all' || (currentPlayingIndex !== null && currentPlayingIndex < songs.length - 1)) {
        handleNextSong()
        isClosingRef.current = false
        return
      }
      
      // 다음 곡이 없으면 종료
      setExpandedSongId(null)
      setCurrentPlayingIndex(null)
      setIsPlaying(false)
      setProgress(0)
      setCurrentTime(0)
      setDuration(0)
      
      // 플레이어 정리
      if (playerRefs.current[songId]) {
        try {
          playerRefs.current[songId].destroy()
          console.log('[RandomPlayDance] 플레이어 정리 완료')
        } catch (e) {
          console.error('[RandomPlayDance] 플레이어 정리 실패:', e)
        }
        delete playerRefs.current[songId]
      }
      
      // 닫기 플래그 리셋
      isClosingRef.current = false
      
      // 진행도 인터벌 정리
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }, 800) // 0.8초 딜레이로 자연스러운 전환
  }

  // 시간 포맷팅 함수 (초 -> MM:SS 또는 HH:MM:SS)
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // 진행 바 클릭 핸들러
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!expandedSongId) return

    const currentSong = songs.find(s => s.id === expandedSongId)
    if (!currentSong) return

    const player = playerRefs.current[currentSong.id]
    if (!player) return

    try {
      const progressBar = e.currentTarget
      const rect = progressBar.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const width = rect.width
      const percentage = clickX / width

      const duration = player.getDuration()
      if (duration && duration > 0) {
        const targetTime = duration * percentage
        player.seekTo(targetTime, true)
        setCurrentTime(targetTime)
        setProgress(percentage * 100)
        console.log('[RandomPlayDance] 진행 바 클릭:', { percentage, targetTime, duration })
      }
    } catch (error) {
      console.error('[RandomPlayDance] 진행 바 클릭 실패:', error)
    }
  }

  // 노래 변경 시 볼륨 저장 및 불러오기
  useEffect(() => {
    if (!expandedSongId) return

    const currentSong = songs.find(s => s.id === expandedSongId)
    if (!currentSong) return

    // 저장된 볼륨이 있으면 불러오기
    const savedVolume = songVolumesRef.current[currentSong.id]
    const savedMuted = songMutedRef.current[currentSong.id]
    
    if (savedVolume !== undefined) {
      setVolume(savedVolume)
      setIsMuted(savedMuted || false)
      
      // 플레이어가 이미 준비되어 있으면 즉시 적용
      const player = playerRefs.current[currentSong.id]
      if (player) {
        try {
          player.setVolume(savedVolume)
          if (savedMuted) {
            player.mute()
          } else {
            player.unMute()
          }
        } catch (e) {
          console.error('[RandomPlayDance] 저장된 볼륨 적용 실패:', e)
        }
      }
    } else {
      // 저장된 볼륨이 없으면 기본값 사용
      songVolumesRef.current[currentSong.id] = 100
      songMutedRef.current[currentSong.id] = false
    }
  }, [expandedSongId, songs])

  // 진행도 업데이트 (주기적으로 체크)
  useEffect(() => {
    if (!expandedSongId) {
      // 아코디언이 닫혀있으면 진행도 업데이트 중지
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      setProgress(0)
      return
    }

    const currentSong = songs.find(s => s.id === expandedSongId)
    if (!currentSong) return

    const player = playerRefs.current[currentSong.id]
    if (!player) {
      // 플레이어가 아직 준비되지 않았으면 잠시 후 재시도
      const checkPlayer = setTimeout(() => {
        const retryPlayer = playerRefs.current[currentSong.id]
        if (retryPlayer && !progressIntervalRef.current) {
          // 플레이어가 준비되었고 인터벌이 없으면 시작
          const updateProgress = () => {
            try {
              const playerState = retryPlayer.getPlayerState()
              if (playerState === 0) {
                handleVideoEnd(currentSong.id)
                return
              }
              const videoDuration = retryPlayer.getDuration()
              const videoCurrentTime = retryPlayer.getCurrentTime()
              if (videoDuration && videoDuration > 0 && !isNaN(videoCurrentTime) && videoCurrentTime >= 0) {
                setDuration(videoDuration)
                setCurrentTime(videoCurrentTime)
                const progressPercent = (videoCurrentTime / videoDuration) * 100
                setProgress(progressPercent)
              }
            } catch (e) {
              // 무시
            }
          }
          updateProgress()
          progressIntervalRef.current = setInterval(updateProgress, 100)
        }
      }, 300)
      return () => clearTimeout(checkPlayer)
    }

    // 이미 인터벌이 시작되었으면 (onReady에서 시작) 추가 작업 불필요
    if (progressIntervalRef.current) {
      return
    }

    // 진행도 업데이트 함수
    const updateProgress = () => {
      try {
        // 플레이어 상태 확인
        const playerState = player.getPlayerState()
        
        // ENDED (0) 상태이면 아코디언 닫기
        if (playerState === 0) {
          console.log('[RandomPlayDance] 영상 종료 감지 (상태 체크)')
          handleVideoEnd(currentSong.id)
          return
        }

        // duration과 currentTime 가져오기 (항상 시도)
        let videoDuration = 0
        let videoCurrentTime = 0
        
        try {
          videoDuration = player.getDuration()
          videoCurrentTime = player.getCurrentTime()
        } catch (e) {
          // getDuration이나 getCurrentTime이 실패할 수 있음 (초기 로딩 중)
          // 하지만 계속 시도해야 함
          console.log('[RandomPlayDance] 플레이어 정보 가져오기 대기 중...')
          return
        }
        
        // duration이 유효한 값이면 상태 업데이트
        if (videoDuration && videoDuration > 0 && !isNaN(videoDuration)) {
          setDuration(videoDuration)
          
          // currentTime이 유효한 값이면 항상 업데이트 (플레이어 상태와 무관)
          if (!isNaN(videoCurrentTime) && videoCurrentTime >= 0) {
            setCurrentTime(videoCurrentTime)
            
            // 재생 위치 저장 (일시정지 시에도 저장)
            if (currentSong.id) {
              songPlaybackPositionsRef.current[currentSong.id] = videoCurrentTime
            }
            
            // 진행도 계산 (더 정확하게)
            const progressPercent = Math.min(100, Math.max(0, (videoCurrentTime / videoDuration) * 100))
            setProgress(progressPercent)
            
            console.log('[RandomPlayDance] 진행도 업데이트:', { 
              currentTime: videoCurrentTime.toFixed(1), 
              duration: videoDuration.toFixed(1), 
              progress: progressPercent.toFixed(1) + '%',
              state: playerState 
            })
            
            // 진행도가 99.9% 이상이거나 현재 시간이 전체 길이의 99.9% 이상이면 영상 종료로 간주
            if ((progressPercent >= 99.9 || videoCurrentTime >= videoDuration * 0.999) && playerState === 1) {
              console.log('[RandomPlayDance] 영상 종료 감지 (진행도 체크):', { currentTime: videoCurrentTime, duration: videoDuration, progressPercent })
              handleVideoEnd(currentSong.id)
              return
            }
          }
        }
      } catch (error) {
        console.error('[RandomPlayDance] 진행도 업데이트 실패:', error)
        // Player가 아직 준비되지 않았거나 오류 발생 시 무시하지만 계속 시도
      }
    }

    // 즉시 한 번 업데이트 (딜레이 없이)
    updateProgress()

    // 0.1초마다 진행도 업데이트 (더 자주 업데이트)
    progressIntervalRef.current = setInterval(updateProgress, 100)

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      setCurrentTime(0)
      setDuration(0)
    }
  }, [expandedSongId, songs, isPlaying])

  // YouTube 플레이어 인스턴스 생성 및 이벤트 리스너 설정
  useEffect(() => {
    if (typeof window === 'undefined' || !expandedSongId) return

    const currentSong = songs.find(s => s.id === expandedSongId)
    if (!currentSong?.youtube_video_id) return

    // 이미 플레이어가 생성되어 있으면 스킵
    if (playerRefs.current[currentSong.id]) return

    // YouTube API가 로드될 때까지 대기
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        // API가 아직 로드되지 않았으면 대기
        setTimeout(initPlayer, 100)
        return
      }

      // div 요소 찾기 또는 생성
      const playerElementId = `youtube-player-${currentSong.id}`
      let playerElement = document.getElementById(playerElementId)
      if (!playerElement) {
        // 아직 DOM에 없으면 잠시 대기
        setTimeout(initPlayer, 100)
        return
      }

      // YouTube Player 인스턴스 생성
      try {
        const player = new window.YT.Player(playerElement, {
          videoId: currentSong.youtube_video_id,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
            iv_load_policy: 3,
            showinfo: 0
          },
          events: {
            onReady: (event: { target: any }) => {
              setIsPlaying(true)
              setProgress(0)
              setCurrentTime(0)
              console.log('[RandomPlayDance] YouTube Player 준비 완료:', currentSong.song_title)
              
              // 플레이어가 준비되면 즉시 duration 설정 및 진행도 업데이트 시작
              const setupPlayer = () => {
                try {
                  const videoDuration = event.target.getDuration()
                  if (videoDuration && videoDuration > 0) {
                    setDuration(videoDuration)
                    console.log('[RandomPlayDance] 영상 길이:', videoDuration)
                    
                    // 저장된 재생 위치 확인
                    const savedPosition = songPlaybackPositionsRef.current[currentSong.id] || 0
                    
                    // 저장된 위치가 있으면 그 위치부터 재생
                    if (savedPosition > 0 && savedPosition < videoDuration) {
                      try {
                        event.target.seekTo(savedPosition, true)
                        setCurrentTime(savedPosition)
                        const initialProgress = (savedPosition / videoDuration) * 100
                        setProgress(initialProgress)
                        console.log('[RandomPlayDance] 저장된 위치부터 재생:', { 
                          savedPosition, 
                          duration: videoDuration, 
                          progress: initialProgress 
                        })
                      } catch (e) {
                        console.error('[RandomPlayDance] 저장된 위치로 이동 실패:', e)
                        setCurrentTime(0)
                        setProgress(0)
                      }
                    } else {
                      // 저장된 위치가 없으면 처음부터
                      const videoCurrentTime = event.target.getCurrentTime() || 0
                      setCurrentTime(videoCurrentTime)
                      const initialProgress = videoDuration > 0 ? (videoCurrentTime / videoDuration) * 100 : 0
                      setProgress(initialProgress)
                      console.log('[RandomPlayDance] 초기 진행도 설정:', { 
                        currentTime: videoCurrentTime, 
                        duration: videoDuration, 
                        progress: initialProgress 
                      })
                    }
                    
                    // 진행도 업데이트 인터벌 시작 (onReady에서 직접 시작)
                    if (!progressIntervalRef.current) {
                      const startProgressUpdate = () => {
                        try {
                          const currentTime = event.target.getCurrentTime()
                          const duration = event.target.getDuration()
                          if (duration && duration > 0 && !isNaN(currentTime) && currentTime >= 0) {
                            setCurrentTime(currentTime)
                            const progressPercent = (currentTime / duration) * 100
                            setProgress(progressPercent)
                            setDuration(duration)
                          }
                        } catch (e) {
                          console.error('[RandomPlayDance] 진행도 업데이트 오류:', e)
                        }
                      }
                      
                      // 즉시 한 번 업데이트
                      startProgressUpdate()
                      
                      // 100ms마다 업데이트
                      progressIntervalRef.current = setInterval(startProgressUpdate, 100)
                      console.log('[RandomPlayDance] 진행도 업데이트 인터벌 시작 (onReady)')
                    }
                  } else {
                    // duration이 아직 준비되지 않았으면 재시도
                    setTimeout(setupPlayer, 100)
                    return
                  }
                  
                  // 볼륨 초기값 설정 - 저장된 볼륨이 있으면 사용, 없으면 플레이어 기본값
                  try {
                    const savedVolume = songVolumesRef.current[currentSong.id]
                    const savedMuted = songMutedRef.current[currentSong.id]
                    
                    if (savedVolume !== undefined) {
                      // 저장된 볼륨 적용
                      event.target.setVolume(savedVolume)
                      if (savedMuted) {
                        event.target.mute()
                      } else {
                        event.target.unMute()
                      }
                      setVolume(savedVolume)
                      setIsMuted(savedMuted || false)
                    } else {
                      // 저장된 볼륨이 없으면 플레이어 기본값 사용하고 저장
                      const currentVolume = event.target.getVolume()
                      const currentMuted = event.target.isMuted()
                      songVolumesRef.current[currentSong.id] = currentVolume
                      songMutedRef.current[currentSong.id] = currentMuted
                      setVolume(currentVolume)
                      setIsMuted(currentMuted)
                    }
                  } catch (volError) {
                    console.error('[RandomPlayDance] 볼륨 설정 실패:', volError)
                  }
                } catch (error) {
                  console.error('[RandomPlayDance] 영상 정보 가져오기 실패:', error)
                  // 오류 발생 시 재시도
                  setTimeout(setupPlayer, 100)
                }
              }
              
              // 즉시 한 번 시도
              setupPlayer()
            },
            onStateChange: (event: { data: number, target: any }) => {
              console.log('[RandomPlayDance] Player 상태 변경:', { 
                state: event.data, 
                stateName: event.data === 0 ? 'ENDED' : event.data === 1 ? 'PLAYING' : event.data === 2 ? 'PAUSED' : event.data === 3 ? 'BUFFERING' : 'OTHER',
                songTitle: currentSong.song_title 
              })
              
              // 상태 변경 시 항상 현재 시간과 duration 업데이트
              const updateTimeAndProgress = () => {
                try {
                  const videoDuration = event.target.getDuration()
                  const videoCurrentTime = event.target.getCurrentTime()
                  
                  if (videoDuration && videoDuration > 0 && !isNaN(videoDuration)) {
                    setDuration(videoDuration)
                    if (!isNaN(videoCurrentTime) && videoCurrentTime >= 0) {
                      setCurrentTime(videoCurrentTime)
                      const progressPercent = (videoCurrentTime / videoDuration) * 100
                      setProgress(Math.min(100, Math.max(0, progressPercent)))
                      
                      // 재생 위치 저장
                      songPlaybackPositionsRef.current[currentSong.id] = videoCurrentTime
                      
                      console.log('[RandomPlayDance] 상태 변경 시 진행도 업데이트:', { 
                        currentTime: videoCurrentTime.toFixed(1), 
                        duration: videoDuration.toFixed(1), 
                        progress: progressPercent.toFixed(1) + '%' 
                      })
                    }
                  }
                } catch (error) {
                  console.error('[RandomPlayDance] 상태 변경 시 진행도 업데이트 실패:', error)
                }
              }
              
              // 즉시 업데이트
              updateTimeAndProgress()
              
              // YT.PlayerState.ENDED = 0
              if (event.data === 0) {
                console.log('[RandomPlayDance] 영상 종료 감지 (onStateChange 이벤트)')
                setProgress(100)
                // 약간의 딜레이 후 종료 처리 (진행도가 100%로 표시되도록)
                setTimeout(() => {
                  handleVideoEnd(currentSong.id)
                }, 100)
              }
              // YT.PlayerState.PLAYING = 1
              else if (event.data === 1) {
                setIsPlaying(true)
                // 재생 시작 시 즉시 업데이트 (추가로 한 번 더)
                setTimeout(updateTimeAndProgress, 50)
              }
              // YT.PlayerState.PAUSED = 2
              else if (event.data === 2) {
                setIsPlaying(false)
                // 일시정지 시에도 현재 시간 업데이트 및 저장
                updateTimeAndProgress()
              }
              // YT.PlayerState.BUFFERING = 3
              else if (event.data === 3) {
                // 버퍼링 중에도 재생 상태 유지
                // setIsPlaying은 변경하지 않음
                updateTimeAndProgress()
              }
            }
          }
        })

        playerRefs.current[currentSong.id] = player
      } catch (error) {
        console.error('[RandomPlayDance] YouTube Player 생성 실패:', error)
      }
    }

    // 약간의 딜레이를 두고 초기화 (DOM 렌더링 대기)
    const timeoutId = setTimeout(initPlayer, 100)

    // cleanup
    return () => {
      clearTimeout(timeoutId)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      if (playerRefs.current[currentSong.id]) {
        try {
          playerRefs.current[currentSong.id].destroy()
        } catch (e) {
          // 무시
        }
        delete playerRefs.current[currentSong.id]
      }
    }
  }, [expandedSongId, songs])

  // expandedSongId가 변경되면 재생 상태 업데이트
  useEffect(() => {
    if (expandedSongId) {
      const index = songs.findIndex(s => s.id === expandedSongId)
      if (index !== -1) {
        setCurrentPlayingIndex(index)
        setIsPlaying(true)
      }
    } else {
      setIsPlaying(false)
      setShowVolumeSlider(false) // 영상이 닫히면 볼륨 슬라이더도 닫기
    }
  }, [expandedSongId, songs])

  // 외부 클릭 시 볼륨 슬라이더 닫기
  useEffect(() => {
    if (!showVolumeSlider) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.volume-control-container')) {
        setShowVolumeSlider(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showVolumeSlider])

  if (loading || checkingAdmin) {
    return <RandomPlayDanceSkeleton />
  }

  return (
    <div className="w-full mb-6">
      {/* 주차 리본 (빨간색, 대각선) */}
      {/* 제목과 Participar 버튼 (데스크톱만) - hideTitle이 true면 숨김 */}
      {!hideTitle && (
      <div className="mb-4">
        {/* K-POP Random Play Dance SVG 제목 (손글씨 스타일) */}
        <div className="flex items-center justify-center md:items-center md:justify-between md:flex-row flex-col w-full">
          {/* 모바일 버전 (작은 크기) */}
          <svg 
            width="380" 
            height="60" 
            viewBox="0 0 450 60" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="md:hidden w-auto h-10 mx-auto"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* K-POP Random Play Dance 손글씨 스타일 */}
            <text 
              x="5" 
              y="42" 
              fontFamily="'Brush Script MT', 'Lucida Handwriting', 'Comic Sans MS', cursive" 
              fontSize="34" 
              fontWeight="bold" 
              fill="#000000" 
              className="dark:fill-gray-100"
              style={{ 
                fontStyle: 'italic',
                letterSpacing: '1px'
              }}
            >
              K-POP Random Play Dance
            </text>
          </svg>
          
          {/* 데스크톱 버전 (큰 크기) */}
          <svg 
            width="550" 
            height="80" 
            viewBox="0 0 550 80" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="hidden md:block w-auto h-16"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* K-POP Random Play Dance 손글씨 스타일 */}
            <text 
              x="5" 
              y="55" 
              fontFamily="'Brush Script MT', 'Lucida Handwriting', 'Comic Sans MS', cursive" 
              fontSize="48" 
              fontWeight="bold" 
              fill="#000000" 
              className="dark:fill-gray-100"
              style={{ 
                fontStyle: 'italic',
                letterSpacing: '1px'
              }}
            >
              K-POP Random Play Dance
            </text>
          </svg>
          
          {/* 데스크톱 버전 Participar 버튼 (제목 오른쪽) */}
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold"
            onClick={() => router.push('/main?tab=dance')}
          >
            {language === 'ko' ? '참여하기' : 'Participar'}
          </Button>
        </div>
      </div>
      )}

      {!hideCard ? (
      <Card className="bg-white dark:bg-gray-900 rounded-lg relative overflow-hidden" style={{ border: '3px solid #000000' }}>
        {/* 빨간 리본 (45도 각도, 단순) - 드래그 가능 (모바일: 작게, 데스크톱: 크게) */}
        {!hideRibbon && playlist && playlist.week_label && (
          <div 
            className="absolute z-20 select-none"
            style={{ 
              top: (() => {
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
                if (isMobile && ribbonPosition.top === -1) return '0px'
                return `${ribbonPosition.top}px`
              })(),
              right: (() => {
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
                if (isMobile && ribbonPosition.left === -1) return '0px'
                return 'auto'
              })(),
              left: (() => {
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
                if (isMobile && ribbonPosition.left === -1) return 'auto'
                return `${ribbonPosition.left}px`
              })(),
              userSelect: 'none'
            }}
          >
            {/* 모바일 버전 (작은 크기) */}
            <svg 
              width="200" 
              height="42" 
              viewBox="0 0 250 60" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="md:hidden transform -rotate-45"
              style={{ transformOrigin: '0 0' }}
            >
              {/* 리본 본체 (직사각형, 길게) */}
              <rect 
                x="0" 
                y="8" 
                width="200" 
                height="32" 
                fill="#EF4444" 
                stroke="#DC2626" 
                strokeWidth="0.8"
              />
              
              {/* 텍스트 */}
              <text 
                x="45" 
                y="28" 
                fontFamily="Arial, sans-serif" 
                fontSize="12" 
                fontWeight="bold" 
                fill="#FFFFFF"
              >
                {playlist.week_label}
              </text>
            </svg>
            
            {/* 데스크톱 버전 (큰 크기) */}
            <svg 
              width="250" 
              height="60" 
              viewBox="0 0 250 60" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="hidden md:block transform -rotate-45"
              style={{ transformOrigin: '0 0' }}
            >
              {/* 리본 본체 (직사각형, 길게) */}
              <rect 
                x="0" 
                y="8" 
                width="230" 
                height="44" 
                fill="#EF4444" 
                stroke="#DC2626" 
                strokeWidth="1"
              />
              
              {/* 텍스트 */}
              <text 
                x="50" 
                y="36" 
                fontFamily="Arial, sans-serif" 
                fontSize="14" 
                fontWeight="bold" 
                fill="#FFFFFF"
              >
                {playlist.week_label}
              </text>
            </svg>
          </div>
        )}
        <div className="overflow-hidden">
          <CardContent className="pt-2 pb-2 px-2 md:p-6 md:pt-6">
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
            {/* 가운데: 플레이리스트 */}
            <div className="order-1 lg:order-1 lg:col-span-2 lg:mx-auto lg:max-w-2xl">
              {/* Playlist 헤더 - 플레이리스트 박스 밖 */}
              <div className="flex items-center justify-center mb-3 md:mb-4 relative">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg md:text-xl font-bold" style={{ fontFamily: 'cursive', fontWeight: 'bold' }}>
                    Playlist
                  </h3>
                  <span className="text-red-500 text-lg">❤️</span>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                    className="hidden md:flex items-center gap-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 absolute right-0"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="text-xs">{language === 'ko' ? '편집' : 'Editar'}</span>
                  </Button>
                )}
              </div>
              
              {playlist && playlist.id && playlist.songs && playlist.songs.length > 0 ? (
                <div className="space-y-0 !rounded-none p-1.5 pb-1.5 md:p-2 md:pb-2 bg-white dark:bg-gray-900 relative" style={{ border: '2px solid #000000' }}>
                  {/* 재생 중일 때: YouTube 플레이어만 표시 (아코디언 효과로 부드럽게 펼쳐짐) */}
                  {/* 플레이어는 항상 DOM에 유지하되, 재생 중일 때만 보이도록 */}
                  {expandedSongId && (() => {
                    const currentIndex = playlist.songs.findIndex(s => s.id === expandedSongId)
                    const currentSong = currentIndex !== -1 ? playlist.songs[currentIndex] : null
                    const nextSong = currentIndex !== -1 && currentIndex < playlist.songs.length - 1 ? playlist.songs[currentIndex + 1] : null
                    
                    return currentSong && currentSong.youtube_video_id ? (
                      <div 
                        className="overflow-hidden transition-all duration-300 ease-in-out"
                        style={{
                          maxHeight: isPlaying ? '1000px' : '0',
                          opacity: isPlaying ? 1 : 0
                        }}
                      >
                        <div className="mb-3">
                          <div id={`youtube-player-${currentSong.id}`} className="relative aspect-video w-full rounded-lg overflow-hidden" />
                        </div>
                        {nextSong && (
                          <div className="py-2 border-t border-gray-300 dark:border-gray-600">
                            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                              {language === 'ko' ? '다음곡' : 'Siguiente'}: <span className="font-medium text-gray-900 dark:text-gray-100">{nextSong.song_title}</span> – {nextSong.artist_name}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : null
                  })()}
                  
                  {/* 일시정지 시: 곡 목록 표시 (즉시 나타남, YouTube 접힐 때 부드럽게 펼쳐짐) */}
                  <div 
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{
                      maxHeight: isPlaying ? '0' : `${playlist.songs.length * 40 + 20}px`, // 곡 개수에 맞춰 정확한 높이 계산 (여유 공간 추가)
                      opacity: isPlaying ? 0 : 1,
                      transition: isPlaying ? 'max-height 0s ease-out, opacity 0s ease-out' : 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out' // 재생 시작 시 즉시 사라짐
                    }}
                  >
                    {playlist.songs.map((song, index) => {
                      const isExpanded = expandedSongId === song.id
                      const isLast = index === playlist.songs.length - 1
                      
                      return (
                        <div key={song.id} className="space-y-0">
                          {/* 노래 항목 - 박스로 감싸기 */}
                          <div
                            className={`relative flex items-center py-0 px-2 md:py-0 md:px-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group !rounded-none cursor-pointer ${!isLast ? 'border-b border-gray-300 dark:border-gray-600' : ''}`}
                            onClick={() => {
                              if (isExpanded) {
                                // 같은 노래면 플레이어 재생성 후 재생
                                const player = playerRefs.current[song.id]
                                if (player) {
                                  // 플레이어가 이미 존재하면 재생성
                                  try {
                                    player.destroy()
                                  } catch (e) {
                                    console.error('[RandomPlayDance] 플레이어 정리 실패:', e)
                                  }
                                  delete playerRefs.current[song.id]
                                }
                                // expandedSongId를 리셋했다가 다시 설정하여 플레이어 재생성
                                setExpandedSongId(null)
                                setCurrentPlayingIndex(null)
                                setIsPlaying(false)
                                setTimeout(() => {
                                  setExpandedSongId(song.id)
                                  const songIndex = playlist.songs.findIndex(s => s.id === song.id)
                                  setCurrentPlayingIndex(songIndex !== -1 ? songIndex : null)
                                  setIsPlaying(true)
                                }, 100)
                              } else {
                                // 다른 노래면 열기 및 저장된 위치부터 재생
                                setExpandedSongId(song.id)
                                const songIndex = playlist.songs.findIndex(s => s.id === song.id)
                                setCurrentPlayingIndex(songIndex !== -1 ? songIndex : null)
                                setIsPlaying(true)
                              }
                            }}
                          >
                            <div className="flex-1 min-w-0 pr-8">
                              <div className="flex flex-row items-center gap-1.5 md:gap-2 flex-wrap">
                                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm md:text-base line-clamp-1">
                                  {song.song_title}
                                </p>
                                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                  – {song.artist_name}
                                </p>
                              </div>
                            </div>
                            {song.youtube_video_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 -translate-y-1/2 flex-shrink-0 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (isExpanded) {
                                    // 같은 노래면 플레이어 재생성 후 재생
                                    const player = playerRefs.current[song.id]
                                    if (player) {
                                      // 플레이어가 이미 존재하면 재생성
                                      try {
                                        player.destroy()
                                      } catch (e) {
                                        console.error('[RandomPlayDance] 플레이어 정리 실패:', e)
                                      }
                                      delete playerRefs.current[song.id]
                                    }
                                    // expandedSongId를 리셋했다가 다시 설정하여 플레이어 재생성
                                    setExpandedSongId(null)
                                    setCurrentPlayingIndex(null)
                                    setIsPlaying(false)
                                    setTimeout(() => {
                                      setExpandedSongId(song.id)
                                      const songIndex = playlist.songs.findIndex(s => s.id === song.id)
                                      setCurrentPlayingIndex(songIndex !== -1 ? songIndex : null)
                                      setIsPlaying(true)
                                    }, 100)
                                  } else {
                                    // 다른 노래면 열기 및 저장된 위치부터 재생
                                    setExpandedSongId(song.id)
                                    const songIndex = playlist.songs.findIndex(s => s.id === song.id)
                                    setCurrentPlayingIndex(songIndex !== -1 ? songIndex : null)
                                    setIsPlaying(true)
                                  }
                                }}
                              >
                                <Play className={`w-4 h-4 ${isExpanded ? 'text-blue-500' : ''}`} />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-0 !rounded-none p-1.5 pb-1.5 md:p-2 md:pb-2 bg-white dark:bg-gray-900" style={{ border: '2px solid #000000' }}>
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                    {language === 'ko' ? '플레이리스트가 없습니다.' : 'No hay playlist disponible.'}
                  </p>
                </div>
              )}
              
              {/* 플레이어 컨트롤 - SVG 아이콘으로 변경 */}
              <div className="mt-2 pt-2">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-bold min-w-[40px] text-left">
                    {duration > 0 ? formatTime(currentTime) : '0:00'}
                  </span>
                  <div 
                    className="flex-1 h-2 bg-gray-300 dark:bg-gray-600 rounded-full relative cursor-pointer hover:h-2.5 transition-all group"
                    onClick={handleProgressBarClick}
                  >
                    <div 
                      className="absolute left-0 top-0 h-full bg-black dark:bg-white rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                    {/* 호버 시 진행 바 더 두껍게 */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div 
                        className="absolute h-3 w-3 bg-black dark:bg-white rounded-full -translate-x-1/2 shadow-lg"
                        style={{ left: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-bold min-w-[40px] text-right">
                    {duration > 0 ? formatTime(duration) : '0:00'}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
                  {/* 이전 버튼 (<<) */}
                  <button 
                    onClick={handlePreviousSong}
                    disabled={!playlist || songs.length === 0}
                    className="text-black dark:text-white hover:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 5L4 10L8 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 5L10 10L14 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {/* 재생/일시정지 버튼 */}
                  <button 
                    onClick={handlePlayPause}
                    disabled={!playlist || songs.length === 0}
                    className="text-black dark:text-white hover:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isPlaying ? (
                      // 일시정지 아이콘 (||)
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <rect x="5" y="3" width="3" height="14" rx="0.5"/>
                        <rect x="12" y="3" width="3" height="14" rx="0.5"/>
                      </svg>
                    ) : (
                      // 재생 아이콘 (▶)
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 5L15 10L7 15V5Z" fill="currentColor"/>
                      </svg>
                    )}
                  </button>
                  {/* 다음 버튼 (>>) */}
                  <button 
                    onClick={handleNextSong}
                    disabled={!playlist || songs.length === 0}
                    className="text-black dark:text-white hover:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5L16 10L12 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 5L10 10L6 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {/* 반복 버튼 (45도 기울인 두 화살표) */}
                  <button 
                    onClick={handleRepeat}
                    className={`hover:opacity-70 transition-opacity relative ${
                      repeatMode !== 'none' 
                        ? 'text-red-500 dark:text-red-400' 
                        : 'text-black dark:text-white'
                    }`}
                    title={
                      repeatMode === 'none' ? '반복 없음' :
                      repeatMode === 'all' ? '전체 반복' :
                      '1곡 반복'
                    }
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* 원형 반복 화살표 (2개의 화살표가 분리되어 원형으로 도는 느낌) */}
                      {/* 위쪽 반원 화살표 (왼쪽에서 오른쪽으로) */}
                      <path 
                        d="M4 8.5C4 6 6 4 9 4C12 4 14 6 14 8.5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        fill="none"
                      />
                      <path 
                        d="M14 8.5L12 6.5L14 4.5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        fill="none"
                      />
                      {/* 아래쪽 반원 화살표 (오른쪽에서 왼쪽으로) */}
                      <path 
                        d="M14 9.5C14 12 12 14 9 14C6 14 4 12 4 9.5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        fill="none"
                      />
                      <path 
                        d="M4 9.5L6 11.5L4 13.5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        fill="none"
                      />
                      {/* 1곡 반복일 때만 "1" 표시 - 중앙에 배치 */}
                      {repeatMode === 'one' && (
                        <text 
                          x="9" 
                          y="11.5" 
                          textAnchor="middle" 
                          fontSize="9" 
                          fill="currentColor" 
                          fontWeight="bold"
                          fontFamily="Arial, sans-serif"
                        >
                          1
                        </text>
                      )}
                    </svg>
                  </button>
                  
                  {/* 볼륨 컨트롤 - 웹에서만 표시, YouTube 스타일 */}
                  <div 
                    className="relative volume-control-container hidden md:flex md:items-center group"
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // 더블 클릭 시 음소거 토글
                        if (e.detail === 2) {
                          const currentSongId = expandedSongId
                          const player = currentSongId ? playerRefs.current[currentSongId] : null
                          
                          if (player) {
                            try {
                              if (isMuted) {
                                player.unMute()
                                setIsMuted(false)
                                if (currentSongId) {
                                  songMutedRef.current[currentSongId] = false
                                }
                              } else {
                                player.mute()
                                setIsMuted(true)
                                if (currentSongId) {
                                  songMutedRef.current[currentSongId] = true
                                }
                              }
                            } catch (error) {
                              console.error('[RandomPlayDance] 음소거 토글 실패:', error)
                            }
                          } else {
                            // 플레이어가 없어도 상태만 저장
                            const newMuted = !isMuted
                            setIsMuted(newMuted)
                            if (currentSongId) {
                              songMutedRef.current[currentSongId] = newMuted
                            }
                          }
                        }
                      }}
                      className="text-black dark:text-white hover:opacity-70 transition-opacity flex-shrink-0 relative z-10"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                    
                    {/* 볼륨 슬라이더 - hover 시 오른쪽으로 부드럽게 확장 */}
                    <div 
                      className={`flex items-center transition-all duration-300 ease-out ${
                        showVolumeSlider 
                          ? 'opacity-100 max-w-20 ml-2' 
                          : 'opacity-0 max-w-0 ml-0'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      onMouseLeave={() => setShowVolumeSlider(false)}
                      style={{ overflow: 'visible' }}
                    >
                        <div 
                          className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full relative cursor-pointer hover:h-2.5 transition-all group flex-shrink-0"
                          style={{ width: '80px', padding: '0 7px', margin: '0 -7px' }}
                          onMouseDown={(e) => {
                            isDraggingVolumeRef.current = true
                            e.preventDefault()

                            // 요소를 변수에 저장 (이벤트 핸들러 외부에서도 사용 가능하도록)
                            const volumeBar = e.currentTarget as HTMLElement
                            if (!volumeBar) return

                            // 현재 재생 중인 노래 ID (없을 수도 있음)
                            const currentSongId = expandedSongId
                            const currentSong = currentSongId ? songs.find(s => s.id === currentSongId) : null
                            const player = currentSongId ? playerRefs.current[currentSongId] : null

                            const updateVolume = (clientX: number) => {
                              // 요소가 여전히 DOM에 있는지 확인
                              if (!volumeBar || !document.body.contains(volumeBar)) {
                                isDraggingVolumeRef.current = false
                                return
                              }

                              try {
                                const rect = volumeBar.getBoundingClientRect()
                                const clickX = clientX - rect.left
                                const width = rect.width
                                // 가로 슬라이더는 왼쪽에서 오른쪽으로 0% -> 100%
                                const percentage = Math.max(0, Math.min(100, (clickX / width) * 100))
                                const newVolume = Math.round(percentage)

                                // 볼륨 상태 업데이트
                                setVolume(newVolume)
                                
                                // 현재 재생 중인 노래가 있으면 플레이어에 적용
                                if (player && currentSongId) {
                                  try {
                                    player.setVolume(newVolume)
                                    if (isMuted && newVolume > 0) {
                                      try {
                                        player.unMute()
                                        setIsMuted(false)
                                        songMutedRef.current[currentSongId] = false
                                      } catch (e) {
                                        // 무시
                                      }
                                    } else if (newVolume === 0) {
                                      try {
                                        player.mute()
                                        setIsMuted(true)
                                        songMutedRef.current[currentSongId] = true
                                      } catch (e) {
                                        // 무시
                                      }
                                    }
                                  } catch (error) {
                                    console.error('[RandomPlayDance] 볼륨 조절 실패:', error)
                                  }
                                }
                                
                                // 현재 재생 중인 노래가 있으면 해당 노래의 볼륨 저장
                                // 없으면 다음에 재생될 때 사용할 수 있도록 전역 볼륨으로 저장
                                if (currentSongId) {
                                  songVolumesRef.current[currentSongId] = newVolume
                                } else {
                                  // 재생 중인 노래가 없으면 모든 노래에 기본 볼륨으로 저장
                                  songs.forEach(song => {
                                    if (!songVolumesRef.current[song.id]) {
                                      songVolumesRef.current[song.id] = newVolume
                                    }
                                  })
                                }
                              } catch (error) {
                                console.error('[RandomPlayDance] 볼륨 바 위치 계산 실패:', error)
                                isDraggingVolumeRef.current = false
                              }
                            }

                            // 초기 클릭 위치로 볼륨 조절
                            updateVolume(e.clientX)

                            // 마우스 이동 이벤트
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              if (!isDraggingVolumeRef.current) return
                              updateVolume(moveEvent.clientX)
                            }

                            // 마우스 업 이벤트
                            const handleMouseUp = () => {
                              isDraggingVolumeRef.current = false
                              document.removeEventListener('mousemove', handleMouseMove)
                              document.removeEventListener('mouseup', handleMouseUp)
                            }

                            document.addEventListener('mousemove', handleMouseMove)
                            document.addEventListener('mouseup', handleMouseUp)
                          }}
                          onClick={(e) => {
                            // 클릭 이벤트는 onMouseDown에서 처리되므로 여기서는 중복 방지
                            e.stopPropagation()
                          }}
                        >
                          <div 
                            className="absolute top-0 left-0 h-full bg-black dark:bg-white rounded-full transition-all duration-300"
                            style={{ width: `${volume}%` }}
                          ></div>
                          {/* 볼륨 핸들 - 동그라미 */}
                          <div 
                            className="absolute top-1/2 rounded-full transition-all duration-300 group-hover:scale-125"
                            style={{ 
                              left: `${volume}%`,
                              transform: 'translate(-50%, -50%)',
                              width: '14px',
                              height: '14px',
                              backgroundColor: '#000000',
                              border: '2px solid #ffffff',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.5)',
                              zIndex: 10
                            }}
                          ></div>
                        </div>
                      </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 오른쪽: 비디오 그리드 */}
            {!hideVideoGrid && (
            <div className="order-2 lg:order-2 flex flex-col">
              {videos.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {videos.slice(0, 12).map((video) => {
                    const isLiked = likedVideos.has(video.id)
                    const counts = videoCounts[video.id] || {
                      likes: video.like_count || 0,
                      comments: video.comment_count || 0,
                      views: video.view_count || 0
                    }
                    const isGuide = video.is_guide || false

                    return (
                      <div
                        key={video.id}
                        className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-all hover:scale-105 group"
                        onClick={() => {
                          // 조회수 증가
                          fetch(`/api/dance/videos/${video.id}/view`, { method: 'POST' }).catch(console.error)
                          // 비디오 열기 (추후 구현)
                        }}
                      >
                        {/* 사용자 프로필 (왼쪽 위) */}
                        <div className="absolute top-1 left-1 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                          {video.user_avatar_url ? (
                            <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                              <Image
                                src={video.user_avatar_url}
                                alt={video.user_display_name || 'User'}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-500 flex-shrink-0 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {(video.user_display_name || 'A')[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="text-white text-xs font-medium truncate max-w-[80px]">
                            {video.user_display_name || 'Anónimo'}
                          </span>
                        </div>

                        {/* 가이드 영상 라벨 (오른쪽 위) */}
                        {isGuide && (
                          <div className="absolute top-1 right-1 z-10 bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                            Video guía
                          </div>
                        )}

                        {/* 썸네일 URL이 유효하고 example.com이 아닐 때만 Image 컴포넌트 사용 */}
                        {video.thumbnail_url && 
                         video.thumbnail_url.startsWith('http') && 
                         !video.thumbnail_url.includes('example.com') ? (
                          <Image
                            src={video.thumbnail_url}
                            alt={video.title || 'Dance video'}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              // 이미지 로드 실패 시 플레이 아이콘 표시
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                const fallback = parent.querySelector('.thumbnail-fallback') as HTMLElement
                                if (fallback) fallback.style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        {/* 썸네일이 없거나 example.com이거나 로드 실패 시 표시 */}
                        <div className={`thumbnail-fallback w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 dark:from-purple-600 dark:via-pink-600 dark:to-red-600 ${video.thumbnail_url && video.thumbnail_url.startsWith('http') && !video.thumbnail_url.includes('example.com') ? 'hidden' : ''}`}>
                          <Play className="w-8 h-8 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* 하트, 댓글, 조회수 오버레이 */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex items-center gap-3 text-white text-xs">
                          {/* 하트 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVideoLike(video.id, isLiked)
                            }}
                            className="flex items-center gap-1 hover:scale-110 transition-transform"
                          >
                            <Heart 
                              className={`w-3 h-3 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} 
                            />
                            <span>{counts.likes}</span>
                          </button>

                          {/* 댓글 */}
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            <span>{counts.comments}</span>
                          </div>

                          {/* 조회수 */}
                          <div className="flex items-center gap-1 ml-auto">
                            <Eye className="w-3 h-3" />
                            <span>{counts.views}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {/* 빈 슬롯 채우기 (12개 미만인 경우) */}
                  {Array.from({ length: Math.max(0, 12 - videos.length) }).map((_, i) => (
                    <div
                      key={`placeholder-${i}`}
                      className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700"
                    >
                      <Play className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            )}
          </div>
        </CardContent>
        </div>
      </Card>
      ) : (
        <div className="pt-0 pb-0 px-0 md:px-2 md:pt-6 md:pb-6">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
            {/* 가운데: 플레이리스트 */}
            <div className="order-1 lg:order-1 lg:col-span-2 lg:mx-auto lg:max-w-2xl">
              {/* Playlist 헤더 - 플레이리스트 박스 밖 */}
              <div className="flex items-center justify-center mb-3 md:mb-4 relative">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg md:text-xl font-bold" style={{ fontFamily: 'cursive', fontWeight: 'bold' }}>
                    Playlist
                  </h3>
                  <span className="text-red-500 text-lg">❤️</span>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                    className="hidden md:flex items-center gap-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 absolute right-0"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="text-xs">{language === 'ko' ? '편집' : 'Editar'}</span>
                  </Button>
                )}
              </div>
              
              {playlist && playlist.id && playlist.songs && playlist.songs.length > 0 ? (
                <div className="space-y-0 !rounded-none p-1.5 pb-1.5 md:p-2 md:pb-2 bg-white dark:bg-gray-900 relative" style={{ border: '2px solid #000000' }}>
                  {/* 재생 중일 때: YouTube 플레이어만 표시 (아코디언 효과로 부드럽게 펼쳐짐) */}
                  {/* 플레이어는 항상 DOM에 유지하되, 재생 중일 때만 보이도록 */}
                  {expandedSongId && (() => {
                    const currentIndex = playlist.songs.findIndex(s => s.id === expandedSongId)
                    const currentSong = currentIndex !== -1 ? playlist.songs[currentIndex] : null
                    const nextSong = currentIndex !== -1 && currentIndex < playlist.songs.length - 1 ? playlist.songs[currentIndex + 1] : null
                    
                    return currentSong && currentSong.youtube_video_id ? (
                      <div 
                        className="overflow-hidden transition-all duration-300 ease-in-out"
                        style={{
                          maxHeight: isPlaying ? '1000px' : '0',
                          opacity: isPlaying ? 1 : 0
                        }}
                      >
                        <div className="mb-3">
                          <div id={`youtube-player-${currentSong.id}`} className="relative aspect-video w-full rounded-lg overflow-hidden" />
                        </div>
                        {nextSong && (
                          <div className="py-2 border-t border-gray-300 dark:border-gray-600">
                            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                              {language === 'ko' ? '다음곡' : 'Siguiente'}: <span className="font-medium text-gray-900 dark:text-gray-100">{nextSong.song_title}</span> – {nextSong.artist_name}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : null
                  })()}
                  
                  {/* 일시정지 시: 곡 목록 표시 (즉시 나타남, YouTube 접힐 때 부드럽게 펼쳐짐) */}
                  <div 
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{
                      maxHeight: isPlaying ? '0' : `${playlist.songs.length * 40 + 20}px`, // 곡 개수에 맞춰 정확한 높이 계산 (여유 공간 추가)
                      opacity: isPlaying ? 0 : 1,
                      transition: isPlaying ? 'max-height 0s ease-out, opacity 0s ease-out' : 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out' // 재생 시작 시 즉시 사라짐
                    }}
                  >
                    {playlist.songs.map((song, index) => {
                      const isExpanded = expandedSongId === song.id
                      const isLast = index === playlist.songs.length - 1
                      
                      return (
                        <div key={song.id} className="space-y-0">
                          {/* 노래 항목 - 박스로 감싸기 */}
                          <div
                            className={`relative flex items-center py-0 px-2 md:py-0 md:px-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group !rounded-none cursor-pointer ${!isLast ? 'border-b border-gray-300 dark:border-gray-600' : ''}`}
                            onClick={() => {
                              if (isExpanded) {
                                // 같은 노래면 플레이어 재생성 후 재생
                                const player = playerRefs.current[song.id]
                                if (player) {
                                  // 플레이어가 이미 존재하면 재생성
                                  try {
                                    player.destroy()
                                  } catch (e) {
                                    console.error('[RandomPlayDance] 플레이어 정리 실패:', e)
                                  }
                                  delete playerRefs.current[song.id]
                                }
                                // expandedSongId를 리셋했다가 다시 설정하여 플레이어 재생성
                                setExpandedSongId(null)
                                setCurrentPlayingIndex(null)
                                setIsPlaying(false)
                                setTimeout(() => {
                                  setExpandedSongId(song.id)
                                  const songIndex = playlist.songs.findIndex(s => s.id === song.id)
                                  setCurrentPlayingIndex(songIndex !== -1 ? songIndex : null)
                                  setIsPlaying(true)
                                }, 100)
                              } else {
                                // 다른 노래면 열기 및 저장된 위치부터 재생
                                setExpandedSongId(song.id)
                                const songIndex = playlist.songs.findIndex(s => s.id === song.id)
                                setCurrentPlayingIndex(songIndex !== -1 ? songIndex : null)
                                setIsPlaying(true)
                              }
                            }}
                          >
                            <div className="flex-1 min-w-0 pr-8">
                              <div className="flex flex-row items-center gap-1.5 md:gap-2 flex-wrap">
                                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm md:text-base line-clamp-1">
                                  {song.song_title}
                                </p>
                                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                  – {song.artist_name}
                                </p>
                              </div>
                            </div>
                            {song.youtube_video_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 -translate-y-1/2 flex-shrink-0 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (isExpanded) {
                                    // 같은 노래면 플레이어 재생성 후 재생
                                    const player = playerRefs.current[song.id]
                                    if (player) {
                                      // 플레이어가 이미 존재하면 재생성
                                      try {
                                        player.destroy()
                                      } catch (e) {
                                        console.error('[RandomPlayDance] 플레이어 정리 실패:', e)
                                      }
                                      delete playerRefs.current[song.id]
                                    }
                                    // expandedSongId를 리셋했다가 다시 설정하여 플레이어 재생성
                                    setExpandedSongId(null)
                                    setCurrentPlayingIndex(null)
                                    setIsPlaying(false)
                                    setTimeout(() => {
                                      setExpandedSongId(song.id)
                                      const songIndex = playlist.songs.findIndex(s => s.id === song.id)
                                      setCurrentPlayingIndex(songIndex !== -1 ? songIndex : null)
                                      setIsPlaying(true)
                                    }, 100)
                                  } else {
                                    // 다른 노래면 열기 및 저장된 위치부터 재생
                                    setExpandedSongId(song.id)
                                    const songIndex = playlist.songs.findIndex(s => s.id === song.id)
                                    setCurrentPlayingIndex(songIndex !== -1 ? songIndex : null)
                                    setIsPlaying(true)
                                  }
                                }}
                              >
                                <Play className={`w-4 h-4 ${isExpanded ? 'text-blue-500' : ''}`} />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-0 !rounded-none p-1.5 pb-1.5 md:p-2 md:pb-2 bg-white dark:bg-gray-900" style={{ border: '2px solid #000000' }}>
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                    {language === 'ko' ? '플레이리스트가 없습니다.' : 'No hay playlist disponible.'}
                  </p>
                </div>
              )}
              
              {/* 플레이어 컨트롤 - SVG 아이콘으로 변경 */}
              <div className="mt-2 pt-2">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-bold min-w-[40px] text-left">
                    {duration > 0 ? formatTime(currentTime) : '0:00'}
                  </span>
                  <div 
                    className="flex-1 h-2 bg-gray-300 dark:bg-gray-600 rounded-full relative cursor-pointer hover:h-2.5 transition-all group"
                    onClick={handleProgressBarClick}
                  >
                    <div 
                      className="absolute left-0 top-0 h-full bg-black dark:bg-white rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                    {/* 호버 시 진행 바 더 두껍게 */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div 
                        className="absolute h-3 w-3 bg-black dark:bg-white rounded-full -translate-x-1/2 shadow-lg"
                        style={{ left: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-bold min-w-[40px] text-right">
                    {duration > 0 ? formatTime(duration) : '0:00'}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
                  {/* 이전 버튼 (<<) */}
                  <button 
                    onClick={handlePreviousSong}
                    disabled={!playlist || songs.length === 0}
                    className="text-black dark:text-white hover:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 5L4 10L8 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 5L10 10L14 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {/* 재생/일시정지 버튼 */}
                  <button 
                    onClick={handlePlayPause}
                    disabled={!playlist || songs.length === 0}
                    className="text-black dark:text-white hover:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isPlaying ? (
                      // 일시정지 아이콘 (||)
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <rect x="5" y="3" width="3" height="14" rx="0.5"/>
                        <rect x="12" y="3" width="3" height="14" rx="0.5"/>
                      </svg>
                    ) : (
                      // 재생 아이콘 (▶)
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 5L15 10L7 15V5Z" fill="currentColor"/>
                      </svg>
                    )}
                  </button>
                  {/* 다음 버튼 (>>) */}
                  <button 
                    onClick={handleNextSong}
                    disabled={!playlist || songs.length === 0}
                    className="text-black dark:text-white hover:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5L16 10L12 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 5L10 10L6 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {/* 반복 버튼 (45도 기울인 두 화살표) */}
                  <button 
                    onClick={handleRepeat}
                    className={`hover:opacity-70 transition-opacity relative ${
                      repeatMode !== 'none' 
                        ? 'text-red-500 dark:text-red-400' 
                        : 'text-black dark:text-white'
                    }`}
                    title={
                      repeatMode === 'none' ? '반복 없음' :
                      repeatMode === 'all' ? '전체 반복' :
                      '1곡 반복'
                    }
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* 원형 반복 화살표 (2개의 화살표가 분리되어 원형으로 도는 느낌) */}
                      {/* 위쪽 반원 화살표 (왼쪽에서 오른쪽으로) */}
                      <path 
                        d="M4 8.5C4 6 6 4 9 4C12 4 14 6 14 8.5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        fill="none"
                      />
                      <path 
                        d="M14 8.5L12 6.5L14 4.5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        fill="none"
                      />
                      {/* 아래쪽 반원 화살표 (오른쪽에서 왼쪽으로) */}
                      <path 
                        d="M14 9.5C14 12 12 14 9 14C6 14 4 12 4 9.5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        fill="none"
                      />
                      <path 
                        d="M4 9.5L6 11.5L4 13.5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        fill="none"
                      />
                      {/* 1곡 반복일 때만 "1" 표시 - 중앙에 배치 */}
                      {repeatMode === 'one' && (
                        <text 
                          x="9" 
                          y="11.5" 
                          textAnchor="middle" 
                          fontSize="9" 
                          fill="currentColor" 
                          fontWeight="bold"
                          fontFamily="Arial, sans-serif"
                        >
                          1
                        </text>
                      )}
                    </svg>
                  </button>
                  
                  {/* 볼륨 컨트롤 - 웹에서만 표시, YouTube 스타일 */}
                  <div 
                    className="relative volume-control-container hidden md:flex md:items-center group"
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // 더블 클릭 시 음소거 토글
                        if (e.detail === 2) {
                          const currentSongId = expandedSongId
                          const player = currentSongId ? playerRefs.current[currentSongId] : null
                          
                          if (player) {
                            try {
                              if (isMuted) {
                                player.unMute()
                                setIsMuted(false)
                                if (currentSongId) {
                                  songMutedRef.current[currentSongId] = false
                                }
                              } else {
                                player.mute()
                                setIsMuted(true)
                                if (currentSongId) {
                                  songMutedRef.current[currentSongId] = true
                                }
                              }
                            } catch (error) {
                              console.error('[RandomPlayDance] 음소거 토글 실패:', error)
                            }
                          } else {
                            // 플레이어가 없어도 상태만 저장
                            const newMuted = !isMuted
                            setIsMuted(newMuted)
                            if (currentSongId) {
                              songMutedRef.current[currentSongId] = newMuted
                            }
                          }
                        }
                      }}
                      className="text-black dark:text-white hover:opacity-70 transition-opacity flex-shrink-0 relative z-10"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                    
                    {/* 볼륨 슬라이더 - hover 시 오른쪽으로 부드럽게 확장 */}
                    <div 
                      className={`flex items-center transition-all duration-300 ease-out ${
                        showVolumeSlider 
                          ? 'opacity-100 max-w-20 ml-2' 
                          : 'opacity-0 max-w-0 ml-0'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      onMouseLeave={() => setShowVolumeSlider(false)}
                      style={{ overflow: 'visible' }}
                    >
                      <div 
                        className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full relative cursor-pointer hover:h-2.5 transition-all group flex-shrink-0"
                        style={{ width: '80px', padding: '0 7px', margin: '0 -7px' }}
                        onMouseDown={(e) => {
                          isDraggingVolumeRef.current = true
                          e.preventDefault()

                          // 요소를 변수에 저장 (이벤트 핸들러 외부에서도 사용 가능하도록)
                          const volumeBar = e.currentTarget as HTMLElement
                          if (!volumeBar) return

                          // 현재 재생 중인 노래 ID (없을 수도 있음)
                          const currentSongId = expandedSongId
                          const currentSong = currentSongId ? songs.find(s => s.id === currentSongId) : null
                          const player = currentSongId ? playerRefs.current[currentSongId] : null

                          const updateVolume = (clientX: number) => {
                            // 요소가 여전히 DOM에 있는지 확인
                            if (!volumeBar || !document.body.contains(volumeBar)) {
                              isDraggingVolumeRef.current = false
                              return
                            }

                            try {
                              const rect = volumeBar.getBoundingClientRect()
                              const clickX = clientX - rect.left
                              const width = rect.width
                              // 가로 슬라이더는 왼쪽에서 오른쪽으로 0% -> 100%
                              const percentage = Math.max(0, Math.min(100, (clickX / width) * 100))
                              const newVolume = Math.round(percentage)

                              // 볼륨 상태 업데이트
                              setVolume(newVolume)
                              
                              // 현재 재생 중인 노래가 있으면 플레이어에 적용
                              if (player && currentSongId) {
                                try {
                                  player.setVolume(newVolume)
                                  if (isMuted && newVolume > 0) {
                                    try {
                                      player.unMute()
                                      setIsMuted(false)
                                      songMutedRef.current[currentSongId] = false
                                    } catch (e) {
                                      // 무시
                                    }
                                  } else if (newVolume === 0) {
                                    try {
                                      player.mute()
                                      setIsMuted(true)
                                      songMutedRef.current[currentSongId] = true
                                    } catch (e) {
                                      // 무시
                                    }
                                  }
                                } catch (error) {
                                  console.error('[RandomPlayDance] 볼륨 조절 실패:', error)
                                }
                              }
                              
                              // 현재 재생 중인 노래가 있으면 해당 노래의 볼륨 저장
                              // 없으면 다음에 재생될 때 사용할 수 있도록 전역 볼륨으로 저장
                              if (currentSongId) {
                                songVolumesRef.current[currentSongId] = newVolume
                              } else {
                                // 재생 중인 노래가 없으면 모든 노래에 기본 볼륨으로 저장
                                songs.forEach(song => {
                                  if (!songVolumesRef.current[song.id]) {
                                    songVolumesRef.current[song.id] = newVolume
                                  }
                                })
                              }
                            } catch (error) {
                              console.error('[RandomPlayDance] 볼륨 바 위치 계산 실패:', error)
                              isDraggingVolumeRef.current = false
                            }
                          }

                          // 초기 클릭 위치로 볼륨 조절
                          updateVolume(e.clientX)

                          // 마우스 이동 이벤트
                          const handleMouseMove = (moveEvent: MouseEvent) => {
                            if (!isDraggingVolumeRef.current) return
                            updateVolume(moveEvent.clientX)
                          }

                          // 마우스 업 이벤트
                          const handleMouseUp = () => {
                            isDraggingVolumeRef.current = false
                            document.removeEventListener('mousemove', handleMouseMove)
                            document.removeEventListener('mouseup', handleMouseUp)
                          }

                          document.addEventListener('mousemove', handleMouseMove)
                          document.addEventListener('mouseup', handleMouseUp)
                        }}
                        onClick={(e) => {
                          // 클릭 이벤트는 onMouseDown에서 처리되므로 여기서는 중복 방지
                          e.stopPropagation()
                        }}
                      >
                        <div 
                          className="absolute top-0 left-0 h-full bg-black dark:bg-white rounded-full transition-all duration-300"
                          style={{ width: `${volume}%` }}
                        ></div>
                        {/* 볼륨 핸들 - 동그라미 */}
                        <div 
                          className="absolute top-1/2 rounded-full transition-all duration-300 group-hover:scale-125"
                          style={{ 
                            left: `${volume}%`,
                            transform: 'translate(-50%, -50%)',
                            width: '14px',
                            height: '14px',
                            backgroundColor: '#000000',
                            border: '2px solid #ffffff',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.5)',
                            zIndex: 10
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 플레이리스트 편집 모달 */}
      {isAdmin && (
        <DancePlaylistEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          playlist={playlist}
          onSuccess={handlePlaylistUpdate}
        />
      )}

    </div>
  )
}

// 스켈레톤 컴포넌트
function RandomPlayDanceSkeleton() {
  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4 md:p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
      <Skeleton className="h-20 w-full mt-6 rounded-lg" />
    </div>
  )
}

