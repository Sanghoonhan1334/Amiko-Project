'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import SplashSequence from '@/components/splash/SplashSequence'
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
  HelpCircle,
  Share2,
  Headphones,
  Shield
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
  const [showSplash, setShowSplash] = useState(true)
  const { t, language } = useLanguage()
  const router = useRouter()
  
  // 문의 모달 상태
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false)

  // 제휴 모달 상태
  const [isPartnershipModalOpen, setIsPartnershipModalOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // 스플래시 화면 표시 후 메인 콘텐츠로 전환
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2000) // 2초 후 스플래시 종료

    return () => clearTimeout(timer)
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
  }




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

  // 스플래시 화면 표시
  if (showSplash) {
    return <SplashSequence onComplete={handleSplashComplete} />
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
                    <img src="/misc/1.png" alt="AMIKO" className="w-24 h-24 mx-auto mb-2 dark:hidden" />
                    <img src="/logos/amiko-logo-dark.png" alt="AMIKO" className="w-24 h-24 mx-auto mb-2 hidden dark:block" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">{t('heroSlides.slide3.infoSection.about.description')}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <img src="/misc/2.png" alt="Bridge" className="w-24 h-24 mx-auto mb-2" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {language === 'es' ? (
                        <>
                          Un puente que conecta <span className="text-red-500">AM</span>érica y <span className="text-blue-500">KO</span>rea a través de I
                        </>
                      ) : (
                        <>
                          <span className="text-red-500">AM</span>erica와 <span className="text-blue-500">KO</span>rea를 I 이어주는 다리
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <img src="/misc/3.png" alt="Connect" className="w-24 h-24 mx-auto mb-2 dark:hidden" />
                    <img src="/logos/amiko-logo-dark.png" alt="Connect" className="w-24 h-24 mx-auto mb-2 hidden dark:block" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">{t('heroSlides.slide3.infoSection.about.connectDescription')}</p>
                  </div>
                </div>
                
                {/* 소개글 */}
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      {t('about.greeting')}
                    </h2>
                    
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-bold">
                      {t('about.thankYou')}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-bold">
                      {t('about.teamIntroduction')}
                    </p>
                    
                    <br />
                    
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {t('about.latinAmericaExperience')}
                    </p>
                    
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {t('about.koreanInterest')}
                    </p>
                    
                    <br />
                    
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {t('about.culturalExchange')}
                    </p>
                    
                    <br />
                    
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {t('about.bridgePromise')}
                    </p>
                    
                    <br />
                    
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {t('about.platformDescription')}
                    </p>
                    
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {t('about.communityVision')}
                    </p>
                    
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-6">
                      {t('about.finalMessage')}
                    </p>
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

          {/* SNS 섹션 */}
          <AccordionItem value="sns" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <AccordionTrigger className="px-6 hover:no-underline transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 transition-transform duration-300 group-data-[state=open]:rotate-180">
                  <Share2 className="w-5 h-5 text-gray-900 dark:text-gray-100" />
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {language === 'ko' ? 'AMIKO 공식 SNS' : 'SNS Oficial de AMIKO'}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  {language === 'ko' 
                    ? 'AMIKO의 최신 소식과 이벤트를 SNS에서 확인하세요!' 
                    : '¡Mantente al día con las últimas noticias y eventos de AMIKO en nuestras redes sociales!'
                  }
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <a 
                    href="https://www.tiktok.com/@amiko_latin" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-300"
                  >
                    <img src="/social/tiktok.png" alt="TikTok" className="w-8 h-8 object-contain" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">TikTok</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">@amiko_latin</p>
                    </div>
                  </a>
                  <a 
                    href="https://www.instagram.com/amiko_latin" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-300"
                  >
                    <img src="/social/instagram.jpeg" alt="Instagram" className="w-8 h-8 object-contain" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Instagram</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">@amiko_latin</p>
                    </div>
                  </a>
                  <a 
                    href="https://www.youtube.com/@AMIKO_Officialstudio" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-300"
                  >
                    <img src="/social/youtube.png" alt="YouTube" className="w-8 h-8 object-contain" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">YouTube</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">@AMIKO_Officialstudio</p>
                    </div>
                  </a>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 고객지원 섹션 */}
          <AccordionItem value="support" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <AccordionTrigger className="px-6 hover:no-underline transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 transition-transform duration-300 group-data-[state=open]:rotate-180">
                  <Headphones className="w-5 h-5 text-gray-900 dark:text-gray-100" />
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {language === 'ko' ? '고객지원' : 'Soporte al Cliente'}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  {language === 'ko' 
                    ? '도움이 필요하신가요? 언제든지 연락주세요!' 
                    : '¿Necesitas ayuda? ¡Contáctanos en cualquier momento!'
                  }
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <a 
                    href="/help" 
                    className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-300"
                  >
                    <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                        {language === 'ko' ? '도움말' : 'Ayuda'}
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        {language === 'ko' ? '사용 방법을 자세히 알아보세요' : 'Aprende cómo usar la plataforma'}
                      </p>
                    </div>
                  </a>
                  <a 
                    href="/faq" 
                    className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors duration-300"
                  >
                    <HelpCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="font-semibold text-green-800 dark:text-green-300">FAQ</h3>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        {language === 'ko' ? '자주 묻는 질문과 답변' : 'Preguntas frecuentes y respuestas'}
                      </p>
                    </div>
                  </a>
                  <a 
                    href="/contact" 
                    className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors duration-300"
                  >
                    <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <h3 className="font-semibold text-purple-800 dark:text-purple-300">
                        {language === 'ko' ? '문의하기' : 'Contacto'}
                      </h3>
                      <p className="text-sm text-purple-700 dark:text-purple-400">
                        {language === 'ko' ? '직접 문의사항을 보내주세요' : 'Envía tus consultas directamente'}
                      </p>
                    </div>
                  </a>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 개인정보처리방침 섹션 */}
          <AccordionItem value="privacy" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <AccordionTrigger className="px-6 hover:no-underline transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 transition-transform duration-300 group-data-[state=open]:rotate-180">
                  <Shield className="w-5 h-5 text-gray-900 dark:text-gray-100" />
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {language === 'ko' ? '개인정보처리방침' : 'Política de Privacidad'}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  {language === 'ko' 
                    ? 'AMIKO는 사용자의 개인정보 보호를 최우선으로 합니다.' 
                    : 'AMIKO prioriza la protección de la información personal de los usuarios.'
                  }
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <a 
                    href="/privacy" 
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300"
                  >
                    <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                        {language === 'ko' ? '개인정보처리방침' : 'Política de Privacidad'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'ko' ? '개인정보 수집 및 이용에 대한 정책' : 'Política sobre recopilación y uso de información personal'}
                      </p>
                    </div>
                  </a>
                  <a 
                    href="/terms" 
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300"
                  >
                    <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                        {language === 'ko' ? '이용약관' : 'Términos de Uso'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'ko' ? '서비스 이용에 대한 약관' : 'Términos para el uso del servicio'}
                      </p>
                    </div>
                  </a>
                  <a 
                    href="/cookies" 
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300"
                  >
                    <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                        {language === 'ko' ? '쿠키 정책' : 'Política de Cookies'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'ko' ? '쿠키 사용에 대한 정책' : 'Política sobre el uso de cookies'}
                      </p>
                    </div>
                  </a>
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
