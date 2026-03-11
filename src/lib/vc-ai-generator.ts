/**
 * Phase 5 — AI-powered Session Summary & Educational Notes Generator
 *
 * Uses DeepSeek to:
 *  1. Generate bilingual session summaries from transcript
 *  2. Extract educational notes (vocabulary, concepts, key points, grammar, cultural)
 *
 * Designed to be called from API routes after a session ends.
 */

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;

// ── DeepSeek caller ──────────────────────────────────────────────────────────

async function callDeepSeek(
  systemPrompt: string,
  userContent: string
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not configured");

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 1s, 2s
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: DEEPSEEK_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          temperature: 0.3,
          max_tokens: 4096,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        const err = new Error(`DeepSeek API error ${res.status}: ${errText}`);

        // Only retry on transient errors (429, 500, 502, 503, 504)
        if ([429, 500, 502, 503, 504].includes(res.status) && attempt < MAX_RETRIES) {
          lastError = err;
          console.warn(`[DeepSeek] Retry ${attempt + 1}/${MAX_RETRIES} after ${res.status}`);
          continue;
        }
        throw err;
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || "";
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Retry on network/timeout errors
      if (attempt < MAX_RETRIES && (lastError.name === "AbortError" || lastError.message.includes("fetch"))) {
        console.warn(`[DeepSeek] Retry ${attempt + 1}/${MAX_RETRIES} after error: ${lastError.message}`);
        continue;
      }
      throw lastError;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error("DeepSeek call failed after retries");
}

// ── Summary generation ───────────────────────────────────────────────────────

export interface SessionSummaryResult {
  summary_ko: string;
  summary_es: string;
  topics: Array<{ topic: string; label_ko: string; label_es: string; count: number }>;
  vocabulary: Array<{ original: string; translated: string; source_lang: string }>;
  cultural_notes: Array<{ note_ko: string; note_es: string; type: string }>;
  key_points: Array<{ point_ko: string; point_es: string }>;
  word_count_stats: {
    total_words: number;
    ko_words: number;
    es_words: number;
    en_words: number;
  };
}

const SUMMARY_SYSTEM_PROMPT = `You are an AI assistant specializing in Korean–Spanish language exchange session analysis.
You will receive a transcript from a video call session between Korean and Spanish speakers.

Generate a comprehensive summary in JSON format with this EXACT structure:
{
  "summary_ko": "Korean summary of the session (3-5 sentences)",
  "summary_es": "Spanish summary of the session (3-5 sentences)",
  "topics": [
    {"topic": "topic_id", "label_ko": "Korean label", "label_es": "Spanish label", "count": 1}
  ],
  "vocabulary": [
    {"original": "word/phrase", "translated": "translation", "source_lang": "ko or es"}
  ],
  "cultural_notes": [
    {"note_ko": "Korean note", "note_es": "Spanish note", "type": "custom/food/etiquette/language"}
  ],
  "key_points": [
    {"point_ko": "Korean key point", "point_es": "Spanish key point"}
  ]
}

Rules:
- Extract 5-15 vocabulary items that were discussed or taught
- Identify 2-5 main topics discussed
- Note any cultural exchange moments
- Keep summaries concise and educational
- Return ONLY valid JSON, no markdown formatting, no code blocks
- If transcript is too short (< 5 lines), still provide what you can`;

export async function generateSessionSummary(
  transcript: string,
  durationMinutes?: number
): Promise<SessionSummaryResult> {
  const userContent = `Session Duration: ${durationMinutes || "unknown"} minutes
  
Transcript:
${transcript}`;

  const raw = await callDeepSeek(SUMMARY_SYSTEM_PROMPT, userContent);

  // Parse JSON from response (strip potential markdown code blocks)
  const jsonStr = raw.replace(/^```json?\n?|\n?```$/g, "").trim();

  try {
    const parsed = JSON.parse(jsonStr);

    // Count words by language (rough heuristic)
    const koWords = (transcript.match(/[\uac00-\ud7af]+/g) || []).length;
    const esMatches = transcript.match(
      /\b[a-záéíóúüñ]{2,}\b/gi
    ) || [];
    const enWords = Math.max(0, esMatches.length - Math.floor(esMatches.length * 0.6)); // rough split
    const esWords = esMatches.length - enWords;

    return {
      summary_ko: parsed.summary_ko || "",
      summary_es: parsed.summary_es || "",
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
      cultural_notes: Array.isArray(parsed.cultural_notes) ? parsed.cultural_notes : [],
      key_points: Array.isArray(parsed.key_points) ? parsed.key_points : [],
      word_count_stats: {
        total_words: koWords + esWords + enWords,
        ko_words: koWords,
        es_words: esWords,
        en_words: enWords,
      },
    };
  } catch {
    throw new Error(`Failed to parse AI summary response: ${jsonStr.slice(0, 200)}`);
  }
}

// ── Educational notes generation ─────────────────────────────────────────────

export interface EducationalNoteResult {
  type: string;
  title_ko: string;
  title_es: string;
  items: Array<{
    term?: string;
    definition_ko?: string;
    definition_es?: string;
    example_ko?: string;
    example_es?: string;
    explanation_ko?: string;
    explanation_es?: string;
    category?: string;
  }>;
}

const NOTES_SYSTEM_PROMPT = `You are an AI assistant specializing in extracting educational content from Korean–Spanish language exchange sessions.
You will receive a transcript from a video call session.

Extract educational notes in JSON format as an array with this EXACT structure:
[
  {
    "type": "vocabulary",
    "title_ko": "학습 어휘",
    "title_es": "Vocabulario Aprendido",
    "items": [
      {
        "term": "word or phrase",
        "definition_ko": "Korean definition",
        "definition_es": "Spanish definition",
        "example_ko": "Korean example sentence",
        "example_es": "Spanish example sentence",
        "category": "noun/verb/adjective/expression/greeting"
      }
    ]
  },
  {
    "type": "concepts",
    "title_ko": "핵심 개념",
    "title_es": "Conceptos Clave",
    "items": [
      {
        "term": "concept name",
        "explanation_ko": "Korean explanation",
        "explanation_es": "Spanish explanation"
      }
    ]
  },
  {
    "type": "key_points",
    "title_ko": "주요 포인트",
    "title_es": "Puntos Importantes",
    "items": [
      {
        "explanation_ko": "Korean point",
        "explanation_es": "Spanish point"
      }
    ]
  },
  {
    "type": "grammar",
    "title_ko": "문법 포인트",
    "title_es": "Puntos de Gramática",
    "items": [
      {
        "term": "grammar pattern",
        "explanation_ko": "Korean explanation",
        "explanation_es": "Spanish explanation",
        "example_ko": "Korean example",
        "example_es": "Spanish example"
      }
    ]
  },
  {
    "type": "cultural",
    "title_ko": "문화 노트",
    "title_es": "Notas Culturales",
    "items": [
      {
        "term": "cultural topic",
        "explanation_ko": "Korean explanation",
        "explanation_es": "Spanish explanation"
      }
    ]
  }
]

Rules:
- Extract 5-20 vocabulary items
- Identify 2-5 grammar points if discussed
- Note 1-5 cultural exchange points
- 3-7 key learning points
- Only include note types that have relevant content
- Return ONLY valid JSON array, no markdown, no code blocks
- Each item must have at least a Korean and Spanish explanation`;

export async function generateEducationalNotes(
  transcript: string
): Promise<EducationalNoteResult[]> {
  const raw = await callDeepSeek(NOTES_SYSTEM_PROMPT, transcript);

  const jsonStr = raw.replace(/^```json?\n?|\n?```$/g, "").trim();

  try {
    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed)) {
      throw new Error("Expected array");
    }

    return parsed.map((note: EducationalNoteResult) => ({
      type: note.type || "key_points",
      title_ko: note.title_ko || "",
      title_es: note.title_es || "",
      items: Array.isArray(note.items) ? note.items : [],
    }));
  } catch {
    throw new Error(`Failed to parse AI notes response: ${jsonStr.slice(0, 200)}`);
  }
}

// ── Transcript builder helper ────────────────────────────────────────────────

export interface CaptionEvent {
  speaker_name: string;
  content: string;
  language: string;
  timestamp_ms: number;
}

/**
 * Build a readable transcript string from caption events for AI processing.
 */
export function buildTranscript(captions: CaptionEvent[]): string {
  return captions
    .sort((a, b) => a.timestamp_ms - b.timestamp_ms)
    .map((c) => `[${c.language}] ${c.speaker_name}: ${c.content}`)
    .join("\n");
}
