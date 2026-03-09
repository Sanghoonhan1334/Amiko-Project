'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Save, ArrowLeft, Upload, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

interface NewsItem {
  id: string
  title: string
  title_es?: string
  content: string
  content_es?: string
  source: string
  category: string
  thumbnail?: string
  author: string
  published: boolean
  created_at: string
}

export default function AdminNewsPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const { token } = useAuth()
  const t = (ko: string, es: string) => language === 'ko' ? ko : es
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 뉴스 작성 폼 상태
  const [newsWriteForm, setNewsWriteForm] = useState({
    title: '',
    title_es: '',
    content: '',
    content_es: '',
    source: '',
    author: '',
    date: '',
    category: 'entertainment',
    published: true,
  })
  
  // 이미지 관련 상태
  const [newsUploadedImages, setNewsUploadedImages] = useState<Array<{url: string, name: string}>>([])
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>('')

  // 운영자 권한 체크
  useEffect(() => {
    if (!token) return
    fetch('/api/admin/check-operator', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      if (!res.ok) {
        router.push('/')
        return
      }
      loadNews()
    }).catch(() => router.push('/'))
  }, [token, router])

  // 뉴스 데이터 로드
  const loadNews = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/news?showAll=true')
      const data = await response.json()
      
      if (data.success) {
        setNews(data.newsItems || [])
      }
    } catch (error) {
      console.error('뉴스 로드 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 이미지 업로드 함수 (CommunityTab.tsx에서 가져옴)
  const insertImageToContent = async (file: File, isNews: boolean = false) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(t('이미지 업로드 실패', 'Error al subir la imagen'))
      }
      
      const result = await response.json()
      
      if (isNews) {
        // 뉴스용 이미지 업로드
        const newImage = { url: result.url, name: file.name }
        setNewsUploadedImages(prev => [...prev, newImage])
        
        // 썸네일이 선택되지 않았다면 첫 번째 이미지를 썸네일로 설정
        if (!selectedThumbnail) {
          setSelectedThumbnail(result.url)
        }
        
        // 내용에 이미지 URL 추가
        const imageMarkdown = `\n![${file.name}](${result.url})\n`
        setNewsWriteForm(prev => ({
          ...prev,
          content: prev.content + imageMarkdown
        }))
      }
      
      toast.success(t('이미지가 업로드되었습니다!', '¡Imagen subida exitosamente!'))
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      toast.error(t('이미지 업로드에 실패했습니다.', 'Error al subir la imagen.'))
    }
  }

  // 뉴스 작성 함수
  const handleNewsWrite = async () => {
    if (!newsWriteForm.title.trim() && !newsWriteForm.title_es.trim()) {
      toast.error(t('제목을 입력해주세요.', 'Por favor, ingrese el título.'))
      return
    }
    if (!newsWriteForm.content.trim() && !newsWriteForm.content_es.trim()) {
      toast.error(t('내용을 입력해주세요.', 'Por favor, ingrese el contenido.'))
      return
    }
    if (!newsWriteForm.author.trim()) {
      toast.error(t('작성자를 입력해주세요.', 'Por favor, seleccione el autor.'))
      return
    }
    if (!token) {
      toast.error(t('로그인이 필요합니다', 'Inicio de sesión requerido'))
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newsWriteForm.title || newsWriteForm.title_es,
          title_es: newsWriteForm.title_es || newsWriteForm.title,
          content: newsWriteForm.content || newsWriteForm.content_es,
          content_es: newsWriteForm.content_es || newsWriteForm.content,
          source: newsWriteForm.source,
          author: newsWriteForm.author,
          date: newsWriteForm.date,
          category: newsWriteForm.category,
          thumbnail: selectedThumbnail || null,
          published: newsWriteForm.published,
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success(t('뉴스가 작성되었습니다!', '¡Noticia creada exitosamente!'))
        resetForm()
        loadNews()
      } else {
        toast.error(result.error || t('뉴스 작성에 실패했습니다.', 'Error al crear la noticia.'))
      }
    } catch (error) {
      console.error('뉴스 작성 오류:', error)
      toast.error(t('뉴스 작성 중 오류가 발생했습니다.', 'Ocurrió un error al crear la noticia.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // 뉴스 수정 함수
  const handleNewsEdit = async () => {
    if (!newsWriteForm.title.trim() && !newsWriteForm.title_es.trim()) {
      toast.error(t('제목을 입력해주세요.', 'Por favor, ingrese el título.'))
      return
    }
    if (!newsWriteForm.content.trim() && !newsWriteForm.content_es.trim()) {
      toast.error(t('내용을 입력해주세요.', 'Por favor, ingrese el contenido.'))
      return
    }
    if (!newsWriteForm.author.trim()) {
      toast.error(t('작성자를 입력해주세요.', 'Por favor, seleccione el autor.'))
      return
    }
    if (!token) {
      toast.error(t('로그인이 필요합니다', 'Inicio de sesión requerido'))
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/news', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingNews?.id,
          title: newsWriteForm.title || newsWriteForm.title_es,
          title_es: newsWriteForm.title_es || newsWriteForm.title,
          content: newsWriteForm.content || newsWriteForm.content_es,
          content_es: newsWriteForm.content_es || newsWriteForm.content,
          source: newsWriteForm.source,
          author: newsWriteForm.author,
          category: newsWriteForm.category,
          thumbnail: selectedThumbnail || null,
          published: newsWriteForm.published,
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success(t('뉴스가 수정되었습니다!', '¡Noticia actualizada exitosamente!'))
        resetForm()
        loadNews()
      } else {
        toast.error(result.error || t('뉴스 수정에 실패했습니다.', 'Error al actualizar la noticia.'))
      }
    } catch (error) {
      console.error('뉴스 수정 오류:', error)
      toast.error(t('뉴스 수정 중 오류가 발생했습니다.', 'Ocurrió un error al actualizar la noticia.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // 폼 리셋
  const resetForm = () => {
    setNewsWriteForm({
      title: '',
      title_es: '',
      content: '',
      content_es: '',
      source: '',
      author: '',
      date: '',
      category: 'entertainment',
      published: true,
    })
    setNewsUploadedImages([])
    setSelectedThumbnail('')
    setShowWriteModal(false)
    setShowEditModal(false)
    setEditingNews(null)
  }

  // 뉴스 수정 시작
  const handleEdit = (newsItem: NewsItem) => {
    setNewsWriteForm({
      title: newsItem.title,
      title_es: newsItem.title_es || '',
      content: newsItem.content,
      content_es: newsItem.content_es || '',
      source: newsItem.source,
      author: newsItem.author,
      date: '',
      category: newsItem.category,
      published: newsItem.published !== false, // default true
    })
    setSelectedThumbnail(newsItem.thumbnail || '')
    setEditingNews(newsItem)
    setShowEditModal(true)
  }

  // 뉴스 삭제
  const handleDelete = async (newsId: string) => {
    if (!confirm(t('정말로 이 뉴스를 삭제하시겠습니까?', '¿Está seguro de eliminar esta noticia?'))) {
      return
    }
    if (!token) {
      toast.error(t('로그인이 필요합니다', 'Inicio de sesión requerido'))
      return
    }
    try {
      const response = await fetch(`/api/news?id=${newsId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        toast.success(t('뉴스가 삭제되었습니다', 'Noticia eliminada exitosamente'))
        loadNews()
      } else {
        const result = await response.json()
        toast.error(result.error || t('뉴스 삭제에 실패했습니다', 'Error al eliminar la noticia'))
      }
    } catch (error) {
      console.error('뉴스 삭제 오류:', error)
      toast.error(t('뉴스 삭제 중 오류가 발생했습니다', 'Ocurrió un error al eliminar la noticia'))
    }
  }

  // 게시/임시저장 토글
  const handleTogglePublished = async (newsItem: NewsItem) => {
    if (!token) return
    try {
      const response = await fetch('/api/news', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          id: newsItem.id,
          published: !newsItem.published,
        })
      })
      if (response.ok) {
        toast.success(
          !newsItem.published
            ? t('뉴스가 게시되었습니다', 'Noticia publicada')
            : t('뉴스가 임시저장으로 변경되었습니다', 'Noticia guardada como borrador')
        )
        loadNews()
      }
    } catch (error) {
      console.error('토글 오류:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('로딩 중...', 'Cargando...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('관리자 대시보드', 'Panel de Administración')}
            </Button>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('K-매거진 관리', 'Gestión de K-Magazine')}</h1>
          </div>
          
          <Button
            onClick={() => setShowWriteModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('새 뉴스 작성', 'Crear Nueva Noticia')}
          </Button>
        </div>

        {/* 뉴스 목록 */}
        <div className="space-y-6">
          {news.length === 0 ? (
            <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
              <div className="text-gray-400 text-6xl mb-4">📰</div>
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">{t('아직 뉴스가 없습니다', 'No hay noticias aún')}</h3>
              <p className="text-gray-500 dark:text-gray-400">{t('첫 번째 뉴스를 작성해보세요!', '¡Cree su primera noticia!')}</p>
            </Card>
          ) : (
            news.map((item) => (
              <Card key={item.id} className="p-6 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{item.title_es || item.title}</h3>
                      <Badge
                        className={`text-xs ${item.published !== false ? 'bg-green-500 hover:bg-green-600' : 'bg-amber-500 hover:bg-amber-600'} text-white`}
                      >
                        {item.published !== false ? t('게시됨', 'Publicado') : t('임시저장', 'Borrador')}
                      </Badge>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{item.content_es || item.content}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>{item.source}</span>
                      <span>{item.category}</span>
                      <span>{item.author}</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      title={item.published !== false ? t('임시저장으로 변경', 'Cambiar a borrador') : t('게시', 'Publicar')}
                      onClick={() => handleTogglePublished(item)}
                      className={item.published !== false ? 'text-green-600 border-green-300' : 'text-amber-600 border-amber-300'}
                    >
                      {item.published !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* 뉴스 작성 모달 */}
        <Dialog open={showWriteModal} onOpenChange={setShowWriteModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-xl">
            <DialogHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">{t('뉴스 작성', 'Crear Noticia')}</DialogTitle>
              <DialogDescription className="sr-only">{t('새로운 뉴스를 작성하는 모달입니다.', 'Modal para crear una nueva noticia.')}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    {t('사진 출처', 'Fuente de Foto')} <span className="text-gray-400 text-xs">({t('선택사항', 'opcional')})</span>
                  </Label>
                  <Input
                    placeholder={t('예: NewsWA, 서울En', 'Ej: NewsWA, SeoulEn')}
                    value={newsWriteForm.source}
                    onChange={(e) => setNewsWriteForm({ ...newsWriteForm, source: e.target.value })}
                    className="border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{t('작성자', 'Autor')}</Label>
                  <Select value={newsWriteForm.author} onValueChange={(value) => setNewsWriteForm({ ...newsWriteForm, author: value })}>
                    <SelectTrigger className="border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                      <SelectValue placeholder={t('작성자를 선택하세요', 'Seleccione el autor')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Amiko">Amiko</SelectItem>
                      <SelectItem value="Amiko 편집팀">{t('Amiko 편집팀', 'Amiko Equipo Editorial')}</SelectItem>
                      <SelectItem value="Amiko 뉴스팀">{t('Amiko 뉴스팀', 'Amiko Equipo de Noticias')}</SelectItem>
                      <SelectItem value="Amiko 관리자">{t('Amiko 관리자', 'Amiko Administrador')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{t('게시 날짜', 'Fecha de Publicación')}</Label>
                  <Input
                    type="date"
                    value={newsWriteForm.date}
                    onChange={(e) => setNewsWriteForm({ ...newsWriteForm, date: e.target.value })}
                    className="border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* 제목 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{t('제목', 'Título')}</Label>
                <Input
                  placeholder={t('제목을 입력하세요', 'Ingrese el título')}
                  value={newsWriteForm.title}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, title: e.target.value })}
                  className="border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* 내용 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('내용', 'Contenido')}</Label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) insertImageToContent(file, true)
                      }}
                      className="hidden"
                      id="contentImageUpload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('contentImageUpload')?.click()}
                      className="text-xs"
                    >
                      📷 {t('이미지 삽입', 'Insertar Imagen')}
                    </Button>
                  </div>
                </div>
                <Textarea
                  placeholder={t("내용을 입력하세요. 이미지를 삽입하려면 위의 '이미지 삽입' 버튼을 클릭하세요.", "Ingrese el contenido. Para insertar una imagen, haga clic en el botón 'Insertar Imagen' de arriba.")}
                  value={newsWriteForm.content}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, content: e.target.value })}
                  rows={8}
                  className="border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                />
              </div>

              {/* 썸네일 선택 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{t('썸네일 선택', 'Seleccionar Miniatura')}</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {newsUploadedImages.map((image, index) => (
                    <div
                      key={index}
                      className={`relative cursor-pointer border-2 rounded-lg overflow-hidden ${
                        selectedThumbnail === image.url 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                      onClick={() => setSelectedThumbnail(image.url)}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-24 object-cover"
                      />
                      {selectedThumbnail === image.url && (
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                          <div className="bg-blue-500 text-white rounded-full p-1">
                            ✓
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {newsUploadedImages.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p>{t('이미지를 업로드하면 썸네일로 선택할 수 있습니다', 'Puede seleccionar una miniatura al subir imágenes')}</p>
                  </div>
                )}
              </div>

              {/* 버튼 */}
              {/* 게시/임시저장 설정 */}
              <div className="flex items-center gap-3 pb-2">
                <Switch
                  id="published-create"
                  checked={newsWriteForm.published}
                  onCheckedChange={(v) => setNewsWriteForm(p => ({ ...p, published: v }))}
                />
                <Label htmlFor="published-create" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  {newsWriteForm.published
                    ? t('게시 (공개 상태)', 'Publicar (visible para todos)')
                    : t('임시저장 (비공개)', 'Borrador (no visible)')}
                </Label>
                <Badge className={`text-xs ml-1 ${newsWriteForm.published ? 'bg-green-500' : 'bg-amber-500'} text-white`}>
                  {newsWriteForm.published ? t('공개', 'Público') : t('비공개', 'Borrador')}
                </Badge>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  {t('취소', 'Cancelar')}
                </Button>
                <Button
                  type="button"
                  onClick={handleNewsWrite}
                  disabled={isSubmitting}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {t('작성 중...', 'Creando...')}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {t('작성하기', 'Crear')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 뉴스 수정 모달 */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-xl">
            <DialogHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">{t('뉴스 수정', 'Editar Noticia')}</DialogTitle>
              <DialogDescription className="sr-only">{t('뉴스를 수정하는 모달입니다.', 'Modal para editar una noticia.')}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    {t('사진 출처', 'Fuente de Foto')} <span className="text-gray-400 text-xs">({t('선택사항', 'opcional')})</span>
                  </Label>
                  <Input
                    placeholder={t('예: NewsWA, 서울En', 'Ej: NewsWA, SeoulEn')}
                    value={newsWriteForm.source}
                    onChange={(e) => setNewsWriteForm({ ...newsWriteForm, source: e.target.value })}
                    className="border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{t('작성자', 'Autor')}</Label>
                  <Select value={newsWriteForm.author} onValueChange={(value) => setNewsWriteForm({ ...newsWriteForm, author: value })}>
                    <SelectTrigger className="border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                      <SelectValue placeholder={t('작성자를 선택하세요', 'Seleccione el autor')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Amiko">Amiko</SelectItem>
                      <SelectItem value="Amiko 편집팀">{t('Amiko 편집팀', 'Amiko Equipo Editorial')}</SelectItem>
                      <SelectItem value="Amiko 뉴스팀">{t('Amiko 뉴스팀', 'Amiko Equipo de Noticias')}</SelectItem>
                      <SelectItem value="Amiko 관리자">{t('Amiko 관리자', 'Amiko Administrador')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{t('게시 날짜', 'Fecha de Publicación')}</Label>
                  <Input
                    type="date"
                    value={newsWriteForm.date}
                    onChange={(e) => setNewsWriteForm({ ...newsWriteForm, date: e.target.value })}
                    className="border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* 제목 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{t('제목', 'Título')}</Label>
                <Input
                  placeholder={t('제목을 입력하세요', 'Ingrese el título')}
                  value={newsWriteForm.title}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, title: e.target.value })}
                  className="border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* 내용 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('내용', 'Contenido')}</Label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) insertImageToContent(file, true)
                      }}
                      className="hidden"
                      id="editContentImageUpload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('editContentImageUpload')?.click()}
                      className="text-xs"
                    >
                      📷 {t('이미지 삽입', 'Insertar Imagen')}
                    </Button>
                  </div>
                </div>
                <Textarea
                  placeholder={t("내용을 입력하세요. 이미지를 삽입하려면 위의 '이미지 삽입' 버튼을 클릭하세요.", "Ingrese el contenido. Para insertar una imagen, haga clic en el botón 'Insertar Imagen' de arriba.")}
                  value={newsWriteForm.content}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, content: e.target.value })}
                  rows={8}
                  className="border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                />
              </div>

              {/* 썸네일 선택 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{t('썸네일 선택', 'Seleccionar Miniatura')}</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {newsUploadedImages.map((image, index) => (
                    <div
                      key={index}
                      className={`relative cursor-pointer border-2 rounded-lg overflow-hidden ${
                        selectedThumbnail === image.url 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                      onClick={() => setSelectedThumbnail(image.url)}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-24 object-cover"
                      />
                      {selectedThumbnail === image.url && (
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                          <div className="bg-blue-500 text-white rounded-full p-1">
                            ✓
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {newsUploadedImages.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p>{t('이미지를 업로드하면 썸네일로 선택할 수 있습니다', 'Puede seleccionar una miniatura al subir imágenes')}</p>
                  </div>
                )}
              </div>

              {/* 게시/임시저장 설정 */}
              <div className="flex items-center gap-3 pb-2">
                <Switch
                  id="published-edit"
                  checked={newsWriteForm.published}
                  onCheckedChange={(v) => setNewsWriteForm(p => ({ ...p, published: v }))}
                />
                <Label htmlFor="published-edit" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  {newsWriteForm.published
                    ? t('게시 (공개 상태)', 'Publicado (visible para todos)')
                    : t('임시저장 (비공개)', 'Borrador (no visible)')}
                </Label>
                <Badge className={`text-xs ml-1 ${newsWriteForm.published ? 'bg-green-500' : 'bg-amber-500'} text-white`}>
                  {newsWriteForm.published ? t('공개', 'Público') : t('비공개', 'Borrador')}
                </Badge>
              </div>

              {/* 버튼 */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  {t('취소', 'Cancelar')}
                </Button>
                <Button
                  type="button"
                  onClick={handleNewsEdit}
                  disabled={isSubmitting}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {t('수정 중...', 'Actualizando...')}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {t('수정하기', 'Actualizar')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
