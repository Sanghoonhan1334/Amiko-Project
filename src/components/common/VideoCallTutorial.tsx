'use client'

import React, { useState, useEffect, useMemo } from 'react'
import OnboardingTutorial from './OnboardingTutorial'
import { useLanguage } from '@/context/LanguageContext'

interface VideoCallTutorialProps {
  isVisible: boolean
  onClose: () => void
}

export default function VideoCallTutorial({ isVisible, onClose }: VideoCallTutorialProps) {
  const [showTutorial, setShowTutorial] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { t } = useLanguage()

  // 화면 크기 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isVisible) {
      // 약간의 지연을 두고 튜토리얼 시작 (DOM 렌더링 완료 후)
      const timer = setTimeout(() => {
        setShowTutorial(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  const tutorialSteps = useMemo(() => {
    const steps = [
      {
        selector: '[data-tutorial="quick-start"]',
        title: t('tutorial.videoCall.welcome'),
        description: t('tutorial.videoCall.welcomeDescription')
      },
      {
        selector: '[data-tutorial="partner-title"]',
        title: t('tutorial.videoCall.partnerList'),
        description: t('tutorial.videoCall.partnerListDescription')
      },
      {
        selector: '[data-tutorial="partner-card"]',
        title: t('tutorial.videoCall.partnerCard'),
        description: t('tutorial.videoCall.partnerCardDescription')
      },
      {
        selector: '[data-tutorial="online-status"]:first-of-type',
        title: t('tutorial.videoCall.onlineStatus'),
        description: t('tutorial.videoCall.onlineStatusDescription')
      },
      {
        selector: '[data-tutorial="start-conversation"]',
        title: t('tutorial.videoCall.startConversation'),
        description: t('tutorial.videoCall.startConversationDescription')
      }
    ]
    
    console.log('=== VideoCallTutorial 단계 설정 ===')
    console.log('현재 모바일 상태:', isMobile)
    console.log('창 너비:', typeof window !== 'undefined' ? window.innerWidth : 'undefined')
    console.log('설정된 단계들:', steps.map((step, index) => ({
      step: index + 1,
      selector: step.selector,
      title: step.title
    })))
    
    return steps
  }, [t, isMobile])

  const handleClose = () => {
    setShowTutorial(false)
    onClose()
  }

  return (
    <>
      {/* 튜토리얼 시작을 위한 더미 요소 */}
      {isVisible && (
        <div className="tutorial-welcome fixed top-4 left-4 w-1 h-1 opacity-0 pointer-events-none" />
      )}

      <OnboardingTutorial
        isOpen={showTutorial}
        onClose={handleClose}
        steps={tutorialSteps}
        storageKey="video-call-tutorial-completed"
      />
    </>
  )
}
