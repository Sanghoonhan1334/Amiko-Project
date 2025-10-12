'use client'

import React, { useState, useEffect, useMemo } from 'react'
import OnboardingTutorial from './OnboardingTutorial'
import { useLanguage } from '@/context/LanguageContext'

interface CommunityTutorialProps {
  isVisible: boolean
  onClose: () => void
}

export default function CommunityTutorial({ isVisible, onClose }: CommunityTutorialProps) {
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
    // 현재 모든 화면 크기에서 동일한 모바일 버전 아이콘들을 사용하므로 모바일 셀렉터만 사용
    const steps = [
      {
        selector: '[data-tutorial="community-section"]',
        title: t('tutorial.community.welcome'),
        description: t('tutorial.community.welcomeDescription')
      },
      {
        selector: '[data-tutorial="topic-board-mobile"]',
        title: t('tutorial.community.topicBoard'),
        description: t('tutorial.community.topicBoardDescription')
      },
      {
        selector: '[data-tutorial="k-magazine-mobile"]',
        title: t('tutorial.community.kMagazine'),
        description: t('tutorial.community.kMagazineDescription')
      },
      {
        selector: '[data-tutorial="qa-mobile"]',
        title: t('tutorial.community.qa'),
        description: t('tutorial.community.qaDescription')
      },
      {
        selector: '[data-tutorial="psychology-test-mobile"]',
        title: t('tutorial.community.psychologyTest'),
        description: t('tutorial.community.psychologyTestDescription')
      },
      {
        selector: '[data-tutorial="story-mobile"]',
        title: t('tutorial.community.story'),
        description: t('tutorial.community.storyDescription')
      }
    ]
    
    console.log('=== CommunityTutorial 단계 설정 ===')
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
        storageKey="community-tutorial-completed"
      />
    </>
  )
}
