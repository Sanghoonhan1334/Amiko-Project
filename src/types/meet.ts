/**
 * AMIKO Meet — Phase 4 & 5 Type Definitions
 *
 * Cultural Glossaries, Moderation, Recording, Summary, Reputation
 */

// ══════════════════════════════════════════════════════════════
// PHASE 4: Cultural Glossaries
// ══════════════════════════════════════════════════════════════

export type GlossaryRule = 'translate' | 'no_translate' | 'preserve' | 'transliterate' | 'annotate'

export type GlossaryCategory =
  | 'food'
  | 'honorific'
  | 'name'
  | 'expression'
  | 'cultural'
  | 'music'
  | 'fashion'
  | 'place'
  | 'general'

export interface CulturalGlossaryEntry {
  id: string
  source_term: string
  source_language: 'ko' | 'es'
  rule: GlossaryRule
  target_value: string | null
  target_language: 'ko' | 'es' | null
  category: GlossaryCategory
  context_hint: string | null
  priority: number
  is_active: boolean
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface GlossaryCreatePayload {
  source_term: string
  source_language: 'ko' | 'es'
  rule: GlossaryRule
  target_value?: string | null
  target_language?: 'ko' | 'es' | null
  category?: GlossaryCategory
  context_hint?: string | null
  priority?: number
  is_active?: boolean
}

export interface GlossaryUpdatePayload {
  source_term?: string
  source_language?: 'ko' | 'es'
  rule?: GlossaryRule
  target_value?: string | null
  target_language?: 'ko' | 'es' | null
  category?: GlossaryCategory
  context_hint?: string | null
  priority?: number
  is_active?: boolean
}

/** Result of applying a glossary entry to text */
export interface GlossaryMatch {
  entry: CulturalGlossaryEntry
  original_segment: string
  replaced_segment: string
  position: number
}

// ══════════════════════════════════════════════════════════════
// PHASE 4: Moderation
// ══════════════════════════════════════════════════════════════

export type ReportReason = 'harassment' | 'insults' | 'spam' | 'offensive_content' | 'other'
export type Severity = 'informative' | 'warning' | 'high_risk'
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed'
export type FlagStatus = 'active' | 'reviewed' | 'false_positive' | 'confirmed'
export type FlagDetectionType = 'keyword' | 'pattern' | 'ml_score' | 'manual'
export type ActionTaken = 'none' | 'warning_sent' | 'user_muted' | 'user_banned' | 'session_ended'

export interface ModerationReport {
  id: string
  session_id: string
  reporter_user_id: string
  reporter_name: string | null
  reported_user_id: string | null
  reported_user_name: string | null
  reason: ReportReason
  description: string | null
  evidence_caption_ids: string[]
  evidence_screenshot_url: string | null
  severity: Severity
  status: ReportStatus
  resolved_by: string | null
  resolution_notes: string | null
  resolved_at: string | null
  action_taken: ActionTaken | null
  created_at: string
  updated_at: string
}

export interface ModerationReportCreatePayload {
  reported_user_id?: string | null
  reported_user_name?: string | null
  reason: ReportReason
  description?: string
  evidence_caption_ids?: string[]
  evidence_screenshot_url?: string | null
}

export interface ModerationFlag {
  id: string
  session_id: string
  flagged_user_id: string | null
  flagged_user_name: string | null
  flagged_content: string
  content_language: 'ko' | 'es' | 'mixed' | 'unknown' | null
  caption_event_id: string | null
  translation_event_id: string | null
  detection_rule: string
  detection_type: FlagDetectionType
  severity: Severity
  confidence: number
  status: FlagStatus
  reviewed_by: string | null
  review_notes: string | null
  reviewed_at: string | null
  created_at: string
}

export interface ModerationStats {
  total_reports: number
  pending_reports: number
  total_flags: number
  active_flags: number
  high_risk_flags: number
  repeat_offenders: Array<{
    user_id: string
    user_name: string | null
    report_count: number
    flag_count: number
  }>
}

// ══════════════════════════════════════════════════════════════
// PHASE 5: Recording
// ══════════════════════════════════════════════════════════════

export type RecordingStatus = 'pending' | 'recording' | 'processing' | 'completed' | 'failed' | 'deleted'
export type ConsentStatus = 'pending' | 'all_consented' | 'declined' | 'partial'

export interface SessionRecording {
  id: string
  session_id: string
  initiated_by: string
  consent_status: ConsentStatus
  status: RecordingStatus
  storage_provider: 'supabase' | 's3' | 'local'
  storage_path: string | null
  storage_url: string | null
  file_size_bytes: number | null
  duration_seconds: number | null
  mime_type: string
  expires_at: string | null
  is_deleted: boolean
  recording_started_at: string | null
  recording_ended_at: string | null
  created_at: string
  updated_at: string
}

export interface RecordingConsent {
  id: string
  recording_id: string
  user_id: string
  consented: boolean
  responded_at: string
}

// ══════════════════════════════════════════════════════════════
// PHASE 5: Summary
// ══════════════════════════════════════════════════════════════

export type SummaryGenerationStatus = 'pending' | 'generating' | 'completed' | 'failed'

export interface TopicEntry {
  topic: string
  topic_ko: string
  topic_es: string
  mentions: number
}

export interface VocabularyEntry {
  term: string
  translation: string
  context: string
  language: 'ko' | 'es'
}

export interface CulturalNote {
  note_ko: string
  note_es: string
  category: string
}

export interface SessionSummary {
  id: string
  session_id: string
  summary_ko: string | null
  summary_es: string | null
  topics: TopicEntry[]
  vocabulary: VocabularyEntry[]
  cultural_notes: CulturalNote[]
  total_caption_events: number
  total_translations: number
  duration_minutes: number
  words_spoken_ko: number
  words_spoken_es: number
  generated_by: 'system' | 'ai' | 'manual'
  ai_model: string | null
  generation_status: SummaryGenerationStatus
  error_message: string | null
  created_at: string
  updated_at: string
}

// ══════════════════════════════════════════════════════════════
// PHASE 5: Notes
// ══════════════════════════════════════════════════════════════

export type NoteType = 'general' | 'vocabulary' | 'grammar' | 'cultural' | 'pronunciation'

export interface SessionNote {
  id: string
  session_id: string
  user_id: string
  title: string | null
  content: string
  language: 'ko' | 'es'
  note_type: NoteType
  tags: string[]
  session_timestamp_start: number | null
  session_timestamp_end: number | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface SessionNoteCreatePayload {
  title?: string
  content: string
  language?: 'ko' | 'es'
  note_type?: NoteType
  tags?: string[]
  session_timestamp_start?: number
  session_timestamp_end?: number
  is_public?: boolean
}

// ══════════════════════════════════════════════════════════════
// PHASE 5: Reputation
// ══════════════════════════════════════════════════════════════

export type ReputationTier = 'newcomer' | 'active' | 'trusted' | 'expert' | 'ambassador'

export type ReputationBadge =
  | 'great_teacher'
  | 'patient'
  | 'fun_conversation'
  | 'cultural_expert'
  | 'helpful'
  | 'encouraging'

export interface SessionReputation {
  id: string
  session_id: string
  rater_user_id: string
  rated_user_id: string
  overall_rating: number
  communication_rating: number | null
  respect_rating: number | null
  helpfulness_rating: number | null
  language_skill_rating: number | null
  comment: string | null
  badges: ReputationBadge[]
  created_at: string
}

export interface SessionReputationCreatePayload {
  rated_user_id: string
  overall_rating: number
  communication_rating?: number
  respect_rating?: number
  helpfulness_rating?: number
  language_skill_rating?: number
  comment?: string
  badges?: ReputationBadge[]
}

export interface UserReputation {
  user_id: string
  total_sessions: number
  total_ratings_received: number
  avg_overall: number
  avg_communication: number
  avg_respect: number
  avg_helpfulness: number
  avg_language_skill: number
  badges_earned: Record<string, number>
  reputation_tier: ReputationTier
  total_reports_received: number
  total_flags_received: number
  updated_at: string
}
