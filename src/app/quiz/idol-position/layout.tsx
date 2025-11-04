import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Test de Posición de Idol | AMIKO',
  description: 'Descubre qué posición de idol te quedaría mejor en un grupo de K-pop. Responde 12 preguntas y encuentra tu rol perfecto.',
  openGraph: {
    title: 'Test de Posición de Idol | AMIKO',
    description: 'Descubre qué posición de idol te quedaría mejor en un grupo de K-pop',
    images: [
      {
        url: 'https://helloamiko.com/quizzes/idol-position/cover.png',
        width: 1200,
        height: 630,
        alt: 'Test de Posición de Idol'
      }
    ],
    type: 'website',
    url: 'https://helloamiko.com/quiz/idol-position'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Test de Posición de Idol | AMIKO',
    description: 'Descubre qué posición de idol te quedaría mejor en un grupo de K-pop',
    images: ['https://helloamiko.com/quizzes/idol-position/cover.png']
  }
}

export default function IdolPositionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

