'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

interface TimeInfo {
  country: string
  flag: string
  time: string
  timezone: string
}

export default function UserTimeDisplay() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [timeInfo, setTimeInfo] = useState<TimeInfo[]>([])

  // 사용자의 국가를 기반으로 시간대 정보 생성
  const getUserCountryTime = (): TimeInfo[] => {
    const now = new Date()
    
    // 기본 시간대들
    const baseTimezones = [
      { country: 'korea', flag: '🇰🇷', timezone: 'Asia/Seoul' },
      { country: 'peru', flag: '🇵🇪', timezone: 'America/Lima' },
      { country: 'mexico', flag: '🇲🇽', timezone: 'America/Mexico_City' },
      { country: 'colombia', flag: '🇨🇴', timezone: 'America/Bogota' },
      { country: 'argentina', flag: '🇦🇷', timezone: 'America/Argentina/Buenos_Aires' },
      { country: 'chile', flag: '🇨🇱', timezone: 'America/Santiago' },
      { country: 'ecuador', flag: '🇪🇨', timezone: 'America/Guayaquil' },
      { country: 'bolivia', flag: '🇧🇴', timezone: 'America/La_Paz' },
      { country: 'uruguay', flag: '🇺🇾', timezone: 'America/Montevideo' },
      { country: 'paraguay', flag: '🇵🇾', timezone: 'America/Asuncion' }
    ]

    // 사용자의 국가 정보 (실제로는 user.country 또는 user.timezone에서 가져올 수 있음)
    const userCountry = user?.country || 'korea' // 기본값은 한국
    
    // 사용자의 국가를 첫 번째로, 나머지는 무작위로 2개 선택
    const userTimezone = baseTimezones.find(tz => tz.country === userCountry) || baseTimezones[0]
    const otherTimezones = baseTimezones
      .filter(tz => tz.country !== userCountry)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
    
    const selectedTimezones = [userTimezone, ...otherTimezones]

    return selectedTimezones.map(tz => {
      try {
        const time = now.toLocaleTimeString('ko-KR', {
          timeZone: tz.timezone,
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        })
        
        return {
          country: tz.country,
          flag: tz.flag,
          time: time,
          timezone: tz.timezone
        }
      } catch (error) {
        console.error('시간 변환 오류:', error)
        return {
          country: tz.country,
          flag: tz.flag,
          time: '00:00',
          timezone: tz.timezone
        }
      }
    })
  }

  useEffect(() => {
    const updateTime = () => {
      setTimeInfo(getUserCountryTime())
    }

    // 초기 시간 설정
    updateTime()

    // 1분마다 시간 업데이트
    const interval = setInterval(updateTime, 60000)

    return () => clearInterval(interval)
  }, [user?.country])

  const getCountryName = (country: string) => {
    const countryNames: { [key: string]: string } = {
      korea: t('loungeMini.timeFormat.korea'),
      peru: t('loungeMini.timeFormat.peru'),
      mexico: t('loungeMini.timeFormat.mexico'),
      colombia: t('loungeMini.timeFormat.colombia') || 'Colombia',
      argentina: t('loungeMini.timeFormat.argentina') || 'Argentina',
      chile: t('loungeMini.timeFormat.chile') || 'Chile',
      ecuador: t('loungeMini.timeFormat.ecuador') || 'Ecuador',
      bolivia: t('loungeMini.timeFormat.bolivia') || 'Bolivia',
      uruguay: t('loungeMini.timeFormat.uruguay') || 'Uruguay',
      paraguay: t('loungeMini.timeFormat.paraguay') || 'Paraguay'
    }
    return countryNames[country] || country
  }

  if (timeInfo.length === 0) {
    return (
      <div className="mt-6 pt-6 border-t border-sky-200/30">
        <div className="text-center text-sm text-gray-600 space-y-2">
          <div className="font-medium text-gray-700 mb-2">{t('loungeMini.timeByCountry')}</div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">🇰🇷</span>
            <span>{t('loungeMini.timeFormat.korea')}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 pt-6 border-t border-sky-200/30">
      <div className="text-center text-sm text-gray-600 space-y-2">
        <div className="font-medium text-gray-700 mb-2">{t('loungeMini.timeByCountry')}</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {timeInfo.map((info, index) => (
            <div key={info.country} className="flex items-center justify-center gap-2">
              <span className="text-lg">{info.flag}</span>
              <span>{info.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
