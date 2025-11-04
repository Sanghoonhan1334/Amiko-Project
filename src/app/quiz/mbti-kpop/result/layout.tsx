import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mi Resultado MBTI | AMIKO',
  description: '¡Descubre tu tipo MBTI y encuentra celebridades K-POP de tu tipo!',
  openGraph: {
    title: 'Mi Resultado MBTI | AMIKO',
    description: '¡He descubierto mi tipo MBTI! Descubre el tuyo también.',
    images: [
      {
        url: 'https://helloamiko.com/quizzes/mbti-with-kpop-stars/cover/cover.png',
        width: 1200,
        height: 630,
        alt: 'Test de MBTI con Estrellas K-POP'
      }
    ],
    type: 'website',
    url: 'https://helloamiko.com/quiz/mbti-kpop/result'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mi Resultado MBTI | AMIKO',
    description: '¡He descubierto mi tipo MBTI! Descubre el tuyo también.',
    images: ['https://helloamiko.com/quizzes/mbti-with-kpop-stars/cover/cover.png']
  }
}

export default function MBTIKpopResultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

