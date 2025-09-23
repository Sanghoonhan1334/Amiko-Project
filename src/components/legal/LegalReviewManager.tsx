'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { 
  Scale, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText,
  Users,
  Calendar,
  Shield,
  Eye,
  Edit,
  Download,
  Upload,
  Send,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Target,
  Award,
  BookOpen,
  Gavel,
  Building,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react'

interface PolicyReview {
  id: string
  policyName: string
  policyType: 'privacy' | 'terms' | 'cookies' | 'retention' | 'consent' | 'deletion' | 'gdpr' | 'security' | 'third_party'
  status: 'draft' | 'under_review' | 'approved' | 'rejected' | 'published'
  version: string
  lastUpdated: string
  reviewProgress: number
  legalCompliance: {
    domestic: boolean
    international: boolean
    industry: boolean
  }
  reviewers: Reviewer[]
  comments: Comment[]
  nextReviewDate: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

interface Reviewer {
  id: string
  name: string
  role: 'legal' | 'security' | 'compliance' | 'management'
  status: 'pending' | 'reviewing' | 'approved' | 'rejected'
  reviewedAt?: string
  comments?: string
}

interface Comment {
  id: string
  reviewerId: string
  reviewerName: string
  content: string
  type: 'suggestion' | 'requirement' | 'question' | 'approval'
  createdAt: string
  resolved: boolean
}

interface ReviewMetrics {
  totalPolicies: number
  underReview: number
  approved: number
  rejected: number
  published: number
  averageReviewTime: number
  complianceScore: number
  riskIssues: number
}

export default function LegalReviewManager() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [policies, setPolicies] = useState<PolicyReview[]>([])
  const [metrics, setMetrics] = useState<ReviewMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPolicy, setSelectedPolicy] = useState<string>('')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewComment, setReviewComment] = useState('')

  const policyTypes = [
    { id: 'privacy', name: '개인정보보호정책', icon: <Shield className="w-4 h-4" /> },
    { id: 'terms', name: '서비스 이용약관', icon: <FileText className="w-4 h-4" /> },
    { id: 'cookies', name: '쿠키 정책', icon: <Eye className="w-4 h-4" /> },
    { id: 'retention', name: '데이터 보관기간 정책', icon: <Calendar className="w-4 h-4" /> },
    { id: 'consent', name: '개인정보 수집 동의 절차', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'deletion', name: '개인정보 삭제 요청 처리', icon: <XCircle className="w-4 h-4" /> },
    { id: 'gdpr', name: 'GDPR 준수 사항', icon: <Building className="w-4 h-4" /> },
    { id: 'security', name: '보안 정책', icon: <Shield className="w-4 h-4" /> },
    { id: 'third_party', name: '제3자 서비스 연동 정책', icon: <ExternalLink className="w-4 h-4" /> }
  ]

  useEffect(() => {
    if (user?.id) {
      loadPolicies()
      loadMetrics()
    }
  }, [user])

  const loadPolicies = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/legal/review?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPolicies(data.policies || [])
      }
    } catch (error) {
      console.error('정책 검토 목록 로드 실패:', error)
    }
  }

  const loadMetrics = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/legal/metrics?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics)
      }
    } catch (error) {
      console.error('검토 메트릭 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSubmit = async (policyId: string, action: 'approve' | 'reject') => {
    if (!user?.id || !reviewComment.trim()) {
      alert('검토 의견을 입력해주세요.')
      return
    }

    try {
      const response = await fetch('/api/legal/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({
          policyId,
          action,
          comment: reviewComment.trim(),
          reviewerId: user.id
        })
      })

      if (response.ok) {
        alert(`정책이 ${action === 'approve' ? '승인' : '거부'}되었습니다.`)
        setReviewComment('')
        setShowReviewForm(false)
        loadPolicies()
      } else {
        const error = await response.json()
        alert(`검토 제출 실패: ${error.error}`)
      }
    } catch (error) {
      console.error('검토 제출 실패:', error)
      alert('검토 제출 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit className="w-4 h-4 text-gray-500" />
      case 'under_review':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'published':
        return <Award className="w-4 h-4 text-blue-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700'
      case 'under_review':
        return 'bg-yellow-100 text-yellow-700'
      case 'approved':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      case 'published':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return '초안'
      case 'under_review':
        return '검토 중'
      case 'approved':
        return '승인됨'
      case 'rejected':
        return '거부됨'
      case 'published':
        return '발행됨'
      default:
        return '알 수 없음'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'high':
        return 'bg-orange-100 text-orange-700'
      case 'critical':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'low':
        return '낮음'
      case 'medium':
        return '보통'
      case 'high':
        return '높음'
      case 'critical':
        return '치명적'
      default:
        return '알 수 없음'
    }
  }

  const getPolicyTypeName = (type: string) => {
    const policyType = policyTypes.find(p => p.id === type)
    return policyType ? policyType.name : type
  }

  const getPolicyTypeIcon = (type: string) => {
    const policyType = policyTypes.find(p => p.id === type)
    return policyType ? policyType.icon : <FileText className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">법무 검토 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">법무 검토 및 정책 승인</h1>
        <p className="text-gray-600">Amiko 서비스의 모든 정책에 대한 법무 검토 및 승인을 관리합니다.</p>
      </div>

      {/* 중요 안내 */}
      <Alert className="bg-blue-50 border-blue-200">
        <Scale className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>법무 검토:</strong> 모든 정책은 법무팀의 검토를 거쳐 승인되어야 하며, 
          정기적인 재검토를 통해 법적 준수를 보장합니다.
        </AlertDescription>
      </Alert>

      {/* 검토 메트릭 */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">총 정책</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.totalPolicies}
              </div>
              <div className="text-xs text-gray-500">
                검토 중: {metrics.underReview}개
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">승인됨</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {metrics.approved}
              </div>
              <div className="text-xs text-gray-500">
                발행됨: {metrics.published}개
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">준수 점수</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {metrics.complianceScore}/100
              </div>
              <div className="text-xs text-gray-500">
                평균 검토시간: {metrics.averageReviewTime}일
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium">위험 이슈</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {metrics.riskIssues}
              </div>
              <div className="text-xs text-gray-500">
                거부됨: {metrics.rejected}개
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 정책 검토 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {policies.map((policy) => (
          <Card key={policy.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getPolicyTypeIcon(policy.policyType)}
                  <div>
                    <CardTitle className="text-lg">{policy.policyName}</CardTitle>
                    <CardDescription>v{policy.version}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(policy.status)}
                  <Badge className={getStatusColor(policy.status)}>
                    {getStatusText(policy.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* 검토 진행률 */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>검토 진행률</span>
                  <span>{policy.reviewProgress}%</span>
                </div>
                <Progress value={policy.reviewProgress} className="h-2" />
              </div>

              {/* 준수 상태 */}
              <div className="space-y-2">
                <div className="text-sm font-medium">준수 상태</div>
                <div className="flex gap-2">
                  <Badge variant="outline" className={policy.legalCompliance.domestic ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    국내법
                  </Badge>
                  <Badge variant="outline" className={policy.legalCompliance.international ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    국제법
                  </Badge>
                  <Badge variant="outline" className={policy.legalCompliance.industry ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    업계표준
                  </Badge>
                </div>
              </div>

              {/* 위험 수준 */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">위험 수준</span>
                <Badge className={getRiskColor(policy.riskLevel)}>
                  {getRiskText(policy.riskLevel)}
                </Badge>
              </div>

              {/* 검토자 정보 */}
              <div className="space-y-2">
                <div className="text-sm font-medium">검토자</div>
                <div className="space-y-1">
                  {policy.reviewers.map((reviewer) => (
                    <div key={reviewer.id} className="flex items-center justify-between text-xs">
                      <span>{reviewer.name}</span>
                      <Badge variant="outline" className={
                        reviewer.status === 'approved' ? 'bg-green-100 text-green-700' :
                        reviewer.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        reviewer.status === 'reviewing' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }>
                        {reviewer.status === 'approved' ? '승인' :
                         reviewer.status === 'rejected' ? '거부' :
                         reviewer.status === 'reviewing' ? '검토중' : '대기'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* 마지막 업데이트 */}
              <div className="text-xs text-gray-500">
                마지막 업데이트: {new Date(policy.lastUpdated).toLocaleDateString()}
              </div>

              {/* 다음 검토일 */}
              <div className="text-xs text-gray-500">
                다음 검토일: {new Date(policy.nextReviewDate).toLocaleDateString()}
              </div>

              {/* 액션 버튼 */}
              {policy.status === 'under_review' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedPolicy(policy.id)
                      setShowReviewForm(true)
                    }}
                    className="flex-1"
                  >
                    검토하기
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // 정책 상세 보기
                      window.open(`/docs/${policy.policyType}`, '_blank')
                    }}
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 검토 폼 */}
      {showReviewForm && (
        <Card>
          <CardHeader>
            <CardTitle>정책 검토</CardTitle>
            <CardDescription>
              선택된 정책에 대한 검토 의견을 작성하고 승인 또는 거부를 결정하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">검토 의견</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="검토 의견을 입력하세요..."
                className="w-full mt-1 p-3 border rounded-lg"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowReviewForm(false)}
              >
                취소
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleReviewSubmit(selectedPolicy, 'reject')}
                disabled={!reviewComment.trim()}
              >
                거부
              </Button>
              <Button 
                onClick={() => handleReviewSubmit(selectedPolicy, 'approve')}
                disabled={!reviewComment.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                승인
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 추가 정보 */}
      <div className="text-center text-sm text-gray-500 space-y-2">
        <p>
          법무 검토에 대한 자세한 내용은 
          <a href="/docs/legal-review-checklist" className="text-blue-600 hover:underline ml-1">
            법무 검토 체크리스트
          </a>
          를 확인하세요.
        </p>
        <p>
          문의사항이 있으시면 
          <a href="mailto:legal@amiko.com" className="text-blue-600 hover:underline ml-1">
            legal@amiko.com
          </a>
          으로 연락해주세요.
        </p>
      </div>
    </div>
  )
}
