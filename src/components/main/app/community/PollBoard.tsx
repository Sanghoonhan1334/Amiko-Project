'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { Plus, Calendar, Users, Clock, BarChart3, Lock, Globe, Check, Image as ImageIcon, Smile, ArrowLeft, Trophy, X, ChevronRight, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PollOption {
  id: string
  option_text?: string
  image_url?: string
  sticker_url?: string
  date_value?: string
  vote_count: number
  percentage: number
}

interface Poll {
  id: string
  title: string
  description?: string
  poll_type: 'text' | 'date' | 'image' | 'sticker'
  is_public: boolean
  is_anonymous: boolean
  status: 'active' | 'completed' | 'draft'
  options: PollOption[]
  total_votes: number
  created_by: string
  created_at: string
  expires_at?: string
  user_voted?: boolean
}

export default function PollBoard() {
  const { user, token } = useAuth()
  const { language, t } = useLanguage()
  const router = useRouter()
  
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('active')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPollTypeMenu, setShowPollTypeMenu] = useState(false)
  const [expandedPolls, setExpandedPolls] = useState<Set<string>>(new Set())
  const [votingPollId, setVotingPollId] = useState<string | null>(null)
  const pollTypeMenuRef = useRef<HTMLDivElement>(null)
  
  // 외부 클릭 감지 - 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pollTypeMenuRef.current && !pollTypeMenuRef.current.contains(event.target as Node)) {
        setShowPollTypeMenu(false)
      }
    }
    
    if (showPollTypeMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showPollTypeMenu])
  
  // Create poll state
  const [newPoll, setNewPoll] = useState({
    title: '',
    description: '',
    poll_type: 'text' as const,
    is_public: true,
    is_anonymous: false,
    options: ['', ''],
    expires_at: '',
  })
  const [creating, setCreating] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([])
  const [uploadingImages, setUploadingImages] = useState<boolean[]>([])

  useEffect(() => {
    fetchPolls()
  }, [statusFilter])

  // 이미지 파일을 base64로 변환
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // 이미지 업로드 핸들러
  const handleImageUpload = async (index: number, file: File) => {
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      alert('Solo se pueden subir archivos de imagen.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('El tamaño del archivo no puede exceder 5MB.')
      return
    }

    setUploadingImages(prev => {
      const newArr = [...prev]
      newArr[index] = true
      return newArr
    })

    try {
      // 먼저 미리보기를 위해 base64 변환
      const base64 = await convertToBase64(file)
      
      // 미리보기 설정
      setImagePreviews(prev => {
        const newPreviews = [...prev]
        newPreviews[index] = base64
        return newPreviews
      })

      // Supabase Storage에 업로드
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'polls')

      const uploadResponse = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('La carga de imagen falló')
      }

      const uploadData = await uploadResponse.json()
      
      // 옵션 업데이트 (URL 저장)
      const newOptions = [...newPoll.options]
      newOptions[index] = uploadData.url
      setNewPoll({ ...newPoll, options: newOptions })
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      alert('No se pudo subir la imagen.')
      // 실패 시 미리보기도 제거
      setImagePreviews(prev => {
        const newPreviews = [...prev]
        newPreviews[index] = null
        return newPreviews
      })
    } finally {
      setUploadingImages(prev => {
        const newArr = [...prev]
        newArr[index] = false
        return newArr
      })
    }
  }

  // 붙여넣기 핸들러
  const handlePaste = async (event: React.ClipboardEvent, index: number) => {
    const items = event.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          await handleImageUpload(index, file)
        }
        break
      }
    }
  }

  // 이미지 제거
  const clearImage = (index: number) => {
    setImagePreviews(prev => {
      const newPreviews = [...prev]
      newPreviews[index] = null
      return newPreviews
    })
    const newOptions = [...newPoll.options]
    newOptions[index] = ''
    setNewPoll({ ...newPoll, options: newOptions })
  }

  const fetchPolls = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/polls?status=${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setPolls(data.polls || [])
      }
    } catch (error) {
      console.error('Failed to fetch polls:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (pollId: string, optionId: string) => {
    if (!user) {
      router.push('/sign-in')
      return
    }

    // 투표 중 상태 설정
    setVotingPollId(pollId)

    try {
      const response = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ poll_id: pollId, option_id: optionId }),
      })

      if (response.ok) {
        // 투표 후 데이터 업데이트 (펼쳐진 상태 유지)
        const pollResponse = await fetch(`/api/polls?status=${statusFilter}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        if (pollResponse.ok) {
          const data = await pollResponse.json()
          // 확장 상태 유지하면서 데이터만 업데이트
          setPolls(data.polls || [])
        }
      }
    } catch (error) {
      console.error('Failed to vote:', error)
    } finally {
      // 투표 완료 후 상태 초기화
      setVotingPollId(null)
    }
  }

  const handleDelete = async (pollId: string, e: React.MouseEvent) => {
    e.stopPropagation() // 부모 클릭 이벤트 방지
    
    if (!user) {
      router.push('/sign-in')
      return
    }

    if (!confirm('¿Estás seguro de que quieres eliminar esta encuesta?')) {
      return
    }

    try {
      const response = await fetch(`/api/polls/${pollId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchPolls()
      } else {
        const data = await response.json()
        alert(`No se pudo eliminar: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to delete poll:', error)
      alert('Ocurrió un error al eliminar la encuesta.')
    }
  }

  const handleCreatePoll = async () => {
    if (!user) {
      router.push('/sign-in')
      return
    }

    try {
      setCreating(true)
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newPoll),
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateModal(false)
        setNewPoll({
          title: '',
          description: '',
          poll_type: 'text',
          is_public: true,
          is_anonymous: false,
          options: ['', ''],
          expires_at: '',
        })
        setImagePreviews([])
        fetchPolls()
      } else {
        console.error('Failed to create poll:', data.error)
        alert(`No se pudo crear la encuesta: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to create poll:', error)
      alert('Ocurrió un error al crear la encuesta.')
    } finally {
      setCreating(false)
    }
  }

  const addOption = () => {
    setNewPoll({ ...newPoll, options: [...newPoll.options, ''] })
    setImagePreviews(prev => [...prev, null])
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newPoll.options]
    newOptions[index] = value
    setNewPoll({ ...newPoll, options: newOptions })
  }

  const togglePoll = (pollId: string) => {
    setExpandedPolls(prev => {
      const newSet = new Set(prev)
      if (newSet.has(pollId)) {
        newSet.delete(pollId)
      } else {
        newSet.add(pollId)
      }
      return newSet
    })
  }

  const getPollTypeIcon = (type: string) => {
    switch (type) {
      case 'date':
        return <Calendar className="w-4 h-4" />
      case 'image':
        return <ImageIcon className="w-4 h-4" />
      case 'sticker':
        return <Smile className="w-4 h-4" />
      default:
        return <BarChart3 className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push('/main?tab=community')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Encuestas</h1>
              <p className="text-sm text-gray-600">¡Participa y decide qué es mejor!</p>
            </div>
            <div className="flex-1" />
            {user && (
              <div className="hidden md:block relative" ref={pollTypeMenuRef}>
                <Button 
                  className="bg-purple-300 hover:bg-purple-400 text-black"
                  onClick={() => setShowPollTypeMenu(!showPollTypeMenu)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Encuesta
                </Button>
                
                {/* 투표 종류 선택 메뉴 - 주르륵 */}
                <div className={`absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border-2 border-purple-200 overflow-hidden z-50 transition-all duration-300 ease-out ${
                  showPollTypeMenu 
                    ? 'opacity-100 translate-y-0 visible' 
                    : 'opacity-0 -translate-y-2 invisible'
                }`}>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setNewPoll({ ...newPoll, poll_type: 'text', options: ['', ''] })
                          setShowPollTypeMenu(false)
                          setShowCreateModal(true)
                        }}
                        className="w-full p-4 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:scale-[1.02] text-left flex items-center gap-3 group"
                      >
                        <div className="text-3xl">📝</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-base mb-1">A vs B</h3>
                          <p className="text-xs text-gray-600">Cara a cara</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setNewPoll({ ...newPoll, poll_type: 'image', options: ['', ''] })
                          setImagePreviews([null, null])
                          setShowPollTypeMenu(false)
                          setShowCreateModal(true)
                        }}
                        className="w-full p-4 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:scale-[1.02] text-left flex items-center gap-3 group"
                      >
                        <div className="text-3xl">🖼️</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-base mb-1">Comparación de Imágenes</h3>
                          <p className="text-xs text-gray-600">Compara con fotos</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setNewPoll({ ...newPoll, poll_type: 'date', options: ['', ''] })
                          setShowPollTypeMenu(false)
                          setShowCreateModal(true)
                        }}
                        className="w-full p-4 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:scale-[1.02] text-left flex items-center gap-3 group"
                      >
                        <div className="text-3xl">📅</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-base mb-1">Selección de Fecha</h3>
                          <p className="text-xs text-gray-600">¿Cuándo te parece bien?</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setNewPoll({ ...newPoll, poll_type: 'text', options: ['', '', ''] })
                          setShowPollTypeMenu(false)
                          setShowCreateModal(true)
                        }}
                        className="w-full p-4 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:scale-[1.02] text-left flex items-center gap-3 group"
                      >
                        <div className="text-3xl">📊</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-base mb-1">Múltiples Opciones</h3>
                          <p className="text-xs text-gray-600">Más de 3 opciones</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                      </button>
                    </div>
                </div>
              </div>
            )}
            {user && (
              <>

                {/* 투표 작성 모달 */}
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                  <DialogContent className="max-w-2xl bg-white flex flex-col max-h-[90vh]">
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle className="text-xl font-semibold">
                        {newPoll.poll_type === 'text' && (newPoll.options.length > 2 ? 'Crear Encuesta Múltiple' : 'Crear Encuesta A vs B')}
                        {newPoll.poll_type === 'image' && 'Crear Encuesta de Imágenes'}
                        {newPoll.poll_type === 'date' && 'Crear Encuesta de Fechas'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto space-y-6 pt-2">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <Label className="text-sm font-medium mb-2 block">Título</Label>
                <Input
                  value={newPoll.title}
                  onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                  placeholder="¿Cuál es tu canción favorita de BTS?"
                  className="bg-white"
                />
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <Label className="text-sm font-medium mb-2 block">Descripción (Opcional)</Label>
                <Textarea
                  value={newPoll.description}
                  onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                  placeholder="ej: Por favor selecciona tu canción favorita"
                  rows={2}
                  className="bg-white"
                />
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <Label className="text-sm font-medium mb-2 block">
                  {newPoll.poll_type === 'date' ? 'Fechas para elegir' : 
                   newPoll.poll_type === 'image' ? 'Opción A vs Opción B' :
                   newPoll.poll_type === 'text' && newPoll.options.length === 2 ? 'Opción A vs Opción B' :
                   'Opciones'}
                </Label>
                <div className="space-y-2">
                  {newPoll.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {newPoll.poll_type === 'date' ? (
                        <div className="flex-1">
                          <Label className="text-xs text-gray-600 mb-1 block">
                            {index === 0 ? 'Opción A' : index === 1 ? 'Opción B' : `Opción ${index + 1}`}
                          </Label>
                          <Input
                            type="date"
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            className="bg-white"
                            required
                            lang="es"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Formato: año-mes-día
                          </p>
                        </div>
                      ) : newPoll.poll_type === 'image' ? (
                        <div className="flex-1 space-y-2">
                          {imagePreviews[index] ? (
                            <div className="relative">
                              <img 
                                src={imagePreviews[index]!} 
                                alt={`Opción ${index + 1}`}
                                className="w-full h-48 object-cover rounded-lg border-2 border-purple-200"
                              />
                              <button
                                type="button"
                                onClick={() => clearImage(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer relative"
                              onPaste={(e) => handlePaste(e, index)}
                            >
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleImageUpload(index, file)
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <div className="flex flex-col items-center gap-2">
                                <ImageIcon className="w-12 h-12 text-purple-400" />
                                <div className="text-sm font-medium text-gray-700">
                                  {index === 0 ? 'Opción A' : 'Opción B'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Haz clic para subir o pegar (Ctrl+V)
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={
                            newPoll.options.length === 2 
                              ? (index === 0 ? "Opción A (ej: Dynamite)" : "Opción B (ej: Blood Sweat & Tears)")
                              : `Opción ${index + 1} (ej: Opción ${index + 1})`
                          }
                          className="bg-white"
                        />
                      )}
                    </div>
                  ))}
                </div>
                {((newPoll.poll_type === 'text' && newPoll.options.length >= 3) || newPoll.poll_type === 'date') && (
                  <Button type="button" variant="outline" onClick={addOption} className="mt-3">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Opción
                  </Button>
                )}
              </div>
                    </div>
                    
                    {/* 고정 버튼 영역 */}
                    <div className="flex-shrink-0 border-t border-gray-200 pt-4 mt-4 space-y-4">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={newPoll.is_public}
                            onCheckedChange={(checked) => setNewPoll({ ...newPoll, is_public: checked })}
                          />
                          <Label>Pública</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={newPoll.is_anonymous}
                            onCheckedChange={(checked) => setNewPoll({ ...newPoll, is_anonymous: checked })}
                          />
                          <Label>Anónima</Label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleCreatePoll} disabled={creating} className="flex-1 bg-purple-300 hover:bg-purple-400 text-black">
                          {creating ? 'Creando...' : 'Crear'}
                        </Button>
                        <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                          Cancelar
                        </Button>
                      </div>
                    </div>
                </DialogContent>
              </Dialog>
              </>
            )}
        </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setStatusFilter('all')}
              className={statusFilter === 'all' 
                ? 'bg-purple-300 hover:bg-purple-400 text-black font-semibold' 
                : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-300'}
            >
              Todas
            </Button>
            <Button
              size="sm"
              onClick={() => setStatusFilter('active')}
              className={statusFilter === 'active' 
                ? 'bg-purple-300 hover:bg-purple-400 text-black font-semibold' 
                : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-300'}
            >
              En Curso
            </Button>
            <Button
              size="sm"
              onClick={() => setStatusFilter('completed')}
              className={statusFilter === 'completed' 
                ? 'bg-purple-300 hover:bg-purple-400 text-black font-semibold' 
                : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-300'}
            >
              Finalizadas
            </Button>
          </div>
        </div>
      </div>

      {/* Polls List */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">Cargando encuestas...</div>
          ) : polls.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed">
              <div className="text-6xl mb-4">🗳️</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-700">
                No hay encuestas disponibles
              </h3>
              <p className="text-sm mb-6 text-gray-500">
                ¡Crea la primera encuesta!
              </p>
            </Card>
          ) : (
          polls.map((poll) => {
            const isExpanded = expandedPolls.has(poll.id)
            
            return (
            <Card key={poll.id} className="overflow-hidden">
              {/* 헤더 - 항상 보임 */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => togglePoll(poll.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {poll.status === 'active' && (
                        <Badge variant="outline" className="border-orange-500 text-orange-600">
                          En Curso
                        </Badge>
                      )}
                      {poll.status === 'completed' && (
                        <Badge variant="outline" className="border-gray-400 text-gray-600">
                          Finalizada
                        </Badge>
                      )}
                      <div className="flex items-center text-gray-500">
                        {poll.is_public ? (
                          <Globe className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>
                      {getPollTypeIcon(poll.poll_type)}
                      <span className="text-sm text-gray-500">{poll.poll_type}</span>
                    </div>
                    <h3 className="text-lg font-semibold">{poll.title}</h3>
                    {poll.description && <p className="text-gray-600 text-sm mt-1">{poll.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {user && poll.created_by === user.id && (
                      <button
                        onClick={(e) => handleDelete(poll.id, e)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500 hover:text-red-600"
                        title="Eliminar encuesta"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </div>

              {/* 투표 옵션 - 접혔다가 펼쳐짐 */}
              <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}>
                <div className="p-4 pt-0 border-t border-gray-100">
              {/* A vs B Style for 2 options */}
              {poll.options.length === 2 ? (
                <div className="grid grid-cols-2 gap-4">
                  {poll.options.map((option, index) => (
                    <div
                      key={option.id}
                      onClick={() => !poll.user_voted && votingPollId !== poll.id && handleVote(poll.id, option.id)}
                      className={`relative rounded-xl p-6 transition-all border-2 ${
                        poll.user_voted || votingPollId === poll.id
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' 
                          : 'border-purple-200 bg-purple-50 hover:border-purple-400 hover:bg-purple-100 cursor-pointer'
                      }`}
                    >
                      <div className="text-center">
                        {poll.poll_type === 'image' && option.image_url ? (
                          <div className="mb-3 -mx-6 -mt-6">
                            <img 
                              src={option.image_url} 
                              alt={`Opción ${index + 1}`}
                              className="w-full h-48 object-cover rounded-t-xl"
                              onError={(e) => {
                                console.error('이미지 로드 실패:', option.image_url)
                                // 이미지 로드 실패 시 기본 플레이스홀더 표시
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                        ) : (
                          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
                            option.percentage > 50 ? 'bg-purple-500' : 'bg-gray-300'
                          } ${poll.user_voted ? 'opacity-50' : ''}`}>
                            {poll.user_voted && option.percentage > 50 && <Check className="w-6 h-6 text-white" />}
                            {poll.user_voted && option.percentage <= 50 && <span className="text-white font-bold text-xl">·</span>}
                            {!poll.user_voted && <span className="text-white font-bold text-xl">{index === 0 ? 'A' : 'B'}</span>}
                          </div>
                        )}
                        {option.option_text && (
                          <h4 className="font-bold text-lg mb-2">{option.option_text}</h4>
                        )}
                        <div className="text-2xl font-bold text-purple-600 mb-1">{option.percentage}%</div>
                        <div className="text-sm text-gray-600">{option.vote_count} votos</div>
                      </div>
                      {poll.user_voted && (
                        <div className="absolute top-2 right-2">
                          <Trophy className={`w-5 h-5 ${option.percentage > 50 ? 'text-yellow-500' : 'text-gray-300'}`} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {poll.options.map((option, index) => (
                    <div
                      key={option.id}
                      onClick={() => !poll.user_voted && votingPollId !== poll.id && handleVote(poll.id, option.id)}
                      className={`relative rounded-lg p-3 transition-all ${
                        poll.user_voted || votingPollId === poll.id
                          ? 'bg-gray-50 cursor-not-allowed opacity-60' 
                          : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            option.percentage > 50 ? 'bg-purple-500' : 'bg-gray-300'
                          } ${poll.user_voted ? 'opacity-50' : ''}`}>
                            {poll.user_voted && <Check className="w-4 h-4 text-white" />}
                          </div>
                          <span className="font-medium">{option.option_text || `Opción ${index + 1}`}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{option.vote_count} votos</span>
                          <span className="font-semibold">{option.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${option.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

                  <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{poll.total_votes} votos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(poll.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {poll.user_voted && (
                      <Badge variant="outline" className="border-green-500 text-green-600">
                        Ya votaste
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            )
          })
          )}
        </div>
      </div>

      {/* Floating Create Button - Mobile Only */}
      {user && (
        <div className="md:hidden fixed bottom-8 right-8 z-50" ref={pollTypeMenuRef}>
          <Button
            size="lg"
            className="rounded-full shadow-2xl h-16 w-16 p-0 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white transition-all duration-300 hover:scale-110"
            onClick={() => setShowPollTypeMenu(!showPollTypeMenu)}
          >
            {showPollTypeMenu ? (
              <X className="w-10 h-10 drop-shadow-lg stroke-[3]" />
            ) : (
              <Plus className="w-10 h-10 drop-shadow-lg stroke-[3]" />
            )}
          </Button>
          
          {/* 모바일 투표 종류 선택 메뉴 */}
          <div className={`absolute bottom-20 right-0 w-72 bg-white rounded-xl shadow-2xl border-2 border-purple-200 overflow-hidden mb-2 transition-all duration-300 ease-out ${
            showPollTypeMenu 
              ? 'opacity-100 translate-y-0 visible' 
              : 'opacity-0 translate-y-2 invisible'
          }`}>
              <div className="p-2">
                <button
                  onClick={() => {
                    setNewPoll({ ...newPoll, poll_type: 'text', options: ['', ''] })
                    setShowPollTypeMenu(false)
                    setShowCreateModal(true)
                  }}
                  className="w-full p-4 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:scale-[1.02] text-left flex items-center gap-3"
                >
                  <div className="text-3xl">📝</div>
                  <div>
                    <h3 className="font-bold text-base">A vs B</h3>
                    <p className="text-xs text-gray-600">Cara a cara</p>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setNewPoll({ ...newPoll, poll_type: 'image', options: ['', ''] })
                    setImagePreviews([null, null])
                    setShowPollTypeMenu(false)
                    setShowCreateModal(true)
                  }}
                  className="w-full p-4 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:scale-[1.02] text-left flex items-center gap-3"
                >
                  <div className="text-3xl">🖼️</div>
                  <div>
                    <h3 className="font-bold text-base">Comparación de Imágenes</h3>
                    <p className="text-xs text-gray-600">Compara con fotos</p>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setNewPoll({ ...newPoll, poll_type: 'date', options: ['', ''] })
                    setShowPollTypeMenu(false)
                    setShowCreateModal(true)
                  }}
                  className="w-full p-4 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:scale-[1.02] text-left flex items-center gap-3"
                >
                  <div className="text-3xl">📅</div>
                  <div>
                    <h3 className="font-bold text-base">Selección de Fecha</h3>
                    <p className="text-xs text-gray-600">¿Cuándo te parece bien?</p>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setNewPoll({ ...newPoll, poll_type: 'text', options: ['', '', ''] })
                    setShowPollTypeMenu(false)
                    setShowCreateModal(true)
                  }}
                  className="w-full p-4 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:scale-[1.02] text-left flex items-center gap-3"
                >
                  <div className="text-3xl">📊</div>
                  <div>
                    <h3 className="font-bold text-base">Múltiples Opciones</h3>
                    <p className="text-xs text-gray-600">Más de 3 opciones</p>
                  </div>
                </button>
              </div>
            </div>
        </div>
      )}
    </div>
  )
}
