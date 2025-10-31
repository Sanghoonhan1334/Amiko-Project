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
import { GA_MEASUREMENT_ID } from '@/lib/gtag'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import GTM from '@/components/analytics/GTM'

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
        {/* Google Analytics */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        <style dangerouslySetInnerHTML={{ __html: pretendard.style }} />
        {/* 파비콘 설정 */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logos/apple-touch-icon.png" />
        <link rel="shortcut icon" href="/logos/amiko-logo.png" />
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
        <GTM />
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
                  {GA_MEASUREMENT_ID && <GoogleAnalytics />}
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
        {/* 카카오톡 링크 미리보기용 추가 메타 태그 */}
        <Script
          id="kakao-meta-tags"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // 카카오톡 링크 미리보기 강제 업데이트
              if (typeof window !== 'undefined') {
                const metaTags = [
                  { property: 'og:title', content: 'Amiko - 한국 문화 교류 플랫폼' },
                  { property: 'og:description', content: '한국 문화를 배우고 소통하는 플랫폼' },
                  { property: 'og:image', content: 'https://www.helloamiko.com/amiko-logo.png' },
                  { property: 'og:url', content: 'https://www.helloamiko.com' },
                  { property: 'og:type', content: 'website' },
                  { property: 'og:site_name', content: 'Amiko' },
                  { name: 'twitter:card', content: 'summary_large_image' },
                  { name: 'twitter:title', content: 'Amiko - 한국 문화 교류 플랫폼' },
                  { name: 'twitter:description', content: '한국 문화를 배우고 소통하는 플랫폼' },
                  { name: 'twitter:image', content: 'https://www.helloamiko.com/amiko-logo.png' }
                ];
                
                metaTags.forEach(tag => {
                  let element = document.querySelector(\`meta[property="\${tag.property}"]\`) || 
                               document.querySelector(\`meta[name="\${tag.name}"]\`);
                  if (element) {
                    element.setAttribute('content', tag.content);
                  } else {
                    element = document.createElement('meta');
                    if (tag.property) {
                      element.setAttribute('property', tag.property);
                    } else {
                      element.setAttribute('name', tag.name);
                    }
                    element.setAttribute('content', tag.content);
                    document.head.appendChild(element);
                  }
                });
                
                // 파비콘 크기 최적화 - 더 큰 파비콘 우선 사용
                const faviconSizes = ['512x512', '192x192', '128x128', '96x96', '64x64', '32x32', '16x16'];
                const existingFavicon = document.querySelector('link[rel="icon"]');
                if (existingFavicon) {
                  existingFavicon.href = '/favicon-128x128.png';
                }
                
                // 파비콘 크기 강제 조정
                const allFavicons = document.querySelectorAll('link[rel="icon"]');
                allFavicons.forEach(favicon => {
                  favicon.href = '/favicon-128x128.png';
                });
                
                // 추가 파비콘 링크들 생성
                faviconSizes.forEach(size => {
                  const link = document.createElement('link');
                  link.rel = 'icon';
                  link.type = 'image/png';
                  link.sizes = size;
                  link.href = \`/favicon-\${size}.png\`;
                  document.head.appendChild(link);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
