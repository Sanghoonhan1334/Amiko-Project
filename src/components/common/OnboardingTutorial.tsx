'use client'

import React, { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TutorialStep {
  id: string
  title: string
  description: string
  targetSelector: string
  position: 'top' | 'bottom' | 'left' | 'right'
  highlight?: boolean
}

interface OnboardingTutorialProps {
  isVisible: boolean
  onClose: () => void
  steps: TutorialStep[]
  storageKey?: string
}

export default function OnboardingTutorial({ 
  isVisible, 
  onClose, 
  steps, 
  storageKey = 'onboarding-completed' 
}: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })

  // 로컬 스토리지에서 완료 상태 확인 (테스트용 - 비활성화)
  useEffect(() => {
    // 테스트용: 로컬스토리지 체크 비활성화
    // if (typeof window !== 'undefined') {
    //   const completed = localStorage.getItem(storageKey)
    //   if (completed === 'true' && isVisible) {
    //     onClose()
    //   }
    // }
  }, [isVisible, storageKey, onClose])

  // 현재 단계의 타겟 요소 찾기
  useEffect(() => {
    if (!isVisible || currentStep >= steps.length) return

    // 모바일/데스크톱 구분하여 요소 찾기
    const isMobile = window.innerWidth < 768
    
    let target: HTMLElement | null = null
    let selectorUsed = ''
    
    // 모바일 전용 셀렉터가 있는 경우 우선 사용
    if (isMobile) {
      const mobileSelector = steps[currentStep].targetSelector.replace('online-status', 'online-status-mobile').replace('start-conversation', 'start-conversation-mobile')
      target = document.querySelector(mobileSelector) as HTMLElement
      selectorUsed = mobileSelector
    }
    
    // 모바일에서 찾지 못했거나 데스크톱인 경우 기본 셀렉터 사용
    if (!target) {
      target = document.querySelector(steps[currentStep].targetSelector) as HTMLElement
      selectorUsed = steps[currentStep].targetSelector
    }
    
    // 디버깅 로그
    console.log(`튜토리얼 단계 ${currentStep + 1}:`, {
      isMobile,
      selectorUsed,
      targetFound: !!target,
      targetElement: target,
      stepTitle: steps[currentStep].title,
      allElements: document.querySelectorAll(selectorUsed)
    })
    
    if (target) {
      setTargetElement(target)
      updateTooltipPosition(target)
      
      // 하이라이트 속성 추가
      target.setAttribute('data-tutorial-highlight', 'true')
      
      // 하이라이트 위치 디버깅
      const rect = target.getBoundingClientRect()
      console.log(`하이라이트 위치:`, {
        element: target,
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        },
        textContent: target.textContent?.trim()
      })
    } else {
      // 요소를 찾지 못한 경우 하이라이트 제거
      setTargetElement(null)
      console.warn(`튜토리얼 요소를 찾을 수 없습니다: ${selectorUsed}`)
    }
    
    // 이전 하이라이트 제거
    const previousHighlight = document.querySelector('[data-tutorial-highlight]')
    if (previousHighlight && previousHighlight !== target) {
      previousHighlight.removeAttribute('data-tutorial-highlight')
    }
  }, [currentStep, isVisible, steps])

  // 툴팁 위치 계산 (하단 패널 방식으로 변경되어 더 이상 필요 없음)
  const updateTooltipPosition = (element: HTMLElement) => {
    // 하단 패널 방식으로 변경되어 위치 계산 불필요
  }

  // 다음 단계로
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTutorial()
    }
  }

  // 이전 단계로
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // 튜토리얼 완료 (테스트용 - 로컬스토리지 저장 비활성화)
  const completeTutorial = () => {
    // 하이라이트 제거
    const highlightElement = document.querySelector('[data-tutorial-highlight]')
    if (highlightElement) {
      highlightElement.removeAttribute('data-tutorial-highlight')
    }
    
    // 테스트용: 로컬스토리지 저장 비활성화
    // if (typeof window !== 'undefined') {
    //   localStorage.setItem(storageKey, 'true')
    // }
    onClose()
  }

  // 튜토리얼 건너뛰기
  const skipTutorial = () => {
    completeTutorial()
  }

  // 튜토리얼이 닫힐 때 하이라이트 제거
  useEffect(() => {
    if (!isVisible) {
      const highlightElement = document.querySelector('[data-tutorial-highlight]')
      if (highlightElement) {
        highlightElement.removeAttribute('data-tutorial-highlight')
      }
    }
  }, [isVisible])

  if (!isVisible || currentStep >= steps.length) return null

  const currentStepData = steps[currentStep]

  return (
    <>
      {/* 오버레이 배경 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-60 z-50 transition-opacity duration-300"
        onClick={skipTutorial}
      />

      {/* 최종 하이라이트 - CSS outline 방식 */}
      {targetElement && (
        <style>
          {`
            [data-tutorial-highlight] {
              outline: 4px solid #9333ea !important;
              outline-offset: 4px !important;
              border-radius: 8px !important;
              z-index: 1000 !important;
            }
          `}
        </style>
      )}

      {/* 모바일에서 요소를 찾지 못한 경우 안내 메시지 */}
      {!targetElement && window.innerWidth < 768 && (
        <div className="fixed top-20 left-4 right-4 z-50 bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm text-center">
          모바일에서는 화면을 스크롤하여 해당 요소를 찾아주세요
        </div>
      )}

      {/* 오버레이에 직접 설명 표시 */}
      <div className="fixed inset-0 z-50 flex flex-col justify-center items-center text-white p-8">
        {/* 상단 진행 표시 */}
        <div className="absolute top-8 left-8 flex items-center gap-2">
          <span className="text-sm text-gray-300">
            {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={skipTutorial}
          className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 중앙 설명 텍스트와 버튼 */}
        <div className="text-center max-w-2xl px-4">
          <h3 className="font-bold text-white mb-4 md:mb-6 text-xl md:text-3xl">
            {currentStepData.title}
          </h3>
          <p className="text-gray-200 text-sm md:text-lg leading-relaxed mb-6 md:mb-8">
            {currentStepData.description}
          </p>
          
          {/* 네비게이션 버튼 */}
          <div className="flex items-center justify-center gap-2 md:gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-1 md:gap-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm"
            >
              <ChevronLeft className="w-3 h-3 md:w-5 md:h-5" />
              이전
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={nextStep}
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1 md:gap-2 px-4 md:px-8 py-2 md:py-3 text-xs md:text-lg"
              >
                다음
                <ChevronRight className="w-3 h-3 md:w-5 md:h-5" />
              </Button>
            ) : (
              <Button
                onClick={completeTutorial}
                className="bg-green-600 hover:bg-green-700 text-white px-4 md:px-8 py-2 md:py-3 text-xs md:text-lg"
              >
                완료
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
