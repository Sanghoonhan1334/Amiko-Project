/**
 * Content Moderation — Auto-flag detection for videocall captions
 *
 * Scans caption text for potentially problematic content and returns
 * flag entries to be stored in vc_moderation_flags.
 *
 * Severity levels:
 *   - informative: borderline, may need context review
 *   - warning: likely inappropriate
 *   - high_risk: clearly offensive / threatening
 */

export interface ContentFlag {
  flagged_content: string;
  detection_rule: string;
  detection_type: "keyword" | "pattern";
  severity: "informative" | "warning" | "high_risk";
  confidence: number;
  source_language: string;
}

// ── Sensitive term dictionaries ──────────────────────────────
// Each entry: [term/pattern, rule_name, severity, confidence]

const KOREAN_KEYWORDS: Array<[string, string, ContentFlag["severity"], number]> = [
  // High risk — slurs and threats
  ["죽여", "ko_threat_kill", "high_risk", 0.9],
  ["죽일", "ko_threat_kill_future", "high_risk", 0.9],
  ["자살", "ko_suicide_mention", "high_risk", 0.95],
  ["씨발", "ko_profanity_f", "warning", 0.95],
  ["시발", "ko_profanity_f_alt", "warning", 0.95],
  ["개새끼", "ko_profanity_insult", "high_risk", 0.95],
  ["병신", "ko_ableist_slur", "high_risk", 0.9],
  ["지랄", "ko_profanity_crazy", "warning", 0.85],
  ["느금마", "ko_maternal_insult", "high_risk", 0.95],
  // Warning level
  ["꺼져", "ko_hostile_goaway", "warning", 0.7],
  ["닥쳐", "ko_hostile_shutup", "warning", 0.75],
  ["바보", "ko_mild_insult_stupid", "informative", 0.5],
  ["멍청", "ko_mild_insult_dumb", "informative", 0.6],
];

const SPANISH_KEYWORDS: Array<[string, string, ContentFlag["severity"], number]> = [
  // High risk
  ["te voy a matar", "es_threat_kill", "high_risk", 0.95],
  ["voy a matarte", "es_threat_kill_alt", "high_risk", 0.95],
  ["suicid", "es_suicide_mention", "high_risk", 0.9],
  ["hijo de puta", "es_profanity_hdp", "high_risk", 0.9],
  ["hijueputa", "es_profanity_hjp", "high_risk", 0.9],
  // Warning level
  ["mierda", "es_profanity_shit", "warning", 0.7],
  ["puta", "es_profanity_f", "warning", 0.8],
  ["marica", "es_homophobic_slur", "high_risk", 0.85],
  ["maricón", "es_homophobic_slur_m", "high_risk", 0.9],
  ["pendejo", "es_insult_pendejo", "warning", 0.7],
  ["imbécil", "es_insult_imbecil", "warning", 0.7],
  ["idiota", "es_insult_idiota", "informative", 0.6],
  ["cállate", "es_hostile_shutup", "informative", 0.5],
  ["estúpido", "es_insult_stupid", "informative", 0.6],
  ["estúpida", "es_insult_stupid_f", "informative", 0.6],
];

const ENGLISH_KEYWORDS: Array<[string, string, ContentFlag["severity"], number]> = [
  ["kill you", "en_threat_kill", "high_risk", 0.9],
  ["fuck you", "en_profanity_fy", "warning", 0.85],
  ["kill myself", "en_suicide_mention", "high_risk", 0.95],
  ["nigger", "en_racial_slur", "high_risk", 0.99],
  ["faggot", "en_homophobic_slur", "high_risk", 0.95],
];

const KEYWORD_MAP: Record<string, Array<[string, string, ContentFlag["severity"], number]>> = {
  ko: KOREAN_KEYWORDS,
  es: SPANISH_KEYWORDS,
  en: ENGLISH_KEYWORDS,
};

/**
 * Scan caption text for sensitive content.
 * Returns an array of flags (may be empty).
 */
export function scanContent(
  text: string,
  language: string
): ContentFlag[] {
  if (!text || text.trim().length === 0) return [];

  const flags: ContentFlag[] = [];
  const lowerText = text.toLowerCase();

  // Check language-specific keywords
  const keywords = KEYWORD_MAP[language];
  if (keywords) {
    for (const [term, rule, severity, confidence] of keywords) {
      if (lowerText.includes(term.toLowerCase())) {
        flags.push({
          flagged_content: text,
          detection_rule: rule,
          detection_type: "keyword",
          severity,
          confidence,
          source_language: language,
        });
      }
    }
  }

  // Also check ALL language lists for cross-language detection
  // (user might speak in a different language than declared)
  for (const [lang, keywords] of Object.entries(KEYWORD_MAP)) {
    if (lang === language) continue; // already checked
    for (const [term, rule, severity, confidence] of keywords) {
      if (lowerText.includes(term.toLowerCase())) {
        flags.push({
          flagged_content: text,
          detection_rule: `crosslang_${rule}`,
          detection_type: "keyword",
          severity,
          confidence: confidence * 0.8, // lower confidence for cross-language
          source_language: lang,
        });
      }
    }
  }

  // Deduplicate by rule (keep highest confidence)
  const ruleMap = new Map<string, ContentFlag>();
  for (const flag of flags) {
    const existing = ruleMap.get(flag.detection_rule);
    if (!existing || existing.confidence < flag.confidence) {
      ruleMap.set(flag.detection_rule, flag);
    }
  }

  return Array.from(ruleMap.values());
}

/**
 * Get the highest severity from a list of flags.
 */
export function getHighestSeverity(
  flags: ContentFlag[]
): ContentFlag["severity"] | null {
  if (flags.length === 0) return null;
  const order: Record<ContentFlag["severity"], number> = {
    informative: 0,
    warning: 1,
    high_risk: 2,
  };
  return flags.reduce((max, f) =>
    order[f.severity] > order[max.severity] ? f : max
  ).severity;
}
