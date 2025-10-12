'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/context/LanguageContext'

interface TutorialStep {
  selector: string
  title: string
  description: string
}

interface OnboardingTutorialProps {
  isOpen: boolean
  onClose: () => void
  steps: TutorialStep[]
  storageKey: string
}

export default function OnboardingTutorial({
  isOpen,
  onClose,
  steps,
  storageKey
}: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const { t } = useLanguage()

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 현재 단계 데이터
  const currentStepData = steps[currentStep]

  // 🚀 최적화: 하이라이트 제거 함수 (메모리 누수 방지)
  const removeAllHighlights = useCallback(() => {
    // 하이라이트 오버레이 제거
    const highlightOverlay = document.getElementById('tutorial-highlight-overlay')
    if (highlightOverlay) {
      // 이벤트 리스너 정리 (메모리 누수 방지)
      const cleanup = (highlightOverlay as any).__cleanup
      if (cleanup) {
        cleanup()
      }
      // DOM에서 안전하게 제거
      if (highlightOverlay.parentNode) {
        highlightOverlay.parentNode.removeChild(highlightOverlay)
      }
    }
    
    setTargetElement(null)
  }, [])

  // 튜토리얼이 열릴 때 첫 번째 단계로 초기화
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
    } else {
      // 튜토리얼이 닫힐 때 모든 하이라이트 제거
      removeAllHighlights()
    }
  }, [isOpen, removeAllHighlights])

  // 현재 단계에 따라 하이라이트 업데이트
  useEffect(() => {
    if (!isOpen || !currentStepData) return

    console.log(`튜토리얼 단계 ${currentStep + 1}:`, {
      isMobile,
      windowWidth: window.innerWidth,
      selectorUsed: currentStepData.selector,
      targetFound: !!document.querySelector(currentStepData.selector),
      targetElement: document.querySelector(currentStepData.selector),
      stepTitle: currentStepData.title
    })

    // 이전 하이라이트 제거
    const previousHighlight = document.querySelector('[data-tutorial-highlight]')
    if (previousHighlight) {
      previousHighlight.removeAttribute('data-tutorial-highlight')
      // 인라인 스타일도 제거
      const element = previousHighlight as HTMLElement
      element.style.position = ''
      element.style.zIndex = ''
      element.style.boxShadow = ''
      element.style.borderRadius = ''
      element.style.backgroundColor = ''
      element.style.border = ''
      element.style.transform = ''
      element.style.transition = ''
    }
    
    const target = document.querySelector(currentStepData.selector) as HTMLElement
    
    if (target) {
      setTargetElement(target)
      
      // 기존 하이라이트 오버레이 제거
      const existingHighlight = document.getElementById('tutorial-highlight-overlay')
      if (existingHighlight) {
        existingHighlight.remove()
      }
      
      // 요소의 위치와 크기 가져오기
      const rect = target.getBoundingClientRect()
      
      console.log('🎯 타겟 요소 위치:', {
        selector: currentStepData.selector,
        element: target.tagName,
        text: target.textContent?.trim().substring(0, 20),
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        }
      })
      
      // 하이라이트 오버레이 요소 생성
      const highlightOverlay = document.createElement('div')
      highlightOverlay.id = 'tutorial-highlight-overlay'
      
      // 모바일과 데스크톱 모두에서 하이라이트 표시
      if (rect.width > 0 && rect.height > 0) {
        highlightOverlay.style.cssText = `
          position: fixed;
          top: ${rect.top - 8}px;
          left: ${rect.left - 8}px;
          width: ${rect.width + 16}px;
          height: ${rect.height + 16}px;
          border: 3px solid rgba(147, 51, 234, 0.8);
          border-radius: 12px;
          box-shadow: 0 0 0 6px rgba(147, 51, 234, 0.7), 0 0 0 12px rgba(147, 51, 234, 0.4), inset 0 0 0 1000px rgba(147, 51, 234, 0.15);
          z-index: 9999999;
          pointer-events: none;
          animation: tutorial-pulse-highlight 2s ease-in-out infinite;
        `
        
        // body에 추가
        document.body.appendChild(highlightOverlay)
        console.log('✅ 하이라이트 오버레이 생성 완료! (모바일 포함)')
      } else {
        console.log('요소가 화면에 보이지 않음, 하이라이트 생성을 건너뜀')
        return
      }
      
      console.log('📍 하이라이트 오버레이 위치:', {
        isMobile,
        top: rect.top - 8,
        left: rect.left - 8,
        width: rect.width + 16,
        height: rect.height + 16,
        elementRect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        }
      })
      
      // 🚀 최적화: 스크롤 이벤트 리스너 최적화 (throttling 적용)
      let scrollTimeout: NodeJS.Timeout | null = null
      const updatePosition = () => {
        if (scrollTimeout) return // 이미 예약된 업데이트가 있으면 건너뛰기
        
        scrollTimeout = setTimeout(() => {
          const newRect = target.getBoundingClientRect()
          highlightOverlay.style.top = `${newRect.top - 8}px`
          highlightOverlay.style.left = `${newRect.left - 8}px`
          scrollTimeout = null
        }, 16) // 60fps로 제한 (16ms)
      }
      
      window.addEventListener('scroll', updatePosition, { passive: true })
      window.addEventListener('resize', updatePosition, { passive: true })
      
      // 정리 함수를 위해 저장
      ;(highlightOverlay as any).__cleanup = () => {
        window.removeEventListener('scroll', updatePosition)
        window.removeEventListener('resize', updatePosition)
        if (scrollTimeout) {
          clearTimeout(scrollTimeout)
        }
      }
      
      // 하이라이트된 요소로 화면 스크롤
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      })
      
      // 하이라이트 위치 디버깅
      console.log('✅ 하이라이트 오버레이 생성 완료!')
    } else {
      console.log(`튜토리얼 요소를 찾을 수 없습니다: ${currentStepData.selector}`)
      setTargetElement(null)
    }
  }, [currentStep, isOpen, currentStepData, isMobile])

  // 다음 단계로
  const nextStep = () => {
    console.log('다음 버튼 클릭됨! 현재 단계:', currentStep, '총 단계:', steps.length)
    console.log('모바일 상태:', isMobile)
    if (currentStep < steps.length - 1) {
      console.log('다음 단계로 이동:', currentStep + 1)
      setCurrentStep(currentStep + 1)
    } else {
      console.log('튜토리얼 완료')
      completeTutorial()
    }
  }

  // 이전 단계로
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // 튜토리얼 완료
  const completeTutorial = () => {
    // 모든 하이라이트 제거
    removeAllHighlights()
    
    // 로컬스토리지에 완료 상태 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true')
    }
    onClose()
  }

  // 튜토리얼 건너뛰기
  const skipTutorial = () => {
    // 모든 하이라이트 제거
    removeAllHighlights()
    
    // 로컬스토리지에 완료 상태 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true')
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* 배경 오버레이 - 모바일에서는 제거 */}
      {!isMobile && (
        <div className="fixed inset-0 bg-transparent z-40 pointer-events-none" />
      )}
      

      {/* 모바일 안내 메시지 */}
      {isMobile && (
        <div className="fixed bottom-20 left-4 right-4 bg-yellow-500 dark:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs text-center" style={{ zIndex: 9999998, fontSize: '10px' }}>
          {t('tutorial.mobileScrollHint')}
        </div>
      )}

      {/* 설명 패널 - 모바일과 데스크톱에 따라 다른 방식 */}
      {targetElement && (() => {
        const rect = targetElement.getBoundingClientRect()
        
        if (isMobile) {
          // 모바일: 하이라이트된 요소 바로 위에 작은 툴팁 형태로 표시
          const tooltipWidth = Math.min(280, window.innerWidth - 40)
          const tooltipHeight = 120
          const margin = 10
          
          let left = rect.left + (rect.width / 2)
          let top = rect.top - tooltipHeight - margin
          
          // 화면 경계 체크
          if (left - (tooltipWidth / 2) < margin) {
            left = margin + (tooltipWidth / 2)
          }
          
          if (left + (tooltipWidth / 2) > window.innerWidth - margin) {
            left = window.innerWidth - margin - (tooltipWidth / 2)
          }
          
          if (top < margin) {
            // 위쪽에 공간이 없으면 아래쪽에 배치
            top = rect.bottom + margin
          }
          
          return (
            <div
              className="fixed pointer-events-none"
              style={{
                zIndex: 9999998, // 하이라이트보다 낮게
                top: top,
                left: left,
                transform: 'translate(-50%, 0)'
              }}
            >
              <div className={`bg-black dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-95 backdrop-blur-sm rounded-lg shadow-2xl p-3 border border-white dark:border-gray-700 border-opacity-20 dark:border-opacity-30 pointer-events-auto relative`} style={{ width: tooltipWidth }}>
                {/* 하이라이트된 요소를 가리키는 아래쪽 화살표 */}
                <div 
                  className="absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black dark:border-t-gray-900 border-opacity-90 dark:border-opacity-95"
                  style={{
                    bottom: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                />
                
                {/* 진행 표시 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    <span className="text-xs text-white dark:text-gray-200 text-opacity-80 dark:text-opacity-90">
                      {currentStep + 1} / {steps.length}
                    </span>
                  </div>
                  <button
                    onClick={skipTutorial}
                    className="text-white text-opacity-60 hover:text-white transition-colors pointer-events-auto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* 제목과 설명 */}
                <h3 className="font-bold text-white dark:text-gray-100 mb-1 text-sm">
                  {currentStepData.title}
                </h3>
                <p className="text-white dark:text-gray-200 text-opacity-90 dark:text-opacity-80 text-xs leading-relaxed mb-2">
                  {currentStepData.description}
                </p>

                {/* 네비게이션 버튼 */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="text-xs px-2 py-1 h-6 bg-white bg-opacity-10 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20 pointer-events-auto"
                  >
                    <ChevronLeft className="w-3 h-3 mr-1" />
                    {t('buttons.previous')}
                  </Button>
                  
                  <Button
                    onClick={nextStep}
                    className="text-xs px-3 py-1 h-6 bg-purple-500 hover:bg-purple-600 text-white pointer-events-auto"
                  >
                    {currentStep === steps.length - 1 ? t('buttons.complete') : t('buttons.next')}
                    {currentStep < steps.length - 1 && <ChevronRight className="w-3 h-3 ml-1" />}
                  </Button>
                </div>
              </div>
            </div>
          )
        } else {
          // 데스크톱: 기존 중앙 고정 방식
          const panelWidth = 500
          const panelHeight = 200
          const margin = 20
          
          let left = window.innerWidth / 2
          let top = window.innerHeight / 2
          
          // "한국인만 보기 필터" 단계일 때만 왼쪽으로 이동
          if (currentStepData.title.includes('한국인만 보기') || currentStepData.title.includes('필터')) {
            left = window.innerWidth * 0.3 // 화면 왼쪽 30% 위치로 이동
          }
          
          // 화면 경계 체크
          if (left - (panelWidth / 2) < margin) {
            left = margin + (panelWidth / 2)
          }
          
          if (left + (panelWidth / 2) > window.innerWidth - margin) {
            left = window.innerWidth - margin - (panelWidth / 2)
          }
          
          if (top - (panelHeight / 2) < margin) {
            top = margin + (panelHeight / 2)
          }
          
          if (top + (panelHeight / 2) > window.innerHeight - margin) {
            top = window.innerHeight - margin - (panelHeight / 2)
          }
          
          return (
            <div
              className="fixed pointer-events-none"
              style={{
                zIndex: 9999998, // 하이라이트보다 낮게
                top: top,
                left: left,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="bg-black dark:bg-gray-900 bg-opacity-40 dark:bg-opacity-95 backdrop-blur-sm rounded-lg shadow-2xl p-4 w-[500px] mx-4 border border-white dark:border-gray-700 border-opacity-20 dark:border-opacity-30 pointer-events-auto relative">
                {/* 강조 테두리 */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg opacity-15 -z-10"></div>
                
                {/* 진행 표시 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-sm text-white dark:text-gray-200 text-opacity-80 dark:text-opacity-90">
                      {currentStep + 1} / {steps.length}
                    </span>
                  </div>
                  <button
                    onClick={skipTutorial}
                    className="text-white text-opacity-60 hover:text-white transition-colors pointer-events-auto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 제목과 설명 */}
                <h3 className="font-bold text-white dark:text-gray-100 mb-2 text-base">
                  {currentStepData.title}
                </h3>
                <p className="text-white dark:text-gray-200 text-opacity-90 dark:text-opacity-80 text-sm leading-relaxed mb-3">
                  {currentStepData.description}
                </p>

                {/* 네비게이션 버튼 */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="bg-white bg-opacity-10 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20 pointer-events-auto"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {t('buttons.previous')}
                  </Button>
                  
                  <Button
                    onClick={nextStep}
                    className="bg-purple-500 hover:bg-purple-600 text-white pointer-events-auto"
                  >
                    {currentStep === steps.length - 1 ? t('buttons.complete') : t('buttons.next')}
                    {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                  </Button>
                </div>
              </div>
            </div>
          )
        }
      })()}
    </>
  )
}