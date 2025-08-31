'use client'


import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Sparkles, Clock, Users } from 'lucide-react'
import MeetTab from '@/components/main/app/meet/MeetTab'
import CommunityTab from '@/components/main/app/community/CommunityTab'
import MyTab from '@/components/main/app/me/MyTab'
import { useLanguage } from '@/context/LanguageContext'

export default function AppPage() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen body-gradient">

      
      {/* 상단 고정 헤더 */}
      <div className="relative z-10 bg-white border-b border-gray-200 mt-4">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-brand-100 to-mint-100 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <Badge className="bg-gradient-to-r from-brand-100 to-mint-100 text-brand-700 border-brand-200 mb-1">
                  {t('main.weekendLounge')}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{t('main.time')}</span>
                  <Users className="w-4 h-4 ml-2" />
                  <span>{t('main.maxParticipants')}</span>
                </div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="border-brand-300 text-brand-700 hover:bg-brand-50 hover:border-brand-400 transition-all duration-300 shadow-none"
              onClick={() => window.location.href = '/lounge'}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {t('main.viewCalendar')}
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 탭 섹션 */}
      <div className="max-w-5xl mx-auto px-4 py-6 relative z-0">
        <Tabs defaultValue="meet" className="w-full">
          {/* 탭 헤더 */}
          <div className="mb-8">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 rounded-3xl p-0">
              <TabsTrigger 
                value="meet" 
                className="data-[state=active]:bg-brand-100 data-[state=active]:text-brand-700 data-[state=active]:shadow-lg data-[state=active]:shadow-black/20 hover:shadow-md hover:shadow-black/10 rounded-l-3xl rounded-r-2xl transition-all duration-300 m-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎥</span>
                  <span className="font-medium">{t('main.meet')}</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="community" 
                className="data-[state=active]:bg-mint-100 data-[state=active]:text-mint-700 data-[state=active]:shadow-lg data-[state=active]:shadow-black/20 hover:shadow-md hover:shadow-black/10 rounded-2xl transition-all duration-300 m-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">💬</span>
                  <span className="font-medium">{t('main.community')}</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="me" 
                className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700 data-[state=active]:shadow-lg data-[state=active]:shadow-black/20 hover:shadow-md hover:shadow-black/10 rounded-r-3xl rounded-l-2xl transition-all duration-300 m-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">👤</span>
                  <span className="font-medium">{t('main.me')}</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="space-y-8">
            <TabsContent value="meet" className="mt-0">
              <div className="card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-brand-100 rounded-3xl flex items-center justify-center">
                    <span className="text-2xl">🎥</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{t('main.meet')} ({t('videoCall')})</h2>
                    <p className="text-gray-600">{t('main.meetDescription')}</p>
                  </div>
                </div>
                <MeetTab />
              </div>
            </TabsContent>

            <TabsContent value="community" className="mt-0">
              <div className="card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-mint-100 rounded-3xl flex items-center justify-center">
                    <span className="text-2xl">💬</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{t('main.community')} (Q&A)</h2>
                    <p className="text-gray-600">{t('main.communityDescription')}</p>
                  </div>
                </div>
                <CommunityTab />
              </div>
            </TabsContent>

            <TabsContent value="me" className="mt-0">
              <div className="card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-sky-100 rounded-3xl flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{t('main.me')}</h2>
                    <p className="text-gray-600">{t('main.meDescription')}</p>
                  </div>
                </div>
                <MyTab />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
