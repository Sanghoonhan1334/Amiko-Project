/**
 * AMIKO Meet — Cultural Glossary Engine
 *
 * Loads glossary entries from DB and applies them to text
 * before/after translation to preserve cultural terms.
 *
 * Supports rules: translate, no_translate, preserve, transliterate, annotate
 */

import { supabaseServer } from '@/lib/supabaseServer'
import type { CulturalGlossaryEntry, GlossaryMatch, GlossaryRule } from '@/types/meet'

// ── In-memory cache ─────────────────────────────────
let glossaryCache: CulturalGlossaryEntry[] = []
let cacheTimestamp = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Load (or refresh) glossary entries from DB.
 * Caches for CACHE_TTL_MS to avoid repeated queries.
 */
export async function loadGlossary(forceRefresh = false): Promise<CulturalGlossaryEntry[]> {
  const now = Date.now()
  if (!forceRefresh && glossaryCache.length > 0 && now - cacheTimestamp < CACHE_TTL_MS) {
    return glossaryCache
  }

  if (!supabaseServer) {
    console.warn('[Glossary] Supabase not configured, returning empty glossary')
    return []
  }

  try {
    const { data, error } = await supabaseServer
      .from('amiko_meet_cultural_glossaries')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('source_term', { ascending: false }) // longer terms first (natural sort)

    if (error) {
      console.error('[Glossary] Load failed:', error.message)
      return glossaryCache // return stale cache on error
    }

    glossaryCache = (data || []) as CulturalGlossaryEntry[]
    cacheTimestamp = now
    return glossaryCache
  } catch (err) {
    console.error('[Glossary] Unexpected error:', err)
    return glossaryCache
  }
}

/**
 * Clear the glossary cache (call after CRUD ops).
 */
export function invalidateGlossaryCache(): void {
  glossaryCache = []
  cacheTimestamp = 0
}

/**
 * Find all glossary entries that match segments within the given text.
 */
export function findMatches(
  text: string,
  sourceLanguage: 'ko' | 'es',
  targetLanguage: 'ko' | 'es',
  entries: CulturalGlossaryEntry[]
): GlossaryMatch[] {
  const matches: GlossaryMatch[] = []
  const lowerText = text.toLowerCase()

  // Sort by priority DESC, then by source_term length DESC (longer = more specific)
  const sorted = [...entries]
    .filter(e =>
      e.source_language === sourceLanguage &&
      (e.target_language === null || e.target_language === targetLanguage) &&
      e.is_active
    )
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      return b.source_term.length - a.source_term.length
    })

  for (const entry of sorted) {
    const lowerTerm = entry.source_term.toLowerCase()
    let searchFrom = 0
    let pos: number

    while ((pos = lowerText.indexOf(lowerTerm, searchFrom)) !== -1) {
      const originalSegment = text.substring(pos, pos + entry.source_term.length)
      matches.push({
        entry,
        original_segment: originalSegment,
        replaced_segment: applyRule(entry, originalSegment),
        position: pos,
      })
      searchFrom = pos + entry.source_term.length
    }
  }

  // Deduplicate overlapping matches (keep higher priority / longer)
  return deduplicateMatches(matches)
}

/**
 * Apply a glossary rule to produce the replacement text.
 */
function applyRule(entry: CulturalGlossaryEntry, originalSegment: string): string {
  switch (entry.rule) {
    case 'no_translate':
      // Keep original untouched
      return originalSegment

    case 'preserve':
      // Keep original + add transliteration/translation
      if (entry.target_value) {
        return `${originalSegment} (${entry.target_value})`
      }
      return originalSegment

    case 'transliterate':
      // Replace with phonetic equivalent
      return entry.target_value || originalSegment

    case 'annotate':
      // Keep original + add annotation
      if (entry.target_value) {
        return `${originalSegment} [${entry.target_value}]`
      }
      return originalSegment

    case 'translate':
      // Replace with translation
      return entry.target_value || originalSegment

    default:
      return originalSegment
  }
}

/**
 * Remove overlapping matches, keeping the higher-priority / longer one.
 */
function deduplicateMatches(matches: GlossaryMatch[]): GlossaryMatch[] {
  if (matches.length <= 1) return matches

  // Sort by position
  const sorted = [...matches].sort((a, b) => a.position - b.position)
  const result: GlossaryMatch[] = []
  let lastEnd = -1

  for (const m of sorted) {
    const mEnd = m.position + m.original_segment.length
    if (m.position >= lastEnd) {
      result.push(m)
      lastEnd = mEnd
    }
    // else: overlapping → skip (earlier/higher-priority match already taken)
  }

  return result
}

/**
 * Pre-process text BEFORE translation:
 *  - Replace no_translate terms with placeholders
 *  - Keep track of positions for post-processing
 *
 * Returns { processedText, placeholders }
 */
export interface PreProcessResult {
  processedText: string
  placeholders: Array<{ placeholder: string; original: string; entry: CulturalGlossaryEntry }>
}

export function preProcessText(
  text: string,
  sourceLanguage: 'ko' | 'es',
  targetLanguage: 'ko' | 'es',
  entries: CulturalGlossaryEntry[]
): PreProcessResult {
  const noTranslateEntries = entries.filter(e => e.rule === 'no_translate')
  const matches = findMatches(text, sourceLanguage, targetLanguage, noTranslateEntries)

  if (matches.length === 0) {
    return { processedText: text, placeholders: [] }
  }

  const placeholders: PreProcessResult['placeholders'] = []
  let result = text

  // Replace from end to start to preserve positions
  const reversedMatches = [...matches].sort((a, b) => b.position - a.position)
  for (let i = 0; i < reversedMatches.length; i++) {
    const m = reversedMatches[i]
    const placeholder = `__GLOSSARY_${i}__`
    result = result.substring(0, m.position) + placeholder + result.substring(m.position + m.original_segment.length)
    placeholders.push({ placeholder, original: m.original_segment, entry: m.entry })
  }

  return { processedText: result, placeholders }
}

/**
 * Post-process text AFTER translation:
 *  - Restore placeholders
 *  - Apply preserve/transliterate/annotate rules
 */
export function postProcessText(
  translatedText: string,
  sourceLanguage: 'ko' | 'es',
  targetLanguage: 'ko' | 'es',
  entries: CulturalGlossaryEntry[],
  placeholders: PreProcessResult['placeholders']
): string {
  let result = translatedText

  // 1. Restore no_translate placeholders
  for (const p of placeholders) {
    result = result.replace(p.placeholder, p.original)
  }

  // 2. Apply preserve / annotate / transliterate rules on the result
  const postRules: GlossaryRule[] = ['preserve', 'annotate', 'transliterate']
  const postEntries = entries.filter(e => postRules.includes(e.rule))
  const matches = findMatches(result, sourceLanguage, targetLanguage, postEntries)

  if (matches.length === 0) return result

  // Replace from end to start
  const reversedMatches = [...matches].sort((a, b) => b.position - a.position)
  for (const m of reversedMatches) {
    result =
      result.substring(0, m.position) +
      m.replaced_segment +
      result.substring(m.position + m.original_segment.length)
  }

  return result
}

/**
 * Full glossary pipeline: pre-process → translate callback → post-process
 */
export async function applyGlossaryPipeline(
  text: string,
  sourceLanguage: 'ko' | 'es',
  targetLanguage: 'ko' | 'es',
  translateFn: (text: string) => Promise<string>
): Promise<{ result: string; glossaryApplied: boolean; matchCount: number }> {
  const entries = await loadGlossary()

  if (entries.length === 0) {
    const result = await translateFn(text)
    return { result, glossaryApplied: false, matchCount: 0 }
  }

  // Pre-process: protect no_translate terms
  const { processedText, placeholders } = preProcessText(text, sourceLanguage, targetLanguage, entries)

  // Translate the processed text
  const translated = await translateFn(processedText)

  // Post-process: apply preserve/annotate/transliterate + restore placeholders
  const result = postProcessText(translated, sourceLanguage, targetLanguage, entries, placeholders)

  const allMatches = findMatches(text, sourceLanguage, targetLanguage, entries)
  return {
    result,
    glossaryApplied: allMatches.length > 0 || placeholders.length > 0,
    matchCount: allMatches.length + placeholders.length,
  }
}
