'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface QuizResult {
  id: string
  result_type: string
  title: string
  description: string
  image_url?: string
  characteristic?: string
  recommendation?: string
  created_at: string
}

const CAPTIONS: Record<string, string> = {
  vocalista: "Presencia cálida; brillas en directos con voz estable.",
  bailarina: "Te adaptas a todo; favorita en programas de supervivencia.",
  centro: "Amas la libertad; famosa por tu cariño constante a los fans.",
  cantautora: "Sincera y audaz; destacas con comentarios directos en entrevistas.",
  rapera: "Expresas poco tus emociones, pero tienes un mundo interior profundo.",
  "la-menor": "Extrovertida y con muchos contactos; sorprendes con amistades inesperadas.",
  lider: "Te comunicas muy bien con fans; nunca fallas a los mensajes diarios.",
  productora: "Das consejos realistas y prácticos; la 'consultora' del grupo.",
}

export default function AllIdolPositionTypesPage() {
  const router = useRouter()
  const [results, setResults] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch('/api/quizzes/by-slug/idol-position')
        if (!response.ok) {
          throw new Error('Failed to fetch quiz data')
        }
        
        const data = await response.json()
        if (data.success && data.data?.results) {
          // Sort by result_type alphabetically for consistent display
          const sortedResults = data.data.results.sort((a: QuizResult, b: QuizResult) => {
            return a.result_type.localeCompare(b.result_type)
          })
          setResults(sortedResults)
        }
      } catch (error) {
        console.error('Error fetching results:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E3A8A] via-[#3B82F6] to-[#1E40AF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-2 text-white/80">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A8A] via-[#3B82F6] to-[#1E40AF]">
      {/* Header */}
      <div className="sticky top-16 z-10 bg-[#1E3A8A]/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">
              Todos los tipos de posición
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((result) => {
            // vocalista-principal을 vocalista로 매핑
            const slug = result.result_type === 'vocalista-principal' ? 'vocalista' : result.result_type
            const src = `/quizzes/idol-roles/${slug}.png`
            const caption = CAPTIONS[slug] ?? ""
            
            // 디버깅용 로그
            console.log(`Rendering ${result.title}: slug=${slug}, src=${src}`)

            return (
              <div 
                key={result.id} 
                className="rounded-2xl overflow-hidden bg-[#5A7FBA]/30 backdrop-blur-sm hover:scale-[1.01] hover:shadow-lg transition-all duration-300"
              >
                <div className="relative">
                  {/* Main poster image */}
                  <img
                    src={src}
                    alt={result.title}
                    className="w-full aspect-[4/5] object-cover"
                  />
                  
                </div>

                {/* Caption */}
                {caption && (
                  <div className="px-4 py-3">
                    <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                      {caption}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom spacing */}
        <div className="h-16"></div>
      </div>
    </div>
  )
}
