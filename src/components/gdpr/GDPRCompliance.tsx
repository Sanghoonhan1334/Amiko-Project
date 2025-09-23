'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { 
  Shield, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  Database,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Unlock,
  Copy,
  ExternalLink
} from 'lucide-react'

interface DataSubjectRights {
  id: string
  userId: string
  rightType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection'
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  requestedAt: string
  processedAt?: string
  responseData?: any
  rejectionReason?: string
}

interface PersonalDataExport {
  id: string
  userId: string
  dataType: 'complete' | 'profile' | 'activity' | 'consent'
  status: 'pending' | 'processing' | 'completed' | 'expired'
  requestedAt: string
  completedAt?: string
  downloadUrl?: string
  expiresAt?: string
}

export default function GDPRCompliance() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [rightsHistory, setRightsHistory] = useState<DataSubjectRights[]>([])
  const [exportHistory, setExportHistory] = useState<PersonalDataExport[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [selectedRight, setSelectedRight] = useState<string>('')
  const [requestReason, setRequestReason] = useState('')

  const gdprRights = [
    {
      id: 'access',
      title: '데이터 접근권 (Right of Access)',
      description: '처리 중인 개인정보에 대한 접근 및 사본 요청',
      icon: <Eye className="w-5 h-5" />,
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600'
    },
    {
      id: 'rectification',
      title: '데이터 정정권 (Right of Rectification)',
      description: '부정확하거나 불완전한 개인정보의 정정 요청',
      icon: <Edit className="w-5 h-5" />,
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600'
    },
    {
      id: 'erasure',
      title: '데이터 삭제권 (Right to Erasure)',
      description: '특정 조건 하에서 개인정보 삭제 요청',
      icon: <Trash2 className="w-5 h-5" />,
      color: 'bg-red-50 border-red-200',
      iconColor: 'text-red-600'
    },
    {
      id: 'portability',
      title: '데이터 이식권 (Right to Data Portability)',
      description: '구조화된 형태로 개인정보 사본 제공 요청',
      icon: <Download className="w-5 h-5" />,
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600'
    },
    {
      id: 'restriction',
      title: '처리 제한권 (Right to Restriction)',
      description: '특정 조건 하에서 개인정보 처리 제한 요청',
      icon: <Lock className="w-5 h-5" />,
      color: 'bg-yellow-50 border-yellow-200',
      iconColor: 'text-yellow-600'
    },
    {
      id: 'objection',
      title: '처리 반대권 (Right to Object)',
      description: '개인정보 처리에 대한 반대 의사 표시',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'bg-orange-50 border-orange-200',
      iconColor: 'text-orange-600'
    }
  ]

  useEffect(() => {
    if (user?.id) {
      loadRightsHistory()
      loadExportHistory()
    }
  }, [user])

  const loadRightsHistory = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/gdpr/rights-history?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRightsHistory(data.rightsHistory || [])
      }
    } catch (error) {
      console.error('권리 이력 로드 실패:', error)
    }
  }

  const loadExportHistory = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/gdpr/data-export?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setExportHistory(data.exportHistory || [])
      }
    } catch (error) {
      console.error('데이터 내보내기 이력 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRightRequest = async () => {
    if (!user?.id || !selectedRight || !requestReason.trim()) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/gdpr/rights-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({
          userId: user.id,
          rightType: selectedRight,
          reason: requestReason.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert('GDPR 권리 요청이 접수되었습니다. 처리 결과는 이메일로 안내드립니다.')
        
        // 폼 초기화
        setSelectedRight('')
        setRequestReason('')
        setShowRequestForm(false)
        
        // 데이터 새로고침
        loadRightsHistory()
      } else {
        const error = await response.json()
        alert(`권리 요청 실패: ${error.error}`)
      }
    } catch (error) {
      console.error('권리 요청 실패:', error)
      alert('권리 요청 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDataExport = async (dataType: string) => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/gdpr/data-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({
          userId: user.id,
          dataType
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert('데이터 내보내기 요청이 접수되었습니다. 처리 완료 시 다운로드 링크를 이메일로 안내드립니다.')
        loadExportHistory()
      } else {
        const error = await response.json()
        alert(`데이터 내보내기 실패: ${error.error}`)
      }
    } catch (error) {
      console.error('데이터 내보내기 실패:', error)
      alert('데이터 내보내기 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'processing':
        return <Database className="w-4 h-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'expired':
        return <Clock className="w-4 h-4 text-gray-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'processing':
        return 'bg-blue-100 text-blue-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      case 'expired':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '대기 중'
      case 'processing':
        return '처리 중'
      case 'completed':
        return '완료'
      case 'rejected':
        return '거부됨'
      case 'expired':
        return '만료됨'
      default:
        return '알 수 없음'
    }
  }

  const getRightTitle = (rightType: string) => {
    const right = gdprRights.find(r => r.id === rightType)
    return right ? right.title : rightType
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">GDPR 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">GDPR 데이터 주체 권리</h1>
        <p className="text-gray-600">EU 일반데이터보호규정(GDPR)에 따른 개인정보 보호 권리를 행사할 수 있습니다.</p>
      </div>

      {/* GDPR 정보 */}
      <Alert className="bg-blue-50 border-blue-200">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>GDPR 준수:</strong> Amiko는 EU 일반데이터보호규정(GDPR)을 준수하며, 
          데이터 주체의 권리를 보장합니다. 모든 요청은 30일 이내에 처리됩니다.
        </AlertDescription>
      </Alert>

      {/* GDPR 권리 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gdprRights.map((right) => (
          <Card key={right.id} className={`${right.color} hover:shadow-md transition-shadow`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white ${right.iconColor}`}>
                  {right.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{right.title}</CardTitle>
                  <CardDescription className="text-sm">{right.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => {
                  setSelectedRight(right.id)
                  setShowRequestForm(true)
                }}
                variant="outline"
                className="w-full"
              >
                권리 행사 요청
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 데이터 이식권 - 빠른 액션 */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-600" />
            데이터 이식권 (Data Portability)
          </CardTitle>
          <CardDescription>
            개인정보를 구조화된 형태로 다운로드할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => handleDataExport('complete')}
              variant="outline"
              className="flex flex-col items-center p-4 h-auto"
            >
              <FileText className="w-6 h-6 mb-2" />
              <span className="text-sm">전체 데이터</span>
            </Button>
            <Button
              onClick={() => handleDataExport('profile')}
              variant="outline"
              className="flex flex-col items-center p-4 h-auto"
            >
              <User className="w-6 h-6 mb-2" />
              <span className="text-sm">프로필 정보</span>
            </Button>
            <Button
              onClick={() => handleDataExport('activity')}
              variant="outline"
              className="flex flex-col items-center p-4 h-auto"
            >
              <Database className="w-6 h-6 mb-2" />
              <span className="text-sm">활동 기록</span>
            </Button>
            <Button
              onClick={() => handleDataExport('consent')}
              variant="outline"
              className="flex flex-col items-center p-4 h-auto"
            >
              <Shield className="w-6 h-6 mb-2" />
              <span className="text-sm">동의 기록</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 권리 요청 폼 */}
      {showRequestForm && (
        <Card>
          <CardHeader>
            <CardTitle>GDPR 권리 요청</CardTitle>
            <CardDescription>
              {selectedRight && getRightTitle(selectedRight)} 요청을 위한 정보를 입력해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reason" className="text-base font-semibold">
                요청 사유 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="권리 행사를 요청하는 구체적인 사유를 입력해주세요..."
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowRequestForm(false)}
                disabled={submitting}
              >
                취소
              </Button>
              <Button 
                onClick={handleRightRequest}
                disabled={submitting || !requestReason.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? '요청 중...' : '권리 요청'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 권리 요청 이력 */}
      {rightsHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>권리 요청 이력</CardTitle>
            <CardDescription>
              이전에 요청한 GDPR 권리 행사 내역입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rightsHistory.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span className="font-medium">{getRightTitle(request.rightType)}</span>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusText(request.status)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{request.responseData?.reason || '사유 없음'}</p>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>요청일: {new Date(request.requestedAt).toLocaleString()}</span>
                    {request.processedAt && (
                      <span>처리일: {new Date(request.processedAt).toLocaleString()}</span>
                    )}
                  </div>
                  
                  {request.rejectionReason && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                      <strong>거부 사유:</strong> {request.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 데이터 내보내기 이력 */}
      {exportHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>데이터 내보내기 이력</CardTitle>
            <CardDescription>
              요청한 개인정보 다운로드 내역입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exportHistory.map((exportItem) => (
                <div key={exportItem.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(exportItem.status)}
                      <span className="font-medium">
                        {exportItem.dataType === 'complete' ? '전체 데이터' :
                         exportItem.dataType === 'profile' ? '프로필 정보' :
                         exportItem.dataType === 'activity' ? '활동 기록' : '동의 기록'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(exportItem.status)}>
                        {getStatusText(exportItem.status)}
                      </Badge>
                      {exportItem.downloadUrl && exportItem.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(exportItem.downloadUrl, '_blank')}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          다운로드
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>요청일: {new Date(exportItem.requestedAt).toLocaleString()}</span>
                    {exportItem.completedAt && (
                      <span>완료일: {new Date(exportItem.completedAt).toLocaleString()}</span>
                    )}
                    {exportItem.expiresAt && (
                      <span>만료일: {new Date(exportItem.expiresAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 추가 정보 */}
      <div className="text-center text-sm text-gray-500 space-y-2">
        <p>
          GDPR에 대한 자세한 내용은 
          <a href="/privacy" className="text-blue-600 hover:underline ml-1">
            개인정보처리방침
          </a>
          을 확인하세요.
        </p>
        <p>
          문의사항이 있으시면 
          <a href="mailto:gdpr@amiko.com" className="text-blue-600 hover:underline ml-1">
            gdpr@amiko.com
          </a>
          으로 연락해주세요.
        </p>
        <p className="text-xs">
          <ExternalLink className="w-3 h-3 inline mr-1" />
          <a href="https://gdpr.eu/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            GDPR 공식 웹사이트
          </a>
        </p>
      </div>
    </div>
  )
}
