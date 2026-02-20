import type { Metadata, Viewport } from 'next'
import { Inter, Baloo_2 } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import HeaderWrapper from '@/components/layout/HeaderWrapper'
import Footer from '@/components/layout/Footer'
import ScrollToTop from '@/components/common/ScrollToTop'
import CustomBanner from '@/components/layout/CustomBanner'
import GlobalChatButton from '@/components/common/GlobalChatButton'
import FaviconBadge from '@/components/common/FaviconBadge'
import HistoryManager from '@/components/common/HistoryManager'
import DeepLinkHandler from '@/components/common/DeepLinkHandler'
import { AuthProvider } from '@/context/AuthContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { UserProvider } from '@/context/UserContext'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import QueryProvider from '@/providers/QueryProvider'
import Analytics from '@/components/analytics/Analytics'
import { Suspense } from 'react'
import { PushNotificationInitializer } from '@/components/notifications/PushNotificationInitializer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const baloo2 = Baloo_2({
  subsets: ['latin'],
  variable: '--font-baloo2',
  display: 'swap',
})

// Pretendard 폰트를 위한 CSS 변수 설정
const pretendard = {
  variable: '--font-pretendard',
  style: `
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
  `
}

export const metadata: Metadata = {
  title: 'Amiko - 한국 문화 교류 플랫폼',
  description: '한국 문화를 배우고 소통하는 플랫폼',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-64x64.png', sizes: '64x64', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon-128x128.png',
    apple: '/apple-touch-icon.png',
  },
  keywords: ['한국문화', '문화교류', '언어교환', 'K-Culture', 'Amiko'],
  authors: [{ name: 'Amiko Team' }],
  creator: 'Amiko',
  publisher: 'Amiko',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.helloamiko.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Amiko - 한국 문화 교류 플랫폼',
    description: '한국 문화를 배우고 소통하는 플랫폼',
    url: 'https://www.helloamiko.com',
    siteName: 'Amiko',
    images: [
      {
        url: 'https://www.helloamiko.com/amiko-logo.png',
        width: 1200,
        height: 630,
        alt: 'Amiko - 한국 문화 교류 플랫폼',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amiko - 한국 문화 교류 플랫폼',
    description: '한국 문화를 배우고 소통하는 플랫폼',
    images: ['https://www.helloamiko.com/amiko-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: pretendard.style }} />
        {/* 파비콘 설정 */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logos/apple-touch-icon.png" />
        <link rel="shortcut icon" href="/logos/amiko-logo.png" />
      </head>
      <body className={`${inter.variable} ${baloo2.variable} ${pretendard.variable} font-sans min-h-dvh`} suppressHydrationWarning>
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        <Suspense fallback={null}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange={false}
          >
            <AuthProvider>
              <LanguageProvider>
                <UserProvider>
                  <PushNotificationInitializer />
                  <DeepLinkHandler />
                  <CustomBanner />
                  <HeaderWrapper />
                  <main>
                    <HistoryManager />
                    {children}
                  </main>
                  <Footer />
                  <ScrollToTop />
                  <GlobalChatButton />
                  <FaviconBadge />
                </UserProvider>
              </LanguageProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
        </Suspense>
        <Script src="//www.instagram.com/embed.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}
