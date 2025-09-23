'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/context/LanguageContext'
import { Shield, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'

interface ConsentStepProps {
  onConsentComplete: (consentState: ConsentState) => void
  onBack: () => void
}

interface ConsentState {
  essential: boolean
  profile: boolean
  activity: boolean
  system: boolean
  marketing: boolean
}

export default function ConsentStep({ onConsentComplete, onBack }: ConsentStepProps) {
  const { t } = useLanguage()
  const [consentState, setConsentState] = useState<ConsentState>({
    essential: false,
    profile: false,
    activity: false,
    system: false,
    marketing: false
  })
  const [allConsentChecked, setAllConsentChecked] = useState(false)
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({})

  const consentItems = [
    {
      id: 'essential',
      title: '필수 개인정보 수집',
      description: '서비스 제공을 위해 반드시 필요한 개인정보입니다.',
      required: true,
      dataTypes: ['이메일', '이름', '전화번호', '국가', '한국인 여부'],
      retentionPeriod: '회원 탈퇴 시 즉시 삭제',
      legalBasis: '서비스 제공을 위한 정당한 이익'
    },
    {
      id: 'system',
      title: '시스템 로그 수집',
      description: '보안 및 서비스 안정성을 위한 자동 수집 정보입니다.',
      required: true,
      dataTypes: ['IP 주소', '접속 로그', '디바이스 정보', '브라우저 정보'],
      retentionPeriod: '3개월',
      legalBasis: '보안 및 서비스 제공을 위한 정당한 이익'
    },
    {
      id: 'profile',
      title: '프로필 정보 수집',
      description: '맞춤형 서비스 제공을 위한 추가 정보입니다.',
      required: false,
      dataTypes: ['프로필 사진', '대학/직업 정보', '관심사', '언어 수준', '매칭 선호도'],
      retentionPeriod: '회원 탈퇴 시 즉시 삭제',
      legalBasis: '사용자 동의'
    },
    {
      id: 'activity',
      title: '서비스 이용 기록 수집',
      description: '서비스 개선 및 품질 향상을 위한 이용 기록입니다.',
      required: false,
      dataTypes: ['화상채팅 기록', '게시글', '댓글', '좋아요', '포인트 사용 내역'],
      retentionPeriod: '3개월 ~ 5년 (항목별 상이)',
      legalBasis: '서비스 개선을 위한 정당한 이익'
    },
    {
      id: 'marketing',
      title: '마케팅 정보 수집',
      description: '맞춤형 이벤트 및 서비스 추천을 위한 정보입니다.',
      required: false,
      dataTypes: ['관심사 분석', '이벤트 참여 기록', '서비스 이용 패턴'],
      retentionPeriod: '1년',
      legalBasis: '명시적 사용자 동의'
    }
  ]

  const handleConsentChange = (itemId: string, checked: boolean) => {
    setConsentState(prev => ({
      ...prev,
      [itemId]: checked
    }))
  }

  const handleAllConsentChange = (checked: boolean) => {
    const newState: ConsentState = {
      essential: checked,
      profile: checked,
      activity: checked,
      system: checked,
      marketing: checked
    }
    setConsentState(newState)
    setAllConsentChecked(checked)
  }

  const toggleDetails = (itemId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const handleNext = () => {
    // 필수 동의 항목 확인
    if (!consentState.essential || !consentState.system) {
      alert('필수 동의 항목에 동의해야 회원가입을 진행할 수 있습니다.')
      return
    }

    onConsentComplete(consentState)
  }

  const canProceed = consentState.essential && consentState.system

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">개인정보 수집 동의</h2>
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

      {/* 전체 동의 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="all-consent"
              checked={allConsentChecked}
              onCheckedChange={handleAllConsentChange}
            />
            <label htmlFor="all-consent" className="text-sm font-medium text-gray-900">
              전체 동의 (선택 항목 포함)
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 개별 동의 항목들 */}
      <div className="space-y-4">
        {consentItems.map((item) => (
          <Card key={item.id} className={item.required ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                  checked={consentState[item.id as keyof ConsentState] || false}
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

      {/* 정책 링크 */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          자세한 내용은 다음 정책을 확인하세요:
        </p>
        <div className="flex justify-center gap-4">
          <a 
            href="/privacy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
          >
            개인정보처리방침 <ExternalLink className="w-3 h-3" />
          </a>
          <a 
            href="/terms" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
          >
            서비스 이용약관 <ExternalLink className="w-3 h-3" />
          </a>
          <a 
            href="/cookies" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
          >
            쿠키 정책 <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* 동의 상태 확인 */}
      {canProceed && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            필수 동의 항목에 동의하셨습니다. 회원가입을 진행할 수 있습니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 버튼 */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          이전
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!canProceed}
          className="bg-blue-600 hover:bg-blue-700"
        >
          다음
        </Button>
      </div>
    </div>
  )
}
