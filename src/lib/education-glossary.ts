/**
 * Education — Cultural Glossary Engine
 *
 * Loads entries from `cultural_glossaries` (context IN ('education','general'))
 * and `translation_rules`, then applies them around the DeepSeek AI call to:
 *   1. Protect no_translate terms via placeholder swap (pre-process)
 *   2. Force-override translations via `translate` action (post-process)
 *   3. Annotate / transliterate / preserve terms (post-process)
 *   4. Apply regex `translation_rules` at configured phases
 *
 * Cache TTL: 5 minutes (invalidated on admin CRUD).
 */

import { supabaseServer } from '@/lib/supabaseServer'

// ── Types ───────────────────────────────────────────────────────────────────

export type GlossaryAction = 'translate' | 'preserve' | 'no_translate' | 'annotate' | 'transliterate'

export interface CulturalGlossaryEntry {
  id: string
  term: string
  source_language: string
  target_language: string | null
  action: GlossaryAction
  preferred_translation: string | null
  category: string
  context: string | null
  priority: number
  is_active: boolean
}

export interface TranslationRule {
  id: string
  name: string
  pattern: string
  replacement: string
  phase: 'pre' | 'post'
  source_language: string | null
  target_language: string | null
  context: string | null
  flags: string
  priority: number
  is_active: boolean
}

export interface GlossaryMatch {
  entry: CulturalGlossaryEntry
  original_segment: string
  replaced_segment: string
  position: number
}

export interface PreProcessResult {
  processedText: string
  placeholders: Array<{
    placeholder: string
    original: string
    entry: CulturalGlossaryEntry
  }>
}

// ── In-memory cache ──────────────────────────────────────────────────────────

let glossaryCache: CulturalGlossaryEntry[] = []
let rulesCache: TranslationRule[] = []
let cacheTimestamp = 0
const CACHE_TTL_MS = 5 * 60 * 1000

export function invalidateEducationGlossaryCache(): void {
  glossaryCache = []
  rulesCache = []
  cacheTimestamp = 0
}

async function loadCache(forceRefresh = false): Promise<void> {
  const now = Date.now()
  if (!forceRefresh && glossaryCache.length > 0 && now - cacheTimestamp < CACHE_TTL_MS) {
    return
  }

  if (!supabaseServer) {
    console.warn('[EduGlossary] Supabase not configured — skipping glossary load')
    return
  }

  try {
    const [glRes, ruRes] = await Promise.all([
      supabaseServer
        .from('cultural_glossaries')
        .select('*')
        .eq('is_active', true)
        .in('context', ['education', 'general'])
        .order('priority', { ascending: false }),
      supabaseServer
        .from('translation_rules')
        .select('*')
        .eq('is_active', true)
        .in('context', ['education', 'general'])
        .order('priority', { ascending: false }),
    ])

    if (!glRes.error) glossaryCache = (glRes.data || []) as CulturalGlossaryEntry[]
    else console.error('[EduGlossary] Glossary load error:', glRes.error.message)

    if (!ruRes.error) rulesCache = (ruRes.data || []) as TranslationRule[]
    else console.error('[EduGlossary] Rules load error:', ruRes.error.message)

    cacheTimestamp = Date.now()
  } catch (err) {
    console.error('[EduGlossary] Cache load failed:', err)
  }
}

// ── Term matching ────────────────────────────────────────────────────────────

export function findMatches(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  entries: CulturalGlossaryEntry[]
): GlossaryMatch[] {
  const matches: GlossaryMatch[] = []
  const lowerText = text.toLowerCase()

  const relevant = [...entries]
    .filter(e =>
      e.source_language === sourceLanguage &&
      (e.target_language === null || e.target_language === targetLanguage) &&
      e.is_active
    )
    // Longer terms first within same priority (avoids partial matches)
    .sort((a, b) =>
      b.priority !== a.priority
        ? b.priority - a.priority
        : b.term.length - a.term.length
    )

  for (const entry of relevant) {
    const lowerTerm = entry.term.toLowerCase()
    let searchFrom = 0
    let pos: number

    while ((pos = lowerText.indexOf(lowerTerm, searchFrom)) !== -1) {
      const originalSegment = text.substring(pos, pos + entry.term.length)
      matches.push({
        entry,
        original_segment: originalSegment,
        replaced_segment: applyAction(entry, originalSegment),
        position: pos,
      })
      searchFrom = pos + entry.term.length
    }
  }

  return deduplicateMatches(matches)
}

function applyAction(entry: CulturalGlossaryEntry, segment: string): string {
  switch (entry.action) {
    case 'no_translate':
      return segment

    case 'preserve':
      return entry.preferred_translation
        ? `${segment} (${entry.preferred_translation})`
        : segment

    case 'transliterate':
      return entry.preferred_translation ?? segment

    case 'annotate':
      return entry.preferred_translation
        ? `${segment} [${entry.preferred_translation}]`
        : segment

    case 'translate':
      return entry.preferred_translation ?? segment

    default:
      return segment
  }
}

function deduplicateMatches(matches: GlossaryMatch[]): GlossaryMatch[] {
  if (matches.length <= 1) return matches
  const sorted = [...matches].sort((a, b) => a.position - b.position)
  const result: GlossaryMatch[] = []
  let lastEnd = -1
  for (const m of sorted) {
    if (m.position >= lastEnd) {
      result.push(m)
      lastEnd = m.position + m.original_segment.length
    }
  }
  return result
}

// ── Pre-process ──────────────────────────────────────────────────────────────
// Protect `no_translate` terms with unique placeholders before the AI call.

export function preProcessText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  entries: CulturalGlossaryEntry[]
): PreProcessResult {
  const noTransEntries = entries.filter(e => e.action === 'no_translate')
  const matches = findMatches(text, sourceLanguage, targetLanguage, noTransEntries)

  if (matches.length === 0) return { processedText: text, placeholders: [] }

  const placeholders: PreProcessResult['placeholders'] = []
  let result = text

  // Replace from end → start to preserve positions
  const reversed = [...matches].sort((a, b) => b.position - a.position)
  reversed.forEach((m, i) => {
    const ph = `__GLOSSARY_${i}__`
    result = result.substring(0, m.position) + ph + result.substring(m.position + m.original_segment.length)
    placeholders.push({ placeholder: ph, original: m.original_segment, entry: m.entry })
  })

  return { processedText: result, placeholders }
}

// ── Post-process ─────────────────────────────────────────────────────────────
// After translation: restore placeholders + apply preserve/annotate/transliterate/translate.

export function postProcessText(
  translatedText: string,
  sourceLanguage: string,
  targetLanguage: string,
  entries: CulturalGlossaryEntry[],
  placeholders: PreProcessResult['placeholders']
): string {
  let result = translatedText

  // 1. Restore placeholders (reverse order for safety)
  for (const p of [...placeholders].reverse()) {
    result = result.replace(p.placeholder, p.original)
  }

  // 2. Apply post-translation rules (preserve, annotate, transliterate, translate)
  const postActions: GlossaryAction[] = ['preserve', 'annotate', 'transliterate', 'translate']
  const postEntries = entries.filter(e => postActions.includes(e.action))

  // For `translate` action we operate on the TRANSLATED text using source_language
  // context — but the language in the translated text is target_language.
  // We need to match against target_language text for 'translate' entries where
  // source_language matches target. In practice, most post-rules use
  // preserve/annotate on the TRANSLATED output scanning for the ORIGINAL TERM
  // that may have survived (e.g. model copied "oppa" as-is). We scan the
  // translated text for the source term.
  const matches = findMatches(result, sourceLanguage, targetLanguage, postEntries)

  if (matches.length === 0) return result

  const reversed = [...matches].sort((a, b) => b.position - a.position)
  for (const m of reversed) {
    result = result.substring(0, m.position) + m.replaced_segment + result.substring(m.position + m.original_segment.length)
  }

  return result
}

// ── Regex translation_rules ──────────────────────────────────────────────────

export function applyTranslationRules(
  text: string,
  phase: 'pre' | 'post',
  sourceLanguage: string,
  targetLanguage: string,
  rules: TranslationRule[]
): string {
  let result = text
  const applicable = rules
    .filter(r =>
      r.phase === phase &&
      r.is_active &&
      (r.source_language === null || r.source_language === sourceLanguage) &&
      (r.target_language === null || r.target_language === targetLanguage)
    )
    .sort((a, b) => b.priority - a.priority)

  for (const rule of applicable) {
    try {
      const regex = new RegExp(rule.pattern, rule.flags || 'gi')
      result = result.replace(regex, rule.replacement)
    } catch (err) {
      console.warn(`[EduGlossary] Invalid regex in rule "${rule.name}":`, err)
    }
  }

  return result
}

// ── Full pipeline ────────────────────────────────────────────────────────────

export interface GlossaryPipelineResult {
  result: string
  glossaryApplied: boolean
  matchCount: number
}

/**
 * Full glossary pipeline:
 *   1. Load cache
 *   2. Apply pre-translation regex rules
 *   3. Pre-process: protect no_translate terms
 *   4. Translate via callback
 *   5. Post-process: restore + apply preserve/annotate/transliterate/translate
 *   6. Apply post-translation regex rules
 *
 * @param text            Raw caption text
 * @param sourceLanguage  Language of the input text ('ko', 'es', 'en')
 * @param targetLanguage  Desired output language ('ko', 'es', 'en')
 * @param translateFn     Async callback that calls DeepSeek (or mock)
 */
export async function applyEducationGlossaryPipeline(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  translateFn: (text: string) => Promise<string>
): Promise<GlossaryPipelineResult> {
  await loadCache()

  const entries = glossaryCache
  const rules = rulesCache

  if (entries.length === 0 && rules.length === 0) {
    const result = await translateFn(text)
    return { result, glossaryApplied: false, matchCount: 0 }
  }

  // 1. Pre-translation regex rules
  let working = applyTranslationRules(text, 'pre', sourceLanguage, targetLanguage, rules)

  // 2. Protect no_translate terms
  const { processedText, placeholders } = preProcessText(working, sourceLanguage, targetLanguage, entries)

  // 3. Translate
  const translated = await translateFn(processedText)

  // 4. Post-process glossary (restore + annotate/transliterate/translate)
  let result = postProcessText(translated, sourceLanguage, targetLanguage, entries, placeholders)

  // 5. Post-translation regex rules
  result = applyTranslationRules(result, 'post', sourceLanguage, targetLanguage, rules)

  const allMatches = findMatches(text, sourceLanguage, targetLanguage, entries)
  const matchCount = allMatches.length + placeholders.length

  return { result, glossaryApplied: matchCount > 0, matchCount }
}
