'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Shield, Eye, Database, Mail, Settings, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface ConsentItem {
  id: string
  title: string
  description: string
  required: boolean
  category: 'essential' | 'functional' | 'analytics' | 'marketing'
  dataTypes: string[]
  retentionPeriod: string
  legalBasis: string
}

interface ConsentState {
  [key: string]: boolean
}

export default function ConsentManager() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [consentItems, setConsentItems] = useState<ConsentItem[]>([])
  const [consentState, setConsentState] = useState<ConsentState>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({})

  // 개인정보 수집 동의 항목 정의
  const consentItemsData: ConsentItem[] = [
    {
      id: 'essential',
      title: '필수 개인정보 수집',
      description: '서비스 제공을 위해 반드시 필요한 개인정보입니다.',
      required: true,
      category: 'essential',
      dataTypes: ['이메일', '이름', '전화번호', '국가', '한국인 여부'],
      retentionPeriod: '회원 탈퇴 시 즉시 삭제',
      legalBasis: '서비스 제공을 위한 정당한 이익'
    },
    {
      id: 'profile',
      title: '프로필 정보 수집',
      description: '맞춤형 서비스 제공을 위한 추가 정보입니다.',
      required: false,
      category: 'functional',
      dataTypes: ['프로필 사진', '대학/직업 정보', '관심사', '언어 수준', '매칭 선호도'],
      retentionPeriod: '회원 탈퇴 시 즉시 삭제',
      legalBasis: '사용자 동의'
    },
    {
      id: 'activity',
      title: '서비스 이용 기록 수집',
      description: '서비스 개선 및 품질 향상을 위한 이용 기록입니다.',
      required: false,
      category: 'analytics',
      dataTypes: ['화상채팅 기록', '게시글', '댓글', '좋아요', '포인트 사용 내역'],
      retentionPeriod: '3개월 ~ 5년 (항목별 상이)',
      legalBasis: '서비스 개선을 위한 정당한 이익'
    },
    {
      id: 'system',
      title: '시스템 로그 수집',
      description: '보안 및 서비스 안정성을 위한 자동 수집 정보입니다.',
      required: true,
      category: 'essential',
      dataTypes: ['IP 주소', '접속 로그', '디바이스 정보', '브라우저 정보'],
      retentionPeriod: '3개월',
      legalBasis: '보안 및 서비스 제공을 위한 정당한 이익'
    },
    {
      id: 'marketing',
      title: '마케팅 정보 수집',
      description: '맞춤형 이벤트 및 서비스 추천을 위한 정보입니다.',
      required: false,
      category: 'marketing',
      dataTypes: ['관심사 분석', '이벤트 참여 기록', '서비스 이용 패턴'],
      retentionPeriod: '1년',
      legalBasis: '명시적 사용자 동의'
    }
  ]

  useEffect(() => {
    loadConsentState()
  }, [user])

  const loadConsentState = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/user/consent?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConsentState(data.consentState || {})
      } else {
        // 기본값 설정 (필수 항목은 true, 선택 항목은 false)
        const defaultState: ConsentState = {}
        consentItemsData.forEach(item => {
          defaultState[item.id] = item.required
        })
        setConsentState(defaultState)
      }
    } catch (error) {
      console.error('동의 상태 로드 실패:', error)
      // 기본값 설정
      const defaultState: ConsentState = {}
      consentItemsData.forEach(item => {
        defaultState[item.id] = item.required
      })
      setConsentState(defaultState)
    } finally {
      setLoading(false)
    }
  }

  const handleConsentChange = (itemId: string, checked: boolean) => {
    setConsentState(prev => ({
      ...prev,
      [itemId]: checked
    }))
  }

  const handleSaveConsent = async () => {
    if (!user?.id) return

    setSaving(true)
    try {
      const response = await fetch('/api/user/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({
          userId: user.id,
          consentState,
          consentDate: new Date().toISOString()
        })
      })

      if (response.ok) {
        // 성공 알림
        alert('개인정보 수집 동의 설정이 저장되었습니다.')
      } else {
        throw new Error('저장 실패')
      }
    } catch (error) {
      console.error('동의 저장 실패:', error)
      alert('동의 설정 저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  const toggleDetails = (itemId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'essential':
        return <Shield className="w-4 h-4 text-red-500" />
      case 'functional':
        return <Settings className="w-4 h-4 text-blue-500" />
      case 'analytics':
        return <Database className="w-4 h-4 text-purple-500" />
      case 'marketing':
        return <Mail className="w-4 h-4 text-green-500" />
      default:
        return <Eye className="w-4 h-4 text-gray-500" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'essential':
        return 'bg-red-50 border-red-200'
      case 'functional':
        return 'bg-blue-50 border-blue-200'
      case 'analytics':
        return 'bg-purple-50 border-purple-200'
      case 'marketing':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'essential':
        return 'bg-red-100 text-red-700'
      case 'functional':
        return 'bg-blue-100 text-blue-700'
      case 'analytics':
        return 'bg-purple-100 text-purple-700'
      case 'marketing':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">동의 설정을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">개인정보 수집 동의</h1>
        <p className="text-gray-600">Amiko 서비스 이용을 위한 개인정보 수집에 동의해주세요.</p>
      </div>

      {/* 중요 안내 */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>필수 항목</strong>은 서비스 이용을 위해 반드시 동의해야 합니다. 
          <strong>선택 항목</strong>은 동의하지 않아도 서비스를 이용할 수 있지만, 일부 기능이 제한될 수 있습니다.
        </AlertDescription>
      </Alert>

      {/* 동의 항목들 */}
      <div className="space-y-4">
        {consentItemsData.map((item) => (
          <Card key={item.id} className={`${getCategoryColor(item.category)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getCategoryIcon(item.category)}
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryBadgeColor(item.category)}>
                    {item.category === 'essential' ? '필수' : 
                     item.category === 'functional' ? '기능' :
                     item.category === 'analytics' ? '분석' : '마케팅'}
                  </Badge>
                  {item.required && (
                    <Badge variant="destructive">필수</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* 동의 체크박스 */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={item.id}
                  checked={consentState[item.id] || false}
                  onCheckedChange={(checked) => handleConsentChange(item.id, checked as boolean)}
                  disabled={item.required}
                />
                <label 
                  htmlFor={item.id} 
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                    item.required ? 'text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {item.required ? '필수 동의 (변경 불가)' : '동의합니다'}
                </label>
              </div>

              {/* 상세 정보 토글 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleDetails(item.id)}
                className="text-blue-600 hover:text-blue-800"
              >
                {showDetails[item.id] ? '상세 정보 숨기기' : '상세 정보 보기'}
              </Button>

              {/* 상세 정보 */}
              {showDetails[item.id] && (
                <div className="bg-white/50 p-4 rounded-lg space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">수집하는 개인정보</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.dataTypes.map((dataType, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {dataType}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">보관기간</h4>
                    <p className="text-sm text-gray-600">{item.retentionPeriod}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">법적 근거</h4>
                    <p className="text-sm text-gray-600">{item.legalBasis}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 동의 상태 요약 */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-800 mb-4">동의 상태 요약</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {consentItemsData.map((item) => (
              <div key={item.id} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {consentState[item.id] ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
                <p className="text-sm font-medium text-gray-700">{item.title}</p>
                <p className="text-xs text-gray-500">
                  {consentState[item.id] ? '동의함' : '동의 안함'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-center">
        <Button 
          onClick={handleSaveConsent}
          disabled={saving}
          className="px-8 py-3"
        >
          {saving ? '저장 중...' : '동의 설정 저장'}
        </Button>
      </div>

      {/* 추가 정보 */}
      <div className="text-center text-sm text-gray-500">
        <p>
          동의 설정은 언제든지 변경할 수 있습니다. 
          <a href="/privacy" className="text-blue-600 hover:underline ml-1">
            개인정보처리방침
          </a>
          을 확인하세요.
        </p>
      </div>
    </div>
  )
}
