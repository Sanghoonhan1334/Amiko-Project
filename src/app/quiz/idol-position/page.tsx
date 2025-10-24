'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bookmark, Heart, Target, Share2, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react'
import Header from '@/components/layout/Header'
import { useLanguage } from '@/context/LanguageContext'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { useAuth } from '@/context/AuthContext'

interface QuizData {
  id: string
  title: string
  description: string
  thumbnail_url: string | null
  total_questions: number
  total_participants: number
  created_at: string
  updated_at: string
}

export default function IdolPositionTestPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const { user } = useAuth()
  const [isStarting, setIsStarting] = useState(false)
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 상호작용 버튼 상태
  const [isSaved, setIsSaved] = useState(false)
  const [isFun, setIsFun] = useState(false)
  const [isAccurate, setIsAccurate] = useState(false)
  const [funCount, setFunCount] = useState(0)
  const [accurateCount, setAccurateCount] = useState(0)
  
  // 댓글 상태
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(true)
  
  // 답글 상태
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)

  // 데이터베이스에서 퀴즈 데이터 가져오기
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', 'dea20361-fd46-409d-880f-f91869c1d184')
          .single()

        if (error) {
          throw error
        }

        setQuizData(data)
      } catch (err) {
        console.error('퀴즈 데이터 로딩 실패:', err)
        setError('퀴즈 데이터를 불러올 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchQuizData()
    
    // 로컬 스토리지 정리 (SQL 테이블로 마이그레이션 후)
    cleanupLocalStorage()
  }, [])

  // 상호작용 데이터와 댓글 가져오기
  useEffect(() => {
    if (quizData) {
      fetchInteractionData()
      fetchComments()
    }
  }, [quizData])

  // 사용자 정보가 변경될 때마다 상호작용 상태 다시 확인
  useEffect(() => {
    if (quizData && user) {
      fetchInteractionData()
    }
  }, [user, quizData])

  // 상호작용 데이터 가져오기 (임시로 로컬 스토리지 사용)
  const fetchInteractionData = async () => {
    try {
      // 임시로 더미 데이터 사용
      setFunCount(0)
      setAccurateCount(0)
      setIsFun(false)
      setIsAccurate(false)

      // 저장 상태는 간단히 로컬 스토리지 사용
      if (user) {
        const savedQuizzes = JSON.parse(localStorage.getItem('saved_quizzes') || '[]')
        setIsSaved(savedQuizzes.includes(quizData?.id))
      }
    } catch (error) {
      console.error('상호작용 데이터 로딩 실패:', error)
    }
  }

  // 댓글 가져오기 (임시로 로컬 스토리지 사용)
  const fetchComments = async () => {
    try {
      setCommentsLoading(true)
      
      // 임시로 로컬 스토리지에서 댓글 목록 가져오기
      const allComments = JSON.parse(localStorage.getItem('quiz_comments_temp') || '[]')
      
      // 현재 퀴즈의 댓글만 필터링
      const quizComments = allComments.filter(comment => comment.quiz_id === quizData?.id)
      
      // 사용자 정보 추가
      const commentsWithUsers = quizComments.map(comment => ({
        ...comment,
        users: {
          full_name: comment.user_name || 'Usuario',
          avatar_url: null
        }
      }))
      
      setComments(commentsWithUsers)
    } catch (error) {
      console.error('댓글 로딩 실패:', error)
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/community/tests')
  }

  const handleStart = () => {
    setIsStarting(true)
    // 커버 페이지로 이동
    router.push('/quiz/idol-position/cover')
  }

  // 상호작용 버튼 핸들러들
  const handleSave = async () => {
    if (!user) {
      alert(language === 'es' ? 'Por favor, inicia sesión para guardar el test.' : '테스트를 저장하려면 로그인해주세요.')
      return
    }
    
    try {
      const savedQuizzes = JSON.parse(localStorage.getItem('saved_quizzes') || '[]')
      
      if (isSaved) {
        // 저장 취소
        const updatedQuizzes = savedQuizzes.filter((id: string) => id !== quizData?.id)
        localStorage.setItem('saved_quizzes', JSON.stringify(updatedQuizzes))
        setIsSaved(false)
      } else {
        // 저장
        savedQuizzes.push(quizData?.id)
        localStorage.setItem('saved_quizzes', JSON.stringify(savedQuizzes))
        setIsSaved(true)
      }
    } catch (error) {
      console.error('저장 실패:', error)
    }
  }

  const handleFun = async () => {
    if (!user) {
      alert(language === 'es' ? 'Por favor, inicia sesión para dar like.' : '좋아요를 누르려면 로그인해주세요.')
      return
    }
    
    try {
      const supabase = createClientComponentClient()
      
      if (isFun) {
        // 재밌어요 취소
        await supabase
          .from('quiz_reactions')
          .delete()
          .eq('quiz_id', quizData?.id)
          .eq('user_id', user.id)
          .eq('reaction_type', 'fun')
        setIsFun(false)
        setFunCount(prev => Math.max(0, prev - 1))
      } else {
        // 재밌어요 추가
        await supabase
          .from('quiz_reactions')
          .insert({ 
            quiz_id: quizData?.id, 
            user_id: user.id, 
            reaction_type: 'fun' 
          })
        setIsFun(true)
        setFunCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('재밌어요 실패:', error)
    }
  }

  const handleAccurate = async () => {
    if (!user) {
      alert(language === 'es' ? 'Por favor, inicia sesión para calificar.' : '평가하려면 로그인해주세요.')
      return
    }
    
    try {
      const supabase = createClientComponentClient()
      
      if (isAccurate) {
        // 정확해요 취소
        await supabase
          .from('quiz_reactions')
          .delete()
          .eq('quiz_id', quizData?.id)
          .eq('user_id', user.id)
          .eq('reaction_type', 'accurate')
        setIsAccurate(false)
        setAccurateCount(prev => Math.max(0, prev - 1))
      } else {
        // 정확해요 추가
        await supabase
          .from('quiz_reactions')
          .insert({ 
            quiz_id: quizData?.id, 
            user_id: user.id, 
            reaction_type: 'accurate' 
          })
        setIsAccurate(true)
        setAccurateCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('정확해요 실패:', error)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: quizData?.title,
          text: quizData?.description,
          url: window.location.href
        })
      } else {
        // 클립보드에 URL 복사
        await navigator.clipboard.writeText(window.location.href)
        alert(language === 'es' ? 'URL copiada al portapapeles' : 'URL이 클립보드에 복사되었습니다')
      }
    } catch (error) {
      console.error('공유 실패:', error)
    }
  }

  // 댓글 작성 (로컬 스토리지 사용)
  const handleCommentSubmit = async () => {
    if (!user) {
      alert(language === 'es' ? 'Por favor, inicia sesión para comentar.' : '댓글을 작성하려면 로그인해주세요.')
      return
    }
    
    if (!newComment.trim()) return
    
    try {
      setCommentLoading(true)
      
      // 임시로 로컬 스토리지에서 댓글 목록 가져오기
      const existingComments = JSON.parse(localStorage.getItem('quiz_comments_temp') || '[]')
      
      // 새 댓글 생성
      const newCommentObj = {
        id: Date.now().toString(),
        quiz_id: quizData?.id,
        user_id: user.id,
        user_name: user.email || 'Usuario',
        content: newComment.trim(),
        like_count: 0,
        dislike_count: 0,
        replies: [],
        created_at: new Date().toISOString()
      }
      
      // 댓글 추가
      existingComments.unshift(newCommentObj)
      
      // 로컬 스토리지에 저장
      localStorage.setItem('quiz_comments_temp', JSON.stringify(existingComments))
      
      console.log('댓글 작성 성공:', newCommentObj)
      setNewComment('')
      await fetchComments() // 댓글 목록 새로고침
    } catch (error) {
      console.error('댓글 작성 실패:', error)
      alert(language === 'es' ? 'Error al escribir el comentario' : '댓글 작성 중 오류가 발생했습니다')
    } finally {
      setCommentLoading(false)
    }
  }

  // 답글 작성 (임시로 로컬 스토리지 사용)
  const handleReplySubmit = async (parentCommentId: string) => {
    if (!user) {
      alert(language === 'es' ? 'Por favor, inicia sesión para responder.' : '답글을 작성하려면 로그인해주세요.')
      return
    }
    
    if (!replyText.trim()) return
    
    try {
      setReplyLoading(true)
      
      // 임시로 로컬 스토리지에서 댓글 목록 가져오기
      const existingComments = JSON.parse(localStorage.getItem('quiz_comments_temp') || '[]')
      
      // 새 답글 생성
      const newReply = {
        id: Date.now().toString(),
        user_id: user.id,
        user_name: user.email || 'Usuario',
        content: replyText.trim(),
        like_count: 0,
        dislike_count: 0,
        created_at: new Date().toISOString()
      }
      
      // 부모 댓글에 답글 추가
      const updatedComments = existingComments.map(comment => {
        if (comment.id === parentCommentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply]
          }
        }
        return comment
      })
      
      // 로컬 스토리지에 저장
      localStorage.setItem('quiz_comments_temp', JSON.stringify(updatedComments))
      
      console.log('답글 작성 성공:', newReply)
      setReplyText('')
      setReplyingTo(null)
      await fetchComments() // 댓글 목록 새로고침
    } catch (error) {
      console.error('답글 작성 실패:', error)
      alert(language === 'es' ? 'Error al escribir la respuesta' : '답글 작성 중 오류가 발생했습니다')
    } finally {
      setReplyLoading(false)
    }
  }

  // 좋아요/싫어요 토글 (임시로 로컬 스토리지 사용)
  const handleLikeToggle = async (commentId: string, reactionType: 'like' | 'dislike') => {
    if (!user) {
      alert(language === 'es' ? 'Por favor, inicia sesión para dar like.' : '좋아요를 누르려면 로그인해주세요.')
      return
    }

    try {
      // 임시로 로컬 스토리지에서 댓글 목록 가져오기
      const existingComments = JSON.parse(localStorage.getItem('quiz_comments_temp') || '[]')
      
      // 사용자의 기존 반응 확인
      const likeKey = `reaction_${commentId}_${user.id}_like`
      const dislikeKey = `reaction_${commentId}_${user.id}_dislike`
      const hasLiked = localStorage.getItem(likeKey)
      const hasDisliked = localStorage.getItem(dislikeKey)
      
      const updatedComments = existingComments.map(comment => {
        if (comment.id === commentId) {
          const currentLikeCount = comment.like_count || 0
          const currentDislikeCount = comment.dislike_count || 0
          
          if (reactionType === 'like') {
            if (hasLiked) {
              // 좋아요 취소
              localStorage.removeItem(likeKey)
              return {
                ...comment,
                like_count: Math.max(0, currentLikeCount - 1)
              }
            } else {
              // 좋아요 추가 (싫어요가 있으면 취소)
              if (hasDisliked) {
                localStorage.removeItem(dislikeKey)
                localStorage.setItem(likeKey, 'true')
                return {
                  ...comment,
                  like_count: currentLikeCount + 1,
                  dislike_count: Math.max(0, currentDislikeCount - 1)
                }
              } else {
                localStorage.setItem(likeKey, 'true')
                return {
                  ...comment,
                  like_count: currentLikeCount + 1
                }
              }
            }
          } else { // dislike
            if (hasDisliked) {
              // 싫어요 취소
              localStorage.removeItem(dislikeKey)
              return {
                ...comment,
                dislike_count: Math.max(0, currentDislikeCount - 1)
              }
            } else {
              // 싫어요 추가 (좋아요가 있으면 취소)
              if (hasLiked) {
                localStorage.removeItem(likeKey)
                localStorage.setItem(dislikeKey, 'true')
                return {
                  ...comment,
                  dislike_count: currentDislikeCount + 1,
                  like_count: Math.max(0, currentLikeCount - 1)
                }
              } else {
                localStorage.setItem(dislikeKey, 'true')
                return {
                  ...comment,
                  dislike_count: currentDislikeCount + 1
                }
              }
            }
          }
        }
        return comment
      })
      
      // 로컬 스토리지에 저장
      localStorage.setItem('quiz_comments_temp', JSON.stringify(updatedComments))
      
      // 댓글 목록 새로고침
      await fetchComments()
    } catch (error) {
      console.error('반응 토글 실패:', error)
      alert(language === 'es' ? 'Error al procesar la reacción' : '반응 처리 중 오류가 발생했습니다')
    }
  }

  // 답글의 좋아요/싫어요 토글
  const handleReplyLikeToggle = async (parentCommentId: string, replyId: string, reactionType: 'like' | 'dislike') => {
    if (!user) {
      alert(language === 'es' ? 'Por favor, inicia sesión para dar like.' : '좋아요를 누르려면 로그인해주세요.')
      return
    }

    try {
      // 임시로 로컬 스토리지에서 댓글 목록 가져오기
      const existingComments = JSON.parse(localStorage.getItem('quiz_comments_temp') || '[]')
      
      // 사용자의 기존 반응 확인
      const likeKey = `reply_reaction_${replyId}_${user.id}_like`
      const dislikeKey = `reply_reaction_${replyId}_${user.id}_dislike`
      const hasLiked = localStorage.getItem(likeKey)
      const hasDisliked = localStorage.getItem(dislikeKey)
      
      const updatedComments = existingComments.map(comment => {
        if (comment.id === parentCommentId) {
          const updatedReplies = comment.replies?.map(reply => {
            if (reply.id === replyId) {
              const currentLikeCount = reply.like_count || 0
              const currentDislikeCount = reply.dislike_count || 0
              
              if (reactionType === 'like') {
                if (hasLiked) {
                  // 좋아요 취소
                  localStorage.removeItem(likeKey)
                  return {
                    ...reply,
                    like_count: Math.max(0, currentLikeCount - 1)
                  }
                } else {
                  // 좋아요 추가 (싫어요가 있으면 취소)
                  if (hasDisliked) {
                    localStorage.removeItem(dislikeKey)
                    localStorage.setItem(likeKey, 'true')
                    return {
                      ...reply,
                      like_count: currentLikeCount + 1,
                      dislike_count: Math.max(0, currentDislikeCount - 1)
                    }
                  } else {
                    localStorage.setItem(likeKey, 'true')
                    return {
                      ...reply,
                      like_count: currentLikeCount + 1
                    }
                  }
                }
              } else { // dislike
                if (hasDisliked) {
                  // 싫어요 취소
                  localStorage.removeItem(dislikeKey)
                  return {
                    ...reply,
                    dislike_count: Math.max(0, currentDislikeCount - 1)
                  }
                } else {
                  // 싫어요 추가 (좋아요가 있으면 취소)
                  if (hasLiked) {
                    localStorage.removeItem(likeKey)
                    localStorage.setItem(dislikeKey, 'true')
                    return {
                      ...reply,
                      dislike_count: currentDislikeCount + 1,
                      like_count: Math.max(0, currentLikeCount - 1)
                    }
                  } else {
                    localStorage.setItem(dislikeKey, 'true')
                    return {
                      ...reply,
                      dislike_count: currentDislikeCount + 1
                    }
                  }
                }
              }
            }
            return reply
          }) || []
          
          return { ...comment, replies: updatedReplies }
        }
        return comment
      })
      
      // 로컬 스토리지에 저장
      localStorage.setItem('quiz_comments_temp', JSON.stringify(updatedComments))
      
      // 댓글 목록 새로고침
      await fetchComments()
    } catch (error) {
      console.error('답글 반응 토글 실패:', error)
      alert(language === 'es' ? 'Error al procesar la reacción' : '반응 처리 중 오류가 발생했습니다')
    }
  }

  // 답글 접기/펼치기 토글
  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies)
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId)
    } else {
      newExpanded.add(commentId)
    }
    setExpandedReplies(newExpanded)
  }

  // 로컬 스토리지 정리 (기존 데이터 마이그레이션 후 정리)
  const cleanupLocalStorage = () => {
    if (localStorage.getItem('quiz_comments')) {
      localStorage.removeItem('quiz_comments')
      console.log('로컬 스토리지 댓글 데이터 정리 완료')
    }
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {language === 'es' ? 'Cargando test...' : '테스트 로딩 중...'}
          </p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error || !quizData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            {language === 'es' ? 'Error al cargar el test' : '테스트 로드 중 오류 발생'}
          </p>
          <Button onClick={handleBack} variant="outline">
            {language === 'es' ? 'Volver' : '돌아가기'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* 테스트 소개 페이지 */}
      <div className="pt-32 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 뒤로가기 버튼 */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="bg-white">
            {/* 제목과 메타데이터 */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {quizData.title}
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  <span>{language === 'es' ? 'AMIKO' : '푸망'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-400"></div>
                  <span>{quizData.total_participants.toLocaleString()}만</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-400"></div>
                  <span>{language === 'es' ? `Aprox. ${quizData.total_questions} min` : `약 ${quizData.total_questions}분`}</span>
                </div>
              </div>
            </div>

            {/* 썸네일 이미지 */}
            <div className="mb-6">
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                {/* 실제 썸네일 이미지를 배경으로 사용 */}
                <img 
                  src={quizData.thumbnail_url || "/quizzes/idol-position/thumbnail.png"} 
                  alt={quizData.title}
                  className="w-full h-full object-cover"
                />
                
                {/* 그라데이션 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/60 to-purple-500/60"></div>
                
                {/* 이미지 오버레이 텍스트 */}
                <div className="absolute top-4 left-4 right-4">
                  <p className="text-white text-sm font-medium drop-shadow-lg">
                    {language === 'es' ? 'Encuentra la posición perfecta para ti' : '나와 꼭 맞는 포지션 찾기'}
                  </p>
                </div>
                <div className="absolute bottom-8 left-4 right-4">
                  <h2 className="text-white text-xl font-bold mb-2 drop-shadow-lg">
                    {language === 'es' ? '¿Qué posición de idol me quedaría mejor?' : '나에게 어울리는 아이돌 포지션은?'}
                  </h2>
                </div>
                
                {/* 다이아몬드 모양과 실루엣 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 border-2 border-white/30 rounded-lg transform rotate-45 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white/20 rounded-lg transform -rotate-45 flex items-center justify-center">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 설명 텍스트 */}
            <div className="mb-6">
              <p className="text-gray-800 text-base leading-relaxed mb-3">
                {quizData.description}
              </p>
              
              <div className="space-y-2 mb-4">
                <p className="text-gray-700">
                  {language === 'es' ? '¿Maknae del equipo 😊?' : '팀 막내😊?'}
                </p>
                <p className="text-gray-700">
                  {language === 'es' ? '¿Bailarín principal 💃?' : '메인 댄서💃?'}
                </p>
                <p className="text-gray-700">
                  {language === 'es' ? '¿Centro definitivo ✨?' : '확신의 센터✨?'}
                </p>
              </div>
              
              <p className="text-gray-800 font-medium">
                {language === 'es' 
                  ? '¿En qué posición debutaré? 🎤 ¡Descubrámoslo ahora!'
                  : '과연 나는 어떤 포지션으로 데뷔할까? 🎤 지금 알아보자!'
                }
              </p>
            </div>

            {/* 해시태그 */}
            <div className="flex gap-2 mb-6">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                #{language === 'es' ? 'idol' : '아이돌'}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                #{language === 'es' ? 'test' : '유형테스트'}
              </span>
            </div>

            {/* 테스트 시작 버튼 */}
            <div className="mb-6">
              <Button
                onClick={handleStart}
                disabled={isStarting}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 text-lg font-semibold rounded-lg"
              >
                {isStarting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>{language === 'es' ? 'Cargando...' : '로딩 중...'}</span>
                  </div>
                ) : (
                  language === 'es' ? 'Comenzar Test' : '테스트 시작'
                )}
              </Button>
            </div>

            {/* 상호작용 버튼들 */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <button 
                onClick={handleSave}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
                  isSaved ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'text-blue-600 fill-current' : 'text-gray-600'}`} />
                <span className="text-xs">{language === 'es' ? 'Guardar' : '저장하기'}</span>
              </button>
              
              <button 
                onClick={handleFun}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
                  isFun ? 'bg-red-50 text-red-600' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFun ? 'text-red-600 fill-current' : 'text-gray-600'}`} />
                <span className="text-xs">{language === 'es' ? 'Divertido' : '재밌어요'}</span>
                <span className="text-xs text-gray-500">{funCount}</span>
              </button>
              
              <button 
                onClick={handleAccurate}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
                  isAccurate ? 'bg-green-50 text-green-600' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Target className={`w-5 h-5 ${isAccurate ? 'text-green-600 fill-current' : 'text-gray-600'}`} />
                <span className="text-xs">{language === 'es' ? 'Preciso' : '정확해요'}</span>
                <span className="text-xs text-gray-500">{accurateCount}</span>
              </button>
              
              <button 
                onClick={handleShare}
                className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-xs">{language === 'es' ? 'Compartir' : '공유하기'}</span>
              </button>
            </div>

            {/* 댓글 섹션 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {language === 'es' ? `Comentarios (${comments.length})` : `댓글 (${comments.length})`}
              </h3>
              
              {/* 댓글 입력 */}
              <div className="mb-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={language === 'es' ? 'Quiero escuchar tu historia :D' : '너의 얘기가 듣고 싶어 :D'}
                    className="flex-1 bg-transparent text-gray-600 placeholder-gray-400 outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                  />
                  <button 
                    onClick={handleCommentSubmit}
                    disabled={commentLoading || !newComment.trim()}
                    className="p-1 disabled:opacity-50"
                  >
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      {commentLoading ? (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      ) : (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* 댓글 목록 */}
              {commentsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      {language === 'es' ? 'No hay comentarios aún. ¡Sé el primero en comentar!' : '아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!'}
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="space-y-3">
                        {/* 메인 댓글 */}
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {comment.users?.full_name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {comment.users?.full_name || 'Usuario'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-800 mb-2">{comment.content}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <button 
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="hover:text-gray-700"
                              >
                                {language === 'es' ? 'Respuesta' : '답글'}
                              </button>
                              <button 
                                onClick={() => toggleReplies(comment.id)}
                                className="hover:text-gray-700"
                              >
                                {language === 'es' 
                                  ? `Respuestas ${comment.replies?.length || 0}` 
                                  : `답글 ${comment.replies?.length || 0}`
                                }
                              </button>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleLikeToggle(comment.id, 'like')}
                                  className={`flex items-center gap-1 hover:text-blue-500 ${
                                    localStorage.getItem(`reaction_${comment.id}_${user?.id}_like`) 
                                      ? 'text-blue-500' 
                                      : 'text-gray-500'
                                  }`}
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                  <span>{comment.like_count || 0}</span>
                                </button>
                                <button 
                                  onClick={() => handleLikeToggle(comment.id, 'dislike')}
                                  className={`flex items-center gap-1 hover:text-red-500 ${
                                    localStorage.getItem(`reaction_${comment.id}_${user?.id}_dislike`) 
                                      ? 'text-red-500' 
                                      : 'text-gray-500'
                                  }`}
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                  <span>{comment.dislike_count || 0}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 답글 입력 */}
                        {replyingTo === comment.id && (
                          <div className="ml-11">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                              <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={language === 'es' ? 'Escribe tu respuesta...' : '답글을 작성하세요...'}
                                className="flex-1 bg-transparent text-gray-600 placeholder-gray-400 outline-none"
                                onKeyPress={(e) => e.key === 'Enter' && handleReplySubmit(comment.id)}
                              />
                              <button 
                                onClick={() => handleReplySubmit(comment.id)}
                                disabled={replyLoading || !replyText.trim()}
                                className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:opacity-50"
                              >
                                {replyLoading ? '...' : (language === 'es' ? 'Enviar' : '전송')}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 답글 목록 */}
                        {expandedReplies.has(comment.id) && comment.replies && comment.replies.length > 0 && (
                          <div className="ml-11 space-y-3">
                            {comment.replies.map((reply: any) => (
                              <div key={reply.id} className="flex gap-3">
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-600">
                                    {reply.user_name?.charAt(0) || 'U'}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-gray-900">
                                      {reply.user_name || 'Usuario'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(reply.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-gray-800 mb-2">{reply.content}</p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <button 
                                      onClick={() => handleReplyLikeToggle(comment.id, reply.id, 'like')}
                                      className={`flex items-center gap-1 hover:text-blue-500 ${
                                        localStorage.getItem(`reply_reaction_${reply.id}_${user?.id}_like`) 
                                          ? 'text-blue-500' 
                                          : 'text-gray-500'
                                      }`}
                                    >
                                      <ThumbsUp className="w-3 h-3" />
                                      <span>{reply.like_count || 0}</span>
                                    </button>
                                    <button 
                                      onClick={() => handleReplyLikeToggle(comment.id, reply.id, 'dislike')}
                                      className={`flex items-center gap-1 hover:text-red-500 ${
                                        localStorage.getItem(`reply_reaction_${reply.id}_${user?.id}_dislike`) 
                                          ? 'text-red-500' 
                                          : 'text-gray-500'
                                      }`}
                                    >
                                      <ThumbsDown className="w-3 h-3" />
                                      <span>{reply.dislike_count || 0}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}