'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

export default function PartnersPage() {
  const { t, language } = useLanguage()
  const [selectedPartner, setSelectedPartner] = useState<number | null>(null)
  const [closingPartner, setClosingPartner] = useState<number | null>(null)
  const paraFansImageRef = useRef<HTMLImageElement>(null)
  const [imageBounds, setImageBounds] = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  
  // 하이퍼링크 위치 (고정)
  const linkPositions = (() => {
    // localStorage에서 저장된 위치 불러오기
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('para-fans-link-positions')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // 기본값 사용
        }
      }
    }
    // 기본 위치
    return {
      instagram: { top: 15, left: 10, width: 80, height: 12 },
      facebook: { top: 28, left: 10, width: 80, height: 12 },
      website: { top: 41, left: 10, width: 80, height: 12 }
    }
  })()

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
      links: [],
      location: '',
      phone: ''
    },
    {
      name: '',
      country: '',
      flag: '',
      logo: '/logos/socios-placeholder.jpg',
      description: language === 'es' 
        ? 'Descubre nuevas oportunidades junto a AMIKO.'
        : 'Descubre nuevas oportunidades junto a AMIKO.',
      links: []
    },
    {
      name: '',
      country: '',
      flag: '',
      logo: '/logos/socios-placeholder.jpg',
      description: language === 'es' 
        ? 'Descubre nuevas oportunidades junto a AMIKO.'
        : 'Descubre nuevas oportunidades junto a AMIKO.',
      links: []
    },
    {
      name: '',
      country: '',
      flag: '',
      logo: '/logos/socios-placeholder.jpg',
      description: language === 'es' 
        ? 'Descubre nuevas oportunidades junto a AMIKO.'
        : 'Descubre nuevas oportunidades junto a AMIKO.',
      links: []
    },
    {
      name: '',
      country: '',
      flag: '',
      logo: '/logos/socios-placeholder.jpg',
      description: language === 'es' 
        ? 'Descubre nuevas oportunidades junto a AMIKO.'
        : 'Descubre nuevas oportunidades junto a AMIKO.',
      links: []
    }
  ]

  // 파트너 카드 클릭 핸들러
  const handlePartnerClick = (index: number) => {
    if (!partners[index].name || !partners[index].id) return
    
    // Acu-Point는 상세 정보가 없으므로 클릭해도 아무 동작 안 함
    if (partners[index].id === 'acu-point') return
    
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

  // 이미지 위치 재측정 (selectedPartner 변경 시)
  useEffect(() => {
    if (selectedPartner !== null && currentPartner?.id === 'para-fans' && paraFansImageRef.current) {
      const updateBounds = () => {
        if (paraFansImageRef.current) {
          const rect = paraFansImageRef.current.getBoundingClientRect()
          const container = paraFansImageRef.current.parentElement
          if (container) {
            const containerRect = container.getBoundingClientRect()
            setImageBounds({
              left: rect.left - containerRect.left,
              top: rect.top - containerRect.top,
              width: rect.width,
              height: rect.height
            })
          }
        }
      }
      
      // 이미지가 이미 로드된 경우 즉시 측정
      if (paraFansImageRef.current.complete) {
        setTimeout(updateBounds, 100)
      }
      
      // 리사이즈 이벤트 리스너
      window.addEventListener('resize', updateBounds)
      return () => window.removeEventListener('resize', updateBounds)
    }
  }, [selectedPartner, currentPartner])


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
                    className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all flex flex-col ${partner.name && partner.id && partner.id !== 'acu-point' ? 'cursor-pointer' : ''}`}
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
                  {(isSelected || closingPartner === index) && currentPartner && currentPartner.id === partners[index].id && currentPartner.id !== 'acu-point' && (
                    <div 
                      className={`absolute top-full mt-2 left-0 w-[280px] bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-300 dark:border-gray-500 shadow-xl z-[60] ${
                        closingPartner === index ? 'partner-detail-exit' : 'partner-detail-enter'
                      }`}
                      style={{ aspectRatio: '1 / 1' }}
                    >
                      <div className="relative h-full w-full overflow-hidden">
                        {/* Close button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePartnerClick(index)
                          }}
                          className="absolute top-2 right-2 p-1 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors z-20"
                        >
                          <X className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                        </button>

                        {/* Para Fans - 이미지만 표시 (이미지 안에 정보 포함) */}
                        {currentPartner.id === 'para-fans' ? (
                          <div className="relative w-full h-full flex items-center justify-center p-4">
                            {/* Para Fans 상세 이미지 */}
                            <div data-para-fans-container className="relative w-full h-full flex items-center justify-center">
                              <img 
                                ref={paraFansImageRef}
                                src="/logos/Para fans.png"
                                alt={currentPartner.name || 'Partner detail'}
                                className="max-w-full max-h-full object-contain"
                                draggable={false}
                                onLoad={() => {
                                  if (paraFansImageRef.current) {
                                    const rect = paraFansImageRef.current.getBoundingClientRect()
                                    const container = paraFansImageRef.current.parentElement
                                    if (container) {
                                      const containerRect = container.getBoundingClientRect()
                                      setImageBounds({
                                        left: rect.left - containerRect.left,
                                        top: rect.top - containerRect.top,
                                        width: rect.width,
                                        height: rect.height
                                      })
                                    }
                                  }
                                }}
                              />
                              
                              {/* 클릭 가능한 투명 영역들 - 이미지의 실제 위치에 맞춤 */}
                              {imageBounds && (
                                <div 
                                  data-para-fans-container
                                  className="absolute pointer-events-none"
                                  style={{
                                    left: `${imageBounds.left}px`,
                                    top: `${imageBounds.top}px`,
                                    width: `${imageBounds.width}px`,
                                    height: `${imageBounds.height}px`
                                  }}
                                >
                                  {/* Instagram 영역 - 첫 번째 URL */}
                                  <a
                                    href="https://www.instagram.com/_parafans_"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute cursor-pointer hover:bg-blue-500/10 transition-colors rounded z-10 pointer-events-auto"
                                    style={{
                                      left: `${linkPositions.instagram.left}%`,
                                      top: `${linkPositions.instagram.top}%`,
                                      width: `${linkPositions.instagram.width}%`,
                                      height: `${linkPositions.instagram.height}%`
                                    }}
                                    title="Instagram: @_parafans_"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  
                                  {/* Facebook 영역 - 두 번째 URL */}
                                  <a
                                    href="https://www.facebook.com/parafanscol"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute cursor-pointer hover:bg-blue-500/10 transition-colors rounded z-10 pointer-events-auto"
                                    style={{
                                      left: `${linkPositions.facebook.left}%`,
                                      top: `${linkPositions.facebook.top}%`,
                                      width: `${linkPositions.facebook.width}%`,
                                      height: `${linkPositions.facebook.height}%`
                                    }}
                                    title="Facebook: parafanscol"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  
                                  {/* Website 영역 - 세 번째 URL */}
                                  <a
                                    href="https://www.parafansk.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute cursor-pointer hover:bg-blue-500/10 transition-colors rounded z-10 pointer-events-auto"
                                    style={{
                                      left: `${linkPositions.website.left}%`,
                                      top: `${linkPositions.website.top}%`,
                                      width: `${linkPositions.website.width}%`,
                                      height: `${linkPositions.website.height}%`
                                    }}
                                    title="Website: www.parafansk.com"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Acu-Point 및 기타 파트너 - 텍스트 정보 */
                          <div className="relative h-full w-full overflow-y-auto p-4">
                            <div className="space-y-3">
                              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
                                {currentPartner.name} {currentPartner.country && `· ${currentPartner.country}`}
                              </h3>
                              
                              {/* Social Media Links */}
                              {currentPartner.links && currentPartner.links.length > 0 && (
                                <div className="space-y-2">
                                  {currentPartner.links.map((link: any, i: number) => (
                                    <a
                                      key={i}
                                      href={link.url}
                                      target={link.url === '#' ? '_self' : '_blank'}
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 text-xs ${link.url === '#' ? 'text-gray-400 dark:text-gray-500 cursor-default' : 'text-blue-600 dark:text-blue-400 hover:underline'}`}
                                      onClick={(e) => {
                                        if (link.url === '#') {
                                          e.preventDefault()
                                        }
                                      }}
                                    >
                                      <span className="text-base">{link.icon}</span>
                                      <span>{link.label || link.url}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                              
                              {/* Location & Phone */}
                              {currentPartner.location && (
                                <div className="mt-3 space-y-1">
                                  <div className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                                    <span className="text-base">📍</span>
                                    <div>
                                      <div>{currentPartner.location}</div>
                                      <div className="font-semibold">{currentPartner.name.toUpperCase()} {currentPartner.country && currentPartner.country.toUpperCase()}.</div>
                                      {currentPartner.phone && <div>{currentPartner.phone}</div>}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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