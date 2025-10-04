'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ArrowLeft, Plus, Eye, MessageCircle, ThumbsUp, ThumbsDown, Edit, Pin, PinOff, Trash2 } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/layout/Header'
import { toast } from 'react-hot-toast'

// 운영자 권한 체크 함수를 컴포넌트 내부로 이동
const checkOperatorStatus = async (user: any, token: string | null): Promise<boolean> => {
  try {
    if (!user || !token) {
      console.log('운영자 체크: 사용자가 로그인되지 않음 또는 토큰 없음')
      return false
    }

    console.log('운영자 체크: 사용자 ID:', user.id)

    const response = await fetch('/api/admin/check-operator', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('운영자 체크 API 응답:', response.status)

    if (response.ok) {
      const result = await response.json()
      console.log('운영자 체크 결과:', result)
      return result.isOperator
    }

    console.log('운영자 체크 API 실패:', response.status)
    return false
  } catch (error) {
    console.error('Operator check error:', error)
    return false
  }
}

// 임시 뉴스 데이터 (컴포넌트 외부로 이동)
const tempNewsData = [
  {
    id: 1,
    title: '"한국 문화가 세계를 휩쓸고 있다!" 글로벌 K-콘텐츠 열풍',
    title_es: '"¡La cultura coreana está arrasando el mundo!" Torbellino global de contenido K',
    source: 'NewsWA',
    date: '2025.09.18',
    thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face',
    content: `한국의 전통문화와 현대문화가 조화롭게 발전하고 있습니다. K-팝, K-드라마, K-푸드 등 한국 문화 콘텐츠가 전 세계적으로 큰 인기를 얻고 있으며, 이를 통해 한국의 문화적 가치가 더욱 널리 알려지고 있습니다.

최근 넷플릭스에서 한국 드라마가 상위권을 차지하고 있고, BTS, 뉴진스 등 K-팝 아티스트들이 빌보드 차트를 휩쓸고 있습니다. 또한 김치, 비빔밥 등 한국 음식도 전 세계인의 입맛을 사로잡고 있습니다.`,
    likes: 156,
    comments: 23
  },
  {
    id: 2,
    title: '"한국어 배우기 열풍" 전 세계 한국어 학습자 급증',
    title_es: '"Torbellino de aprendizaje del coreano" Aumento drástico de estudiantes de coreano en todo el mundo',
    source: 'NewsWA',
    date: '2025.09.18',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
    content: `한류 콘텐츠의 인기로 인해 전 세계적으로 한국어 학습 열풍이 불고 있습니다. K-팝 가사와 드라마 대사를 이해하고 싶어하는 팬들이 한국어를 배우기 시작하고 있으며, 이는 한국 문화에 대한 깊은 관심으로 이어지고 있습니다.

세계 각국의 한국어 교육기관과 온라인 학습 플랫폼에서 한국어 수강생이 급증하고 있으며, 특히 젊은 세대들의 학습 열정이 높습니다.`,
    likes: 89,
    comments: 8
  },
  {
    id: 3,
    title: '"한국이 다시 핫하다!" 외국인 관광객 몰려드는 충격 현황',
    source: 'NewsWA',
    date: '2025.09.18',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
    content: `한국 관광산업이 코로나19 이후 빠르게 회복되고 있습니다. 서울, 부산, 제주도 등 주요 관광지에 외국인 관광객들이 다시 찾아오고 있으며, 한국의 아름다운 자연과 문화를 경험하고자 하는 관심이 높아지고 있습니다.

특히 한류 콘텐츠를 통해 한국에 관심을 갖게 된 젊은 관광객들이 크게 증가하고 있습니다. K-팝 콘서트, 드라마 촬영지 투어, 한국 전통문화 체험 등이 인기 관광 상품으로 떠오르고 있습니다.`,
    likes: 234,
    comments: 23
  }
]

export default function NewsPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const { user, token } = useAuth()
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNews, setSelectedNews] = useState<any>(null)
  const [showNewsDetail, setShowNewsDetail] = useState(false)
  const [isOperatorUser, setIsOperatorUser] = useState(false)
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalNews, setTotalNews] = useState(0)
  const itemsPerPage = 10
  
  // 뉴스 작성 모달 상태 (CommunityTab.tsx에서 가져옴)
  const [showNewsWriteModal, setShowNewsWriteModal] = useState(false)
  const [showNewsEditModal, setShowNewsEditModal] = useState(false)
  const [editingNews, setEditingNews] = useState<any>(null)
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
  const [newsWriteLoading, setNewsWriteLoading] = useState(false)
  
  // 이미지 관련 상태
  const [newsUploadedImages, setNewsUploadedImages] = useState<Array<{url: string, name: string}>>([])
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>('')

  const handleBack = () => {
    router.push('/main?tab=community')
  }

  const handleCreateNews = () => {
    // 뉴스 작성 로직 (나중에 구현)
    console.log('뉴스 작성')
  }

  const handleNewsClick = (newsItem: any) => {
    setSelectedNews(newsItem)
    setShowNewsDetail(true)
  }

  const handleBackToList = () => {
    setShowNewsDetail(false)
    setSelectedNews(null)
  }

  // 뉴스 데이터 새로고침 함수 (페이지네이션 지원)
  const fetchRealNews = async (page: number = currentPage) => {
    try {
      const response = await fetch(`/api/news?page=${page}&limit=${itemsPerPage}`)
      const data = await response.json()
      
      if (data.success) {
        const sortedNews = data.newsItems.sort((a: any, b: any) => {
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          return new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
        })
        setNews(sortedNews)
        setTotalNews(data.total || 0)
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
      }
    } catch (error) {
      console.error('뉴스 새로고침 오류:', error)
    }
  }

  // 페이지 변경 함수
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchRealNews(page)
  }

  // 이미지 업로드 함수 (CommunityTab.tsx에서 가져옴)
  const insertImageToContent = async (file: File, isNews: boolean = false) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
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
        
        // 이미지만 업로드하고 텍스트는 자동으로 추가하지 않음
      }
      
      toast.success('이미지가 업로드되었습니다!')
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      toast.error('이미지 업로드에 실패했습니다.')
    }
  }

  // 뉴스 편집 함수
  const handleNewsEdit = (newsItem: any) => {
    setEditingNews(newsItem)
    setNewsWriteForm({
      title: newsItem.title || '',
      title_es: newsItem.title_es || '',
      content: newsItem.content || '',
      content_es: newsItem.content_es || '',
      source: newsItem.source || '',
      author: newsItem.author || '',
      date: newsItem.date || '',
      category: newsItem.category || 'entertainment'
    })
    setSelectedThumbnail(newsItem.thumbnail || '')
    setShowNewsEditModal(true)
  }

  // 뉴스 고정/고정해제 함수
  const handleNewsPin = async (newsItem: any) => {
    try {
      const response = await fetch('/api/news', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: newsItem.id,
          is_pinned: !newsItem.is_pinned
        })
      })

      if (response.ok) {
        toast.success(newsItem.is_pinned ? '고정이 해제되었습니다.' : '뉴스가 고정되었습니다.')
        fetchRealNews() // 뉴스 목록 새로고침
      } else {
        toast.error('고정 상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('뉴스 고정 오류:', error)
      toast.error('고정 상태 변경 중 오류가 발생했습니다.')
    }
  }

  // 뉴스 삭제 함수
  const handleNewsDelete = async (newsItem: any) => {
    if (!confirm(`"${newsItem.title}" 뉴스를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch(`/api/news?id=${newsItem.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('뉴스가 삭제되었습니다.')
        fetchRealNews() // 뉴스 목록 새로고침
      } else {
        toast.error('뉴스 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('뉴스 삭제 오류:', error)
      toast.error('뉴스 삭제 중 오류가 발생했습니다.')
    }
  }

  // 뉴스 업데이트 함수
  const handleNewsUpdate = async () => {
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

    setNewsWriteLoading(true)
    try {
      const response = await fetch('/api/news', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingNews.id,
          title: newsWriteForm.title,
          title_es: newsWriteForm.title_es,
          content: newsWriteForm.content,
          content_es: newsWriteForm.content_es,
          source: newsWriteForm.source,
          author: newsWriteForm.author,
          date: newsWriteForm.date,
          category: newsWriteForm.category,
          thumbnail: selectedThumbnail || editingNews.thumbnail,
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success('뉴스가 수정되었습니다!')
        setShowNewsEditModal(false)
        setEditingNews(null)
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
        fetchRealNews() // 뉴스 목록 새로고침
      } else {
        toast.error(result.error || '뉴스 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('뉴스 수정 오류:', error)
      toast.error('뉴스 수정 중 오류가 발생했습니다.')
    } finally {
      setNewsWriteLoading(false)
    }
  }

  // 뉴스 작성 함수 (CommunityTab.tsx에서 가져옴)
  const handleNewsWrite = async () => {
    if (!newsWriteForm.content.trim()) {
      toast.error('내용을 입력해주세요.')
      return
    }
    
    if (!newsWriteForm.author.trim()) {
      toast.error('작성자를 입력해주세요.')
      return
    }

    setNewsWriteLoading(true)
    try {
      console.log('뉴스 작성 요청 데이터:', {
        title: newsWriteForm.title,
        content: newsWriteForm.content,
        source: newsWriteForm.source,
        author: newsWriteForm.author,
        selectedThumbnail: selectedThumbnail,
        thumbnailLength: selectedThumbnail?.length
      })

      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newsWriteForm.title,
          title_es: newsWriteForm.title, // 한국어 제목을 스페인어 제목으로도 사용
          content: newsWriteForm.content,
          content_es: newsWriteForm.content, // 한국어 내용을 스페인어 내용으로도 사용
          source: newsWriteForm.source,
          author: newsWriteForm.author,
          date: newsWriteForm.date,
          category: 'entertainment', // 기본 카테고리 설정
          thumbnail: selectedThumbnail || null, // 썸네일이 선택되지 않으면 null
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success('뉴스가 작성되었습니다!')
        setShowNewsWriteModal(false)
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
        fetchRealNews() // 뉴스 목록 새로고침
      } else {
        toast.error(result.error || '뉴스 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('뉴스 작성 오류:', error)
      toast.error('뉴스 작성 중 오류가 발생했습니다.')
    } finally {
      setNewsWriteLoading(false)
    }
  }


  // 컴포넌트 마운트 시 한 번만 실행
  useEffect(() => {
    console.log('NewsPage useEffect 실행')
    
        // 뉴스 데이터 로딩 (페이지네이션 지원)
        const loadNews = async () => {
          console.log('뉴스 로딩 시작')
          setLoading(true)
          setError(null)
          
          try {
            const response = await fetch(`/api/news?page=1&limit=${itemsPerPage}`)
            const data = await response.json()
            
            if (data.success) {
              // 고정된 뉴스를 먼저, 그 다음 최신순으로 정렬
              const sortedNews = data.newsItems.sort((a: any, b: any) => {
                // 고정된 뉴스가 먼저
                if (a.is_pinned && !b.is_pinned) return -1
                if (!a.is_pinned && b.is_pinned) return 1
                // 같은 고정 상태면 최신순
                return new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
              })
              setNews(sortedNews)
              setTotalNews(data.total || 0)
              setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
              console.log('뉴스 로드 완료:', sortedNews.length, '개, 총', data.total || 0, '개')
            } else {
              throw new Error(data.error || '뉴스를 불러오는데 실패했습니다.')
            }
          } catch (error) {
            console.error('뉴스 API 오류:', error)
            setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
            // 오류 시 임시 데이터 사용
            setNews(tempNewsData)
            setTotalNews(tempNewsData.length)
            setTotalPages(1)
          } finally {
            setLoading(false)
            console.log('뉴스 로딩 완료')
          }
        }
    
    loadNews()
  }, []) // 빈 의존성 배열로 한 번만 실행

  // 운영자 권한 체크는 user와 token 상태가 변경될 때마다 실행
  useEffect(() => {
    const checkOperator = async () => {
      console.log('운영자 체크 시작, user:', user?.id, 'token:', token ? '있음' : '없음')
      if (!user || !token) {
        setIsOperatorUser(false)
        return
      }
      
      try {
        const isOp = await checkOperatorStatus(user, token)
        console.log('운영자 체크 결과:', isOp)
        setIsOperatorUser(isOp)
      } catch (error) {
        console.error('운영자 체크 오류:', error)
        setIsOperatorUser(false)
      }
    }
    
    // 사용자와 토큰이 모두 있을 때만 체크 실행
    if (user && token) {
      checkOperator()
    } else {
      setIsOperatorUser(false)
    }
  }, [user?.id, token]) // user.id와 token만 의존성으로 사용

  if (showNewsDetail && selectedNews) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 기존 Header 컴포넌트 사용 */}
        <Header />
        
        {/* 페이지별 헤더 */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 pt-48">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
                목록으로
              </Button>
              <h1 className="text-xl font-bold text-gray-800">뉴스 상세</h1>
            </div>
          </div>
        </div>

        {/* 뉴스 상세 내용 */}
        <div className="max-w-6xl mx-auto px-2 pt-4 pb-8">
          <Card className="p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">{selectedNews.title}</h1>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-4">
                  {selectedNews.source && selectedNews.source.trim() ? (
                    <>
                      <span>{selectedNews.source}</span>
                      <span>{selectedNews.author}</span>
                      <span>{selectedNews.date}</span>
                    </>
                  ) : (
                    <>
                      <span>{selectedNews.author}</span>
                      <span>{selectedNews.date}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{selectedNews.views || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{selectedNews.comments || 0}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {selectedNews.content}
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
              <Button variant="outline" className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" />
                {selectedNews.likes || 0}
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <ThumbsDown className="w-4 h-4" />
                0
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 기존 Header 컴포넌트 사용 */}
      <Header />
      
      {/* 페이지별 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 pt-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-800">K-매거진</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 사용자 정보 표시 */}
            {user && (
              <div className="text-sm text-gray-600">
                {user.email} {isOperatorUser && '(운영자)'}
              </div>
            )}
            
            {/* 운영자일 때만 글쓰기 버튼 표시 */}
            {isOperatorUser && (
              <Button
                onClick={() => setShowNewsWriteModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                뉴스 작성
              </Button>
            )}
            
            {/* 이전 버튼 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 border-2 border-gray-400 hover:border-gray-500 bg-white shadow-sm hover:shadow-md px-3 py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              이전
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">뉴스를 불러오는 중...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 뉴스 목록 */}
            <div className="grid gap-6">
              {news.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="text-gray-400 text-6xl mb-4">📰</div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">아직 뉴스가 없습니다</h3>
                  <p className="text-gray-500">첫 번째 뉴스를 작성해보세요!</p>
                </Card>
              ) : (
                news.map((item) => (
                  <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex gap-4">
                      <div 
                        className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center cursor-pointer" 
                        onClick={() => handleNewsClick(item)}
                      >
                        <img 
                          src={item.thumbnail} 
                          alt={item.title}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling.style.display = 'flex'
                          }}
                        />
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-2xl" style={{display: 'none'}}>
                          📰
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 
                            className="text-lg font-semibold text-gray-800 line-clamp-2 cursor-pointer flex-1 mr-4" 
                            onClick={() => handleNewsClick(item)}
                          >
                            {item.title}
                            {item.is_pinned && (
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                📌 고정
                              </span>
                            )}
                          </h3>
                          
                          {/* 운영자용 버튼들 */}
                          {isOperatorUser && (
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleNewsEdit(item)
                                }}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleNewsPin(item)
                                }}
                                className="h-8 w-8 p-0 text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                              >
                                {item.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleNewsDelete(item)
                                }}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <p 
                          className="text-gray-600 text-sm mb-3 line-clamp-2 cursor-pointer" 
                          onClick={() => handleNewsClick(item)}
                        >
                          {item.content}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            {item.source && item.source.trim() ? (
                              <>
                                <span>{item.source}</span>
                                <span>{item.author}</span>
                                <span>{item.date}</span>
                              </>
                            ) : (
                              <>
                                <span>{item.author}</span>
                                <span>{item.date}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{item.likes || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{item.comments || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
            
            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-8 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2"
                >
                  이전
                </Button>
                
                {/* 페이지 번호들 */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 ${
                          currentPage === pageNum 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2"
                >
                  다음
                </Button>
              </div>
            )}
            
            {/* 페이지 정보 */}
            <div className="text-center mt-4 text-sm text-gray-500">
              총 {totalNews}개의 뉴스 중 {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalNews)}개 표시
            </div>
          </div>
        )}
      </div>

      {/* 뉴스 작성 모달 */}
      <Dialog open={showNewsWriteModal} onOpenChange={setShowNewsWriteModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 border-gray-200 shadow-xl">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-900">뉴스 작성</DialogTitle>
            <DialogDescription className="sr-only">새로운 뉴스를 작성하는 모달입니다.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="min-w-0">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  사진 출처 <span className="text-gray-400 text-xs">(선택사항)</span>
                </Label>
                <Input
                  placeholder="예: NewsWA, 서울En"
                  value={newsWriteForm.source}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, source: e.target.value })}
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-full h-10"
                />
              </div>
              <div className="min-w-0 -ml-2">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">작성자</Label>
                <Select value={newsWriteForm.author} onValueChange={(value) => setNewsWriteForm({ ...newsWriteForm, author: value })}>
                  <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-full h-10 pr-6">
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
              <div className="min-w-0">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">게시 날짜</Label>
                <input
                  type="date"
                  value={newsWriteForm.date}
                  onChange={(e) => setNewsWriteForm({ ...newsWriteForm, date: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none h-10"
                  style={{ 
                    colorScheme: 'light'
                  }}
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
              <Select value={selectedThumbnail} onValueChange={setSelectedThumbnail}>
                <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                  <SelectValue placeholder="썸네일로 사용할 이미지를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {newsUploadedImages.length > 0 ? (
                    newsUploadedImages.map((image, index) => (
                      <SelectItem key={index} value={image.url}>
                        <div className="flex items-center gap-2">
                          <img src={image.url} alt={`이미지 ${index + 1}`} className="w-8 h-8 object-cover rounded" />
                          <span>이미지 {index + 1}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-images" disabled>
                      <span className="text-gray-400">먼저 이미지를 삽입해주세요</span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {newsUploadedImages.length > 0 
                  ? "본문에 삽입된 이미지 중에서 썸네일로 사용할 이미지를 선택하세요."
                  : "본문에 이미지를 삽입하면 썸네일로 선택할 수 있습니다."
                }
              </p>
            </div>

            {/* 버튼들 */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowNewsWriteModal(false)}
                disabled={newsWriteLoading}
                className="px-6"
              >
                취소
              </Button>
              <Button
                onClick={handleNewsWrite}
                disabled={newsWriteLoading}
                className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {newsWriteLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    작성 중...
                  </>
                ) : (
                  '뉴스 작성'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
          </Dialog>

          {/* 뉴스 편집 모달 */}
          <Dialog open={showNewsEditModal} onOpenChange={setShowNewsEditModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 border-gray-200 shadow-xl">
              <DialogHeader className="pb-4 border-b border-gray-200">
                <DialogTitle className="text-xl font-semibold text-gray-900">뉴스 수정</DialogTitle>
                <DialogDescription className="sr-only">뉴스를 수정하는 모달입니다.</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="min-w-0">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      사진 출처 <span className="text-gray-400 text-xs">(선택사항)</span>
                    </Label>
                    <Input
                      placeholder="예: NewsWA, 서울En"
                      value={newsWriteForm.source}
                      onChange={(e) => setNewsWriteForm({ ...newsWriteForm, source: e.target.value })}
                      className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-full h-10"
                    />
                  </div>
                  <div className="min-w-0 -ml-2">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">작성자</Label>
                    <Select value={newsWriteForm.author} onValueChange={(value) => setNewsWriteForm({ ...newsWriteForm, author: value })}>
                      <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-full h-10 pr-6">
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
                  <div className="min-w-0">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">게시 날짜</Label>
                    <input
                      type="date"
                      value={newsWriteForm.date}
                      onChange={(e) => setNewsWriteForm({ ...newsWriteForm, date: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none h-10"
                      style={{ 
                        colorScheme: 'light'
                      }}
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
                  <Select value={selectedThumbnail} onValueChange={setSelectedThumbnail}>
                    <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                      <SelectValue placeholder="썸네일로 사용할 이미지를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {newsUploadedImages.length > 0 ? (
                        newsUploadedImages.map((image, index) => (
                          <SelectItem key={index} value={image.url}>
                            <div className="flex items-center gap-2">
                              <img src={image.url} alt={`이미지 ${index + 1}`} className="w-8 h-8 object-cover rounded" />
                              <span>이미지 {index + 1}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-images" disabled>
                          <span className="text-gray-400">먼저 이미지를 삽입해주세요</span>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {newsUploadedImages.length > 0 
                      ? "본문에 삽입된 이미지 중에서 썸네일로 사용할 이미지를 선택하세요."
                      : "본문에 이미지를 삽입하면 썸네일로 선택할 수 있습니다."
                    }
                  </p>
                </div>

                {/* 버튼들 */}
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewsEditModal(false)}
                    disabled={newsWriteLoading}
                    className="px-6"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleNewsUpdate}
                    disabled={newsWriteLoading}
                    className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {newsWriteLoading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        수정 중...
                      </>
                    ) : (
                      '뉴스 수정'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
  )
}
