'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Settings, BarChart3, Calendar, Clock, Plus, Trash2,
  Loader2, AlertCircle, CheckCircle, Users, DollarSign,
  Star, Video, TrendingUp
} from 'lucide-react'

interface VCAdminPanelProps {
  open: boolean
  onClose: () => void
}

const DAYS_OF_WEEK = [
  { value: 0, key: 'sunday' },
  { value: 1, key: 'monday' },
  { value: 2, key: 'tuesday' },
  { value: 3, key: 'wednesday' },
  { value: 4, key: 'thursday' },
  { value: 5, key: 'friday' },
  { value: 6, key: 'saturday' },
]

export default function VCAdminPanel({ open, onClose }: VCAdminPanelProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('metrics')
  const [metrics, setMetrics] = useState<any>(null)
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // New slot form
  const [newDay, setNewDay] = useState('3')
  const [newStart, setNewStart] = useState('19:00')
  const [newEnd, setNewEnd] = useState('21:00')

  // Fetch metrics
  useEffect(() => {
    if (!open || activeTab !== 'metrics') return
    setLoading(true)
    fetch('/api/videocall/admin/metrics')
      .then(r => r.json())
      .then(data => setMetrics(data))
      .catch(() => setError('Failed to load metrics'))
      .finally(() => setLoading(false))
  }, [open, activeTab])

  // Fetch schedules
  useEffect(() => {
    if (!open || activeTab !== 'schedule') return
    setLoading(true)
    fetch('/api/videocall/schedule')
      .then(r => r.json())
      .then(data => setSchedules(data.schedules || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, activeTab])

  const handleAddSlot = async () => {
    try {
      setSaving(true)
      setError('')
      const res = await fetch('/api/videocall/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedules: [{
            day_of_week: parseInt(newDay),
            start_time: newStart,
            end_time: newEnd,
            is_active: true,
          }]
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to add slot')
        return
      }
      setSuccess(t('vcMarketplace.admin.slotAdded'))
      // Refresh
      const refreshRes = await fetch('/api/videocall/schedule')
      const refreshData = await refreshRes.json()
      setSchedules(refreshData.schedules || [])
      setTimeout(() => setSuccess(''), 2000)
    } catch {
      setError('Failed to add slot')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const res = await fetch(`/api/videocall/schedule?id=${slotId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setSchedules(prev => prev.filter(s => s.id !== slotId))
        setSuccess(t('vcMarketplace.admin.slotRemoved'))
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch {
      setError('Failed to delete slot')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Settings className="w-5 h-5 text-purple-500" />
            {t('vcMarketplace.admin.title')}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {success}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-9">
            <TabsTrigger value="metrics" className="text-xs">
              <BarChart3 className="w-3 h-3 mr-1" />
              {t('vcMarketplace.admin.metrics')}
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {t('vcMarketplace.admin.schedule')}
            </TabsTrigger>
          </TabsList>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="mt-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
              </div>
            ) : metrics ? (
              <div className="space-y-4">
                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard
                    icon={Video}
                    label={t('vcMarketplace.admin.totalSessions')}
                    value={metrics.totalSessions || 0}
                    color="purple"
                  />
                  <MetricCard
                    icon={Users}
                    label={t('vcMarketplace.admin.totalBookings')}
                    value={metrics.totalBookings || 0}
                    color="blue"
                  />
                  <MetricCard
                    icon={DollarSign}
                    label={t('vcMarketplace.admin.totalRevenue')}
                    value={`$${(metrics.totalRevenue || 0).toFixed(2)}`}
                    color="green"
                  />
                  <MetricCard
                    icon={Star}
                    label={t('vcMarketplace.admin.avgRating')}
                    value={metrics.avgRating?.toFixed(1) || '0.0'}
                    color="yellow"
                  />
                </div>

                {/* Revenue breakdown */}
                {metrics.platformRevenue !== undefined && (
                  <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      {t('vcMarketplace.admin.revenueBreakdown')}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">{t('vcMarketplace.admin.platformShare')}:</span>
                        <span className="font-medium text-green-600 ml-1">
                          ${(metrics.platformRevenue || 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('vcMarketplace.admin.hostPayouts')}:</span>
                        <span className="font-medium text-blue-600 ml-1">
                          ${(metrics.hostPayouts || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional stats */}
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard
                    icon={Users}
                    label={t('vcMarketplace.admin.activeHosts')}
                    value={metrics.activeHosts || 0}
                    color="cyan"
                  />
                  <MetricCard
                    icon={TrendingUp}
                    label={t('vcMarketplace.admin.liveSessions')}
                    value={metrics.liveSessions || 0}
                    color="red"
                  />
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-400 py-8">
                {t('vcMarketplace.admin.noData')}
              </p>
            )}
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="mt-3">
            <div className="space-y-4">
              {/* Add new slot */}
              <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                  {t('vcMarketplace.admin.addSlot')}
                </p>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <Select value={newDay} onValueChange={setNewDay}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map(day => (
                        <SelectItem key={day.value} value={day.value.toString()} className="text-xs">
                          {t(`vcMarketplace.days.${day.key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="time"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    type="time"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleAddSlot}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs h-8"
                >
                  {saving ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3 mr-1" />
                  )}
                  {t('vcMarketplace.admin.addSlot')}
                </Button>
              </div>

              {/* Current slots */}
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                </div>
              ) : schedules.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-6">
                  {t('vcMarketplace.admin.noSlots')}
                </p>
              ) : (
                <div className="space-y-1">
                  {schedules.map(slot => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {t(`vcMarketplace.days.${DAYS_OF_WEEK.find(d => d.value === slot.day_of_week)?.key || 'monday'}`)}
                        </Badge>
                        <span className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {slot.start_time} - {slot.end_time}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
    green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    yellow: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    cyan: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20',
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  }

  return (
    <div className={`rounded-lg p-3 ${colorMap[color] || colorMap.purple}`}>
      <Icon className="w-4 h-4 mb-1 opacity-60" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] opacity-70">{label}</p>
    </div>
  )
}
