/**
 * AMIKO Meet — Content Moderation Engine
 *
 * Detects potentially problematic content in captions/translations
 * using keyword matching and pattern detection.
 *
 * Returns flags with severity levels: informative, warning, high_risk
 *
 * IMPORTANT: This system does NOT automatically terminate sessions.
 * It only creates flags for admin review.
 */

import { supabaseServer } from '@/lib/supabaseServer'
import type { Severity, FlagDetectionType, ModerationFlag } from '@/types/meet'

// ── Types ─────────────────────────────────────────────
export interface ContentToCheck {
  session_id: string
  user_id?: string
  user_name?: string
  content: string
  language: 'ko' | 'es' | 'mixed' | 'unknown'
  caption_event_id?: string
  translation_event_id?: string
}

export interface FlagResult {
  flagged: boolean
  flags: Array<{
    rule: string
    severity: Severity
    detection_type: FlagDetectionType
    confidence: number
    matched_text: string
  }>
}

// ── Keyword/Pattern Rules ─────────────────────────────
// These rules detect potentially problematic content.
// Severity levels:
//   informative  → logged but no action needed
//   warning      → admin should review
//   high_risk    → urgent review needed

interface ModerationRule {
  id: string
  patterns: RegExp[]
  severity: Severity
  detection_type: FlagDetectionType
  language: 'ko' | 'es' | 'all'
  description: string
}

const MODERATION_RULES: ModerationRule[] = [
  // ── Korean: High Risk ──
  {
    id: 'ko_slur_01',
    patterns: [/시발/gi, /씨발/gi, /씨빨/gi, /ㅅㅂ/g, /ㅆㅂ/g],
    severity: 'high_risk',
    detection_type: 'keyword',
    language: 'ko',
    description: 'Korean profane slur',
  },
  {
    id: 'ko_slur_02',
    patterns: [/개새끼/gi, /개세끼/gi, /ㄱㅅㄲ/g],
    severity: 'high_risk',
    detection_type: 'keyword',
    language: 'ko',
    description: 'Korean insult (dog)',
  },
  {
    id: 'ko_slur_03',
    patterns: [/병신/gi, /ㅂㅅ/g],
    severity: 'high_risk',
    detection_type: 'keyword',
    language: 'ko',
    description: 'Korean ableist slur',
  },
  {
    id: 'ko_threat_01',
    patterns: [/죽여버릴/gi, /죽일거야/gi, /죽여줄까/gi],
    severity: 'high_risk',
    detection_type: 'pattern',
    language: 'ko',
    description: 'Korean threat of violence',
  },

  // ── Korean: Warning ──
  {
    id: 'ko_insult_01',
    patterns: [/바보/gi, /멍청이/gi, /돼지/gi],
    severity: 'warning',
    detection_type: 'keyword',
    language: 'ko',
    description: 'Korean mild insult',
  },
  {
    id: 'ko_discrimination_01',
    patterns: [/외국인\s*나가/gi, /동남아\s*사람/gi],
    severity: 'warning',
    detection_type: 'pattern',
    language: 'ko',
    description: 'Korean potentially discriminatory language',
  },

  // ── Spanish: High Risk ──
  {
    id: 'es_slur_01',
    patterns: [/hijo\s*de\s*puta/gi, /hdp/gi, /hp/gi],
    severity: 'high_risk',
    detection_type: 'keyword',
    language: 'es',
    description: 'Spanish profane insult',
  },
  {
    id: 'es_slur_02',
    patterns: [/put[oa](?:\s|\b|$)/gi, /maldito\s*(?:negro|indio)/gi],
    severity: 'high_risk',
    detection_type: 'keyword',
    language: 'es',
    description: 'Spanish offensive slur',
  },
  {
    id: 'es_threat_01',
    patterns: [/te\s*voy\s*a\s*matar/gi, /voy\s*a\s*matarte/gi],
    severity: 'high_risk',
    detection_type: 'pattern',
    language: 'es',
    description: 'Spanish threat of violence',
  },

  // ── Spanish: Warning ──
  {
    id: 'es_insult_01',
    patterns: [/idiota/gi, /est[uú]pid[oa]/gi, /imb[eé]cil/gi, /tont[oa]/gi],
    severity: 'warning',
    detection_type: 'keyword',
    language: 'es',
    description: 'Spanish mild insult',
  },

  // ── Universal: Spam patterns ──
  {
    id: 'spam_url',
    patterns: [/(https?:\/\/[^\s]+){3,}/gi],
    severity: 'warning',
    detection_type: 'pattern',
    language: 'all',
    description: 'Multiple URLs (potential spam)',
  },
  {
    id: 'spam_repeat',
    patterns: [/(.{3,})\1{4,}/gi],
    severity: 'informative',
    detection_type: 'pattern',
    language: 'all',
    description: 'Repeated text pattern (potential spam)',
  },
]

// ── Main: check content for flags ─────────────────────
export function checkContent(content: ContentToCheck): FlagResult {
  const flags: FlagResult['flags'] = []

  for (const rule of MODERATION_RULES) {
    // Skip rules for other languages
    if (rule.language !== 'all' && rule.language !== content.language) {
      // If language is 'mixed' or 'unknown', check all rules
      if (content.language !== 'mixed' && content.language !== 'unknown') {
        continue
      }
    }

    for (const pattern of rule.patterns) {
      // Reset regex lastIndex for global patterns
      pattern.lastIndex = 0
      const match = pattern.exec(content.content)
      if (match) {
        flags.push({
          rule: rule.id,
          severity: rule.severity,
          detection_type: rule.detection_type,
          confidence: 1.0,
          matched_text: match[0],
        })
        break // one match per rule is enough
      }
    }
  }

  return {
    flagged: flags.length > 0,
    flags,
  }
}

// ── Persist flags to DB ───────────────────────────────
export async function persistFlags(
  content: ContentToCheck,
  flagResult: FlagResult
): Promise<void> {
  if (!supabaseServer || !flagResult.flagged) return

  try {
    const inserts = flagResult.flags.map(f => ({
      session_id: content.session_id,
      flagged_user_id: content.user_id || null,
      flagged_user_name: content.user_name || null,
      flagged_content: content.content,
      content_language: content.language,
      caption_event_id: content.caption_event_id || null,
      translation_event_id: content.translation_event_id || null,
      detection_rule: f.rule,
      detection_type: f.detection_type,
      severity: f.severity,
      confidence: f.confidence,
    }))

    const { error } = await supabaseServer
      .from('amiko_meet_moderation_flags')
      .insert(inserts as any)

    if (error) {
      console.error('[Moderation] Failed to persist flags:', error.message)
    }
  } catch (err) {
    console.error('[Moderation] Unexpected error persisting flags:', err)
  }
}

// ── Combined: check + persist ─────────────────────────
export async function moderateContent(
  content: ContentToCheck
): Promise<FlagResult> {
  const result = checkContent(content)
  if (result.flagged) {
    await persistFlags(content, result)
  }
  return result
}

// ── Get highest severity from multiple flags ──────────
export function getHighestSeverity(
  flags: Array<{ severity: Severity }>
): Severity {
  if (flags.some(f => f.severity === 'high_risk')) return 'high_risk'
  if (flags.some(f => f.severity === 'warning')) return 'warning'
  return 'informative'
}
