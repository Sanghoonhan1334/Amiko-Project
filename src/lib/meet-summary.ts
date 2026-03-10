/**
 * AMIKO Meet — Session Summary Generator
 *
 * Generates summaries from caption and translation events.
 * Supports both rule-based and AI-assisted generation.
 */

import { supabaseServer } from '@/lib/supabaseServer'
import type { TopicEntry, VocabularyEntry, CulturalNote, SessionSummary } from '@/types/meet'

// ── Types ─────────────────────────────────────────────
interface CaptionEvent {
  id: string
  content: string
  language: string
  speaker_name: string
  is_final: boolean
  created_at: string
}

interface TranslationEvent {
  original_content: string
  original_language: string
  translated_content: string
  translated_language: string
}

// ── Main: Generate summary for a session ──────────────
export async function generateSessionSummary(sessionId: string): Promise<SessionSummary | null> {
  if (!supabaseServer) return null

  try {
    // Mark as generating
    await supabaseServer
      .from('amiko_meet_session_summaries')
      .upsert({
        session_id: sessionId,
        generation_status: 'generating',
        generated_by: 'system',
      } as any, { onConflict: 'session_id' })

    // Fetch all final captions
    const { data: captions } = await supabaseServer
      .from('amiko_meet_caption_events')
      .select('id, content, language, speaker_name, is_final, created_at')
      .eq('session_id', sessionId)
      .eq('is_final', true)
      .order('sequence_number', { ascending: true })

    // Fetch translations
    const { data: translations } = await supabaseServer
      .from('amiko_meet_translation_events')
      .select('original_content, original_language, translated_content, translated_language')
      .eq('session_id', sessionId)
      .eq('is_final', true)

    // Fetch session info
    const { data: session } = await supabaseServer
      .from('amiko_meet_sessions')
      .select('title, topic, scheduled_at, duration_minutes')
      .eq('id', sessionId)
      .single()

    const captionList = (captions || []) as CaptionEvent[]
    const translationList = (translations || []) as TranslationEvent[]

    // Generate summary data
    const topics = extractTopics(captionList)
    const vocabulary = extractVocabulary(captionList, translationList)
    const culturalNotes = extractCulturalNotes(captionList)
    const stats = computeStats(captionList)

    // Build summaries
    const summaryEs = buildSummaryText(captionList, 'es', session as any)
    const summaryKo = buildSummaryText(captionList, 'ko', session as any)

    const summary = {
      session_id: sessionId,
      summary_ko: summaryKo,
      summary_es: summaryEs,
      topics,
      vocabulary,
      cultural_notes: culturalNotes,
      total_caption_events: captionList.length,
      total_translations: translationList.length,
      duration_minutes: (session as any)?.duration_minutes || 0,
      words_spoken_ko: stats.wordsKo,
      words_spoken_es: stats.wordsEs,
      generated_by: 'system' as const,
      generation_status: 'completed' as const,
    }

    // Persist
    const { data, error } = await supabaseServer
      .from('amiko_meet_session_summaries')
      .upsert(summary as any, { onConflict: 'session_id' })
      .select()
      .single()

    if (error) {
      console.error('[Summary] Persist failed:', error.message)
      await (supabaseServer
        .from('amiko_meet_session_summaries') as any)
        .update({ generation_status: 'failed', error_message: error.message })
        .eq('session_id', sessionId)
      return null
    }

    return data as unknown as SessionSummary
  } catch (err: any) {
    console.error('[Summary] Generation failed:', err)
    if (supabaseServer) {
      await (supabaseServer
        .from('amiko_meet_session_summaries') as any)
        .update({ generation_status: 'failed', error_message: err.message })
        .eq('session_id', sessionId)
    }
    return null
  }
}

// ── Extract topics from captions ──────────────────────
function extractTopics(captions: CaptionEvent[]): TopicEntry[] {
  // Simple keyword frequency analysis
  const topicKeywords: Record<string, { ko: string; es: string; count: number }> = {
    food: { ko: '음식', es: 'Comida', count: 0 },
    music: { ko: '음악', es: 'Música', count: 0 },
    travel: { ko: '여행', es: 'Viajes', count: 0 },
    culture: { ko: '문화', es: 'Cultura', count: 0 },
    language: { ko: '언어', es: 'Idioma', count: 0 },
    kpop: { ko: 'K-pop', es: 'K-pop', count: 0 },
    drama: { ko: '드라마', es: 'Dramas', count: 0 },
    fashion: { ko: '패션', es: 'Moda', count: 0 },
    family: { ko: '가족', es: 'Familia', count: 0 },
    work: { ko: '일/직장', es: 'Trabajo', count: 0 },
  }

  const patterns: Record<string, RegExp[]> = {
    food: [/음식|먹|밥|김치|떡볶이|불고기|삼겹살|맛/gi, /comida|comer|arroz|kimchi|pollo|delicioso|cocin/gi],
    music: [/음악|노래|가수|앨범|콘서트/gi, /música|canción|cantante|álbum|concierto/gi],
    travel: [/여행|관광|비행기|공항|호텔/gi, /viaj|turismo|avión|aeropuerto|hotel/gi],
    culture: [/문화|전통|한복|설날|추석/gi, /cultura|tradición|costumbre|festival/gi],
    language: [/언어|한국어|스페인어|단어|문법|발음/gi, /idioma|coreano|español|palabra|gramática|pronunciación/gi],
    kpop: [/케이팝|k-?pop|아이돌|방탄|블랙핑크|컴백/gi, /k-?pop|idol|bts|blackpink|comeback/gi],
    drama: [/드라마|영화|배우|시리즈/gi, /drama|película|actor|serie/gi],
    fashion: [/패션|옷|스타일|브랜드/gi, /moda|ropa|estilo|marca/gi],
    family: [/가족|부모|형제|엄마|아빠/gi, /familia|padres|hermano|mamá|papá/gi],
    work: [/일|직장|회사|업무|직업/gi, /trabajo|empresa|oficina|empleo|profesión/gi],
  }

  const allText = captions.map(c => c.content).join(' ')

  for (const [topic, pats] of Object.entries(patterns)) {
    for (const pat of pats) {
      pat.lastIndex = 0
      const matches = allText.match(pat)
      if (matches) {
        topicKeywords[topic].count += matches.length
      }
    }
  }

  return Object.entries(topicKeywords)
    .filter(([, v]) => v.count > 0)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([key, v]) => ({
      topic: key,
      topic_ko: v.ko,
      topic_es: v.es,
      mentions: v.count,
    }))
}

// ── Extract vocabulary pairs ──────────────────────────
function extractVocabulary(
  captions: CaptionEvent[],
  translations: TranslationEvent[]
): VocabularyEntry[] {
  const vocab: VocabularyEntry[] = []
  const seen = new Set<string>()

  // Use translation pairs as vocabulary
  for (const t of translations.slice(0, 20)) { // limit
    const key = `${t.original_content}:${t.translated_content}`
    if (seen.has(key)) continue
    seen.add(key)

    // Only include short phrases (likely vocabulary)
    if (t.original_content.length <= 30) {
      vocab.push({
        term: t.original_content,
        translation: t.translated_content,
        context: '',
        language: t.original_language as 'ko' | 'es',
      })
    }
  }

  return vocab.slice(0, 15) // max 15 entries
}

// ── Extract cultural notes ────────────────────────────
function extractCulturalNotes(captions: CaptionEvent[]): CulturalNote[] {
  const notes: CulturalNote[] = []
  const allText = captions.map(c => c.content).join(' ')

  const culturalPatterns = [
    { pattern: /김치|떡볶이|불고기|비빔밥|삼겹살/g, ko: '한국 음식에 대해 이야기했습니다', es: 'Se habló sobre comida coreana', cat: 'food' },
    { pattern: /arepa|empanada|hallaca|taco|ceviche/gi, ko: '라틴 아메리카 음식에 대해 이야기했습니다', es: 'Se habló sobre comida latinoamericana', cat: 'food' },
    { pattern: /오빠|언니|누나|형|선배/g, ko: '한국 경칭을 사용했습니다', es: 'Se usaron honoríficos coreanos', cat: 'honorific' },
    { pattern: /한복|설날|추석|세배/g, ko: '한국 전통문화에 대해 이야기했습니다', es: 'Se habló sobre cultura tradicional coreana', cat: 'cultural' },
    { pattern: /화이팅|대박|아이고/g, ko: '한국 감탄사/표현을 사용했습니다', es: 'Se usaron expresiones coreanas populares', cat: 'expression' },
  ]

  const seen = new Set<string>()
  for (const { pattern, ko, es, cat } of culturalPatterns) {
    pattern.lastIndex = 0
    if (pattern.test(allText) && !seen.has(cat)) {
      notes.push({ note_ko: ko, note_es: es, category: cat })
      seen.add(cat)
    }
  }

  return notes
}

// ── Compute word stats ────────────────────────────────
function computeStats(captions: CaptionEvent[]): { wordsKo: number; wordsEs: number } {
  let wordsKo = 0
  let wordsEs = 0

  for (const c of captions) {
    const wordCount = c.content.split(/\s+/).filter(Boolean).length
    if (c.language === 'ko') wordsKo += wordCount
    else if (c.language === 'es') wordsEs += wordCount
    else {
      // mixed/unknown — split evenly
      wordsKo += Math.floor(wordCount / 2)
      wordsEs += Math.ceil(wordCount / 2)
    }
  }

  return { wordsKo, wordsEs }
}

// ── Build human-readable summary text ─────────────────
function buildSummaryText(
  captions: CaptionEvent[],
  language: 'ko' | 'es',
  session: { title?: string; topic?: string; duration_minutes?: number } | null
): string {
  const total = captions.length
  const speakers = new Set(captions.map(c => c.speaker_name)).size
  const duration = session?.duration_minutes || 0

  if (language === 'es') {
    const lines = [
      `## Resumen de la sesión${session?.title ? ': ' + session.title : ''}`,
      '',
      `- **Duración:** ${duration} minutos`,
      `- **Participantes activos:** ${speakers}`,
      `- **Total de intervenciones:** ${total}`,
    ]
    if (session?.topic) lines.push(`- **Tema:** ${session.topic}`)
    return lines.join('\n')
  } else {
    const lines = [
      `## 세션 요약${session?.title ? ': ' + session.title : ''}`,
      '',
      `- **시간:** ${duration}분`,
      `- **참여 인원:** ${speakers}명`,
      `- **총 발언 수:** ${total}`,
    ]
    if (session?.topic) lines.push(`- **주제:** ${session.topic}`)
    return lines.join('\n')
  }
}
