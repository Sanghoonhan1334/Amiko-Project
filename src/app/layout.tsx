import type { Metadata } from 'next'
import { Inter, Baloo_2 } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import HeaderWrapper from '@/components/layout/HeaderWrapper'
import Footer from '@/components/layout/Footer'
import ScrollToTop from '@/components/common/ScrollToTop'
import CustomBanner from '@/components/layout/CustomBanner'
import { AuthProvider } from '@/context/AuthContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { UserProvider } from '@/context/UserContext'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import QueryProvider from '@/providers/QueryProvider'

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
    icon: '/amiko-logo.png',
    shortcut: '/amiko-logo.png',
    apple: '/amiko-logo.png',
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
        url: '/amiko-logo.png', // Amiko 로고 이미지
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
    images: ['/amiko-logo.png'],
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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover', // Safe Area 적용
  },
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
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="shortcut icon" href="/amiko-logo.png" />
        {/* 폰트 preload로 초기 렌더링 최적화 */}
        <link 
          rel="preload" 
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" 
          as="style"
        />
        <link 
          rel="preload" 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" 
          as="style"
        />
        <link 
          rel="preload" 
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700&display=swap" 
          as="style"
        />
      </head>
      <body className={`${inter.variable} ${baloo2.variable} ${pretendard.variable} font-sans min-h-screen`} suppressHydrationWarning>
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
                  <CustomBanner />
                  <HeaderWrapper />
                  <main>{children}</main>
                  <Footer />
                  <ScrollToTop />
                </UserProvider>
              </LanguageProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
        <Script src="//www.instagram.com/embed.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}
