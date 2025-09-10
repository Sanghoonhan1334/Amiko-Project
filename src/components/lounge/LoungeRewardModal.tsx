'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { 
  Gift, 
  Star, 
  Users, 
  MessageSquare, 
  Award,
  Sparkles,
  CheckCircle 
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

interface LoungeRewardModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue: () => void
  pointsEarned?: number
  isFirstTime?: boolean
}

export default function LoungeRewardModal({ 
  isOpen, 
  onClose, 
  onContinue, 
  pointsEarned = 30,
  isFirstTime = false 
}: LoungeRewardModalProps) {
  const { t } = useLanguage()
  const [step, setStep] = useState<'reward' | 'guide'>('reward')

  const handleContinue = () => {
    if (step === 'reward' && isFirstTime) {
      setStep('guide')
    } else {
      onContinue()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white border-2 border-purple-200 shadow-xl">
        {step === 'reward' ? (
          <>
            <DialogHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <DialogTitle className="text-xl font-bold text-gray-800">
                {t('loungeReward.welcome')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* 포인트 적립 안내 */}
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 p-4">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Star className="w-6 h-6 text-purple-600" />
                  <span className="text-lg font-semibold text-purple-800">
                    +{pointsEarned} {t('loungeReward.pointsEarned')}
                  </span>
                </div>
                <p className="text-center text-purple-700 text-sm">
                  {t('loungeReward.pointsDescription')}
                </p>
              </Card>

              {/* 특별 혜택 */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800 text-center mb-3">
                  {t('loungeReward.specialBenefits')}
                </h4>
                
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Users className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-medium text-gray-800 text-sm">
                        {t('loungeReward.networkingOpportunity')}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {t('loungeReward.meetNewFriends')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-medium text-gray-800 text-sm">
                        {t('loungeReward.languageExchange')}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {t('loungeReward.practiceLanguage')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Gift className="w-5 h-5 text-orange-500" />
                    <div>
                      <div className="font-medium text-gray-800 text-sm">
                        {t('loungeReward.specialEvents')}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {t('loungeReward.weeklySpecialEvents')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {isFirstTime ? t('loungeReward.showGuide') : t('loungeReward.startNow')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <DialogTitle className="text-xl font-bold text-gray-800">
                {t('loungeReward.quickGuide')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800 text-sm">
                      {t('loungeReward.guide.step1.title')}
                    </h5>
                    <p className="text-gray-600 text-xs">
                      {t('loungeReward.guide.step1.description')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-pink-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800 text-sm">
                      {t('loungeReward.guide.step2.title')}
                    </h5>
                    <p className="text-gray-600 text-xs">
                      {t('loungeReward.guide.step2.description')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-orange-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800 text-sm">
                      {t('loungeReward.guide.step3.title')}
                    </h5>
                    <p className="text-gray-600 text-xs">
                      {t('loungeReward.guide.step3.description')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setStep('reward')}
                  className="flex-1"
                >
                  {t('loungeReward.back')}
                </Button>
                <Button 
                  onClick={onContinue}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('loungeReward.gotIt')}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
