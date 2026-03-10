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
  StickyNote,
  Award,
  ArrowLeft,
  Plus,
  Send,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface PostSessionViewProps {
  sessionId: string;
  partnerId?: string;
  partnerName?: string;
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
}

interface NoteData {
  id: string;
  content: string;
  note_type: string;
  tags: string[];
  is_public: boolean;
  created_at: string;
}

export default function PostSessionView({
  sessionId,
  partnerId,
  partnerName,
  durationMinutes,
  onClose,
}: PostSessionViewProps) {
  const { language } = useLanguage();
  const ko = language === "ko";

  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Summary state
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Notes state
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [noteTags, setNoteTags] = useState("");
  const [notePublic, setNotePublic] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  // Rating state
  const [overallRating, setOverallRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [attitudeRating, setAttitudeRating] = useState(0);
  const [helpfulnessRating, setHelpfulnessRating] = useState(0);
  const [languageSkillRating, setLanguageSkillRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const t = useCallback(
    (section: string, key: string) => {
      const translations: Record<string, Record<string, Record<string, string>>> = {
        postSession: {
          title: { ko: "세션 완료!", es: "¡Sesión Completada!" },
          subtitle: {
            ko: "오늘 대화가 어떠셨나요?",
            es: "¿Cómo estuvo la conversación?",
          },
          backToList: {
            ko: "목록으로 돌아가기",
            es: "Volver a la Lista",
          },
        },
        summary: {
          title: { ko: "세션 요약", es: "Resumen de Sesión" },
          generating: { ko: "요약 생성 중...", es: "Generando resumen..." },
          generate: { ko: "요약 생성", es: "Generar Resumen" },
          duration: { ko: "대화 시간", es: "Duración" },
          topics: { ko: "주제", es: "Temas" },
          vocabulary: { ko: "학습 어휘", es: "Vocabulario" },
          culturalNotes: { ko: "문화 노트", es: "Notas Culturales" },
          noSummary: { ko: "아직 요약이 없습니다", es: "Aún no hay resumen" },
          minutes: { ko: "분", es: "min" },
          captions: { ko: "자막", es: "subtítulos" },
          translations: { ko: "번역", es: "traducciones" },
          error: { ko: "요약 생성 실패", es: "Error al generar resumen" },
        },
        notes: {
          title: { ko: "학습 노트", es: "Notas de Aprendizaje" },
          addNote: { ko: "노트 추가", es: "Agregar Nota" },
          content: { ko: "내용", es: "Contenido" },
          type: { ko: "유형", es: "Tipo" },
          tags: { ko: "태그 (쉼표로 구분)", es: "Etiquetas (separadas por coma)" },
          public: { ko: "공개", es: "Público" },
          private: { ko: "비공개", es: "Privado" },
          save: { ko: "저장", es: "Guardar" },
          saved: { ko: "저장됨", es: "Guardado" },
          noNotes: { ko: "아직 노트가 없습니다", es: "Aún no hay notas" },
          general: { ko: "일반", es: "General" },
          vocabulary: { ko: "어휘", es: "Vocabulario" },
          grammar: { ko: "문법", es: "Gramática" },
          cultural: { ko: "문화", es: "Cultural" },
          pronunciation: { ko: "발음", es: "Pronunciación" },
        },
        rating: {
          title: { ko: "세션 평가", es: "Evaluar Sesión" },
          overall: { ko: "전체 평점", es: "Calificación General" },
          communication: { ko: "의사소통", es: "Comunicación" },
          attitude: { ko: "태도", es: "Actitud" },
          helpfulness: { ko: "도움 정도", es: "Disposición" },
          languageSkill: { ko: "언어 실력", es: "Habilidad" },
          comment: {
            ko: "코멘트 (선택사항)",
            es: "Comentario (opcional)",
          },
          commentPlaceholder: {
            ko: "대화 경험을 공유해주세요...",
            es: "Comparte tu experiencia...",
          },
          submit: { ko: "평가 제출", es: "Enviar Evaluación" },
          submitted: { ko: "감사합니다!", es: "¡Gracias!" },
          submittedMsg: {
            ko: "평가가 제출되었습니다",
            es: "Tu evaluación fue enviada",
          },
          skip: { ko: "건너뛰기", es: "Omitir" },
        },
      };
      return translations[section]?.[key]?.[ko ? "ko" : "es"] ?? key;
    },
    [ko],
  );

  const getAuthHeaders = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
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
        const res = await fetch(
          `/api/meet/sessions/${sessionId}/summary`,
          { headers },
        );
        if (res.ok) {
          const data = await res.json();
          if (data.summary) setSummary(data.summary);
        }
      } catch {
        // summaries not available yet
      }
    };
    loadSummary();
  }, [sessionId, getAuthHeaders]);

  // Load notes when tab changes
  useEffect(() => {
    if (activeTab !== "notes") return;
    const loadNotes = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(
          `/api/meet/sessions/${sessionId}/notes`,
          { headers },
        );
        if (res.ok) {
          const data = await res.json();
          setNotes(data.notes || []);
        }
      } catch {
        // notes not available
      }
    };
    loadNotes();
  }, [activeTab, sessionId, getAuthHeaders]);

  const handleGenerateSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `/api/meet/sessions/${sessionId}/summary`,
        { method: "POST", headers },
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSummary(data.summary);
    } catch {
      setSummaryError(t("summary", "error"));
    } finally {
      setSummaryLoading(false);
    }
  }, [sessionId, getAuthHeaders, t]);

  const handleSaveNote = useCallback(async () => {
    if (!noteContent.trim()) return;
    setNoteSaving(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `/api/meet/sessions/${sessionId}/notes`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            content: noteContent.trim(),
            note_type: noteType,
            tags: noteTags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            is_public: notePublic,
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => [data.note, ...prev]);
        setNoteContent("");
        setNoteTags("");
        setShowNoteForm(false);
      }
    } catch {
      // save failed
    } finally {
      setNoteSaving(false);
    }
  }, [sessionId, noteContent, noteType, noteTags, notePublic, getAuthHeaders]);

  const handleSubmitRating = useCallback(async () => {
    if (overallRating === 0) return;
    setRatingSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      await fetch(
        `/api/meet/sessions/${sessionId}/reputation`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            rated_user_id: partnerId,
            overall_rating: overallRating,
            communication_score: communicationRating || undefined,
            attitude_score: attitudeRating || undefined,
            helpfulness_score: helpfulnessRating || undefined,
            language_skill_score: languageSkillRating || undefined,
            comment: ratingComment.trim() || undefined,
          }),
        },
      );
      setRatingSubmitted(true);
    } catch {
      // rating failed
    } finally {
      setRatingSubmitting(false);
    }
  }, [
    sessionId,
    partnerId,
    overallRating,
    communicationRating,
    attitudeRating,
    helpfulnessRating,
    languageSkillRating,
    ratingComment,
    getAuthHeaders,
  ]);

  const StarRating = ({
    value,
    onChange,
    size = "md",
  }: {
    value: number;
    onChange: (v: number) => void;
    size?: "sm" | "md";
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`${size === "sm" ? "w-5 h-5" : "w-7 h-7"} ${
              n <= value
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-500"
            }`}
          />
        </button>
      ))}
    </div>
  );

  const noteTypeColors: Record<string, string> = {
    general: "bg-gray-500/20 text-gray-300",
    vocabulary: "bg-blue-500/20 text-blue-300",
    grammar: "bg-green-500/20 text-green-300",
    cultural: "bg-purple-500/20 text-purple-300",
    pronunciation: "bg-orange-500/20 text-orange-300",
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700">
        <div>
          <h2 className="text-white font-bold text-lg">
            {t("postSession", "title")}
          </h2>
          <p className="text-gray-400 text-sm">
            {t("postSession", "subtitle")}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t("postSession", "backToList")}
        </Button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-700 bg-gray-800/50 px-4">
        {(
          [
            {
              key: "summary" as Tab,
              icon: FileText,
              label: t("summary", "title"),
            },
            {
              key: "notes" as Tab,
              icon: StickyNote,
              label: t("notes", "title"),
            },
            {
              key: "rating" as Tab,
              icon: Award,
              label: t("rating", "title"),
            },
          ] as const
        ).map(({ key, icon: Icon, label }) => (
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
                  <p className="text-gray-400 mb-4">
                    {t("summary", "noSummary")}
                  </p>
                  <Button
                    onClick={handleGenerateSummary}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {t("summary", "generate")}
                  </Button>
                  {summaryError && (
                    <p className="text-red-400 text-sm mt-2">
                      {summaryError}
                    </p>
                  )}
                </div>
              )}

              {summaryLoading && (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 mx-auto text-purple-400 animate-spin mb-4" />
                  <p className="text-gray-400">{t("summary", "generating")}</p>
                </div>
              )}

              {summary && (
                <>
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-gray-700">
                      <Clock className="w-5 h-5 mx-auto text-blue-400 mb-1" />
                      <p className="text-white font-bold text-lg">
                        {summary.duration_minutes || durationMinutes || "—"}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {t("summary", "minutes")}
                      </p>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-gray-700">
                      <MessageCircle className="w-5 h-5 mx-auto text-green-400 mb-1" />
                      <p className="text-white font-bold text-lg">
                        {summary.total_captions}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {t("summary", "captions")}
                      </p>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-gray-700">
                      <Globe className="w-5 h-5 mx-auto text-purple-400 mb-1" />
                      <p className="text-white font-bold text-lg">
                        {summary.total_translations}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {t("summary", "translations")}
                      </p>
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
                          <Badge
                            key={i}
                            className="bg-purple-500/20 text-purple-300 border-purple-500/30"
                          >
                            {ko ? topic.label_ko : topic.label_es} ({topic.count})
                          </Badge>
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
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="text-gray-200 font-medium min-w-[80px]">
                              {v.original}
                            </span>
                            <ChevronRight className="w-3 h-3 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-400">
                              {v.translated}
                            </span>
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
                          <p
                            key={i}
                            className="text-gray-300 text-sm pl-3 border-l-2 border-green-500/40"
                          >
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
            <div className="space-y-4">
              {/* Add note button */}
              {!showNoteForm && (
                <Button
                  onClick={() => setShowNoteForm(true)}
                  className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("notes", "addNote")}
                </Button>
              )}

              {/* Note form */}
              {showNoteForm && (
                <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold text-sm">
                      {t("notes", "addNote")}
                    </h3>
                    <button
                      onClick={() => setShowNoteForm(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Note type selector */}
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">
                      {t("notes", "type")}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["general", "vocabulary", "grammar", "cultural", "pronunciation"].map(
                        (type) => (
                          <button
                            key={type}
                            onClick={() => setNoteType(type)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              noteType === type
                                ? "bg-purple-600 text-white"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                          >
                            {t("notes", type)}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">
                      {t("notes", "content")}
                    </label>
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={4}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                      placeholder={
                        ko
                          ? "학습 내용을 메모하세요..."
                          : "Escribe tus notas de aprendizaje..."
                      }
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">
                      {t("notes", "tags")}
                    </label>
                    <Input
                      value={noteTags}
                      onChange={(e) => setNoteTags(e.target.value)}
                      className="bg-gray-700/50 border-gray-600 text-white text-sm"
                      placeholder={
                        ko ? "한국어, 인사, 문화" : "coreano, saludos, cultura"
                      }
                    />
                  </div>

                  {/* Public/Private toggle + Save */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setNotePublic(!notePublic)}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className={`w-8 h-4 rounded-full transition-colors ${
                          notePublic ? "bg-green-500" : "bg-gray-600"
                        } relative`}
                      >
                        <div
                          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                            notePublic ? "left-4" : "left-0.5"
                          }`}
                        />
                      </div>
                      <span className="text-gray-300">
                        {notePublic ? t("notes", "public") : t("notes", "private")}
                      </span>
                    </button>

                    <Button
                      onClick={handleSaveNote}
                      disabled={!noteContent.trim() || noteSaving}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {noteSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Send className="w-4 h-4 mr-1" />
                      )}
                      {t("notes", "save")}
                    </Button>
                  </div>
                </div>
              )}

              {/* Notes list */}
              {notes.length === 0 && !showNoteForm && (
                <div className="text-center py-12">
                  <StickyNote className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">{t("notes", "noNotes")}</p>
                </div>
              )}

              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-gray-800/60 rounded-xl p-4 border border-gray-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={noteTypeColors[note.note_type] || noteTypeColors.general}>
                      {t("notes", note.note_type)}
                    </Badge>
                    <span className="text-gray-500 text-xs">
                      {new Date(note.created_at).toLocaleDateString(
                        ko ? "ko-KR" : "es-ES",
                      )}
                    </span>
                  </div>
                  <p className="text-gray-200 text-sm whitespace-pre-wrap">
                    {note.content}
                  </p>
                  {note.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ========== RATING TAB ========== */}
          {activeTab === "rating" && (
            <div className="space-y-6">
              {ratingSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">
                    {t("rating", "submitted")}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {t("rating", "submittedMsg")}
                  </p>
                </div>
              ) : (
                <>
                  {/* Partner info */}
                  {partnerName && (
                    <div className="flex items-center gap-3 bg-gray-800/60 rounded-xl p-4 border border-gray-700">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <span className="text-white font-bold">
                          {partnerName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {partnerName}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {durationMinutes
                            ? `${durationMinutes} ${t("summary", "minutes")}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Overall rating */}
                  <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700 text-center">
                    <h3 className="text-white font-semibold mb-3">
                      {t("rating", "overall")}
                    </h3>
                    <div className="flex justify-center">
                      <StarRating value={overallRating} onChange={setOverallRating} />
                    </div>
                  </div>

                  {/* Breakdown ratings */}
                  <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700 space-y-4">
                    {[
                      {
                        label: t("rating", "communication"),
                        value: communicationRating,
                        set: setCommunicationRating,
                      },
                      {
                        label: t("rating", "attitude"),
                        value: attitudeRating,
                        set: setAttitudeRating,
                      },
                      {
                        label: t("rating", "helpfulness"),
                        value: helpfulnessRating,
                        set: setHelpfulnessRating,
                      },
                      {
                        label: t("rating", "languageSkill"),
                        value: languageSkillRating,
                        set: setLanguageSkillRating,
                      },
                    ].map(({ label, value, set }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between"
                      >
                        <span className="text-gray-300 text-sm">{label}</span>
                        <StarRating value={value} onChange={set} size="sm" />
                      </div>
                    ))}
                  </div>

                  {/* Comment */}
                  <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700">
                    <label className="text-gray-400 text-xs mb-2 block">
                      {t("rating", "comment")}
                    </label>
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
                    <Button
                      variant="ghost"
                      onClick={onClose}
                      className="flex-1 text-gray-400 hover:text-white"
                    >
                      {t("rating", "skip")}
                    </Button>
                    <Button
                      onClick={handleSubmitRating}
                      disabled={overallRating === 0 || ratingSubmitting}
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
