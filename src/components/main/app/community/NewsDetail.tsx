'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Share2, ThumbsUp, ThumbsDown, MessageCircle, Edit, Trash2,
  Pin, PinOff, CornerDownRight, Pencil, Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { shareContent } from '@/lib/share-utils'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import AuthorName from '@/components/common/AuthorName'

// ─── Types ──────────────────────────────────────────────
interface NewsDetailProps {
  news: {
    id: number
    title: string
    title_es?: string
    source: string
    date: string
    thumbnail: string
    content: string
    content_es?: string
    author?: string
    views?: number
    likes?: number
    dislikes?: number
    comments?: number
    celebrity?: string
    originalUrl?: string
    is_pinned?: boolean
  }
  onBack: () => void
  showSpanish?: boolean
  isAdmin?: boolean
  onEdit?: (news: any) => void
  onDelete?: (newsId: number) => void
  onPin?: (newsId: number, isPinned: boolean) => void
}

interface Comment {
  id: string
  content: string
  like_count: number
  dislike_count: number
  created_at: string
  updated_at: string
  parent_id: string | null
  author_id: string
  user_vote?: string | null
  users?: {
    id: string
    full_name?: string
    nickname?: string
    korean_name?: string
    spanish_name?: string
    avatar_url?: string
  } | null
  replies: Comment[]
}

// ─── Component ──────────────────────────────────────────
export default function NewsDetail({
  news,
  onBack,
  showSpanish = false,
  isAdmin = false,
  onEdit,
  onDelete,
  onPin,
}: NewsDetailProps) {
  const { language } = useLanguage()
  const { user, token } = useAuth()
  const t = (ko: string, es: string) => (language === 'ko' ? ko : es)

  // ── Empty guard ──────────────────────────────────────
  if (!news) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <Button onClick={onBack} variant="outline" size="sm" className="text-xs md:text-sm px-2 md:px-4 py-1 md:py-2">
            {t('목록으로', 'Volver')}
          </Button>
        </div>
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <p className="text-lg font-medium mb-2">{t('뉴스를 찾을 수 없습니다', 'No se encontró la noticia')}</p>
          </div>
        </Card>
      </div>
    )
  }

  // ── State ────────────────────────────────────────────
  const [likeCount, setLikeCount] = useState(news.likes || 0)
  const [dislikeCount, setDislikeCount] = useState(news.dislikes || 0)
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null)
  const [votingInProgress, setVotingInProgress] = useState(false)

  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const [isDeleting, setIsDeleting] = useState(false)
  const [isPinning, setIsPinning] = useState(false)

  // ── Increment view count on mount ────────────────────
  useEffect(() => {
    if (news.id) {
      fetch(`/api/news/${news.id}/increment-view`, { method: 'POST' }).catch(() => {})
    }
  }, [news.id])

  // ── Load comments on mount ───────────────────────────
  const fetchComments = useCallback(async () => {
    setCommentsLoading(true)
    try {
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {}
      const res = await fetch(`/api/news/${news.id}/comments`, { headers })
      if (!res.ok) return
      const data = await res.json()
      const all = data.comments || []

      // Build tree
      const map = new Map<string, Comment>()
      const roots: Comment[] = []
      all.forEach((c: any) => map.set(c.id, { ...c, replies: [] }))
      all.forEach((c: any) => {
        const node = map.get(c.id)!
        if (c.parent_id && map.has(c.parent_id)) {
          map.get(c.parent_id)!.replies.push(node)
        } else {
          roots.push(node)
        }
      })
      setComments(roots)
    } catch (err) {
      console.error('댓글 로드 오류:', err)
    } finally {
      setCommentsLoading(false)
    }
  }, [news.id, token])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // ── Vote on news ─────────────────────────────────────
  const handleVote = async (type: 'like' | 'dislike') => {
    if (!user || !token) {
      toast.error(t('로그인이 필요합니다.', 'Necesitas iniciar sesión.'))
      return
    }
    if (votingInProgress) return
    setVotingInProgress(true)
    try {
      const res = await fetch(`/api/news/${news.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vote_type: type }),
      })
      if (res.ok) {
        const data = await res.json()
        setLikeCount(data.like_count)
        setDislikeCount(data.dislike_count)
        setUserVote(data.vote_type)
        toast.success(
          data.vote_type === null
            ? t('투표가 취소되었습니다.', 'Voto cancelado.')
            : data.vote_type === 'like'
            ? t('좋아요!', '¡Me gusta!')
            : t('싫어요', 'No me gusta'),
        )
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || t('투표에 실패했습니다.', 'Error al votar.'))
      }
    } catch {
      toast.error(t('오류가 발생했습니다.', 'Ocurrió un error.'))
    } finally {
      setVotingInProgress(false)
    }
  }

  // ── Submit comment ───────────────────────────────────
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return
    if (!user || !token) {
      toast.error(t('로그인이 필요합니다.', 'Necesitas iniciar sesión.'))
      return
    }
    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/news/${news.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      if (res.ok) {
        setNewComment('')
        toast.success(t('댓글이 작성되었습니다!', '¡Comentario publicado!'))
        await fetchComments()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || t('댓글 작성에 실패했습니다.', 'Error al publicar comentario.'))
      }
    } catch {
      toast.error(t('오류가 발생했습니다.', 'Ocurrió un error.'))
    } finally {
      setSubmittingComment(false)
    }
  }

  // ── Submit reply ─────────────────────────────────────
  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return
    if (!user || !token) {
      toast.error(t('로그인이 필요합니다.', 'Necesitas iniciar sesión.'))
      return
    }
    setSubmittingReply(true)
    try {
      const res = await fetch(`/api/news/${news.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: replyContent.trim(), parent_id: parentId }),
      })
      if (res.ok) {
        setReplyContent('')
        setReplyingTo(null)
        toast.success(t('답글이 작성되었습니다!', '¡Respuesta publicada!'))
        await fetchComments()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || t('답글 작성에 실패했습니다.', 'Error al publicar respuesta.'))
      }
    } catch {
      toast.error(t('오류가 발생했습니다.', 'Ocurrió un error.'))
    } finally {
      setSubmittingReply(false)
    }
  }

  // ── Edit comment ─────────────────────────────────────
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return
    try {
      const res = await fetch(`/api/news/${news.id}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: editContent.trim() }),
      })
      if (res.ok) {
        setEditContent('')
        setEditingComment(null)
        toast.success(t('댓글이 수정되었습니다!', '¡Comentario actualizado!'))
        await fetchComments()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || t('댓글 수정에 실패했습니다.', 'Error al actualizar comentario.'))
      }
    } catch {
      toast.error(t('오류가 발생했습니다.', 'Ocurrió un error.'))
    }
  }

  // ── Delete comment ───────────────────────────────────
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm(t('댓글을 삭제하시겠습니까?', '¿Eliminar este comentario?'))) return
    try {
      const res = await fetch(`/api/news/${news.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        toast.success(t('댓글이 삭제되었습니다!', '¡Comentario eliminado!'))
        await fetchComments()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || t('댓글 삭제에 실패했습니다.', 'Error al eliminar comentario.'))
      }
    } catch {
      toast.error(t('오류가 발생했습니다.', 'Ocurrió un error.'))
    }
  }

  // ── Vote on comment ──────────────────────────────────
  const handleCommentVote = async (commentId: string, type: 'like' | 'dislike') => {
    if (!user || !token) {
      toast.error(t('로그인이 필요합니다.', 'Necesitas iniciar sesión.'))
      return
    }
    try {
      const res = await fetch(`/api/news/${news.id}/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vote_type: type }),
      })
      if (res.ok) {
        await fetchComments()
      }
    } catch {
      toast.error(t('오류가 발생했습니다.', 'Ocurrió un error.'))
    }
  }

  // ── Admin: delete news ───────────────────────────────
  const handleDelete = async () => {
    if (!confirm(t('정말로 이 뉴스를 삭제하시겠습니까?', '¿Está seguro de eliminar esta noticia?'))) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/news?id=${news.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        toast.success(t('뉴스가 삭제되었습니다.', 'Noticia eliminada.'))
        onDelete?.(news.id)
        onBack()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || t('뉴스 삭제에 실패했습니다.', 'Error al eliminar la noticia.'))
      }
    } catch {
      toast.error(t('오류가 발생했습니다.', 'Ocurrió un error.'))
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Admin: pin/unpin ─────────────────────────────────
  const handlePin = async () => {
    setIsPinning(true)
    try {
      const res = await fetch('/api/news', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: news.id, is_pinned: !news.is_pinned }),
      })
      if (res.ok) {
        toast.success(
          news.is_pinned
            ? t('고정이 해제되었습니다.', 'Noticia desfijada.')
            : t('뉴스가 고정되었습니다.', 'Noticia fijada.'),
        )
        onPin?.(news.id, !news.is_pinned)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || t('고정 상태 변경에 실패했습니다.', 'Error al cambiar estado de fijación.'))
      }
    } catch {
      toast.error(t('오류가 발생했습니다.', 'Ocurrió un error.'))
    } finally {
      setIsPinning(false)
    }
  }

  // ── Share ────────────────────────────────────────────
  const handleShare = async () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const webUrl = `${baseUrl}/community/news/${news.id}`
    const deepLink = `amiko://community/news/${news.id}`
    await shareContent({
      title: news.title,
      text: (news.content || '').substring(0, 100) + '...',
      url: webUrl,
      deepLink,
    })
  }

  // ── flatten comment count ────────────────────────────
  const totalComments = (() => {
    let count = 0
    const walk = (list: Comment[]) => { list.forEach(c => { count++; walk(c.replies) }) }
    walk(comments)
    return count
  })()

  // ── helper: author name ──────────────────────────────
  const commentAuthorName = (c: Comment) =>
    c.users?.nickname || c.users?.korean_name || c.users?.spanish_name || c.users?.full_name || t('익명', 'Anónimo')

  // ── render a single comment row ──────────────────────
  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={`${depth > 0 ? 'ml-6 md:ml-10 border-l-2 border-gray-100 dark:border-gray-700 pl-3 md:pl-4' : ''}`}>
      <div className="py-3 first:pt-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {depth > 0 && <CornerDownRight className="w-3 h-3 text-gray-400 shrink-0" />}
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              <AuthorName userId={comment.author_id} name={commentAuthorName(comment)} />
            </span>
            <span className="text-xs text-gray-400">
              {new Date(comment.created_at).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'es-ES', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>

          {/* Actions (own comment or admin) */}
          {user && (comment.author_id === user.id || isAdmin) && (
            <div className="flex items-center gap-1">
              {comment.author_id === user.id && (
                <button
                  className="text-gray-400 hover:text-blue-500 p-1"
                  title={t('수정', 'Editar')}
                  onClick={() => { setEditingComment(comment.id); setEditContent(comment.content) }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                className="text-gray-400 hover:text-red-500 p-1"
                title={t('삭제', 'Eliminar')}
                onClick={() => handleDeleteComment(comment.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Content or Edit form */}
        {editingComment === comment.id ? (
          <div className="mb-2">
            <Textarea
              rows={2}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="text-sm resize-none mb-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setEditingComment(null)}>
                {t('취소', 'Cancelar')}
              </Button>
              <Button size="sm" className="text-xs bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleEditComment(comment.id)}>
                {t('저장', 'Guardar')}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line mb-1.5">{comment.content}</p>
        )}

        {/* Bottom actions: vote + reply */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <button
            className={`flex items-center gap-0.5 hover:text-blue-500 transition-colors ${comment.user_vote === 'like' ? 'text-blue-500 font-semibold' : ''}`}
            onClick={() => handleCommentVote(comment.id, 'like')}
          >
            <ThumbsUp className="w-3 h-3" /> {comment.like_count || 0}
          </button>
          <button
            className={`flex items-center gap-0.5 hover:text-red-500 transition-colors ${comment.user_vote === 'dislike' ? 'text-red-500 font-semibold' : ''}`}
            onClick={() => handleCommentVote(comment.id, 'dislike')}
          >
            <ThumbsDown className="w-3 h-3" /> {comment.dislike_count || 0}
          </button>
          {depth === 0 && (
            <button
              className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyContent('') }}
            >
              <MessageCircle className="w-3 h-3 inline mr-0.5" />
              {t('답글', 'Responder')}
            </button>
          )}
        </div>

        {/* Reply form */}
        {replyingTo === comment.id && (
          <div className="mt-2 ml-2">
            <Textarea
              rows={2}
              placeholder={t('답글을 입력하세요…', 'Escribe una respuesta…')}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="text-sm resize-none mb-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setReplyingTo(null)}>
                {t('취소', 'Cancelar')}
              </Button>
              <Button
                size="sm"
                className="text-xs bg-blue-500 hover:bg-blue-600 text-white"
                disabled={submittingReply || !replyContent.trim()}
                onClick={() => handleSubmitReply(comment.id)}
              >
                {submittingReply ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>{t('답글 작성', 'Responder')}</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Recursive replies */}
      {comment.replies.length > 0 && (
        <div className="space-y-0">
          {comment.replies.map((reply) => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  )

  // ────────────────────────────────────────────────────
  // ── RENDER ─────────────────────────────────────────
  // ────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">
      {/* ─── News article card ─────────────────────────── */}
      <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        {/* Thumbnail */}
        <div className="w-full bg-gray-200 dark:bg-gray-700">
          {news.thumbnail ? (
            <img
              src={news.thumbnail}
              alt={news.title}
              className="w-full h-auto max-h-96 object-cover"
            />
          ) : (
            <div className="aspect-video w-full max-w-2xl mx-auto flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800">
              <div className="text-center">
                <div className="text-6xl mb-4">📰</div>
                <span className="text-blue-600 dark:text-blue-400 text-xl font-medium">
                  {t('뉴스', 'Noticias')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {/* Title + admin buttons */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  {showSpanish && news.title_es ? news.title_es : news.title}
                </h1>
                {news.is_pinned && (
                  <span className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 text-xs px-2 py-0.5 rounded-full">
                    <Pin className="w-3 h-3" />
                    {t('고정', 'Fijado')}
                  </span>
                )}
              </div>
            </div>

            {/* Admin buttons */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 ml-4 shrink-0">
                <Button variant="outline" size="sm" onClick={() => onEdit?.(news)} className="flex items-center gap-1 text-xs">
                  <Edit className="w-3.5 h-3.5" /> {t('수정', 'Editar')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePin}
                  disabled={isPinning}
                  className={`flex items-center gap-1 text-xs ${
                    news.is_pinned
                      ? 'text-yellow-600 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {news.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                  {isPinning ? '…' : news.is_pinned ? t('고정해제', 'Desfijar') : t('고정', 'Fijar')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-1 text-xs text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeleting ? '…' : t('삭제', 'Eliminar')}
                </Button>
              </div>
            )}
          </div>

          {/* Celebrity tag */}
          {news.celebrity && (
            <div className="mb-4">
              <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-sm px-3 py-1 rounded-full">
                {news.celebrity}
              </span>
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-4 flex-wrap">
            <span className="font-medium">{news.source}</span>
            <span>{t('날짜', 'Fecha')}: {news.date}</span>
            <span>{t('조회', 'Vistas')}: {(news.views || 0) + 1}</span>
          </div>

          {/* Article body */}
          <div className="prose max-w-none mb-8 dark:prose-invert">
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-base sm:text-lg">
              {(() => {
                const content = showSpanish && news.content_es ? news.content_es : news.content
                return content.replace(/\[이미지:\s*\d+\]/g, '')
              })()}
            </div>
          </div>

          {/* Original article link */}
          {news.originalUrl && (
            <div className="mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(news.originalUrl, '_blank')}
                className="flex items-center gap-2 text-xs md:text-sm"
              >
                <Share2 className="w-4 h-4" />
                {t('원본 기사 보기', 'Ver artículo original')}
              </Button>
            </div>
          )}

          {/* ─── Action bar: like / dislike / share ────── */}
          <div className="flex items-center justify-center gap-2 md:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote('like')}
              disabled={votingInProgress}
              className={`flex items-center gap-1.5 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 transition-colors ${
                userVote === 'like'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-400 text-green-600 dark:text-green-400'
                  : 'hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${userVote === 'like' ? 'fill-current' : ''}`} />
              {likeCount}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote('dislike')}
              disabled={votingInProgress}
              className={`flex items-center gap-1.5 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 transition-colors ${
                userVote === 'dislike'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-400 text-red-600 dark:text-red-400'
                  : 'hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300'
              }`}
            >
              <ThumbsDown className={`w-4 h-4 ${userVote === 'dislike' ? 'fill-current' : ''}`} />
              {dislikeCount}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs md:text-sm text-gray-600 dark:text-gray-400"
            >
              <Share2 className="w-4 h-4" />
              {t('공유', 'Compartir')}
            </Button>
          </div>
        </div>
      </Card>

      {/* ─── Comments section ──────────────────────────── */}
      <Card className="mt-4 md:mt-6 p-4 md:p-6 dark:bg-gray-800 dark:border-gray-700">
        <h2 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
          {t('댓글', 'Comentarios')} ({totalComments})
        </h2>

        {/* New comment form */}
        {!user ? (
          <div className="mb-4 p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
              {t('댓글을 작성하려면 로그인이 필요합니다.', 'Necesitas iniciar sesión para comentar.')}
            </p>
          </div>
        ) : (
          <div className="mb-4 md:mb-6">
            <Textarea
              placeholder={t('댓글을 작성해주세요…', 'Escribe un comentario…')}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="mb-2 border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none text-sm"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={submittingComment || !newComment.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2"
              >
                {submittingComment ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    {t('댓글 작성', 'Publicar')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Comments list */}
        {commentsLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{t('첫 번째 댓글을 작성해보세요!', '¡Sé el primero en comentar!')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {comments.map((c) => renderComment(c))}
          </div>
        )}
      </Card>
    </div>
  )
}
