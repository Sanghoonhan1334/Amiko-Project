"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import {
  FileText,
  BookOpen,
  Star,
  ChevronRight,
  Loader2,
  Tag,
  Clock,
  MessageCircle,
  Globe,
  Award,
  ArrowLeft,
  Lightbulb,
  GraduationCap,
  Check,
  BookOpenCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VCPostSessionProps {
  sessionId: string;
  hostName?: string;
  isHost?: boolean;
  durationMinutes?: number;
  onClose: () => void;
}

type Tab = "summary" | "notes" | "rating";

interface SummaryData {
  id: string;
  summary_ko: string;
  summary_es: string;
  duration_minutes: number;
  total_captions: number;
  total_translations: number;
  topics: Array<{ topic: string; label_ko: string; label_es: string; count: number }>;
  vocabulary: Array<{ original: string; translated: string; source_lang: string }>;
  cultural_notes: Array<{ note_ko: string; note_es: string; type: string }>;
  key_points: Array<{ point_ko: string; point_es: string }>;
  status: string;
}

interface NoteData {
  id: string;
  note_type: string;
  title: string;
  content: Array<{
    term?: string;
    definition_ko?: string;
    definition_es?: string;
    example_ko?: string;
    example_es?: string;
    explanation_ko?: string;
    explanation_es?: string;
    category?: string;
  }>;
  status: string;
}

export default function VCPostSession({
  sessionId,
  hostName,
  isHost = false,
  durationMinutes,
  onClose,
}: VCPostSessionProps) {
  const { language } = useLanguage();
  const ko = language === "ko";

  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Summary state
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Notes state
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  // Rating state
  const [usefulnessRating, setUsefulnessRating] = useState(0);
  const [clarityRating, setClarityRating] = useState(0);
  const [experienceRating, setExperienceRating] = useState(0);
  const [hostQualityRating, setHostQualityRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [hostReputation, setHostReputation] = useState<{
    reputation_tier: string;
    reputation_score: number;
    avg_rating: number;
    total_reviews: number;
  } | null>(null);

  const t = useCallback(
    (section: string, key: string) => {
      const translations: Record<string, Record<string, Record<string, string>>> = {
        postSession: {
          title: { ko: "세션 완료!", es: "¡Sesión Completada!" },
          subtitle: { ko: "세션 요약과 학습 내용을 확인하세요", es: "Revisa el resumen y contenido de aprendizaje" },
          back: { ko: "닫기", es: "Cerrar" },
        },
        summary: {
          title: { ko: "세션 요약", es: "Resumen de Sesión" },
          generating: { ko: "AI가 요약을 생성 중...", es: "AI generando resumen..." },
          generate: { ko: "요약 생성", es: "Generar Resumen" },
          duration: { ko: "대화 시간", es: "Duración" },
          topics: { ko: "주제", es: "Temas" },
          vocabulary: { ko: "학습 어휘", es: "Vocabulario" },
          culturalNotes: { ko: "문화 노트", es: "Notas Culturales" },
          keyPoints: { ko: "핵심 포인트", es: "Puntos Clave" },
          noSummary: { ko: "아직 요약이 없습니다", es: "Aún no hay resumen" },
          minutes: { ko: "분", es: "min" },
          captions: { ko: "자막", es: "subtítulos" },
          translations: { ko: "번역", es: "traducciones" },
          error: { ko: "요약 생성 실패. 다시 시도해주세요.", es: "Error al generar resumen. Intenta de nuevo." },
        },
        notes: {
          title: { ko: "학습 노트", es: "Notas Educativas" },
          generating: { ko: "AI가 학습 노트를 추출 중...", es: "AI extrayendo notas educativas..." },
          generate: { ko: "노트 생성", es: "Generar Notas" },
          noNotes: { ko: "아직 학습 노트가 없습니다", es: "Aún no hay notas educativas" },
          error: { ko: "노트 생성 실패. 다시 시도해주세요.", es: "Error al generar notas. Intenta de nuevo." },
          vocabulary: { ko: "어휘", es: "Vocabulario" },
          concepts: { ko: "핵심 개념", es: "Conceptos" },
          key_points: { ko: "주요 포인트", es: "Puntos Clave" },
          grammar: { ko: "문법", es: "Gramática" },
          cultural: { ko: "문화", es: "Cultural" },
          pronunciation: { ko: "발음", es: "Pronunciación" },
        },
        rating: {
          title: { ko: "세션 평가", es: "Evaluar Sesión" },
          usefulness: { ko: "유용성", es: "Utilidad" },
          clarity: { ko: "명확성", es: "Claridad" },
          experience: { ko: "경험", es: "Experiencia" },
          hostQuality: { ko: "호스트 퀄리티", es: "Calidad del Host" },
          comment: { ko: "코멘트 (선택)", es: "Comentario (opcional)" },
          commentPlaceholder: { ko: "세션 경험을 공유해주세요...", es: "Comparte tu experiencia..." },
          submit: { ko: "평가 제출", es: "Enviar Evaluación" },
          submitted: { ko: "감사합니다!", es: "¡Gracias!" },
          submittedMsg: { ko: "평가가 제출되었습니다", es: "Tu evaluación fue enviada" },
          skip: { ko: "건너뛰기", es: "Omitir" },
          reputationUpdated: { ko: "호스트 평판이 업데이트되었습니다", es: "Reputación del host actualizada" },
          selfHost: { ko: "호스트는 자신을 평가할 수 없습니다", es: "El host no puede evaluarse a sí mismo" },
          tier: { ko: "등급", es: "Nivel" },
        },
      };
      return translations[section]?.[key]?.[ko ? "ko" : "es"] ?? key;
    },
    [ko],
  );

  const getAuthHeaders = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
    };
  }, []);

  // Load summary on mount
  useEffect(() => {
    const loadSummary = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/video/sessions/${sessionId}/summary`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.summary?.status === "ready") setSummary(data.summary);
        }
      } catch {}
    };
    loadSummary();
  }, [sessionId, getAuthHeaders]);

  // Load notes when tab changes
  useEffect(() => {
    if (activeTab !== "notes") return;
    const loadNotes = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/video/sessions/${sessionId}/notes`, { headers });
        if (res.ok) {
          const data = await res.json();
          setNotes(data.notes || []);
        }
      } catch {}
    };
    loadNotes();
  }, [activeTab, sessionId, getAuthHeaders]);

  // Check if already reviewed
  useEffect(() => {
    if (activeTab !== "rating") return;
    const checkReview = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/video/sessions/${sessionId}/review`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.user_has_reviewed) setRatingSubmitted(true);
        }
      } catch {}
    };
    checkReview();
  }, [activeTab, sessionId, getAuthHeaders]);

  const handleGenerateSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `/api/video/sessions/${sessionId}/post-session/generate-summary`,
        { method: "POST", headers },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : t("summary", "error"));
    } finally {
      setSummaryLoading(false);
    }
  }, [sessionId, getAuthHeaders, t]);

  const handleGenerateNotes = useCallback(async () => {
    setNotesLoading(true);
    setNotesError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `/api/video/sessions/${sessionId}/post-session/generate-notes`,
        { method: "POST", headers },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err) {
      setNotesError(err instanceof Error ? err.message : t("notes", "error"));
    } finally {
      setNotesLoading(false);
    }
  }, [sessionId, getAuthHeaders, t]);

  const handleSubmitRating = useCallback(async () => {
    if (usefulnessRating === 0 || clarityRating === 0 || experienceRating === 0 || hostQualityRating === 0) return;
    setRatingSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/video/sessions/${sessionId}/review`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          usefulness_rating: usefulnessRating,
          clarity_rating: clarityRating,
          experience_rating: experienceRating,
          host_quality_rating: hostQualityRating,
          comment: ratingComment.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRatingSubmitted(true);
        if (data.host_reputation) {
          setHostReputation(data.host_reputation);
        }
      }
    } catch {}
    setRatingSubmitting(false);
  }, [sessionId, usefulnessRating, clarityRating, experienceRating, hostQualityRating, ratingComment, getAuthHeaders]);

  const StarRating = ({ value, onChange, size = "md" }: { value: number; onChange: (v: number) => void; size?: "sm" | "md" }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} className="transition-transform hover:scale-110">
          <Star
            className={`${size === "sm" ? "w-5 h-5" : "w-7 h-7"} ${
              n <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-500"
            }`}
          />
        </button>
      ))}
    </div>
  );

  const noteTypeIcons: Record<string, typeof BookOpen> = {
    vocabulary: BookOpen,
    concepts: Lightbulb,
    key_points: BookOpenCheck,
    grammar: GraduationCap,
    cultural: Globe,
  };

  const noteTypeColors: Record<string, string> = {
    vocabulary: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    concepts: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    key_points: "bg-green-500/20 text-green-300 border-green-500/30",
    grammar: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    cultural: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    pronunciation: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  };

  const tierColors: Record<string, string> = {
    newcomer: "text-gray-400",
    active: "text-blue-400",
    trusted: "text-green-400",
    expert: "text-purple-400",
    ambassador: "text-yellow-400",
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700">
        <div>
          <h2 className="text-white font-bold text-lg">{t("postSession", "title")}</h2>
          <p className="text-gray-400 text-sm">{t("postSession", "subtitle")}</p>
        </div>
        <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t("postSession", "back")}
        </Button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-700 bg-gray-800/50 px-4">
        {([
          { key: "summary" as Tab, icon: FileText, label: t("summary", "title") },
          { key: "notes" as Tab, icon: BookOpen, label: t("notes", "title") },
          { key: "rating" as Tab, icon: Award, label: t("rating", "title") },
        ] as const).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          {/* ========== SUMMARY TAB ========== */}
          {activeTab === "summary" && (
            <div className="space-y-6">
              {!summary && !summaryLoading && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 mb-4">{t("summary", "noSummary")}</p>
                  <Button onClick={handleGenerateSummary} className="bg-purple-600 hover:bg-purple-700">
                    <FileText className="w-4 h-4 mr-2" />
                    {t("summary", "generate")}
                  </Button>
                  {summaryError && <p className="text-red-400 text-sm mt-3">{summaryError}</p>}
                </div>
              )}

              {summaryLoading && (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 mx-auto text-purple-400 animate-spin mb-4" />
                  <p className="text-gray-400">{t("summary", "generating")}</p>
                </div>
              )}

              {summary && summary.status === "ready" && (
                <>
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-gray-700">
                      <Clock className="w-5 h-5 mx-auto text-blue-400 mb-1" />
                      <p className="text-white font-bold text-lg">{summary.duration_minutes || durationMinutes || "—"}</p>
                      <p className="text-gray-400 text-xs">{t("summary", "minutes")}</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-gray-700">
                      <MessageCircle className="w-5 h-5 mx-auto text-green-400 mb-1" />
                      <p className="text-white font-bold text-lg">{summary.total_captions}</p>
                      <p className="text-gray-400 text-xs">{t("summary", "captions")}</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-gray-700">
                      <Globe className="w-5 h-5 mx-auto text-purple-400 mb-1" />
                      <p className="text-white font-bold text-lg">{summary.total_translations}</p>
                      <p className="text-gray-400 text-xs">{t("summary", "translations")}</p>
                    </div>
                  </div>

                  {/* Summary text */}
                  <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700">
                    <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">
                      {ko ? summary.summary_ko : summary.summary_es}
                    </p>
                  </div>

                  {/* Topics */}
                  {summary.topics?.length > 0 && (
                    <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700">
                      <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-yellow-400" />
                        {t("summary", "topics")}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {summary.topics.map((topic, i) => (
                          <Badge key={i} className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                            {ko ? topic.label_ko : topic.label_es} ({topic.count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Points */}
                  {summary.key_points?.length > 0 && (
                    <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700">
                      <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-400" />
                        {t("summary", "keyPoints")}
                      </h3>
                      <div className="space-y-2">
                        {summary.key_points.map((pt, i) => (
                          <p key={i} className="text-gray-300 text-sm pl-3 border-l-2 border-yellow-500/40">
                            {ko ? pt.point_ko : pt.point_es}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vocabulary */}
                  {summary.vocabulary?.length > 0 && (
                    <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700">
                      <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-400" />
                        {t("summary", "vocabulary")}
                      </h3>
                      <div className="space-y-2">
                        {summary.vocabulary.slice(0, 15).map((v, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-gray-200 font-medium min-w-[80px]">{v.original}</span>
                            <ChevronRight className="w-3 h-3 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-400">{v.translated}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cultural Notes */}
                  {summary.cultural_notes?.length > 0 && (
                    <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700">
                      <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-green-400" />
                        {t("summary", "culturalNotes")}
                      </h3>
                      <div className="space-y-2">
                        {summary.cultural_notes.map((note, i) => (
                          <p key={i} className="text-gray-300 text-sm pl-3 border-l-2 border-green-500/40">
                            {ko ? note.note_ko : note.note_es}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ========== NOTES TAB ========== */}
          {activeTab === "notes" && (
            <div className="space-y-6">
              {notes.length === 0 && !notesLoading && (
                <div className="text-center py-12">
                  <GraduationCap className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 mb-4">{t("notes", "noNotes")}</p>
                  <Button onClick={handleGenerateNotes} className="bg-purple-600 hover:bg-purple-700">
                    <BookOpen className="w-4 h-4 mr-2" />
                    {t("notes", "generate")}
                  </Button>
                  {notesError && <p className="text-red-400 text-sm mt-3">{notesError}</p>}
                </div>
              )}

              {notesLoading && (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 mx-auto text-purple-400 animate-spin mb-4" />
                  <p className="text-gray-400">{t("notes", "generating")}</p>
                </div>
              )}

              {notes.map((note) => {
                const Icon = noteTypeIcons[note.note_type] || BookOpen;
                const colorClass = noteTypeColors[note.note_type] || noteTypeColors.key_points;
                return (
                  <div key={note.id} className="bg-gray-800/60 rounded-xl border border-gray-700 overflow-hidden">
                    {/* Note header */}
                    <div className="px-5 py-3 border-b border-gray-700 flex items-center gap-2">
                      <Icon className="w-4 h-4 text-purple-400" />
                      <Badge className={colorClass}>
                        {t("notes", note.note_type)}
                      </Badge>
                      <span className="text-gray-400 text-xs ml-auto">
                        {note.content?.length || 0} {ko ? "항목" : "items"}
                      </span>
                    </div>

                    {/* Note items */}
                    <div className="p-5 space-y-3">
                      {Array.isArray(note.content) && note.content.map((item, idx) => (
                        <div key={idx} className="bg-gray-700/30 rounded-lg p-3">
                          {item.term && (
                            <p className="text-white font-medium text-sm mb-1 flex items-center gap-2">
                              {item.term}
                              {item.category && (
                                <span className="text-xs bg-gray-600/50 text-gray-400 px-1.5 py-0.5 rounded">
                                  {item.category}
                                </span>
                              )}
                            </p>
                          )}
                          {(item.definition_ko || item.definition_es) && (
                            <p className="text-gray-300 text-xs">
                              {ko ? item.definition_ko : item.definition_es}
                            </p>
                          )}
                          {(item.explanation_ko || item.explanation_es) && (
                            <p className="text-gray-300 text-xs">
                              {ko ? item.explanation_ko : item.explanation_es}
                            </p>
                          )}
                          {(item.example_ko || item.example_es) && (
                            <p className="text-gray-500 text-xs italic mt-1">
                              {ko ? `"${item.example_ko}"` : `"${item.example_es}"`}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ========== RATING TAB ========== */}
          {activeTab === "rating" && (
            <div className="space-y-6">
              {isHost ? (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">{t("rating", "selfHost")}</p>
                </div>
              ) : ratingSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{t("rating", "submitted")}</h3>
                  <p className="text-gray-400 text-sm mb-4">{t("rating", "submittedMsg")}</p>

                  {hostReputation && (
                    <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700 max-w-xs mx-auto">
                      <p className="text-gray-400 text-xs mb-2">{t("rating", "reputationUpdated")}</p>
                      <div className="flex items-center justify-center gap-3">
                        <div className="text-center">
                          <p className="text-white font-bold text-lg">{hostReputation.avg_rating}</p>
                          <p className="text-gray-500 text-xs">★ Rating</p>
                        </div>
                        <div className="w-px h-8 bg-gray-600" />
                        <div className="text-center">
                          <p className={`font-bold text-sm capitalize ${tierColors[hostReputation.reputation_tier] || "text-gray-400"}`}>
                            {hostReputation.reputation_tier}
                          </p>
                          <p className="text-gray-500 text-xs">{t("rating", "tier")}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-600" />
                        <div className="text-center">
                          <p className="text-white font-bold text-lg">{hostReputation.total_reviews}</p>
                          <p className="text-gray-500 text-xs">Reviews</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Host info */}
                  {hostName && (
                    <div className="flex items-center gap-3 bg-gray-800/60 rounded-xl p-4 border border-gray-700">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <span className="text-white font-bold">{hostName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{hostName}</p>
                        {durationMinutes && (
                          <p className="text-gray-400 text-xs">{durationMinutes} {t("summary", "minutes")}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rating dimensions */}
                  <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700 space-y-5">
                    {[
                      { label: t("rating", "usefulness"), value: usefulnessRating, set: setUsefulnessRating },
                      { label: t("rating", "clarity"), value: clarityRating, set: setClarityRating },
                      { label: t("rating", "experience"), value: experienceRating, set: setExperienceRating },
                      { label: t("rating", "hostQuality"), value: hostQualityRating, set: setHostQualityRating },
                    ].map(({ label, value, set }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">{label}</span>
                        <StarRating value={value} onChange={set} size="sm" />
                      </div>
                    ))}
                  </div>

                  {/* Comment */}
                  <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700">
                    <label className="text-gray-400 text-xs mb-2 block">{t("rating", "comment")}</label>
                    <textarea
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      rows={3}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                      placeholder={t("rating", "commentPlaceholder")}
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={onClose} className="flex-1 text-gray-400 hover:text-white">
                      {t("rating", "skip")}
                    </Button>
                    <Button
                      onClick={handleSubmitRating}
                      disabled={usefulnessRating === 0 || clarityRating === 0 || experienceRating === 0 || hostQualityRating === 0 || ratingSubmitting}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      {ratingSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Star className="w-4 h-4 mr-1" />
                      )}
                      {t("rating", "submit")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
