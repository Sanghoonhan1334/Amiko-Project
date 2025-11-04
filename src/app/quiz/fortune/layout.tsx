import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Test de Fortuna | AMIKO',
  description: 'Descubre tu fortuna de hoy basada en tu estado emocional y personalidad. ¡Un test único que te revelará qué te depara el destino!',
  openGraph: {
    title: 'Test de Fortuna | AMIKO',
    description: 'Descubre tu fortuna de hoy basada en tu estado emocional y personalidad',
    images: [
      {
        url: 'https://helloamiko.com/quizzes/fortune/cover/cover.png',
        width: 1200,
        height: 630,
        alt: 'Test de Fortuna'
      }
    ],
    type: 'website',
    url: 'https://helloamiko.com/quiz/fortune'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Test de Fortuna | AMIKO',
    description: 'Descubre tu fortuna de hoy basada en tu estado emocional y personalidad',
    images: ['https://helloamiko.com/quizzes/fortune/cover/cover.png']
  }
}

export default function FortuneLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

