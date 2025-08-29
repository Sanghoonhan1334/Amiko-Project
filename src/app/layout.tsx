import type { Metadata } from 'next'
import { Inter, Baloo_2 } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { AuthProvider } from '@/context/AuthContext'

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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <style dangerouslySetInnerHTML={{ __html: pretendard.style }} />
      </head>
      <body className={`${inter.variable} ${baloo2.variable} ${pretendard.variable} font-sans min-h-screen`}>
        <AuthProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
