'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
// import ScrollToTopButton from '@/components/common/ScrollToTopButton'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  Handshake,
  Building2,
  Users,
  DollarSign,
  HelpCircle
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import InquiryModal from '@/components/common/InquiryModal'
import PartnershipModal from '@/components/common/PartnershipModal'

const Hero = dynamic(() => import('@/components/landing/Hero'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen body-gradient">
      {/* 헤더 스켈레톤 */}
      <div className="h-16 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      
      {/* 메인 콘텐츠 스켈레톤 */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          {/* 제목 스켈레톤 */}
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4 mx-auto" />
            <Skeleton className="h-8 w-1/2 mx-auto" />
          </div>
          
          {/* 설명 스켈레톤 */}
          <div className="space-y-3 max-w-2xl mx-auto">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6 mx-auto" />
            <Skeleton className="h-4 w-4/6 mx-auto" />
          </div>
          
          {/* 버튼 스켈레톤 */}
          <div className="flex justify-center space-x-4">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>
        
        {/* 하단 카드들 스켈레톤 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

export default function HomePage() {
  const [isClient, setIsClient] = useState(false)
  const { t, language } = useLanguage()
  const router = useRouter()
  
  // 문의 모달 상태
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false)

  // 제휴 모달 상태
  const [isPartnershipModalOpen, setIsPartnershipModalOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])




  if (!isClient) {
    return (
      <div className="min-h-screen body-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen body-gradient">
      {/* Hero Section */}
      <Hero />

      {/* 통합 콘텐츠 섹션 */}
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-12 space-y-4 md:space-y-6 bg-white dark:bg-gray-900">
        <div className="text-center mb-4 md:mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 md:mb-4">
            {t('heroSlides.slide3.infoSection.title')}
          </h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            {t('heroSlides.slide3.infoSection.subtitle')}
          </p>
        </div>

        <Accordion 
          type="single" 
          collapsible 
          className="w-full space-y-2 md:space-y-4"
          style={{
            '--radix-accordion-content-duration': '300ms',
            '--radix-accordion-content-ease': 'ease-out'
          } as React.CSSProperties}
        >
          {/* 소개 섹션 */}
          <AccordionItem value="about" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <AccordionTrigger className="px-6 hover:no-underline transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 transition-transform duration-300 group-data-[state=open]:rotate-180">
                  <Building2 className="w-5 h-5 text-gray-900 dark:text-gray-100" />
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('heroSlides.slide3.infoSection.about.title')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <iframe
                    src="https://www.youtube.com/embed/do4aDyGZmgM"
                    title="AMIKO 소개 영상"
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <img src="/1.png" alt="AMIKO" className="w-24 h-24 mx-auto mb-2 dark:hidden" />
                    <img src="/amiko-logo-dark.png" alt="AMIKO" className="w-24 h-24 mx-auto mb-2 hidden dark:block" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">{t('heroSlides.slide3.infoSection.about.description')}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <img src="/2.png" alt="Bridge" className="w-24 h-24 mx-auto mb-2" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {t('heroSlides.slide3.infoSection.about.bridgeDescription')}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <img src="/3.png" alt="Connect" className="w-24 h-24 mx-auto mb-2 dark:hidden" />
                    <img src="/amiko-logo-dark.png" alt="Connect" className="w-24 h-24 mx-auto mb-2 hidden dark:block" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">{t('heroSlides.slide3.infoSection.about.connectDescription')}</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 문의 섹션 */}
          <AccordionItem value="contact" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <AccordionTrigger className="px-6 hover:no-underline transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 transition-transform duration-300 group-data-[state=open]:rotate-180">
                  <MessageSquare className="w-5 h-5 text-gray-900 dark:text-gray-100" />
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('heroSlides.slide3.infoSection.contact.title')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  {t('heroSlides.slide3.infoSection.contact.description')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">{t('heroSlides.slide3.infoSection.contact.email')}</h3>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">support@amiko.com</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">{t('heroSlides.slide3.infoSection.contact.operatingHours')}</h3>
                    <p className="text-green-700 dark:text-green-300 text-sm">{t('heroSlides.slide3.infoSection.contact.hours')}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsInquiryModalOpen(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {t('heroSlides.slide3.infoSection.contact.contactButton')}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 제휴문의 섹션 */}
          <AccordionItem value="partnership" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <AccordionTrigger className="px-6 hover:no-underline transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 transition-transform duration-300 group-data-[state=open]:rotate-180">
                  <Handshake className="w-5 h-5 text-gray-900 dark:text-gray-100" />
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('heroSlides.slide3.infoSection.partnership.title')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  {t('heroSlides.slide3.infoSection.partnership.description')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{t('heroSlides.slide3.infoSection.partnership.brandExpansion')}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{t('heroSlides.slide3.infoSection.partnership.brandDescription')}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                    <Users className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{t('heroSlides.slide3.infoSection.partnership.customerExpansion')}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{t('heroSlides.slide3.infoSection.partnership.customerDescription')}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{t('heroSlides.slide3.infoSection.partnership.revenueIncrease')}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{t('heroSlides.slide3.infoSection.partnership.revenueDescription')}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsPartnershipModalOpen(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Handshake className="mr-2 h-4 w-4" />
                  {t('heroSlides.slide3.infoSection.partnership.partnershipButton')}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 섹션 */}
          <AccordionItem value="faq" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <AccordionTrigger className="px-6 hover:no-underline transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 transition-transform duration-300 group-data-[state=open]:rotate-180">
                  <HelpCircle className="w-5 h-5 text-gray-900 dark:text-gray-100" />
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('heroSlides.slide3.infoSection.faq.title')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="border-l-4 border-blue-200 dark:border-blue-700 pl-4 py-2">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Q. {t('heroSlides.slide3.infoSection.faq.q1')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">A. {t('heroSlides.slide3.infoSection.faq.a1')}</p>
                </div>
                <div className="border-l-4 border-blue-200 dark:border-blue-700 pl-4 py-2">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Q. {t('heroSlides.slide3.infoSection.faq.q2')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">A. {t('heroSlides.slide3.infoSection.faq.a2')}</p>
                </div>
                <div className="border-l-4 border-blue-200 dark:border-blue-700 pl-4 py-2">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Q. {t('heroSlides.slide3.infoSection.faq.q3')}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">A. {t('heroSlides.slide3.infoSection.faq.a3')}</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 도움말 섹션 */}
          <AccordionItem value="help" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <AccordionTrigger className="px-6 hover:no-underline transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 transition-transform duration-300 group-data-[state=open]:rotate-180">
                  <HelpCircle className="w-5 h-5 text-gray-900 dark:text-gray-100" />
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('heroSlides.slide3.infoSection.help.title')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('heroSlides.slide3.infoSection.help.gettingStarted')}</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>{t('heroSlides.slide3.infoSection.help.step1')}</li>
                    <li>{t('heroSlides.slide3.infoSection.help.step2')}</li>
                    <li>{t('heroSlides.slide3.infoSection.help.step3')}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('heroSlides.slide3.infoSection.help.videoCall')}</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>{t('heroSlides.slide3.infoSection.help.videoStep1')}</li>
                    <li>{t('heroSlides.slide3.infoSection.help.videoStep2')}</li>
                    <li>{t('heroSlides.slide3.infoSection.help.videoStep3')}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('heroSlides.slide3.infoSection.help.community')}</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>{t('heroSlides.slide3.infoSection.help.communityStep1')}</li>
                    <li>{t('heroSlides.slide3.infoSection.help.communityStep2')}</li>
                    <li>{t('heroSlides.slide3.infoSection.help.communityStep3')}</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* 문의 모달 */}
      <InquiryModal 
        isOpen={isInquiryModalOpen} 
        onClose={() => setIsInquiryModalOpen(false)} 
      />

      {/* 제휴 모달 */}
      <PartnershipModal 
        isOpen={isPartnershipModalOpen} 
        onClose={() => setIsPartnershipModalOpen(false)} 
      />

      {/* 맨 위로 이동 버튼 - 제거됨 */}
      {/* <ScrollToTopButton /> */}
    </div>
  )
}
