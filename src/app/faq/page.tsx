'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Sparkles, Users } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export default function FaqPage() {
  const { t } = useLanguage()
  const faqs = [
    {
      category: t('faq.categories.lounge'),
      questions: [
        {
          question: t('faq.lounge.whatDoWeDo'),
          answer: t('faq.lounge.whatDoWeDoAnswer')
        },
        {
          question: t('faq.lounge.pointsAvailable'),
          answer: t('faq.lounge.pointsAvailableAnswer')
        },
        {
          question: t('faq.lounge.whenOpen'),
          answer: t('faq.lounge.whenOpenAnswer')
        },
        {
          question: t('faq.lounge.differentLanguages'),
          answer: t('faq.lounge.differentLanguagesAnswer')
        }
      ]
    },
    {
      category: t('faq.categories.meeting'),
      questions: [
        {
          question: t('faq.meeting.howToMeet'),
          answer: t('faq.meeting.howToMeetAnswer')
        },
        {
          question: t('faq.meeting.translationMode'),
          answer: t('faq.meeting.translationModeAnswer')
        },
        {
          question: t('faq.meeting.howToUseCoupons'),
          answer: t('faq.meeting.howToUseCouponsAnswer')
        }
      ]
    },
    {
      category: t('faq.categories.community'),
      questions: [
        {
          question: t('faq.community.howToGetPoints'),
          answer: t('faq.community.howToGetPointsAnswer')
        },
        {
          question: t('faq.community.dailyPointLimit'),
          answer: t('faq.community.dailyPointLimitAnswer')
        },
        {
          question: t('faq.community.communityRules'),
          answer: t('faq.community.communityRulesAnswer')
        }
      ]
    },
    {
      category: t('faq.categories.account'),
      questions: [
        {
          question: t('faq.account.whyVerificationNeeded'),
          answer: t('faq.account.whyVerificationNeededAnswer')
        },
        {
          question: t('faq.account.verificationMethods'),
          answer: t('faq.account.verificationMethodsAnswer')
        },
        {
          question: t('faq.account.verificationFailed'),
          answer: t('faq.account.verificationFailedAnswer')
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-mint-50 to-yellow-50">
      {/* Hero Section */}
      <div className="text-center py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-6xl mb-4">❓</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            {t('faq.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t('faq.subtitle')}
          </p>
          <Badge className="bg-gradient-to-r from-brand-100 to-mint-100 text-brand-700 border-brand-200 text-lg px-6 py-3">
            <MessageSquare className="w-5 h-5 mr-2" />
            {t('faq.totalQuestions', { count: faqs.reduce((acc, cat) => acc + cat.questions.length, 0) })}
          </Badge>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-8">
        {faqs.map((category, catIndex) => (
          <Card key={catIndex} className="bg-white/80 backdrop-blur-sm border-2 border-brand-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Sparkles className="w-6 h-6 text-brand-600" />
                {category.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {category.questions.map((faq, faqIndex) => (
                  <div key={faqIndex} className="border-l-4 border-brand-200 pl-6 py-4">
                    <h4 className="font-semibold text-gray-800 text-lg mb-3">
                      Q. {faq.question}
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      A. {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Contact CTA */}
        <Card className="bg-gradient-to-r from-brand-500 to-mint-500 text-white border-0">
          <CardContent className="text-center py-12">
            <h3 className="text-2xl font-bold mb-4">
              {t('faq.moreQuestions')}
            </h3>
            <p className="text-lg mb-6 opacity-90">
              {t('faq.moreQuestionsDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@amiko.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-brand-600 hover:bg-gray-100 rounded-xl font-medium transition-all duration-300"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                {t('faq.emailInquiry')}
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-white/20 text-white hover:bg-white/30 rounded-xl font-medium transition-all duration-300"
              >
                <Users className="w-5 h-5 mr-2" />
                {t('faq.customerService')}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
