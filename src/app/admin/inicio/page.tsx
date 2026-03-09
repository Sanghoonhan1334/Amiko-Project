'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  FileText, ImageIcon, History, Search, Trash2,
  Upload, Eye, EyeOff, ChevronUp, ChevronDown,
  Plus, AlertTriangle, Clock, User, Link2, RefreshCcw,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

// ────── Types ──────────────────────────────────────────────
interface Post {
  id: string
  title: string
  content: string
  category: string
  author_name: string
  like_count: number
  comment_count: number
  view_count: number
  created_at: string
  is_notice: boolean
  is_hot: boolean
}

interface Banner {
  id: string
  title_es: string
  title_ko: string | null
  description_es: string | null
  description_ko: string | null
  image_url: string
  link_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

interface DeletionHistoryItem {
  id: string
  content_type: 'post' | 'news'
  content_id: string
  content_title: string | null
  content_author: string | null
  deleted_by_email: string | null
  reason: string | null
  deleted_at: string
}

// ────── Page ────────────────────────────────────────────────
export default function AdminInicioPage() {
  const { language } = useLanguage()
  const { token } = useAuth()
  const router = useRouter()
  const t = (ko: string, es: string) => language === 'ko' ? ko : es

  // ── Posts state ───────────────────────────────────────────
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsPage, setPostsPage] = useState(1)
  const [postsTotalPages, setPostsTotalPages] = useState(1)
  const [postsTotal, setPostsTotal] = useState(0)
  const [postsSearch, setPostsSearch] = useState('')
  const [deletePostId, setDeletePostId] = useState<string | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [deletingPost, setDeletingPost] = useState(false)

  // ── Banners state ─────────────────────────────────────────
  const [banners, setBanners] = useState<Banner[]>([])
  const [bannersLoading, setBannersLoading] = useState(false)
  const [showBannerForm, setShowBannerForm] = useState(false)
  const [bannerForm, setBannerForm] = useState({
    title_es: '', title_ko: '',
    description_es: '', description_ko: '',
    link_url: '', is_active: true,
  })
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerFilePreview, setBannerFilePreview] = useState<string | null>(null)
  const [savingBanner, setSavingBanner] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── History state ─────────────────────────────────────────
  const [history, setHistory] = useState<DeletionHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // ── Authorization check ──────────────────────────────────
  useEffect(() => {
    if (!token) return
    // Quick operator check (will 403 on API calls if not admin)
    fetch('/api/admin/check-operator', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      if (!res.ok) router.push('/main?tab=home')
    }).catch(() => router.push('/main?tab=home'))
  }, [token, router])

  // ── Data loaders ─────────────────────────────────────────
  const loadPosts = useCallback(async (page = 1, search = '') => {
    setPostsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '20',
        ...(search ? { search } : {}),
      })
      const res = await fetch(`/api/admin/posts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setPosts(data.posts || [])
        setPostsTotalPages(data.pagination.totalPages || 1)
        setPostsTotal(data.pagination.total || 0)
        setPostsPage(page)
      }
    } catch (err) {
      console.error('loadPosts error:', err)
    } finally {
      setPostsLoading(false)
    }
  }, [token])

  const loadBanners = useCallback(async () => {
    setBannersLoading(true)
    try {
      const res = await fetch('/api/home-banners?all=true', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) setBanners(data.banners || [])
    } catch (err) {
      console.error('loadBanners error:', err)
    } finally {
      setBannersLoading(false)
    }
  }, [token])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/admin/deletion-history', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history || [])
      }
    } catch (err) {
      console.error('loadHistory error:', err)
    } finally {
      setHistoryLoading(false)
    }
  }, [token])

  // Load posts on mount
  useEffect(() => {
    if (token) loadPosts()
  }, [token, loadPosts])

  // ── Post actions ─────────────────────────────────────────
  const confirmDeletePost = async () => {
    if (!deletePostId) return
    setDeletingPost(true)
    try {
      const res = await fetch(`/api/posts/${deletePostId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: deleteReason || null }),
      })
      if (res.ok) {
        toast.success(t('게시글이 삭제되었습니다', 'Post eliminado exitosamente'))
        setDeletePostId(null)
        setDeleteReason('')
        loadPosts(postsPage, postsSearch)
      } else {
        const err = await res.json()
        toast.error(err.error || t('삭제 실패', 'Error al eliminar'))
      }
    } catch {
      toast.error(t('오류가 발생했습니다', 'Ocurrió un error'))
    } finally {
      setDeletingPost(false)
    }
  }

  // ── Banner actions ────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerFile(file)
    const url = URL.createObjectURL(file)
    setBannerFilePreview(url)
  }

  const handleUploadBanner = async () => {
    if (!bannerForm.title_es.trim()) {
      toast.error(t('제목(스페인어)을 입력하세요', 'Ingrese el título en español'))
      return
    }

    setSavingBanner(true)
    try {
      const fd = new FormData()
      fd.append('title_es', bannerForm.title_es)
      if (bannerForm.title_ko) fd.append('title_ko', bannerForm.title_ko)
      if (bannerForm.description_es) fd.append('description_es', bannerForm.description_es)
      if (bannerForm.description_ko) fd.append('description_ko', bannerForm.description_ko)
      if (bannerForm.link_url) fd.append('link_url', bannerForm.link_url)
      fd.append('is_active', String(bannerForm.is_active))
      fd.append('display_order', String(banners.length))

      if (bannerFile) {
        fd.append('image', bannerFile)
      } else {
        toast.error(t('이미지를 선택하세요', 'Seleccione una imagen'))
        setSavingBanner(false)
        return
      }

      const res = await fetch('/api/home-banners', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(t('배너가 추가되었습니다', 'Banner agregado exitosamente'))
        setShowBannerForm(false)
        setBannerForm({ title_es: '', title_ko: '', description_es: '', description_ko: '', link_url: '', is_active: true })
        setBannerFile(null)
        setBannerFilePreview(null)
        loadBanners()
      } else {
        toast.error(data.error || t('배너 추가 실패', 'Error al agregar banner'))
      }
    } catch {
      toast.error(t('오류가 발생했습니다', 'Ocurrió un error'))
    } finally {
      setSavingBanner(false)
    }
  }

  const handleToggleBannerActive = async (banner: Banner) => {
    try {
      const res = await fetch('/api/home-banners', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: banner.id, is_active: !banner.is_active }),
      })
      if (res.ok) {
        setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
        toast.success(
          !banner.is_active
            ? t('배너가 활성화되었습니다', 'Banner activado')
            : t('배너가 비활성화되었습니다', 'Banner desactivado')
        )
      }
    } catch {
      toast.error(t('오류가 발생했습니다', 'Ocurrió un error'))
    }
  }

  const handleMoveBanner = async (banner: Banner, direction: 'up' | 'down') => {
    const idx = banners.findIndex(b => b.id === banner.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= banners.length) return

    const swapBanner = banners[swapIdx]

    // Update display_order for both
    await Promise.all([
      fetch('/api/home-banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: banner.id, display_order: swapBanner.display_order }),
      }),
      fetch('/api/home-banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: swapBanner.id, display_order: banner.display_order }),
      }),
    ])

    // Reorder locally
    setBanners(prev => {
      const next = [...prev]
      const tmp = next[idx]
      next[idx] = { ...next[swapIdx], display_order: tmp.display_order }
      next[swapIdx] = { ...tmp, display_order: next[idx].display_order }
      return next
    })
  }

  const handleDeleteBanner = async (id: string) => {
    if (!confirm(t('이 배너를 삭제하시겠습니까?', '¿Eliminar este banner?'))) return
    try {
      const res = await fetch(`/api/home-banners?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        toast.success(t('배너가 삭제되었습니다', 'Banner eliminado'))
        setBanners(prev => prev.filter(b => b.id !== id))
      } else {
        toast.error(t('삭제 실패', 'Error al eliminar'))
      }
    } catch {
      toast.error(t('오류가 발생했습니다', 'Ocurrió un error'))
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('홈(인트로) 관리', 'Gestión de Inicio')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {t('게시글 삭제, 홈 배너 관리, 삭제 이력 확인', 'Eliminar posts, gestionar banners de inicio, ver historial de eliminaciones')}
        </p>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid grid-cols-3 w-full sm:w-auto">
          <TabsTrigger value="posts" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <FileText className="w-3.5 h-3.5" />
            {t('게시글', 'Posts')}
          </TabsTrigger>
          <TabsTrigger
            value="banners"
            className="flex items-center gap-1.5 text-xs sm:text-sm"
            onClick={() => { if (!banners.length) loadBanners() }}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            {t('배너', 'Banners')}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex items-center gap-1.5 text-xs sm:text-sm"
            onClick={() => { if (!history.length) loadHistory() }}
          >
            <History className="w-3.5 h-3.5" />
            {t('삭제 이력', 'Historial')}
          </TabsTrigger>
        </TabsList>

        {/* ─── POSTS TAB ──────────────────────────────────── */}
        <TabsContent value="posts" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder={t('제목 또는 내용으로 검색…', 'Buscar por título o contenido…')}
                value={postsSearch}
                onChange={(e) => setPostsSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') loadPosts(1, postsSearch)
                }}
              />
            </div>
            <Button variant="outline" onClick={() => loadPosts(1, postsSearch)} className="shrink-0">
              <Search className="w-4 h-4 mr-1.5" />
              {t('검색', 'Buscar')}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => loadPosts(postsPage, postsSearch)} title={t('새로고침', 'Actualizar')}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>

          {postsLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>{t('게시글이 없습니다', 'No hay posts')}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t(`총 ${postsTotal}개`, `${postsTotal} en total`)}
              </p>
              <div className="space-y-2">
                {posts.map((post) => (
                  <Card key={post.id} className="dark:bg-gray-800/60 dark:border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {post.is_notice && (
                              <Badge variant="secondary" className="text-xs">
                                {t('공지', 'Aviso')}
                              </Badge>
                            )}
                            {post.is_hot && (
                              <Badge className="text-xs bg-orange-500 hover:bg-orange-600">
                                HOT
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {post.category}
                            </Badge>
                          </div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {post.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                            {post.content}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" /> {post.author_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(post.created_at).toLocaleDateString(
                                language === 'ko' ? 'ko-KR' : 'es-ES',
                                { year: 'numeric', month: 'short', day: 'numeric' }
                              )}
                            </span>
                            <span>👁 {post.view_count}</span>
                            <span>❤️ {post.like_count}</span>
                            <span>💬 {post.comment_count}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => { setDeletePostId(post.id); setDeleteReason('') }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {postsTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline" size="sm"
                    disabled={postsPage <= 1}
                    onClick={() => loadPosts(postsPage - 1, postsSearch)}
                  >
                    ‹
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {postsPage} / {postsTotalPages}
                  </span>
                  <Button
                    variant="outline" size="sm"
                    disabled={postsPage >= postsTotalPages}
                    onClick={() => loadPosts(postsPage + 1, postsSearch)}
                  >
                    ›
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ─── BANNERS TAB ────────────────────────────────── */}
        <TabsContent value="banners" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t(
                  '홈(인트로) 화면의 이벤트 슬라이더 배너를 관리합니다.',
                  'Administra los banners del slider de eventos en la pantalla de inicio.'
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={loadBanners}>
                <RefreshCcw className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setShowBannerForm(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                {t('배너 추가', 'Agregar Banner')}
              </Button>
            </div>
          </div>

          {bannersLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="mb-3">{t('배너가 없습니다', 'No hay banners')}</p>
              <Button variant="outline" onClick={() => setShowBannerForm(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                {t('첫 번째 배너 추가', 'Agregar el primer banner')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {[...banners]
                .sort((a, b) => a.display_order - b.display_order)
                .map((banner, idx, arr) => (
                  <Card
                    key={banner.id}
                    className={`dark:bg-gray-800/60 dark:border-gray-700 ${!banner.is_active ? 'opacity-50' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Thumbnail */}
                        <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-700">
                          <Image
                            src={banner.image_url}
                            alt={banner.title_es}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {language === 'ko' && banner.title_ko ? banner.title_ko : banner.title_es}
                            </p>
                            <Badge
                              variant={banner.is_active ? 'default' : 'secondary'}
                              className={`text-xs ${banner.is_active ? 'bg-green-500 hover:bg-green-600' : ''}`}
                            >
                              {banner.is_active ? t('활성', 'Activo') : t('비활성', 'Inactivo')}
                            </Badge>
                          </div>
                          {(banner.description_es || banner.description_ko) && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {language === 'ko' && banner.description_ko ? banner.description_ko : banner.description_es}
                            </p>
                          )}
                          {banner.link_url && (
                            <p className="text-xs text-blue-500 truncate flex items-center gap-1 mt-0.5">
                              <Link2 className="w-3 h-3" /> {banner.link_url}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {t('순서', 'Orden')}: {banner.display_order} ·{' '}
                            {new Date(banner.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-1">
                            {/* Reorder */}
                            <Button
                              variant="ghost" size="icon"
                              className="w-7 h-7"
                              disabled={idx === 0}
                              onClick={() => handleMoveBanner(banner, 'up')}
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="w-7 h-7"
                              disabled={idx === arr.length - 1}
                              onClick={() => handleMoveBanner(banner, 'down')}
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </Button>
                            {/* Toggle active */}
                            <Button
                              variant="ghost" size="icon"
                              className="w-7 h-7"
                              title={banner.is_active ? t('비활성화', 'Desactivar') : t('활성화', 'Activar')}
                              onClick={() => handleToggleBannerActive(banner)}
                            >
                              {banner.is_active
                                ? <Eye className="w-3.5 h-3.5 text-green-500" />
                                : <EyeOff className="w-3.5 h-3.5 text-gray-400" />}
                            </Button>
                            {/* Delete */}
                            <Button
                              variant="ghost" size="icon"
                              className="w-7 h-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => handleDeleteBanner(banner.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* ─── HISTORY TAB ────────────────────────────────── */}
        <TabsContent value="history" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t(
                '관리자가 삭제한 게시글과 뉴스의 이력입니다.',
                'Historial de posts y noticias eliminadas por administradores.'
              )}
            </p>
            <Button variant="ghost" size="icon" onClick={loadHistory}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <History className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>{t('삭제 이력이 없습니다', 'Sin historial de eliminaciones')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <Card key={item.id} className="dark:bg-gray-800/60 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-xs ${item.content_type === 'news' ? 'border-blue-400 text-blue-500' : 'border-orange-400 text-orange-500'}`}
                      >
                        {item.content_type === 'news' ? t('뉴스', 'Noticia') : t('게시글', 'Post')}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {item.content_title || t('(제목 없음)', '(Sin título)')}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {t('작성자', 'Autor')}: {item.content_author || '—'}
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {t('삭제자', 'Eliminó')}: {item.deleted_by_email || '—'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.deleted_at).toLocaleString(
                              language === 'ko' ? 'ko-KR' : 'es-ES'
                            )}
                          </span>
                        </div>
                        {item.reason && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                            {t('사유', 'Motivo')}: {item.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Delete Post Confirm Dialog ─────────────────────── */}
      <Dialog open={!!deletePostId} onOpenChange={(open) => { if (!open) setDeletePostId(null) }}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              {t('게시글 삭제', 'Eliminar Post')}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {t(
                '이 게시글을 삭제하면 삭제 이력에 기록됩니다. 이 작업은 취소할 수 없습니다.',
                'Al eliminar este post, se registrará en el historial. Esta acción no se puede deshacer.'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700 dark:text-gray-300">
                {t('삭제 사유 (선택)', 'Motivo de eliminación (opcional)')}
              </Label>
              <Textarea
                rows={2}
                placeholder={t('예: 스팸, 부적절한 내용…', 'Ej: spam, contenido inapropiado…')}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeletePostId(null)} disabled={deletingPost}>
                {t('취소', 'Cancelar')}
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDeletePost}
                disabled={deletingPost}
              >
                {deletingPost ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('삭제 중…', 'Eliminando…')}
                  </div>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    {t('삭제', 'Eliminar')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Add Banner Dialog ──────────────────────────────── */}
      <Dialog open={showBannerForm} onOpenChange={setShowBannerForm}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-500" />
              {t('배너 추가', 'Agregar Banner')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t('홈 슬라이더에 표시될 새 배너를 추가합니다.', 'Agrega un nuevo banner para el slider de inicio.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Image Upload */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('배너 이미지 *', 'Imagen del banner *')}
              </Label>
              <div
                className={`border-2 border-dashed rounded-xl overflow-hidden transition-colors cursor-pointer
                  ${bannerFilePreview ? 'border-purple-400' : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {bannerFilePreview ? (
                  <div className="relative w-full h-36">
                    <Image src={bannerFilePreview} alt="preview" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-medium">{t('클릭하여 변경', 'Clic para cambiar')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                    <Upload className="w-8 h-8 mb-2" />
                    <p className="text-sm">{t('클릭하여 이미지 선택', 'Clic para seleccionar imagen')}</p>
                    <p className="text-xs mt-1">{t('권장: 1200×400 이상, JPG/PNG/WebP', 'Recomendado: 1200×400+, JPG/PNG/WebP')}</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Titles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('제목 (스페인어) *', 'Título (Español) *')}
                </Label>
                <Input
                  placeholder="Ej: Evento de apertura"
                  value={bannerForm.title_es}
                  onChange={(e) => setBannerForm(p => ({ ...p, title_es: e.target.value }))}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('제목 (한국어)', 'Título (Coreano)')}
                </Label>
                <Input
                  placeholder="예: 오픈 이벤트"
                  value={bannerForm.title_ko}
                  onChange={(e) => setBannerForm(p => ({ ...p, title_ko: e.target.value }))}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('설명 (스페인어)', 'Descripción (Español)')}
                </Label>
                <Textarea
                  rows={2}
                  placeholder="Descripción breve…"
                  value={bannerForm.description_es}
                  onChange={(e) => setBannerForm(p => ({ ...p, description_es: e.target.value }))}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('설명 (한국어)', 'Descripción (Coreano)')}
                </Label>
                <Textarea
                  rows={2}
                  placeholder="간단한 설명…"
                  value={bannerForm.description_ko}
                  onChange={(e) => setBannerForm(p => ({ ...p, description_ko: e.target.value }))}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none text-sm"
                />
              </div>
            </div>

            {/* Link URL */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('링크 URL (선택)', 'URL de enlace (opcional)')}
              </Label>
              <Input
                type="url"
                placeholder="https://..."
                value={bannerForm.link_url}
                onChange={(e) => setBannerForm(p => ({ ...p, link_url: e.target.value }))}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <Switch
                id="active"
                checked={bannerForm.is_active}
                onCheckedChange={(v) => setBannerForm(p => ({ ...p, is_active: v }))}
              />
              <Label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                {t('즉시 활성화', 'Activar inmediatamente')}
              </Label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowBannerForm(false)} disabled={savingBanner}>
                {t('취소', 'Cancelar')}
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleUploadBanner}
                disabled={savingBanner}
              >
                {savingBanner ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('저장 중…', 'Guardando…')}
                  </div>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-1.5" />
                    {t('배너 저장', 'Guardar Banner')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
