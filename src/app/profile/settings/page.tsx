'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

interface UserSettings {
  timezone: string
  country: string
  language: string
  displayName?: string
}

// 주요 시간대 목록
const TIMEZONES = [
  { value: 'Asia/Seoul', label: '한국 (UTC+9)', offset: '+09:00' },
  { value: 'America/New_York', label: '미국 동부 (UTC-5)', offset: '-05:00' },
  { value: 'America/Los_Angeles', label: '미국 서부 (UTC-8)', offset: '-08:00' },
  { value: 'Europe/London', label: '영국 (UTC+0)', offset: '+00:00' },
  { value: 'Europe/Paris', label: '프랑스 (UTC+1)', offset: '+01:00' },
  { value: 'Asia/Tokyo', label: '일본 (UTC+9)', offset: '+09:00' },
  { value: 'Asia/Shanghai', label: '중국 (UTC+8)', offset: '+08:00' },
  { value: 'Australia/Sydney', label: '호주 (UTC+10)', offset: '+10:00' },
  { value: 'Asia/Dubai', label: 'UAE (UTC+4)', offset: '+04:00' },
  { value: 'Asia/Singapore', label: '싱가포르 (UTC+8)', offset: '+08:00' }
]

// 국가 목록
const COUNTRIES = [
  { value: 'KR', label: '대한민국' },
  { value: 'US', label: '미국' },
  { value: 'GB', label: '영국' },
  { value: 'FR', label: '프랑스' },
  { value: 'DE', label: '독일' },
  { value: 'JP', label: '일본' },
  { value: 'CN', label: '중국' },
  { value: 'AU', label: '호주' },
  { value: 'CA', label: '캐나다' },
  { value: 'SG', label: '싱가포르' }
]

// 언어 목록
const LANGUAGES = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' }
]

export default function ProfileSettingsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [settings, setSettings] = useState<UserSettings>({
    timezone: 'Asia/Seoul',
    country: 'KR',
    language: 'ko'
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // 현재 시간대 감지
  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const detectedCountry = navigator.language.split('-')[1]?.toUpperCase() || 'KR'
    
    setSettings(prev => ({
      ...prev,
      timezone: detectedTimezone,
      country: detectedCountry
    }))
  }, [])

  // 설정 저장
  const handleSave = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Supabase에 사용자 설정 저장
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || t('profileSettings.actions.save'))
      }
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('설정 저장 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 시간대별 현재 시간 표시
  const getCurrentTime = (timezone: string) => {
    try {
      return new Date().toLocaleTimeString('ko-KR', {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch {
      return t('profileSettings.timezone.noTimeInfo')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('profileSettings.title')}</h1>
        <p className="text-gray-600">{t('profileSettings.subtitle')}</p>
      </div>

      {/* 시간대 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profileSettings.timezone.title')}</CardTitle>
          <CardDescription>
            {t('profileSettings.timezone.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timezone">{t('profileSettings.timezone.label')}</Label>
              <Select value={settings.timezone} onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('profileSettings.timezone.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{t(`profileSettings.timezones.${tz.value}`) || tz.label}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {getCurrentTime(tz.value)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>{t('profileSettings.timezone.currentTime')}</Label>
              <div className="text-2xl font-mono font-bold text-blue-600">
                {getCurrentTime(settings.timezone)}
              </div>
              <p className="text-sm text-gray-500">
                {t('profileSettings.timezone.currentTimeDescription')}
              </p>
            </div>
          </div>

          {/* 시간대별 시간 비교 */}
          <div className="mt-6">
            <Label className="text-sm font-medium">{t('profileSettings.timezone.comparison')}</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {TIMEZONES.slice(0, 8).map((tz) => (
                <div key={tz.value} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600">{(t(`profileSettings.timezones.${tz.value}`) || tz.label).split(' ')[0]}</div>
                  <div className="font-mono text-sm font-bold">
                    {getCurrentTime(tz.value)}
                  </div>
                  <div className="text-xs text-gray-500">{tz.offset}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 지역 및 언어 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profileSettings.region.title')}</CardTitle>
          <CardDescription>
            {t('profileSettings.region.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">{t('profileSettings.region.country')}</Label>
              <Select value={settings.country} onValueChange={(value) => setSettings(prev => ({ ...prev, country: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('profileSettings.region.countryPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {t(`profileSettings.countries.${country.value}`) || country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="language">{t('profileSettings.region.language')}</Label>
              <Select value={settings.language} onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('profileSettings.region.languagePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="displayName">{t('profileSettings.region.displayName')}</Label>
            <Input
              id="displayName"
              placeholder={t('profileSettings.region.displayNamePlaceholder')}
              value={settings.displayName || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, displayName: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          {t('profileSettings.actions.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? t('profileSettings.actions.saving') : t('profileSettings.actions.save')}
        </Button>
      </div>

      {/* 저장 완료 메시지 */}
      {saved && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {t('profileSettings.actions.saved')} ✅
        </div>
      )}
    </div>
  )
}
