'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

export default function PartnersPage() {
  const { t, language } = useLanguage()

  const partners = [
    {
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
          url: '#',
          icon: '📷'
        },
        {
          platform: 'Website',
          url: '#',
          icon: '🌐'
        }
      ]
    },
    {
      name: 'Acu-Point',
      country: 'Global Beauty',
      flag: '🌏',
      logo: '/logos/acu-point-logo.png', // Replace with actual logo path
      description: language === 'ko'
        ? '"어떻게 인류를 아름답고 건강하게 할 수 있는가"라는 질문에서 출발한 기업으로, 지속적 연구와 혁신으로 더 나은 미래의 뷰티를 만들어가고 있습니다.'
        : 'Acu-Point es una empresa que comenzó con la pregunta "¿Cómo podemos hacer a la humanidad hermosa y saludable?" y está creando un mejor futuro de la belleza a través de investigación e innovación continuas.',
      links: []
    },
    {
      name: 'Socios',
      country: '',
      flag: '',
      logo: null,
      description: language === 'es' 
        ? 'Descubre nuevas oportunidades junto a Amiko.'
        : 'Descubre nuevas oportunidades junto a Amiko.',
      links: [],
      placeholder: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-8 md:pt-32">
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
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow flex flex-col"
              style={{ aspectRatio: '1 / 1' }}
            >
              {/* Content with equal padding all around */}
              <div className="flex flex-col flex-1 p-6">
                {/* Logo Section - White background with negative margins */}
                <div className="bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center py-6 -mt-6 -mb-0">
                  {partner.logo ? (
                    <img 
                      src={partner.logo} 
                      alt={partner.name}
                      className="h-20 w-auto object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 dark:text-gray-500 text-3xl">
                      {partner.placeholder ? '📦' : partner.flag || '🏢'}
                    </div>
                  )}
                </div>

                {/* Text Content - with top negative margin */}
                <div className="flex flex-col space-y-1 -mt-2">
                  {/* Title with country on same line */}
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {partner.name}
                    {partner.country && <span className="font-normal text-gray-500 dark:text-gray-400"> · {partner.country}</span>}
                  </h2>

                  {/* Description - smaller text */}
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-4">
                    {partner.description}
                  </p>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
