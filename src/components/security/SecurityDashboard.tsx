'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Lock, 
  Key, 
  Database,
  Network,
  Server,
  User,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Info
} from 'lucide-react'

interface SecurityStatus {
  overall: 'secure' | 'warning' | 'critical'
  score: number
  lastChecked: string
  issues: SecurityIssue[]
  recommendations: SecurityRecommendation[]
}

interface SecurityIssue {
  id: string
  type: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  affectedSystems: string[]
  detectedAt: string
  status: 'open' | 'investigating' | 'resolved'
}

interface SecurityRecommendation {
  id: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  effort: 'low' | 'medium' | 'high'
}

interface SecurityMetrics {
  totalThreats: number
  blockedAttacks: number
  failedLogins: number
  suspiciousActivities: number
  encryptionStatus: 'enabled' | 'disabled' | 'partial'
  lastBackup: string
  systemUptime: number
}

export default function SecurityDashboard() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null)
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadSecurityStatus()
      loadSecurityMetrics()
    }
  }, [user])

  const loadSecurityStatus = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/security/status?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSecurityStatus(data.securityStatus)
      }
    } catch (error) {
      console.error('보안 상태 로드 실패:', error)
    }
  }

  const loadSecurityMetrics = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/security/metrics?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSecurityMetrics(data.metrics)
      }
    } catch (error) {
      console.error('보안 메트릭 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      loadSecurityStatus(),
      loadSecurityMetrics()
    ])
    setRefreshing(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secure':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure':
        return 'bg-green-100 text-green-700'
      case 'warning':
        return 'bg-yellow-100 text-yellow-700'
      case 'critical':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'secure':
        return '안전'
      case 'warning':
        return '주의'
      case 'critical':
        return '위험'
      default:
        return '알 수 없음'
    }
  }

  const getIssueTypeColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-100 text-red-700'
      case 'high':
        return 'bg-orange-100 text-orange-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'low':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getIssueTypeText = (type: string) => {
    switch (type) {
      case 'critical':
        return '치명적'
      case 'high':
        return '높음'
      case 'medium':
        return '보통'
      case 'low':
        return '낮음'
      default:
        return '알 수 없음'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">보안 상태를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">보안 대시보드</h1>
          <p className="text-gray-600">Amiko 서비스의 보안 상태를 실시간으로 모니터링합니다.</p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? '새로고침 중...' : '새로고침'}
        </Button>
      </div>

      {/* 전체 보안 상태 */}
      {securityStatus && (
        <Card className={`${getStatusColor(securityStatus.overall)} border-2`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(securityStatus.overall)}
                <div>
                  <CardTitle className="text-xl">전체 보안 상태</CardTitle>
                  <CardDescription>
                    마지막 검사: {new Date(securityStatus.lastChecked).toLocaleString()}
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {securityStatus.score}/100
                </div>
                <Badge className={getStatusColor(securityStatus.overall)}>
                  {getStatusText(securityStatus.overall)}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* 보안 메트릭 */}
      {securityMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">차단된 공격</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {securityMetrics.blockedAttacks}
              </div>
              <div className="text-xs text-gray-500">오늘</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium">실패한 로그인</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {securityMetrics.failedLogins}
              </div>
              <div className="text-xs text-gray-500">오늘</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium">의심스러운 활동</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {securityMetrics.suspiciousActivities}
              </div>
              <div className="text-xs text-gray-500">오늘</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">암호화 상태</span>
              </div>
              <div className="text-lg font-bold text-green-600">
                {securityMetrics.encryptionStatus === 'enabled' ? '활성화' : 
                 securityMetrics.encryptionStatus === 'partial' ? '부분적' : '비활성화'}
              </div>
              <div className="text-xs text-gray-500">전체 시스템</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 보안 이슈 */}
      {securityStatus && securityStatus.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              보안 이슈
            </CardTitle>
            <CardDescription>
              발견된 보안 문제와 해결 상태를 확인하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityStatus.issues.map((issue) => (
                <div key={issue.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getIssueTypeColor(issue.type)}>
                        {getIssueTypeText(issue.type)}
                      </Badge>
                      <span className="font-medium">{issue.title}</span>
                    </div>
                    <Badge variant="outline">
                      {issue.status === 'open' ? '열림' :
                       issue.status === 'investigating' ? '조사 중' : '해결됨'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>영향 시스템: {issue.affectedSystems.join(', ')}</span>
                    <span>발견일: {new Date(issue.detectedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 보안 권장사항 */}
      {securityStatus && securityStatus.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              보안 권장사항
            </CardTitle>
            <CardDescription>
              보안을 강화하기 위한 권장사항입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityStatus.recommendations.map((recommendation) => (
                <div key={recommendation.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={
                        recommendation.priority === 'high' ? 'bg-red-100 text-red-700' :
                        recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }>
                        {recommendation.priority === 'high' ? '높음' :
                         recommendation.priority === 'medium' ? '보통' : '낮음'}
                      </Badge>
                      <span className="font-medium">{recommendation.title}</span>
                    </div>
                    <Badge variant="outline">
                      {recommendation.effort === 'low' ? '쉬움' :
                       recommendation.effort === 'medium' ? '보통' : '어려움'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{recommendation.description}</p>
                  
                  <div className="text-xs text-gray-500">
                    <strong>예상 효과:</strong> {recommendation.impact}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 시스템 상태 */}
      {securityMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                시스템 상태
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">시스템 가동 시간</span>
                <span className="font-medium">{securityMetrics.systemUptime}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">마지막 백업</span>
                <span className="font-medium">
                  {new Date(securityMetrics.lastBackup).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">암호화 상태</span>
                <Badge className={
                  securityMetrics.encryptionStatus === 'enabled' ? 'bg-green-100 text-green-700' :
                  securityMetrics.encryptionStatus === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }>
                  {securityMetrics.encryptionStatus === 'enabled' ? '활성화' :
                   securityMetrics.encryptionStatus === 'partial' ? '부분적' : '비활성화'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                네트워크 보안
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">방화벽 상태</span>
                <Badge className="bg-green-100 text-green-700">활성화</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">DDoS 방어</span>
                <Badge className="bg-green-100 text-green-700">활성화</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">침입 탐지</span>
                <Badge className="bg-green-100 text-green-700">활성화</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 보안 알림 */}
      <Alert className="bg-blue-50 border-gray-600 dark:border-gray-400">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>보안 모니터링:</strong> 모든 보안 이벤트는 실시간으로 모니터링되며, 
          위협이 감지되면 즉시 알림을 받을 수 있습니다. 
          보안 관련 문의사항이 있으시면 security@amiko.com으로 연락해주세요.
        </AlertDescription>
      </Alert>
    </div>
  )
}
