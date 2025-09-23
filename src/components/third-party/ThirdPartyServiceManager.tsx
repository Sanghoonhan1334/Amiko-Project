'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { 
  ExternalLink, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Database,
  CreditCard,
  Mail,
  BarChart3,
  Users,
  Server,
  Key,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  Info,
  Settings,
  Eye,
  Lock,
  Unlock
} from 'lucide-react'

interface ThirdPartyService {
  id: string
  name: string
  category: 'essential' | 'functional' | 'analytics' | 'marketing'
  status: 'active' | 'inactive' | 'maintenance' | 'error'
  description: string
  provider: string
  dataTypes: string[]
  privacyLevel: 'public' | 'internal' | 'confidential' | 'restricted'
  lastUpdated: string
  uptime: number
  responseTime: number
  errorRate: number
  securityScore: number
  complianceStatus: {
    gdpr: boolean
    ccpa: boolean
    soc2: boolean
    iso27001: boolean
  }
  contractInfo: {
    startDate: string
    endDate: string
    renewalDate: string
    cost: number
    sla: string
  }
}

interface ServiceMetrics {
  totalServices: number
  activeServices: number
  criticalIssues: number
  averageUptime: number
  averageResponseTime: number
  totalCost: number
  complianceScore: number
}

export default function ThirdPartyServiceManager() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [services, setServices] = useState<ThirdPartyService[]>([])
  const [metrics, setMetrics] = useState<ServiceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({})

  const categories = [
    { id: 'all', name: '전체', icon: <Server className="w-4 h-4" /> },
    { id: 'essential', name: '필수 서비스', icon: <Shield className="w-4 h-4" /> },
    { id: 'functional', name: '기능 서비스', icon: <Settings className="w-4 h-4" /> },
    { id: 'analytics', name: '분석 서비스', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'marketing', name: '마케팅 서비스', icon: <Users className="w-4 h-4" /> }
  ]

  useEffect(() => {
    if (user?.id) {
      loadServices()
      loadMetrics()
    }
  }, [user])

  const loadServices = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/third-party/services?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      }
    } catch (error) {
      console.error('제3자 서비스 로드 실패:', error)
    }
  }

  const loadMetrics = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/third-party/metrics?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics)
      }
    } catch (error) {
      console.error('서비스 메트릭 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleDetails = (serviceId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'inactive':
        return <XCircle className="w-4 h-4 text-gray-500" />
      case 'maintenance':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'inactive':
        return 'bg-gray-100 text-gray-700'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700'
      case 'error':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '활성'
      case 'inactive':
        return '비활성'
      case 'maintenance':
        return '점검 중'
      case 'error':
        return '오류'
      default:
        return '알 수 없음'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'essential':
        return <Shield className="w-4 h-4 text-blue-600" />
      case 'functional':
        return <Settings className="w-4 h-4 text-green-600" />
      case 'analytics':
        return <BarChart3 className="w-4 h-4 text-purple-600" />
      case 'marketing':
        return <Users className="w-4 h-4 text-orange-600" />
      default:
        return <Server className="w-4 h-4 text-gray-600" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'essential':
        return 'bg-blue-50 border-blue-200'
      case 'functional':
        return 'bg-green-50 border-green-200'
      case 'analytics':
        return 'bg-purple-50 border-purple-200'
      case 'marketing':
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getPrivacyLevelColor = (level: string) => {
    switch (level) {
      case 'public':
        return 'bg-green-100 text-green-700'
      case 'internal':
        return 'bg-blue-100 text-blue-700'
      case 'confidential':
        return 'bg-yellow-100 text-yellow-700'
      case 'restricted':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPrivacyLevelText = (level: string) => {
    switch (level) {
      case 'public':
        return '공개'
      case 'internal':
        return '내부'
      case 'confidential':
        return '기밀'
      case 'restricted':
        return '제한'
      default:
        return '알 수 없음'
    }
  }

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(service => service.category === selectedCategory)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">제3자 서비스 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">제3자 서비스 관리</h1>
        <p className="text-gray-600">Amiko 서비스에 연동된 제3자 서비스의 상태를 모니터링하고 관리합니다.</p>
      </div>

      {/* 중요 안내 */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>제3자 서비스 정책:</strong> 모든 제3자 서비스는 보안 및 개인정보보호 기준을 충족해야 하며, 
          정기적인 검토를 통해 안전성을 보장합니다.
        </AlertDescription>
      </Alert>

      {/* 서비스 메트릭 */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">총 서비스</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.totalServices}
              </div>
              <div className="text-xs text-gray-500">
                활성: {metrics.activeServices}개
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">평균 가동률</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {metrics.averageUptime}%
              </div>
              <div className="text-xs text-gray-500">
                응답시간: {metrics.averageResponseTime}ms
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">준수 점수</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {metrics.complianceScore}/100
              </div>
              <div className="text-xs text-gray-500">
                위험 이슈: {metrics.criticalIssues}개
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium">총 비용</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                ${metrics.totalCost.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                월간 비용
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="flex items-center gap-2"
          >
            {category.icon}
            {category.name}
          </Button>
        ))}
      </div>

      {/* 제3자 서비스 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <Card key={service.id} className={`${getCategoryColor(service.category)} hover:shadow-md transition-shadow`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getCategoryIcon(service.category)}
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription>{service.provider}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(service.status)}
                  <Badge className={getStatusColor(service.status)}>
                    {getStatusText(service.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{service.description}</p>
              
              {/* 서비스 메트릭 */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>가동률:</span>
                  <span className="font-medium">{service.uptime}%</span>
                </div>
                <div className="flex justify-between">
                  <span>응답시간:</span>
                  <span className="font-medium">{service.responseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>에러율:</span>
                  <span className="font-medium">{service.errorRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>보안점수:</span>
                  <span className="font-medium">{service.securityScore}/100</span>
                </div>
              </div>

              {/* 개인정보 보호 수준 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">개인정보 보호:</span>
                <Badge className={getPrivacyLevelColor(service.privacyLevel)}>
                  {getPrivacyLevelText(service.privacyLevel)}
                </Badge>
              </div>

              {/* 준수 상태 */}
              <div className="space-y-1">
                <div className="text-xs text-gray-600">준수 상태:</div>
                <div className="flex gap-1">
                  {service.complianceStatus.gdpr && (
                    <Badge variant="outline" className="text-xs">GDPR</Badge>
                  )}
                  {service.complianceStatus.ccpa && (
                    <Badge variant="outline" className="text-xs">CCPA</Badge>
                  )}
                  {service.complianceStatus.soc2 && (
                    <Badge variant="outline" className="text-xs">SOC2</Badge>
                  )}
                  {service.complianceStatus.iso27001 && (
                    <Badge variant="outline" className="text-xs">ISO27001</Badge>
                  )}
                </div>
              </div>

              {/* 상세 정보 토글 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleDetails(service.id)}
                className="w-full text-blue-600 hover:text-blue-800"
              >
                {showDetails[service.id] ? '상세 정보 숨기기' : '상세 정보 보기'}
              </Button>

              {/* 상세 정보 */}
              {showDetails[service.id] && (
                <div className="bg-white/50 p-3 rounded-lg space-y-3 text-xs">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">처리하는 데이터</h4>
                    <div className="flex flex-wrap gap-1">
                      {service.dataTypes.map((dataType, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {dataType}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">계약 정보</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>시작일:</span>
                        <span>{new Date(service.contractInfo.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>종료일:</span>
                        <span>{new Date(service.contractInfo.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>갱신일:</span>
                        <span>{new Date(service.contractInfo.renewalDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>비용:</span>
                        <span>${service.contractInfo.cost}/월</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SLA:</span>
                        <span>{service.contractInfo.sla}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">마지막 업데이트</h4>
                    <p className="text-gray-600">
                      {new Date(service.lastUpdated).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 서비스가 없는 경우 */}
      {filteredServices.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {selectedCategory === 'all' ? '등록된 서비스가 없습니다' : '해당 카테고리의 서비스가 없습니다'}
            </h3>
            <p className="text-gray-500">
              새로운 제3자 서비스를 추가하거나 다른 카테고리를 선택해보세요.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 추가 정보 */}
      <div className="text-center text-sm text-gray-500 space-y-2">
        <p>
          제3자 서비스에 대한 자세한 내용은 
          <a href="/docs/third-party-policy" className="text-blue-600 hover:underline ml-1">
            제3자 서비스 연동 정책
          </a>
          을 확인하세요.
        </p>
        <p>
          문의사항이 있으시면 
          <a href="mailto:third-party@amiko.com" className="text-blue-600 hover:underline ml-1">
            third-party@amiko.com
          </a>
          으로 연락해주세요.
        </p>
      </div>
    </div>
  )
}
