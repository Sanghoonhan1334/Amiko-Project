'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Save, ArrowLeft, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { toast } from 'react-hot-toast'

// 운영자 권한 체크
const isOperator = async (): Promise<boolean> => {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return false
    }

    const response = await fetch('/api/admin/check-operator', {
      headers: {
        'Authorization': `Bearer ${await supabase.auth.getSession().then((res) => res.data.session?.access_token)}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      return result.isOperator
    }

    return false
  } catch (error) {
    console.error('Operator check error:', error)
    return false
  }
}

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
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 뉴스 작성 폼 상태 (CommunityTab.tsx에서 가져옴)
  const [newsWriteForm, setNewsWriteForm] = useState({
    title: '',
    title_es: '',
    content: '',
    content_es: '',
    source: '',
    author: '',
    date: '',
    category: 'entertainment'
  })
  
  // 이미지 관련 상태
  const [newsUploadedImages, setNewsUploadedImages] = useState<Array<{url: string, name: string}>>([])
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>('')

  // 운영자 권한 체크
  useEffect(() => {
    const checkOperator = async () => {
      const isOp = await isOperator()
      if (!isOp) {
        router.push('/')
        return
      }
      
      loadNews()
    }
    
    checkOperator()
  }, [router])

  // 뉴스 데이터 로드
  const loadNews = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/news')
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
        throw new Error('이미지 업로드 실패')
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
      
      toast.success('이미지가 업로드되었습니다!')
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      toast.error('이미지 업로드에 실패했습니다.')
    }
  }

  // 뉴스 작성 함수 (CommunityTab.tsx에서 가져옴)
  const handleNewsWrite = async () => {
    if (!newsWriteForm.title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }
    
    if (!newsWriteForm.content.trim()) {
      toast.error('내용을 입력해주세요.')
      return
    }
    
    if (!newsWriteForm.author.trim()) {
      toast.error('작성자를 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        toast.error('로그인이 필요합니다')
        return
      }

      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: newsWriteForm.title,
          title_es: newsWriteForm.title,
          content: newsWriteForm.content,
          content_es: newsWriteForm.content,
          source: newsWriteForm.source,
          author: newsWriteForm.author,
          date: newsWriteForm.date,
          category: 'entertainment',
          thumbnail: selectedThumbnail || null,
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success('뉴스가 작성되었습니다!')
        resetForm()
        loadNews()
      } else {
        toast.error(result.error || '뉴스 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('뉴스 작성 오류:', error)
      toast.error('뉴스 작성 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 뉴스 수정 함수 (CommunityTab.tsx에서 가져옴)
  const handleNewsEdit = async () => {
    if (!newsWriteForm.title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }
    
    if (!newsWriteForm.content.trim()) {
      toast.error('내용을 입력해주세요.')
      return
    }
    
    if (!newsWriteForm.author.trim()) {
      toast.error('작성자를 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        toast.error('로그인이 필요합니다')
        return
      }

      const response = await fetch('/api/news', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          id: editingNews?.id,
          title: newsWriteForm.title,
          title_es: newsWriteForm.title,
          content: newsWriteForm.content,
          content_es: newsWriteForm.content,
          source: newsWriteForm.source,
          author: newsWriteForm.author,
          category: 'entertainment',
          thumbnail: selectedThumbnail || null
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success('뉴스가 수정되었습니다!')
        resetForm()
        loadNews()
      } else {
        toast.error(result.error || '뉴스 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('뉴스 수정 오류:', error)
      toast.error('뉴스 수정 중 오류가 발생했습니다.')
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
      category: 'entertainment'
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
      category: newsItem.category
    })
    setSelectedThumbnail(newsItem.thumbnail || '')
    setEditingNews(newsItem)
    setShowEditModal(true)
  }

  // 뉴스 삭제
  const handleDelete = async (newsId: string) => {
    if (!confirm('정말로 이 뉴스를 삭제하시겠습니까?')) {
      return
    }
    
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        toast.error('로그인이 필요합니다')
        return
      }

      const response = await fetch(`/api/news?id=${newsId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (response.ok) {
        toast.success('뉴스가 삭제되었습니다')
        loadNews()
      } else {
        const result = await response.json()
        toast.error(result.error || '뉴스 삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('뉴스 삭제 오류:', error)
      toast.error('뉴스 삭제 중 오류가 발생했습니다')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              관리자 대시보드
            </Button>
            <h1 className="text-3xl font-bold text-gray-800">K-매거진 관리</h1>
          </div>
          
          <Button
            onClick={() => setShowWriteModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 뉴스 작성
          </Button>
        </div>

        {/* 뉴스 목록 */}
        <div className="space-y-6">
          {news.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📰</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">아직 뉴스가 없습니다</h3>
              <p className="text-gray-500">첫 번째 뉴스를 작성해보세요!</p>
            </Card>
          ) : (
            news.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{item.source}</span>
                      <span>{item.category}</span>
                      <span>{item.author}</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 border-gray-200 shadow-xl">
            <DialogHeader className="pb-4 border-b border-gray-200">
              <DialogTitle className="text-xl font-semibold text-gray-900">뉴스 작성</DialogTitle>
              <DialogDescription className="sr-only">새로운 뉴스를 작성하는 모달입니다.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    사진 출처 <span className="text-gray-400 text-xs">(선택사항)</span>
                  </Label>
                  <Input
                    placeholder="예: NewsWA, 서울En"
                    value={newsWriteForm.source}
                    onChange={(e) => setNewsWriteForm({ ...newsWriteForm, source: e.target.value })}
                    className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">작성자</Label>
                  <Select value={newsWriteForm.author} onValueChange={(value) => setNewsWriteForm({ ...newsWriteForm, author: value })}>
                    <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                      <SelectValue placeholder="작성자를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Amiko">Amiko</SelectItem>
                      <SelectItem value="Amiko 편집팀">Amiko 편집팀</SelectItem>
                      <SelectItem value="Amiko 뉴스팀">Amiko 뉴스팀</SelectItem>
                      <SelectItem value="Amiko 관리자">Amiko 관리자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">게시 날짜</Label>
                  <Input
                    type="date"
                    value={newsWriteForm.date}
                    onChange={(e) => setNewsWriteForm({ ...newsWriteForm, date: e.target.value })}
                    className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* 제목 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">제목</Label>
                <Input
                  placeholder="제목을 입력하세요"
                  value={newsWriteForm.title}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, title: e.target.value })}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* 내용 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-gray-700">내용</Label>
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
                      📷 이미지 삽입
                    </Button>
                  </div>
                </div>
                <Textarea
                  placeholder="내용을 입력하세요. 이미지를 삽입하려면 위의 '이미지 삽입' 버튼을 클릭하세요."
                  value={newsWriteForm.content}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, content: e.target.value })}
                  rows={8}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                />
              </div>

              {/* 썸네일 선택 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">썸네일 선택</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {newsUploadedImages.map((image, index) => (
                    <div
                      key={index}
                      className={`relative cursor-pointer border-2 rounded-lg overflow-hidden ${
                        selectedThumbnail === image.url 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-300 hover:border-gray-400'
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
                  <div className="text-center py-8 text-gray-500">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p>이미지를 업로드하면 썸네일로 선택할 수 있습니다</p>
                  </div>
                )}
              </div>

              {/* 버튼 */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  취소
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
                      작성 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      작성하기
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 뉴스 수정 모달 */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 border-gray-200 shadow-xl">
            <DialogHeader className="pb-4 border-b border-gray-200">
              <DialogTitle className="text-xl font-semibold text-gray-900">뉴스 수정</DialogTitle>
              <DialogDescription className="sr-only">뉴스를 수정하는 모달입니다.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    사진 출처 <span className="text-gray-400 text-xs">(선택사항)</span>
                  </Label>
                  <Input
                    placeholder="예: NewsWA, 서울En"
                    value={newsWriteForm.source}
                    onChange={(e) => setNewsWriteForm({ ...newsWriteForm, source: e.target.value })}
                    className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">작성자</Label>
                  <Select value={newsWriteForm.author} onValueChange={(value) => setNewsWriteForm({ ...newsWriteForm, author: value })}>
                    <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                      <SelectValue placeholder="작성자를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Amiko">Amiko</SelectItem>
                      <SelectItem value="Amiko 편집팀">Amiko 편집팀</SelectItem>
                      <SelectItem value="Amiko 뉴스팀">Amiko 뉴스팀</SelectItem>
                      <SelectItem value="Amiko 관리자">Amiko 관리자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">게시 날짜</Label>
                  <Input
                    type="date"
                    value={newsWriteForm.date}
                    onChange={(e) => setNewsWriteForm({ ...newsWriteForm, date: e.target.value })}
                    className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* 제목 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">제목</Label>
                <Input
                  placeholder="제목을 입력하세요"
                  value={newsWriteForm.title}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, title: e.target.value })}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* 내용 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-gray-700">내용</Label>
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
                      📷 이미지 삽입
                    </Button>
                  </div>
                </div>
                <Textarea
                  placeholder="내용을 입력하세요. 이미지를 삽입하려면 위의 '이미지 삽입' 버튼을 클릭하세요."
                  value={newsWriteForm.content}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, content: e.target.value })}
                  rows={8}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                />
              </div>

              {/* 썸네일 선택 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">썸네일 선택</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {newsUploadedImages.map((image, index) => (
                    <div
                      key={index}
                      className={`relative cursor-pointer border-2 rounded-lg overflow-hidden ${
                        selectedThumbnail === image.url 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-300 hover:border-gray-400'
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
                  <div className="text-center py-8 text-gray-500">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p>이미지를 업로드하면 썸네일로 선택할 수 있습니다</p>
                  </div>
                )}
              </div>

              {/* 버튼 */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  취소
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
                      수정 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      수정하기
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
