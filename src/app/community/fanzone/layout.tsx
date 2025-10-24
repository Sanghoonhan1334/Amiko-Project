import React from 'react'
import type { Metadata } from 'next'

/**
 * FanZone Layout - Server Component
 * Layout específico para las páginas de FanZone
 * Mantiene metadata en server component
 */
export default function FanzoneLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

// Metadata para SEO
export const metadata: Metadata = {
  title: 'FanZone - Comunidades de Fans | AMIKO',
  description: 'Conecta con fans como tú en FanZone. Únete a comunidades de K-Pop, K-Drama, K-Beauty y más. Crea tu propio FanRoom y comparte tu pasión.',
  keywords: ['FanZone', 'K-Pop', 'K-Drama', 'K-Beauty', 'comunidades', 'fans', 'AMIKO'],
  openGraph: {
    title: 'FanZone - Comunidades de Fans | AMIKO',
    description: 'Conecta con fans como tú en FanZone. Únete a comunidades de K-Pop, K-Drama, K-Beauty y más.',
    type: 'website',
    images: [
      {
        url: '/fanzone-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'FanZone - Comunidades de Fans'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FanZone - Comunidades de Fans | AMIKO',
    description: 'Conecta con fans como tú en FanZone. Únete a comunidades de K-Pop, K-Drama, K-Beauty y más.',
    images: ['/fanzone-twitter-image.jpg']
  }
}
