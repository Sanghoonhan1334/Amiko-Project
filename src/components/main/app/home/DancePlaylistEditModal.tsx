'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { X, Plus, Trash2, Music } from 'lucide-react'
import { toast } from 'sonner'

interface DanceSong {
  id?: string
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

interface DancePlaylistEditModalProps {
  isOpen: boolean
  onClose: () => void
  playlist: DancePlaylist | null
  onSuccess: () => void
}

export default function DancePlaylistEditModal({
  isOpen,
  onClose,
  playlist,
  onSuccess
}: DancePlaylistEditModalProps) {
  const { user, token } = useAuth()
  const { t, language } = useLanguage()
  const [weekNumber, setWeekNumber] = useState<number>(1)
  const [weekLabel, setWeekLabel] = useState<string>('')
  const [songs, setSongs] = useState<DanceSong[]>([])
  const [saving, setSaving] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false)
      return
    }

    if (playlist) {
      setWeekNumber(playlist.week_number || 1)
      setWeekLabel(playlist.week_label || '')
      // null 값을 빈 문자열로 변환
      setSongs((playlist.songs || []).map(song => ({
        ...song,
        song_title: song.song_title || '',
        artist_name: song.artist_name || '',
        youtube_video_id: song.youtube_video_id || ''
      })))
    } else {
      // 새 플레이리스트
      setWeekNumber(1)
      setWeekLabel('')
      setSongs([])
    }
    setIsInitialized(true)
  }, [playlist, isOpen])

  const addSong = () => {
    setSongs([...songs, {
      song_title: '',
      artist_name: '',
      youtube_video_id: '',
      display_order: songs.length
    }])
  }

  const removeSong = (index: number) => {
    setSongs(songs.filter((_, i) => i !== index).map((song, i) => ({
      ...song,
      display_order: i
    })))
  }

  const updateSong = (index: number, field: keyof DanceSong, value: string) => {
    const updatedSongs = [...songs]
    updatedSongs[index] = {
      ...updatedSongs[index],
      [field]: value
    }
    setSongs(updatedSongs)
  }

  const extractYouTubeId = (url: string): string => {
    if (!url) return ''
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    return match ? match[1] : url
  }

  const handleSave = async () => {
    if (!weekLabel.trim()) {
      toast.error(language === 'ko' ? '주차 라벨을 입력해주세요.' : 'Por favor ingresa la etiqueta de la semana.')
      return
    }

    if (songs.length === 0) {
      toast.error(language === 'ko' ? '최소 1개 이상의 노래를 추가해주세요.' : 'Por favor agrega al menos una canción.')
      return
    }

    // 노래 제목과 아티스트 검증
    for (const song of songs) {
      if (!song.song_title.trim() || !song.artist_name.trim()) {
        toast.error(language === 'ko' ? '모든 노래의 제목과 아티스트를 입력해주세요.' : 'Por favor ingresa el título y artista de todas las canciones.')
        return
      }
    }

    setSaving(true)

    try {
      const songsToSave = songs.map((song, index) => ({
        song_title: song.song_title.trim(),
        artist_name: song.artist_name.trim(),
        youtube_video_id: song.youtube_video_id ? extractYouTubeId(song.youtube_video_id) : null,
        display_order: index
      }))

      const response = await fetch('/api/dance/playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          week_number: weekNumber,
          week_label: weekLabel.trim(),
          songs: songsToSave
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '플레이리스트 저장 실패')
      }

      toast.success(language === 'ko' ? '플레이리스트가 저장되었습니다.' : 'Playlist guardada exitosamente.')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('플레이리스트 저장 실패:', error)
      toast.error(error instanceof Error ? error.message : (language === 'ko' ? '플레이리스트 저장 실패' : 'Error al guardar la playlist'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2">
          <Music className="w-5 h-5 text-red-500" />
          {language === 'ko' ? '플레이리스트 편집' : 'Editar Playlist'}
        </DialogTitle>
        <DialogDescription>
          {language === 'ko' 
            ? '주차별 플레이리스트를 관리합니다. 노래를 추가하고 YouTube 영상 ID를 입력할 수 있습니다.'
            : 'Administra la playlist semanal. Puedes agregar canciones e ingresar el ID del video de YouTube.'}
        </DialogDescription>

        <div className="space-y-4 mt-4">
          {/* 주차 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="week_number">
                {language === 'ko' ? '주차 번호' : 'Número de Semana'}
              </Label>
              <Input
                id="week_number"
                type="number"
                min="1"
                value={isInitialized ? weekNumber : 1}
                onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="week_label">
                {language === 'ko' ? '주차 라벨' : 'Etiqueta de Semana'}
              </Label>
              <Input
                id="week_label"
                type="text"
                placeholder={language === 'ko' ? '예: Semana 1 de enero' : 'Ej: Semana 1 de enero'}
                value={isInitialized ? weekLabel : ''}
                onChange={(e) => setWeekLabel(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* 노래 목록 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>
                {language === 'ko' ? '노래 목록' : 'Lista de Canciones'}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSong}
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                {language === 'ko' ? '노래 추가' : 'Agregar Canción'}
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {songs.map((song, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      {index + 1}.
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSong(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">
                        {language === 'ko' ? '노래 제목' : 'Título'}
                      </Label>
                      <Input
                        type="text"
                        placeholder={language === 'ko' ? '예: Supernova' : 'Ej: Supernova'}
                        value={song.song_title || ''}
                        onChange={(e) => updateSong(index, 'song_title', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">
                        {language === 'ko' ? '아티스트' : 'Artista'}
                      </Label>
                      <Input
                        type="text"
                        placeholder={language === 'ko' ? '예: aespa' : 'Ej: aespa'}
                        value={song.artist_name || ''}
                        onChange={(e) => updateSong(index, 'artist_name', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">
                      {language === 'ko' ? 'YouTube 영상 ID 또는 URL' : 'ID o URL de YouTube'}
                    </Label>
                    <Input
                      type="text"
                      placeholder={language === 'ko' ? '예: dQw4w9WgXcQ 또는 https://youtube.com/watch?v=...' : 'Ej: dQw4w9WgXcQ o https://youtube.com/watch?v=...'}
                      value={song.youtube_video_id || ''}
                      onChange={(e) => updateSong(index, 'youtube_video_id', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}

              {songs.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {language === 'ko' 
                    ? '노래를 추가해주세요.'
                    : 'Agrega canciones a la playlist.'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {language === 'ko' ? '취소' : 'Cancelar'}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving 
              ? (language === 'ko' ? '저장 중...' : 'Guardando...')
              : (language === 'ko' ? '저장' : 'Guardar')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

