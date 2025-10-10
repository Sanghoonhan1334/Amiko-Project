'use client'

import React, { useState, useEffect } from 'react'
import OnboardingTutorial from './OnboardingTutorial'

interface VideoCallTutorialProps {
  isVisible: boolean
  onClose: () => void
}

export default function VideoCallTutorial({ isVisible, onClose }: VideoCallTutorialProps) {
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    if (isVisible) {
      // 약간의 지연을 두고 튜토리얼 시작 (DOM 렌더링 완료 후)
      const timer = setTimeout(() => {
        setShowTutorial(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  const tutorialSteps = [
    {
      id: 'welcome',
      title: 'AMIKO 화상채팅에 오신 것을 환영합니다!',
      description: '이 튜토리얼을 통해 AMIKO의 화상채팅 기능을 쉽게 배워보세요. 각 단계를 따라가며 주요 기능들을 확인해보겠습니다.',
      targetSelector: '[data-tutorial="quick-start"]',
      position: 'bottom' as const
    },
    {
      id: 'korean-filter',
      title: '한국인만 보기 필터',
      description: '이 토글을 켜면 한국인 파트너만 표시됩니다. 끄면 모든 국가의 파트너를 볼 수 있어요. 언어교환 목적에 따라 선택하세요!',
      targetSelector: '[data-tutorial="korean-filter"]',
      position: 'left' as const
    },
    {
      id: 'partner-list',
      title: '대화 상대 목록',
      description: '여기서 대화할 파트너를 선택할 수 있습니다. 각 파트너의 관심사, 자기소개, 온라인 상태를 확인해보세요.',
      targetSelector: '[data-tutorial="partner-title"]',
      position: 'bottom' as const
    },
    {
      id: 'partner-card',
      title: '파트너 정보 카드',
      description: '각 파트너 카드에서 상세 정보를 확인하고, "정보보기"로 더 자세한 프로필을 볼 수 있습니다. "대화시작" 버튼으로 바로 화상채팅을 시작하세요!',
      targetSelector: '[data-tutorial="partner-card"]',
      position: 'right' as const
    },
    {
      id: 'online-status',
      title: '온라인 상태 확인',
      description: '초록색 점이 있는 파트너는 현재 온라인 상태입니다. 오프라인인 파트너는 회색 점으로 표시되며, 대화를 시작할 수 없어요.',
      targetSelector: '[data-tutorial="online-status"]:first-of-type',
      position: 'left' as const
    },
    {
      id: 'start-conversation',
      title: '대화 시작하기',
      description: '온라인인 파트너의 "대화시작" 버튼을 클릭하면 화상채팅이 시작됩니다. 안전하고 즐거운 대화를 즐겨보세요!',
      targetSelector: '[data-tutorial="start-conversation"]',
      position: 'top' as const
    }
  ]

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
        isVisible={showTutorial}
        onClose={handleClose}
        steps={tutorialSteps}
        storageKey="video-call-tutorial-completed"
      />
    </>
  )
}
