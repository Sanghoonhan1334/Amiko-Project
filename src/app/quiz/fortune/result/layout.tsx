import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mi Resultado de Fortuna | AMIKO',
  description: 'Descubre tu índice de fortuna personalizado basado en tu estado emocional y personalidad.',
  openGraph: {
    title: 'Mi Resultado de Fortuna | AMIKO',
    description: 'He descubierto mi fortuna del día. ¡Descubre la tuya también!',
    images: [
      {
        url: 'https://helloamiko.com/quizzes/fortune/cover/cover.png',
        width: 1200,
        height: 630,
        alt: 'Test de Fortuna Resultado'
      }
    ],
    type: 'website',
    url: 'https://helloamiko.com/quiz/fortune/result'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mi Resultado de Fortuna | AMIKO',
    description: 'He descubierto mi fortuna del día. ¡Descubre la tuya también!',
    images: ['https://helloamiko.com/quizzes/fortune/cover/cover.png']
  }
}

export default function FortuneResultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

