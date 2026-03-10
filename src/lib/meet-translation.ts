/**
 * AMIKO Meet — Caption Translation Engine
 *
 * Wraps the generic TranslationService to:
 *  1. Accept a caption event
 *  2. Determine target language (opposite of source)
 *  3. Translate via configured provider
 *  4. Persist the result in amiko_meet_translation_events
 *  5. Return the translation (or original on failure)
 *
 * Designed to be called fire-and-forget from the caption event endpoint.
 */

import { TranslationService, initializeTranslationService } from '@/lib/translation'
import { supabaseServer } from '@/lib/supabaseServer'
import { applyGlossaryPipeline } from '@/lib/meet-glossary'
import { moderateContent } from '@/lib/meet-moderation'

// ── Types ─────────────────────────────────────────────
export interface CaptionForTranslation {
  id: string               // caption_event_id (UUID)
  session_id: string
  speaker_user_id: string
  speaker_name: string
  content: string
  language: 'ko' | 'es' | 'mixed' | 'unknown'
  is_final: boolean
  sequence_number: number
}

export interface TranslationResult {
  success: boolean
  caption_event_id: string
  original_content: string
  original_language: string
  translated_content: string
  translated_language: string
  provider: string
  translation_ms: number
  glossary_applied: boolean
  glossary_match_count: number
  moderation_flagged: boolean
  error?: string
}

// ── Singleton init guard ──────────────────────────────
let initialized = false
function ensureInit() {
  if (!initialized) {
    initializeTranslationService()
    initialized = true
  }
}

// ── Determine target language ─────────────────────────
function getTargetLanguage(sourceLang: string): 'ko' | 'es' {
  // ko → es, es → ko, anything else → es (default)
  return sourceLang === 'ko' ? 'es' : 'ko'
}

// ── Main: translate a single caption event ────────────
export async function translateCaptionEvent(
  caption: CaptionForTranslation
): Promise<TranslationResult> {
  ensureInit()

  const service = TranslationService.getInstance()
  const sourceLang = caption.language === 'ko' || caption.language === 'es'
    ? caption.language
    : undefined
  const targetLang = getTargetLanguage(caption.language)

  const start = Date.now()
  let translatedContent = caption.content  // fallback = original
  let error: string | undefined
  let success = true
  let glossaryApplied = false
  let glossaryMatchCount = 0
  let moderationFlagged = false

  try {
    // ── Phase 4: Apply glossary pipeline ──
    if (sourceLang) {
      const glossaryResult = await applyGlossaryPipeline(
        caption.content,
        sourceLang,
        targetLang,
        async (text) => service.translate(text, targetLang, sourceLang)
      )
      translatedContent = glossaryResult.result
      glossaryApplied = glossaryResult.glossaryApplied
      glossaryMatchCount = glossaryResult.matchCount
    } else {
      // Unknown/mixed language — translate directly
      translatedContent = await service.translate(
        caption.content,
        targetLang,
        sourceLang,
      )
    }
  } catch (err: any) {
    error = err.message || 'Translation failed'
    success = false
    console.error('[MeetTranslation] Failed:', error)
    // Keep translatedContent = original as fallback
  }

  // ── Phase 4: Auto-moderation check (fire-and-forget) ──
  try {
    const flagResult = await moderateContent({
      session_id: caption.session_id,
      user_id: caption.speaker_user_id,
      user_name: caption.speaker_name,
      content: caption.content,
      language: caption.language,
      caption_event_id: caption.id,
    })
    moderationFlagged = flagResult.flagged
  } catch (modErr) {
    // Moderation errors never block translation
    console.error('[MeetTranslation] Moderation check failed:', modErr)
  }

  const translationMs = Date.now() - start

  // ── Persist to DB ─────────────────────────────────
  if (supabaseServer) {
    try {
      await (supabaseServer as any)
        .from('amiko_meet_translation_events')
        .upsert(
          {
            session_id: caption.session_id,
            caption_event_id: caption.id,
            original_content: caption.content,
            original_language: caption.language,
            translated_content: translatedContent,
            translated_language: targetLang,
            speaker_user_id: caption.speaker_user_id,
            speaker_name: caption.speaker_name,
            provider: service.getProvider(),
            translation_ms: translationMs,
            is_final: caption.is_final,
            error_message: error || null,
          },
          { onConflict: 'caption_event_id' } // idempotent
        )
    } catch (dbErr: any) {
      console.error('[MeetTranslation] DB persist failed:', dbErr.message)
      // Don't fail the overall result — the translation itself succeeded
    }
  }

  return {
    success,
    caption_event_id: caption.id,
    original_content: caption.content,
    original_language: caption.language,
    translated_content: translatedContent,
    translated_language: targetLang,
    provider: service.getProvider(),
    translation_ms: translationMs,
    glossary_applied: glossaryApplied,
    glossary_match_count: glossaryMatchCount,
    moderation_flagged: moderationFlagged,
    error,
  }
}

// ── Batch translate (for catch-up / history) ──────────
export async function translateCaptionBatch(
  captions: CaptionForTranslation[]
): Promise<TranslationResult[]> {
  // Process sequentially to respect API rate-limits
  const results: TranslationResult[] = []
  for (const caption of captions) {
    results.push(await translateCaptionEvent(caption))
  }
  return results
}
