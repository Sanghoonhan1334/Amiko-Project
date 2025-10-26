'use client'

import { useState, useEffect } from 'react'
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
import { Plus, Calendar, Users, Clock, BarChart3, Lock, Globe, Check, Image as ImageIcon, Smile } from 'lucide-react'
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

  useEffect(() => {
    fetchPolls()
  }, [statusFilter])

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
        fetchPolls()
      }
    } catch (error) {
      console.error('Failed to vote:', error)
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
        fetchPolls()
      }
    } catch (error) {
      console.error('Failed to create poll:', error)
    } finally {
      setCreating(false)
    }
  }

  const addOption = () => {
    setNewPoll({ ...newPoll, options: [...newPoll.options, ''] })
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newPoll.options]
    newOptions[index] = value
    setNewPoll({ ...newPoll, options: newOptions })
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
    <div className="min-h-screen pt-4 md:pt-32 max-w-4xl mx-auto pb-32">
      {/* Header */}
      <div className="p-4 pt-8 md:pt-12 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
          <div>
            <h2 className="text-2xl font-bold">Tablero de Encuestas</h2>
            <p className="text-gray-600">Participa en votaciones y decisiones</p>
          </div>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="bg-purple-500 hover:bg-purple-600 text-white w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Crear Encuesta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nueva Encuesta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={newPoll.title}
                  onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                  placeholder="¿Qué deberíamos comer hoy?"
                />
              </div>
              <div>
                <Label>Descripción (Opcional)</Label>
                <Textarea
                  value={newPoll.description}
                  onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                  placeholder="Información adicional sobre la encuesta"
                  rows={3}
                />
              </div>
              <div>
                <Label>Tipo de Encuesta</Label>
                <Select
                  value={newPoll.poll_type}
                  onValueChange={(value: any) => setNewPoll({ ...newPoll, poll_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="date">Fecha</SelectItem>
                    <SelectItem value="image">Imagen</SelectItem>
                    <SelectItem value="sticker">Sticker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Opciones</Label>
                {newPoll.options.map((option, index) => (
                  <Input
                    key={index}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Opción ${index + 1}`}
                    className="mb-2"
                  />
                ))}
                <Button type="button" variant="outline" onClick={addOption}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Opción
                </Button>
              </div>
              <div className="flex items-center space-x-4">
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
                <Button onClick={handleCreatePoll} disabled={creating} className="flex-1">
                  {creating ? 'Creando...' : 'Crear'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
          >
            Todas
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('active')}
          >
            En Curso
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('completed')}
          >
            Finalizadas
          </Button>
        </div>
      </div>

      {/* Polls List */}
      <div className="p-4">
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">Cargando encuestas...</div>
        ) : polls.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No hay encuestas disponibles</p>
          </Card>
        ) : (
          polls.map((poll) => (
            <Card key={poll.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
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
              </div>

              <div className="space-y-3">
                {poll.options.map((option, index) => (
                  <div
                    key={option.id}
                    onClick={() => !poll.user_voted && handleVote(poll.id, option.id)}
                    className={`relative rounded-lg p-3 cursor-pointer transition-all ${
                      poll.user_voted ? 'bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
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
                        <span>{option.vote_count}명</span>
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
            </Card>
          ))
        )}
      </div>
      </div>
    </div>
  )
}
