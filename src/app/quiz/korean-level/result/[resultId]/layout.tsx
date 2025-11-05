import { Metadata } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ resultId: string }> 
}): Promise<Metadata> {
  try {
    const { resultId } = await params
    
    if (!supabaseServer || !resultId) {
      return {
        title: 'Korean Level Test Result | AMIKO',
        description: 'Check your Korean language proficiency level'
      }
    }

    // 결과 조회
    const { data: result } = await supabaseServer
      .from('user_korean_level_results')
      .select('*')
      .eq('id', resultId)
      .single()

    if (!result) {
      return {
        title: 'Korean Level Test Result | AMIKO',
        description: 'Check your Korean language proficiency level'
      }
    }

    const level = result.level // 'Básico', 'Intermedio', 'Avanzado'
    const levelKo = result.level_ko // '기초', '중급', '고급'
    const score = result.score

    const title = `Test de Nivel de Coreano: ${level} (${score} puntos) | AMIKO`
    const description = `¡Mi nivel de coreano es "${level}"! Obtuve ${score} puntos en el test de AMIKO. ¡Prueba tú también!`
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://helloamiko.com'
    const imageUrl = `${baseUrl}/quizzes/korean-level/result/result.png`
    const url = `${baseUrl}/quiz/korean-level/result/${resultId}`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: 'Korean Level Test Result'
          }
        ],
        url,
        type: 'website',
        siteName: 'AMIKO'
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl]
      }
    }
  } catch (error) {
    console.error('[METADATA] Error:', error)
    return {
      title: 'Korean Level Test Result | AMIKO',
      description: 'Check your Korean language proficiency level'
    }
  }
}

export default function ResultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}



