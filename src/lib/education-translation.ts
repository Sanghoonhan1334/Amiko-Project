/**
 * Education Phase 3 — Caption Translation Engine
 *
 * Translates a final education caption event using DeepSeek (or fallback).
 * Key rules:
 *  - Only final captions are translated (is_partial = false).
 *  - On any DeepSeek error the original text is returned as-is.
 *  - Uses the spec-prescribed restrictive system prompt.
 *  - Result is persisted idempotently in education_translation_events.
 *  - Designed to be called fire-and-forget from the captions/events endpoint.
 */

import { createClient } from '@supabase/supabase-js'
import { initializeTranslationService } from '@/lib/translation'
import { applyEducationGlossaryPipeline } from '@/lib/education-glossary'

// ── Supabase service-role client (server-side only) ───────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Init guard ────────────────────────────────────────────────────────────────
let initialized = false
function ensureInit() {
  if (!initialized) {
    initializeTranslationService()
    initialized = true
  }
}

// ── Language helpers ──────────────────────────────────────────────────────────

/** ISO 639-1 codes → BCP-47 full names used in the prompt */
const LANG_NAME: Record<string, string> = {
  ko: 'Korean',
  es: 'Spanish',
  en: 'English',
  ja: 'Japanese',
  zh: 'Chinese',
  pt: 'Portuguese',
  fr: 'French',
  de: 'German',
}

function langName(code: string): string {
  return LANG_NAME[code] ?? code.toUpperCase()
}

/** Default opposite-language mapping for auto-selection */
function defaultTargetLanguage(source: string): 'ko' | 'es' {
  return source === 'ko' ? 'es' : 'ko'
}

// ── Spec-prescribed restricted translation prompt ─────────────────────────────
function buildSystemPrompt(sourceLang: string, targetLang: string): string {
  return `You are a real-time subtitle translator specializing in Korean–Latin American cultural content.
Translate the input text from ${langName(sourceLang)} to ${langName(targetLang)}.
Rules:
- Return ONLY the translated text. Nothing else.
- Do NOT translate: proper names, food names (kimchi, tteokbokki, bulgogi, bibimbap…), \
honorifics (oppa, noona, unnie, hyung, sunbae, 선생님, 교수님), Korean pop-culture terms (K-pop, K-drama, Hallyu), \
and any term wrapped in __GLOSSARY_n__ placeholders — restore those exactly.
- Do NOT translate Latin American terms: arepa, tamale, empanada.
- Preserve punctuation.
- Do not add explanations, parentheses, or notes unless asked.
Text:`
}

// ── DeepSeek direct call (bypasses TranslationService for prompt control) ─────
async function callDeepSeek(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured')

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: buildSystemPrompt(sourceLang, targetLang) },
        { role: 'user', content: text },
      ],
      max_tokens: 512,
      temperature: 0.1,    // low temperature = deterministic, best for translation
      stream: false,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`DeepSeek API ${response.status}: ${body}`)
  }

  const data = await response.json()
  const content: string = data.choices?.[0]?.message?.content?.trim() ?? ''
  if (!content) throw new Error('Empty response from DeepSeek')
  return content
}

// ── Fallback: mock translation for development ────────────────────────────────
function mockTranslation(text: string, targetLang: string): string {
  return `[${targetLang.toUpperCase()}] ${text}`
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EducationCaptionForTranslation {
  /** UUID from education_caption_events */
  id: string
  session_id: string
  course_id: string
  source_language: string
  text: string
  /** Must be false — we only translate finals */
  is_partial: boolean
  sequence_number: number
}

export interface EducationTranslationResult {
  success: boolean
  caption_event_id: string
  original_text: string
  translated_text: string
  source_language: string
  target_language: string
  provider: string
  translation_ms: number
  /** Number of glossary matches that were applied */
  glossary_match_count?: number
  error?: string
}

// ── Main: translate a single final caption ────────────────────────────────────
/**
 * Translates a final caption event.
 *
 * @param caption       The final caption to translate.
 * @param targetLanguage Override the target language (from user prefs); if omitted,
 *                       defaults to the opposite of source_language.
 */
export async function translateEducationCaption(
  caption: EducationCaptionForTranslation,
  targetLanguage?: string
): Promise<EducationTranslationResult> {
  // Safety: never translate partials
  if (caption.is_partial) {
    return {
      success: false,
      caption_event_id: caption.id,
      original_text: caption.text,
      translated_text: caption.text,
      source_language: caption.source_language,
      target_language: targetLanguage ?? defaultTargetLanguage(caption.source_language),
      provider: 'none',
      translation_ms: 0,
      error: 'Partials are not translated (by design)',
    }
  }

  ensureInit()

  const srcLang = caption.source_language || 'ko'
  const tgtLang = targetLanguage ?? defaultTargetLanguage(srcLang)

  // Skip if source === target (e.g. user set target=ko and caption is already ko)
  if (srcLang === tgtLang) {
    return {
      success: true,
      caption_event_id: caption.id,
      original_text: caption.text,
      translated_text: caption.text,
      source_language: srcLang,
      target_language: tgtLang,
      provider: 'noop',
      translation_ms: 0,
    }
  }

  const start = Date.now()
  let translatedText = caption.text   // fallback = original
  let success = true
  let errorMsg: string | undefined
  let provider = 'deepseek'
  let glossaryMatchCount = 0

  try {
    if (process.env.DEEPSEEK_API_KEY) {
      // ── Glossary pipeline wraps the raw DeepSeek call ──
      const { result, matchCount } = await applyEducationGlossaryPipeline(
        caption.text,
        srcLang,
        tgtLang,
        (text) => callDeepSeek(text, srcLang, tgtLang)
      )
      translatedText = result
      glossaryMatchCount = matchCount
    } else {
      // Dev mode: mock still respects glossary pre/post
      const { result, matchCount } = await applyEducationGlossaryPipeline(
        caption.text,
        srcLang,
        tgtLang,
        (text) => Promise.resolve(mockTranslation(text, tgtLang))
      )
      translatedText = result
      glossaryMatchCount = matchCount
      provider = 'mock'
    }
  } catch (err: unknown) {
    errorMsg = err instanceof Error ? err.message : String(err)
    success = false
    // translatedText stays as original (graceful degradation)
    console.error('[EducationTranslation] Translation failed, using original:', errorMsg)
  }

  const translationMs = Date.now() - start

  // ── Persist to DB (idempotent via UNIQUE on caption_event_id) ────────────
  try {
    await supabase
      .from('education_translation_events')
      .upsert(
        {
          caption_event_id: caption.id,
          session_id: caption.session_id,
          course_id: caption.course_id,
          source_language: srcLang,
          target_language: tgtLang,
          original_text: caption.text,
          translated_text: translatedText,
          is_partial: false,
          provider,
          translation_ms: translationMs,
          error_message: errorMsg ?? null,
        },
        { onConflict: 'caption_event_id' }
      )
  } catch (dbErr: unknown) {
    const msg = dbErr instanceof Error ? dbErr.message : String(dbErr)
    console.error('[EducationTranslation] DB persist failed:', msg)
    // Non-fatal: the translation itself happened, subscribers will still get it
  }

  return {
    success,
    caption_event_id: caption.id,
    original_text: caption.text,
    translated_text: translatedText,
    source_language: srcLang,
    target_language: tgtLang,
    provider,
    translation_ms: translationMs,
    glossary_match_count: glossaryMatchCount,
    error: errorMsg,
  }
}

// ── Convenience: batch translate (sequential, rate-limit safe) ────────────────
export async function translateEducationBatch(
  captions: EducationCaptionForTranslation[],
  targetLanguage?: string
): Promise<EducationTranslationResult[]> {
  const results: EducationTranslationResult[] = []
  for (const caption of captions) {
    results.push(await translateEducationCaption(caption, targetLanguage))
  }
  return results
}
