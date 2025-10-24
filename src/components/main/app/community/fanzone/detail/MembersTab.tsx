'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Users, Crown, Shield, User, Search, MoreVertical, MessageCircle, UserPlus } from 'lucide-react'
import { FanroomWithDetails, FanroomMemberWithUser } from '@/types/fanzone'
import fanzoneEs from '@/i18n/community/es'

interface MembersTabProps {
  fanroom: FanroomWithDetails
  members: FanroomMemberWithUser[]
  loading: boolean
  onLoadMore?: () => void
}

/**
 * MembersTab - Tab de miembros del FanRoom
 * Muestra lista de miembros con roles y acciones de moderación
 */
export default function MembersTab({ 
  fanroom, 
  members, 
  loading, 
  onLoadMore 
}: MembersTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'creator' | 'admin' | 'moderator' | 'member'>('all')
  const [onlineFilter, setOnlineFilter] = useState(false)

  /**
   * Filtra miembros según criterios
   */
  const filteredMembers = members.filter(member => {
    // Filtro de búsqueda
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      const userName = member.user?.user_metadata?.full_name || member.user?.email || ''
      if (!userName.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    // Filtro de rol
    if (filterRole !== 'all' && member.role !== filterRole) {
      return false
    }

    // Filtro de en línea (simulado)
    if (onlineFilter) {
      // TODO: Implementar lógica real de usuarios en línea
      const isOnline = Math.random() > 0.7 // Simulación
      if (!isOnline) return false
    }

    return true
  })

  /**
   * Maneja cambio de rol de miembro
   */
  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/fanzone/fanrooms/${fanroom.id}/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      })

      if (!response.ok) {
        throw new Error('Error al cambiar rol')
      }

      // TODO: Actualizar estado local
      console.log(`Role changed to ${newRole}`)

    } catch (error) {
      console.error('Error changing role:', error)
    }
  }

  /**
   * Maneja expulsión de miembro
   */
  const handleKickMember = async (memberId: string) => {
    if (!confirm('¿Estás seguro de que quieres expulsar a este miembro?')) {
      return
    }

    try {
      const response = await fetch(`/api/fanzone/fanrooms/${fanroom.id}/members/${memberId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al expulsar miembro')
      }

      // TODO: Actualizar estado local
      console.log('Member kicked')

    } catch (error) {
      console.error('Error kicking member:', error)
    }
  }

  /**
   * Obtiene icono según rol
   */
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'creator':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'admin':
        return <Shield className="w-4 h-4 text-red-500" />
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />
      default:
        return <User className="w-4 h-4 text-gray-500" />
    }
  }

  /**
   * Obtiene color del badge según rol
   */
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'creator':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'moderator':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  /**
   * Formatea fecha relativa
   */
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Hoy'
    if (diffInDays === 1) return 'Ayer'
    if (diffInDays < 7) return `Hace ${diffInDays} días`
    if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`
    return `Hace ${Math.floor(diffInDays / 30)} meses`
  }

  /**
   * Renderiza un miembro individual
   */
  const renderMember = (member: FanroomMemberWithUser) => {
    const isOnline = Math.random() > 0.7 // TODO: Implementar lógica real
    const canModerate = fanroom.user_role === 'creator' || fanroom.user_role === 'admin'
    const isOwnProfile = member.user_id === 'current-user-id' // TODO: Obtener ID del usuario actual

    return (
      <Card key={member.id} className="p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              {member.user?.user_metadata?.avatar_url ? (
                <img
                  src={member.user.user_metadata.avatar_url}
                  alt={member.user.user_metadata.full_name || 'Usuario'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold">
                  {(member.user?.user_metadata?.full_name || member.user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            {/* Indicador de en línea */}
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
            )}
          </div>

          {/* Información del miembro */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {member.user?.user_metadata?.full_name || member.user?.email || 'Usuario'}
              </h4>
              <Badge className={`text-xs px-2 py-1 ${getRoleBadgeColor(member.role)}`}>
                <div className="flex items-center gap-1">
                  {getRoleIcon(member.role)}
                  <span className="capitalize">{member.role}</span>
                </div>
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>Se unió {formatRelativeTime(member.joined_at)}</span>
              {member.last_active_at && (
                <span>
                  {isOnline ? 'En línea ahora' : `Última actividad: ${formatRelativeTime(member.last_active_at)}`}
                </span>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            {!isOwnProfile && (
              <>
                <Button variant="ghost" size="sm" className="p-2">
                  <MessageCircle className="w-4 h-4" />
                </Button>
                
                {canModerate && member.role !== 'creator' && (
                  <Button variant="ghost" size="sm" className="p-2">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {/* Filtros skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>
        </div>
        
        {/* Lista skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="w-8 h-8" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (members.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {fanzoneEs.members.noMembers}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {fanzoneEs.members.noMembersDesc}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="space-y-3">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={fanzoneEs.members.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros de rol y estado */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'creator', 'admin', 'moderator', 'member'] as const).map((role) => (
            <Button
              key={role}
              variant={filterRole === role ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterRole(role)}
            >
              {role === 'all' ? 'Todos' : role.charAt(0).toUpperCase() + role.slice(1)}
            </Button>
          ))}
          
          <Button
            variant={onlineFilter ? "default" : "outline"}
            size="sm"
            onClick={() => setOnlineFilter(!onlineFilter)}
          >
            En línea
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {members.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
        </Card>
        
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-green-600">
            {members.filter(() => Math.random() > 0.7).length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">En línea</div>
        </Card>
        
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {members.filter(m => m.role === 'creator').length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Creadores</div>
        </Card>
        
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {members.filter(m => ['admin', 'moderator'].includes(m.role)).length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Moderadores</div>
        </Card>
      </div>

      {/* Lista de miembros */}
      <div className="space-y-3">
        {filteredMembers.map(renderMember)}
      </div>

      {/* Load More Button */}
      {onLoadMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onLoadMore}>
            Cargar más miembros
          </Button>
        </div>
      )}
    </div>
  )
}
