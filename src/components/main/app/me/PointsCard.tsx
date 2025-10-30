'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

export default function PointsCard() {
  const { t } = useLanguage()
  const { user } = useAuth()
  
  // 포인트 상태
  const [availableAKO, setAvailableAKO] = useState(0)
  const [currentPoints, setCurrentPoints] = useState(0)
  const [vipExpiryDate, setVipExpiryDate] = useState<string | null>(null)
  const [pointsLoading, setPointsLoading] = useState(true)

  // 포인트 데이터 가져오기
  useEffect(() => {
    const fetchPoints = async () => {
      if (!user?.id) {
        setAvailableAKO(0)
        setCurrentPoints(0)
        setVipExpiryDate(null)
        setPointsLoading(false)
        return
      }

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setAvailableAKO(0)
          setCurrentPoints(0)
          setVipExpiryDate(null)
          setPointsLoading(false)
          return
        }

        const response = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log('포인트 데이터:', data)
          
          setAvailableAKO(data.available_ako || 0)
          setCurrentPoints(data.current_points || 0)
          setVipExpiryDate(data.vip_expiry_date || null)
        } else {
          console.error('포인트 데이터 가져오기 실패:', response.status)
          setAvailableAKO(0)
          setCurrentPoints(0)
          setVipExpiryDate(null)
        }
      } catch (error) {
        console.error('포인트 데이터 가져오기 오류:', error)
        setAvailableAKO(0)
        setCurrentPoints(0)
        setVipExpiryDate(null)
      } finally {
        setPointsLoading(false)
      }
    }

    fetchPoints()
  }, [user?.id])

  // VIP 남은 시간 계산
  const getVipStatus = () => {
    if (!vipExpiryDate) {
      return { text: t('storeTab.pointCard.vipInactive'), color: 'text-gray-500 dark:text-gray-400' }
    }
    
    const expiryDate = new Date(vipExpiryDate)
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    
    if (diffTime <= 0) {
      return { text: t('storeTab.pointCard.vipExpired'), color: 'text-red-500 dark:text-red-400' }
    }
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      return { text: t('storeTab.pointCard.vipOneDayLeft'), color: 'text-orange-500 dark:text-orange-400' }
    } else if (diffDays <= 7) {
      return { text: `${diffDays}${t('storeTab.pointCard.vipDaysLeft')}`, color: 'text-orange-500 dark:text-orange-400' }
    } else {
      return { text: `${diffDays}${t('storeTab.pointCard.vipDaysLeft')}`, color: 'text-green-500 dark:text-green-400' }
    }
  }

  const vipStatus = getVipStatus()

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <span className='text-sm font-medium text-blue-800 dark:text-blue-300'>{t('storeTab.pointCard.title')}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 sm:p-3 bg-white dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-blue-600">
          {pointsLoading ? (
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400 animate-pulse">...</div>
          ) : (
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{availableAKO}</div>
          )}
          <div className='text-xs text-gray-600 dark:text-gray-300 mt-1'>{t('storeTab.pointCard.availableAKO')}</div>
        </div>
        <div className="text-center p-2 sm:p-3 bg-white dark:bg-gray-700 rounded-lg border border-purple-200 dark:border-purple-600">
          {pointsLoading ? (
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400 animate-pulse">...</div>
          ) : (
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{currentPoints}</div>
          )}
          <div className='text-xs text-gray-600 dark:text-gray-300 mt-1'>{t('storeTab.pointCard.currentPoints')}</div>
        </div>
        <div className="text-center p-2 sm:p-3 bg-white dark:bg-gray-700 rounded-lg border border-orange-200 dark:border-orange-600 relative">
          {/* 왕관 아이콘 */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            <div className="w-6 h-6 bg-orange-500 dark:bg-orange-400 rounded-full flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 16L3 8l5.5 5L12 4l3.5 9L21 8l-2 8H5zm2.7-2h8.6l.9-4.4L12 9l-5.2 4.6L7.7 14z" />
              </svg>
            </div>
          </div>
          {pointsLoading ? (
            <div className="text-lg font-bold animate-pulse mt-2">...</div>
          ) : (
            <div className={`text-sm sm:text-lg font-bold ${vipStatus.color} mt-2 truncate`}>{vipStatus.text}</div>
          )}
          <div className='text-xs text-gray-600 dark:text-gray-300 mt-1'>{t('storeTab.pointCard.vipStatus')}</div>
        </div>
      </div>
    </div>
  )
}
