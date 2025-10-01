'use client'

import { Button } from '@/components/ui/button'

import { Video, MessageCircle, Sparkles, ArrowRight, Gift, Trophy, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

export default function FeatureCards() {
  const router = useRouter()
  const { t } = useLanguage()

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-brand-100 to-mint-100 rounded-3xl px-6 py-3 mb-6">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <span className="text-brand-700 font-medium">{t('specialService.title')}</span>
          </div>
          
          <h2 className="heading-primary mb-6">
            🎯 {t('specialService.heading')}
          </h2>
          
          <p className="text-body text-lg max-w-3xl mx-auto">
            {t('specialService.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* 만남(영상) — 15분 쿠폰 */}
          <div className="group">
            <div className="card p-8 text-center h-full transform hover:scale-[1.01] transition-all duration-300 hover:shadow-2xl border-2 border-transparent hover:border-brand-200">
              {/* 이모지 아이콘 */}
              <div className="w-24 h-24 bg-gradient-to-br from-brand-100 to-brand-200 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-4xl">🎥</span>
              </div>
              
              {/* 배지 */}
              <div className="bg-brand-100 text-brand-700 mb-4 px-4 py-2 w-full max-w-[180px] min-w-[140px] text-center rounded-full border border-brand-200 flex items-center justify-center mx-auto">
                <Gift className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm font-medium break-words">{t('featureBadges.consultationCoupon')}</span>
              </div>
              
              <h3 className="heading-secondary mb-4 text-brand-800">
                {t('features.meeting.title')}
              </h3>
              
              <p className="text-body mb-6 leading-relaxed">
                {t('features.meeting.description')}
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 text-center">
                  <Video className="w-4 h-4 text-brand-500" />
                  <span>{t('features.meeting.videoSupport')}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 text-center">
                  <Users className="w-4 h-4 text-brand-500" />
                  <span>{t('features.meeting.verifiedFriends')}</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                onClick={() => router.push('/main')}
              >
                {t('features.meeting.button')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* 커뮤니티(Q&A) — 포인트 리워드 */}
          <div className="group">
            <div className="card p-8 text-center h-full transform hover:scale-[1.01] transition-all duration-300 hover:shadow-2xl border-2 border-transparent hover:border-mint-200">
              {/* 이모지 아이콘 */}
              <div className="w-24 h-24 bg-gradient-to-br from-mint-100 to-mint-200 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-4xl">💬</span>
              </div>
              
              {/* 배지 */}
              <div className="bg-mint-100 text-mint-700 mb-4 px-4 py-2 w-full max-w-[200px] min-w-[160px] text-center rounded-full border border-mint-200 flex items-center justify-center mx-auto">
                <Trophy className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm font-medium break-words">{t('featureBadges.pointReward')}</span>
              </div>
              
              <h3 className="heading-secondary mb-4 text-mint-800">
                {t('features.community.title')}
              </h3>
              
              <p className="text-body mb-6 leading-relaxed">
                {t('features.community.description')}
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 text-center">
                  <MessageCircle className="w-4 h-4 text-mint-500" />
                  <span>{t('features.community.categories')}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 text-center">
                  <Trophy className="w-4 h-4 text-mint-500" />
                  <span>{t('features.community.dailyLimit')}</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                onClick={() => router.push('/main')}
              >
                {t('features.community.button')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* ZEP 라운지 — 주말 1회 운영자 */}
          <div className="group">
            <div className="card p-8 text-center h-full transform hover:scale-[1.01] transition-all duration-300 hover:shadow-2xl border-2 border-transparent hover:border-sky-200">
              {/* 이모지 아이콘 */}
              <div className="w-24 h-24 bg-gradient-to-br from-sky-100 to-sky-200 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-4xl">🫧</span>
              </div>
              
              {/* 배지 */}
              <div className="bg-sky-100 text-sky-700 mb-4 px-4 py-3 w-full max-w-[280px] min-w-[200px] rounded-full border border-sky-200 flex flex-col items-center justify-center mx-auto">
                <div className="flex items-center mb-1">
                  <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm font-medium">Operación</span>
                </div>
                <span className="text-sm font-medium mb-1">especial de</span>
                <span className="text-sm font-medium">fin de semana</span>
              </div>
              
              <h3 className="heading-secondary mb-4 text-sky-800">
                {t('features.loungePage.title')}
              </h3>
              
              {/* 미니 달력 */}
              <div className="bg-gradient-to-r from-sky-50 to-brand-50 rounded-2xl p-4 mb-4 border border-sky-200">
                <div className="text-center mb-3">
                  <div className="text-2xl font-bold text-sky-700 text-center">30</div>
                  <div className="text-sm text-sky-600 text-center">{t('calendar.months.august')}</div>
                  <div className="mt-2">
                    <div className="bg-sky-100 text-sky-700 border border-sky-300 text-xs px-3 py-1 w-full max-w-[160px] min-w-[120px] text-center rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="w-3 h-3 mr-2 flex-shrink-0" />
                      <span className="text-xs font-medium">{t('loungeMini.saturdayEvent')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-center text-xs text-gray-600 space-y-1">
                  <div className="text-center">🇰🇷 {t('loungeMini.timeFormat.korea')}</div>
                  <div className="text-center">🇵🇪 {t('loungeMini.timeFormat.peru')}</div>
                  <div className="text-center">🇲🇽 {t('loungeMini.timeFormat.mexico')}</div>
                </div>
              </div>
              
              <p className="text-body mb-6 leading-relaxed">
                {t('features.loungePage.description')}
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4 text-sky-500" />
                  <span>{t('features.loungePage.maxParticipants')}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Sparkles className="w-4 h-4 text-sky-500" />
                  <span>{t('features.loungePage.freeTime')}</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                onClick={() => router.push('/lounge')}
              >
                {t('features.loungePage.button')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
