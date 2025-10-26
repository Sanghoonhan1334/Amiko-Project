'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

export default function PartnersPage() {
  const { t } = useLanguage()

  const partners = [
    {
      name: 'Parapans',
      country: 'Colombia',
      flag: '🇨🇴',
      links: [
        {
          platform: 'Instagram',
          url: 'https://instagram.com/parapans',
          icon: '📷'
        },
        {
          platform: 'Website',
          url: 'https://parapans.com',
          icon: '🌐'
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
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

        {/* Partners List */}
        <div className="space-y-6">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-300 dark:border-gray-500 p-6 shadow-md"
            >
              {/* Partner Info */}
              <div className="flex items-center gap-3 mb-6">
                <div className="text-3xl">{partner.flag}</div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {partner.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {partner.country}
                  </p>
                </div>
              </div>

              {/* Links */}
              <div className="flex flex-col gap-3">
                {partner.links.map((link, linkIndex) => (
                  <a
                    key={linkIndex}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                  >
                    <div className="text-2xl flex-shrink-0">{link.icon}</div>
                    <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {link.platform}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
