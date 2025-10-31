'use client'

import { useState } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

export default function PartnersPage() {
  const { t, language } = useLanguage()
  const [selectedPartner, setSelectedPartner] = useState<number | null>(null)
  const [closingPartner, setClosingPartner] = useState<number | null>(null)

  const partners = [
    {
      id: 'para-fans',
      name: 'Para Fans',
      country: 'Colombia',
      flag: '🇨🇴',
      logo: '/logos/para-fans-logo.jpg',
      description: language === 'ko' 
        ? 'Para Fans Colombia는 K-POP 문화를 사랑하는 사람들을 위한 전문 매장입니다. 단순한 유행이 아닌, 문화를 함께 즐기며 한국의 열정을 전합니다'
        : 'Para Fans Colombia es una tienda especializada para personas que aman la cultura K-POP. No es solo una moda simple, sino un lugar para disfrutar la cultura juntos y transmitir la pasión de Corea.',
      links: [
        {
          platform: 'Instagram',
          url: 'https://www.instagram.com/_parafans_',
          icon: '📷'
        },
        {
          platform: 'Facebook',
          url: 'https://www.facebook.com/parafanscol',
          icon: '👥'
        },
        {
          platform: 'Website',
          url: 'https://www.parafansk.com',
          icon: '🌐'
        }
      ],
      location: 'Bogotá CC Galerias, Local 2055.',
      phone: '312 202 7690'
    },
    {
      id: 'acu-point',
      name: 'Acu-Point',
      country: 'Global Beauty',
      flag: '🌏',
      logo: '/logos/acu-point-logo.jpg',
      description: language === 'ko'
        ? '"어떻게 인류를 아름답고 건강하게 할 수 있는가"라는 질문에서 출발한 기업으로, 지속적 연구와 혁신으로 더 나은 미래의 뷰티를 만들어가고 있습니다.'
        : 'Acu-Point es una empresa que comenzó con la pregunta "¿Cómo podemos hacer a la humanidad hermosa y saludable?" y está creando un mejor futuro de la belleza a través de investigación e innovación continuas.',
      links: []
    },
    {
      name: '',
      country: '',
      flag: '',
      logo: '/logos/socios-placeholder.jpg',
      description: language === 'es' 
        ? 'Descubre nuevas oportunidades junto a Amiko.'
        : 'Descubre nuevas oportunidades junto a Amiko.',
      links: []
    },
    {
      name: '',
      country: '',
      flag: '',
      logo: '/logos/socios-placeholder.jpg',
      description: language === 'es' 
        ? 'Descubre nuevas oportunidades junto a Amiko.'
        : 'Descubre nuevas oportunidades junto a Amiko.',
      links: []
    },
    {
      name: '',
      country: '',
      flag: '',
      logo: '/logos/socios-placeholder.jpg',
      description: language === 'es' 
        ? 'Descubre nuevas oportunidades junto a Amiko.'
        : 'Descubre nuevas oportunidades junto a Amiko.',
      links: []
    },
    {
      name: '',
      country: '',
      flag: '',
      logo: '/logos/socios-placeholder.jpg',
      description: language === 'es' 
        ? 'Descubre nuevas oportunidades junto a Amiko.'
        : 'Descubre nuevas oportunidades junto a Amiko.',
      links: []
    }
  ]

  // 파트너 카드 클릭 핸들러
  const handlePartnerClick = (index: number) => {
    if (!partners[index].name || !partners[index].id) return
    
    if (selectedPartner === index) {
      // 닫기
      setClosingPartner(index)
      setTimeout(() => {
        setSelectedPartner(null)
        setClosingPartner(null)
      }, 500)
    } else {
      // 열기
      setSelectedPartner(index)
    }
  }

  // CSS 애니메이션 스타일
  const animationStyles = `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0.3; }
    }
    @keyframes slideInFromTop {
      from { 
        opacity: 0; 
        transform: translateY(-20px); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    }
    @keyframes slideOutToTop {
      from { 
        opacity: 1; 
        transform: translateY(0); 
      }
      to { 
        opacity: 0; 
        transform: translateY(-20px); 
      }
    }
    @keyframes overlayFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes overlayFadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    .partner-card-fade {
      animation: fadeOut 0.3s ease-out forwards;
    }
    .partner-detail-enter {
      animation: slideInFromTop 0.3s ease-out forwards;
    }
    .partner-detail-exit {
      animation: slideOutToTop 0.3s ease-out forwards;
    }
    .overlay-fade-in {
      animation: overlayFadeIn 0.3s ease-out forwards;
    }
    .overlay-fade-out {
      animation: overlayFadeOut 0.3s ease-out forwards;
    }
  `

  const currentPartner = selectedPartner !== null ? partners[selectedPartner] : null

  return (
    <>
      <style>{animationStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-yellow-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-8 md:pt-32 relative">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/main?tab=community"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('community.partners') || 'Socios'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('community.partnersDesc') || 'Nuestros socios'}
            </p>
          </div>

          {/* Partners Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {/* 오버레이 - 서브메뉴가 열렸을 때 다른 카드 클릭 방지 */}
            {(selectedPartner !== null || closingPartner !== null) && (
              <div 
                className={`absolute inset-0 bg-gradient-to-br from-pink-100 via-yellow-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 z-40 rounded-xl pointer-events-auto ${
                  closingPartner !== null ? 'overlay-fade-out' : 'overlay-fade-in'
                }`}
                onClick={() => {
                  if (selectedPartner !== null) {
                    handlePartnerClick(selectedPartner)
                  }
                }}
              />
            )}
            
            {partners.map((partner, index) => {
              const isSelected = selectedPartner === index
              const shouldFade = selectedPartner !== null && closingPartner === null && !isSelected && partner.name
              
              return (
                <div 
                  key={index}
                  className={`relative w-[280px] overflow-visible ${
                    isSelected ? 'z-50' : shouldFade ? 'z-30 opacity-0 pointer-events-none' : ''
                  }`}
                >
                  {/* Main Card */}
                  <div
                    className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all flex flex-col ${partner.name && partner.id ? 'cursor-pointer' : ''}`}
                    style={{ aspectRatio: '1 / 1' }}
                    onClick={() => handlePartnerClick(index)}
                  >
                    <div className="flex flex-col flex-1 p-6">
                      {/* Logo Section */}
                      <div className={`bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center ${partner.name ? '-mt-6 -mb-0' : 'pt-2 pb-6'}`}>
                        {partner.logo ? (
                          <img 
                            src={partner.logo} 
                            alt={partner.name}
                            className="h-40 w-auto object-contain"
                            draggable={false}
                          />
                        ) : (
                          <div className="text-gray-400 dark:text-gray-500 text-5xl">
                            {partner.flag || '🏢'}
                          </div>
                        )}
                      </div>

                      {/* Text Content */}
                      <div className="flex flex-col space-y-1 -mt-2 text-center">
                        {partner.name && (
                          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {partner.name}
                            {partner.country && <span className="font-bold text-gray-500 dark:text-gray-400"> · {partner.country}</span>}
                          </h2>
                        )}
                        <p className={partner.name ? "text-[10px] font-bold text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-4" : "text-sm font-bold text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-4"}>
                          {partner.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Card - 흰색 오버레이 위에 표시 */}
                  {(isSelected || closingPartner === index) && currentPartner && currentPartner.id === partners[index].id && (
                    <div 
                      className={`absolute top-full mt-2 left-0 w-[280px] bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-300 dark:border-gray-500 shadow-xl z-[60] ${
                        closingPartner === index ? 'partner-detail-exit' : 'partner-detail-enter'
                      }`}
                      style={{ aspectRatio: '1 / 1' }}
                    >
                      <div className="relative h-full w-full overflow-hidden p-4">
                        {/* Close button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePartnerClick(index)
                          }}
                          className="absolute top-2 right-2 p-1 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors z-10"
                        >
                          <X className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                        </button>

                        {/* Image */}
                        <img 
                          src="/logos/Para fans.png"
                          alt={currentPartner.name || 'Partner detail'}
                          className="w-full h-full object-contain"
                          draggable={false}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}