'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { 
  Trash2, 
  AlertTriangle, 
  Shield, 
  Database, 
  User, 
  MessageSquare, 
  Video, 
  Gift,
  Clock,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'

interface DataDeletionRequest {
  id: string
  userId: string
  requestType: 'partial' | 'complete'
  reason: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  requestedAt: string
  processedAt?: string
  processedBy?: string
  rejectionReason?: string
}

interface UserDataStatus {
  hasProfile: boolean
  postsCount: number
  commentsCount: number
  videoCallsCount: number
  pointsCount: number
  lastLoginAt: string
}

export default function DataDeletionRequest() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [dataStatus, setDataStatus] = useState<UserDataStatus | null>(null)
  const [deletionHistory, setDeletionHistory] = useState<DataDeletionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)
  
  // 삭제 요청 폼 상태
  const [requestType, setRequestType] = useState<'partial' | 'complete'>('partial')
  const [reason, setReason] = useState('')
  const [confirmDeletion, setConfirmDeletion] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadDataStatus()
      loadDeletionHistory()
    }
  }, [user])

  const loadDataStatus = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/user/data-deletion?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDataStatus(data.dataStatus)
      }
    } catch (error) {
      console.error('데이터 상태 로드 실패:', error)
    }
  }

  const loadDeletionHistory = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/user/deletion-history?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDeletionHistory(data.deletionHistory || [])
      }
    } catch (error) {
      console.error('삭제 이력 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitRequest = async () => {
    if (!user?.id || !reason.trim() || !confirmDeletion) {
      alert('모든 필수 항목을 입력하고 확인 체크박스를 선택해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/user/data-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({
          userId: user.id,
          requestType,
          reason: reason.trim(),
          deleteAll: requestType === 'complete'
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert('개인정보 삭제 요청이 접수되었습니다. 처리 결과는 이메일로 안내드립니다.')
        
        // 폼 초기화
        setRequestType('partial')
        setReason('')
        setConfirmDeletion(false)
        setShowRequestForm(false)
        
        // 데이터 새로고침
        loadDataStatus()
        loadDeletionHistory()
      } else {
        const error = await response.json()
        alert(`삭제 요청 실패: ${error.error}`)
      }
    } catch (error) {
      console.error('삭제 요청 실패:', error)
      alert('삭제 요청 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
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
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
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
      default:
        return '알 수 없음'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">개인정보 삭제 요청</h1>
        <p className="text-gray-600">개인정보보호법에 따라 개인정보 삭제를 요청할 수 있습니다.</p>
      </div>

      {/* 중요 안내 */}
      <Alert className="bg-red-50 border-red-200">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>주의:</strong> 개인정보 삭제는 되돌릴 수 없습니다. 
          삭제된 데이터는 복구할 수 없으므로 신중하게 결정해주세요.
        </AlertDescription>
      </Alert>

      {/* 현재 보유 데이터 현황 */}
      {dataStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              현재 보유 중인 개인정보
            </CardTitle>
            <CardDescription>
              현재 Amiko에 저장된 개인정보 현황입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <User className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">프로필 정보</p>
                <p className="text-lg font-semibold">
                  {dataStatus.hasProfile ? '있음' : '없음'}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <MessageSquare className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">게시글</p>
                <p className="text-lg font-semibold">{dataStatus.postsCount}개</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <MessageSquare className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">댓글</p>
                <p className="text-lg font-semibold">{dataStatus.commentsCount}개</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Video className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">화상채팅 기록</p>
                <p className="text-lg font-semibold">{dataStatus.videoCallsCount}개</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Gift className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">포인트 기록</p>
                <p className="text-lg font-semibold">{dataStatus.pointsCount}개</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Clock className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">마지막 로그인</p>
                <p className="text-sm font-semibold">
                  {new Date(dataStatus.lastLoginAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 삭제 요청 폼 */}
      {!showRequestForm ? (
        <div className="text-center">
          <Button 
            onClick={() => setShowRequestForm(true)}
            variant="destructive"
            className="px-8 py-3"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            개인정보 삭제 요청
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>개인정보 삭제 요청</CardTitle>
            <CardDescription>
              삭제할 개인정보 범위와 사유를 입력해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 삭제 범위 선택 */}
            <div>
              <Label className="text-base font-semibold">삭제 범위</Label>
              <RadioGroup 
                value={requestType} 
                onValueChange={(value) => setRequestType(value as 'partial' | 'complete')}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="partial" id="partial" />
                  <Label htmlFor="partial" className="flex-1">
                    <div>
                      <p className="font-medium">부분 삭제</p>
                      <p className="text-sm text-gray-600">
                        프로필 정보와 커뮤니티 활동만 삭제 (계정 유지)
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="complete" id="complete" />
                  <Label htmlFor="complete" className="flex-1">
                    <div>
                      <p className="font-medium">전체 삭제</p>
                      <p className="text-sm text-gray-600">
                        모든 개인정보 삭제 (계정 탈퇴)
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 삭제 사유 */}
            <div>
              <Label htmlFor="reason" className="text-base font-semibold">
                삭제 사유 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="개인정보 삭제를 요청하는 사유를 입력해주세요..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>

            {/* 확인 체크박스 */}
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="confirm"
                  checked={confirmDeletion}
                  onChange={(e) => setConfirmDeletion(e.target.checked)}
                  className="mt-1"
                />
                <Label htmlFor="confirm" className="text-sm text-red-800">
                  <strong>삭제된 개인정보는 복구할 수 없습니다.</strong><br />
                  위 내용을 확인했으며, 개인정보 삭제를 요청합니다.
                </Label>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowRequestForm(false)}
                disabled={submitting}
              >
                취소
              </Button>
              <Button 
                onClick={handleSubmitRequest}
                disabled={submitting || !reason.trim() || !confirmDeletion}
                variant="destructive"
              >
                {submitting ? '요청 중...' : '삭제 요청'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 삭제 요청 이력 */}
      {deletionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>삭제 요청 이력</CardTitle>
            <CardDescription>
              이전에 요청한 개인정보 삭제 내역입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deletionHistory.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span className="font-medium">
                        {request.requestType === 'partial' ? '부분 삭제' : '전체 삭제'}
                      </span>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusText(request.status)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{request.reason}</p>
                  
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

      {/* 추가 정보 */}
      <div className="text-center text-sm text-gray-500">
        <p>
          개인정보 삭제에 대한 자세한 내용은 
          <a href="/privacy" className="text-blue-600 hover:underline ml-1">
            개인정보처리방침
          </a>
          을 확인하세요.
        </p>
        <p className="mt-1">
          문의사항이 있으시면 
          <a href="mailto:privacy@amiko.com" className="text-blue-600 hover:underline ml-1">
            privacy@amiko.com
          </a>
          으로 연락해주세요.
        </p>
      </div>
    </div>
  )
}
