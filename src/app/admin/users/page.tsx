'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at?: string
  email_confirmed_at?: string
}

export default function AdminUsersPage() {
  const { language } = useLanguage()
  const { token } = useAuth()
  const t = (ko: string, es: string) => language === 'ko' ? ko : es

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // 사용자 목록 조회
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!response.ok) {
          throw new Error(t('사용자 목록을 불러올 수 없습니다.', 'No se pudo cargar la lista de usuarios.'))
        }
        const data = await response.json()
        setUsers(data.users || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('알 수 없는 오류가 발생했습니다.', 'Ocurrió un error desconocido.'))
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 필터링된 사용자 목록
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'confirmed' && user.email_confirmed_at) ||
      (statusFilter === 'unconfirmed' && !user.email_confirmed_at)
    
    return matchesSearch && matchesStatus
  })

  // 상태별 배지 색상
  const getStatusBadge = (user: User) => {
    if (user.email_confirmed_at) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{t('이메일 확인됨', 'Verificado')}</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{t('이메일 미확인', 'No Verificado')}</Badge>
    }
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 총 사용자 수 계산
  const totalUsers = filteredUsers.length
  const confirmedUsers = filteredUsers.filter(u => u.email_confirmed_at).length
  const unconfirmedUsers = filteredUsers.filter(u => !u.email_confirmed_at).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('사용자 관리', 'Gestión de Usuarios')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('모든 사용자 정보를 조회하고 관리할 수 있습니다.', 'Consulta y gestiona la información de todos los usuarios.')}</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('총 사용자 수', 'Total de Usuarios')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('이메일 확인된 사용자', 'Email Verificado')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confirmedUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('이메일 미확인 사용자', 'Email No Verificado')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{unconfirmedUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('필터 및 검색', 'Filtros y Búsqueda')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('이메일, 사용자 ID로 검색...', 'Buscar por email, ID de usuario...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('상태 선택', 'Seleccionar estado')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('모든 사용자', 'Todos los usuarios')}</SelectItem>
                  <SelectItem value="confirmed">{t('이메일 확인됨', 'Verificado')}</SelectItem>
                  <SelectItem value="unconfirmed">{t('이메일 미확인', 'No Verificado')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 사용자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('사용자 목록', 'Lista de Usuarios')}</CardTitle>
          <CardDescription>
            {filteredUsers.length}{t('명의 사용자가 있습니다.', ' usuarios registrados.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('검색 조건에 맞는 사용자가 없습니다.', 'No se encontraron usuarios con los filtros aplicados.')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium">{t('사용자 ID', 'ID de Usuario')}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('이메일', 'Email')}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('상태', 'Estado')}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('가입일', 'Registro')}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('마지막 로그인', 'Último Acceso')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {user.id.slice(0, 8)}...
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium">{user.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(user)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : t('로그인 기록 없음', 'Sin registro de acceso')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
