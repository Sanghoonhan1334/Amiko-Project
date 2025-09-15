'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, MessageSquare, Shield, Users } from 'lucide-react'

interface ChatRulesModalProps {
  isOpen: boolean
  onClose: () => void
  onAgree: () => void
}

export default function ChatRulesModal({ isOpen, onClose, onAgree }: ChatRulesModalProps) {
  const [isAgreed, setIsAgreed] = useState(false)

  const handleAgree = () => {
    if (isAgreed) {
      onAgree()
      setIsAgreed(false) // 모달 닫을 때 체크박스 리셋
    }
  }

  const handleClose = () => {
    setIsAgreed(false) // 모달 닫을 때 체크박스 리셋
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white border-2 border-gray-200 shadow-xl">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-500" />
            📌 Amiko 채팅 규칙 안내
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* 규칙 내용 */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-blue-800 mb-1">멘토 운영 규칙</p>
                <p>멘토들은 Amiko 플랫폼 내에서만 활동하며, 스펙과 리워드를 받습니다.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-red-800 mb-1">개인 연락처 교환 금지</p>
                <p>개인 연락처나 SNS 정보 교환은 절대 불가합니다.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Users className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-green-800 mb-1">Amiko의 서비스</p>
                <p>Amiko는 번역, 포인트, 안전한 환경을 제공합니다. 모든 대화는 Amiko 내에서만 이루어져야 합니다.</p>
              </div>
            </div>
          </div>
          
          {/* 동의 체크박스 */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Checkbox 
              id="agree-rules"
              checked={isAgreed}
              onCheckedChange={(checked) => setIsAgreed(checked as boolean)}
              className="mt-1"
            />
            <label htmlFor="agree-rules" className="text-sm text-gray-700 cursor-pointer">
              ☑ 위 내용을 이해했고 동의합니다.
            </label>
          </div>
        </div>
        
        {/* 버튼들 */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="px-6"
          >
            취소
          </Button>
          <Button 
            onClick={handleAgree}
            disabled={!isAgreed}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            동의 후 입장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
