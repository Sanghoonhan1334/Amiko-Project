'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Video, Plus, Calendar, Star, Users, Search, Filter, Clock, Globe, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import SessionCard from './SessionCard'
import CreateSessionModal from './CreateSessionModal'
import SessionDetailModal from './SessionDetailModal'
import MyBookingsView from './MyBookingsView'
import HostProfileModal from './HostProfileModal'

interface Session {
  id: string
  host_id: string
  title: string
  topic: string
  description: string
  category: string
  language: string
  level: string
  scheduled_at: string
  duration_minutes: number
  price_usd: number
  max_participants: number
  current_participants: number
  status: string
  agora_channel: string
  tags: string[]
  host: {
    id: string
    user_id: string
    display_name: string
    country: string
    languages: string[]
    avatar_url: string
    avg_rating: number
    total_sessions: number
    total_reviews: number
    status: string
  }
}

export default function VCMarketplace() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [showBookings, setShowBookings] = useState(false)
  const [showHostProfile, setShowHostProfile] = useState(false)
  const [hostProfile, setHostProfile] = useState<any>(null)

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (activeTab === 'upcoming') params.set('status', 'upcoming')
      else if (activeTab === 'live') params.set('status', 'live')
      else if (activeTab === 'popular') {
        params.set('status', 'upcoming')
        params.set('sort', 'popular')
      }
      if (selectedCategory !== 'all') params.set('category', selectedCategory)

      const res = await fetch(`/api/videocall/sessions?${params.toString()}`)
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, selectedCategory])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Check if current user has a host profile
  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/videocall/host-profile?userId=${user.id}`)
      .then(r => r.json())
      .then(d => setHostProfile(d.profile))
      .catch(() => {})
  }, [user?.id])

  const filteredSessions = sessions.filter(s => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return s.title.toLowerCase().includes(q) ||
      s.topic.toLowerCase().includes(q) ||
      s.host?.display_name?.toLowerCase().includes(q) ||
      s.tags?.some(tag => tag.toLowerCase().includes(q))
  })

  const categories = [
    'all', 'general', 'language', 'food', 'travel', 'music',
    'fashion', 'technology', 'sports', 'movies', 'history', 'art', 'business'
  ]

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
              {t('vcMarketplace.title')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('vcMarketplace.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {user && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBookings(true)}
              className="text-xs"
            >
              <Calendar className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">{t('vcMarketplace.myBookings')}</span>
            </Button>
          )}
          {user && (
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">{t('vcMarketplace.createSession')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('vcMarketplace.search')}
            className="pl-9 h-9"
          />
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t(`vcMarketplace.categories.${cat}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-9">
          <TabsTrigger value="upcoming" className="text-xs">
            <Calendar className="w-3 h-3 mr-1 hidden sm:block" />
            {t('vcMarketplace.upcoming')}
          </TabsTrigger>
          <TabsTrigger value="live" className="text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-1" />
            {t('vcMarketplace.live')}
          </TabsTrigger>
          <TabsTrigger value="popular" className="text-xs">
            <Star className="w-3 h-3 mr-1 hidden sm:block" />
            {t('vcMarketplace.popular')}
          </TabsTrigger>
          <TabsTrigger value="newHosts" className="text-xs">
            <Users className="w-3 h-3 mr-1 hidden sm:block" />
            {t('vcMarketplace.newHosts')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Video className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {t('vcMarketplace.noSessions')}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {t('vcMarketplace.noSessionsDesc')}
              </p>
              {user && (
                <Button
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('vcMarketplace.createSession')}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredSessions.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onClick={() => setSelectedSession(session)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showCreateModal && (
        <CreateSessionModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            fetchSessions()
          }}
          hostProfile={hostProfile}
        />
      )}

      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          open={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          onBookingComplete={() => {
            setSelectedSession(null)
            fetchSessions()
          }}
        />
      )}

      {showBookings && (
        <MyBookingsView
          open={showBookings}
          onClose={() => setShowBookings(false)}
        />
      )}

      {showHostProfile && hostProfile && (
        <HostProfileModal
          open={showHostProfile}
          onClose={() => setShowHostProfile(false)}
          hostProfile={hostProfile}
        />
      )}
    </div>
  )
}
