"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import {
  Award,
  Star,
  TrendingUp,
  Users,
  Shield,
  Crown,
  Gem,
  Medal,
  Loader2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { UserReputation } from "@/types/meet";

interface ReputationBadgeProps {
  userId: string;
  compact?: boolean;
  showModal?: boolean;
}

type DisplayTier = "newcomer" | "beginner" | "regular" | "active" | "trusted" | "expert" | "ambassador";

const tierConfig: Record<
  DisplayTier,
  { icon: typeof Award; color: string; bg: string; label_ko: string; label_es: string }
> = {
  newcomer: {
    icon: Users,
    color: "text-gray-400",
    bg: "bg-gray-500/20",
    label_ko: "신입",
    label_es: "Nuevo",
  },
  beginner: {
    icon: Shield,
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    label_ko: "초보자",
    label_es: "Principiante",
  },
  regular: {
    icon: Medal,
    color: "text-green-400",
    bg: "bg-green-500/20",
    label_ko: "일반",
    label_es: "Regular",
  },
  active: {
    icon: Medal,
    color: "text-teal-400",
    bg: "bg-teal-500/20",
    label_ko: "활동적",
    label_es: "Activo",
  },
  trusted: {
    icon: Award,
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
    label_ko: "신뢰",
    label_es: "Confiable",
  },
  expert: {
    icon: Gem,
    color: "text-purple-400",
    bg: "bg-purple-500/20",
    label_ko: "전문가",
    label_es: "Experto",
  },
  ambassador: {
    icon: Crown,
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    label_ko: "대사",
    label_es: "Embajador",
  },
};

export default function ReputationBadge({
  userId,
  compact = false,
  showModal: enableModal = true,
}: ReputationBadgeProps) {
  const { language } = useLanguage();
  const ko = language === "ko";

  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch(`/api/meet/users/${userId}/reputation`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setReputation(data.reputation);
        }
      } catch {
        // failed to load reputation
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) {
    return compact ? null : (
      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
    );
  }

  if (!reputation) return null;

  const tier = (reputation.reputation_tier as DisplayTier) || "newcomer";
  const config = tierConfig[tier] || tierConfig.newcomer;
  const TierIcon = config.icon;

  if (compact) {
    return (
      <button
        onClick={() => enableModal && setShowDetail(true)}
        className={`inline-flex items-center gap-1 ${config.bg} ${config.color} px-2 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80`}
      >
        <TierIcon className="w-3 h-3" />
        {ko ? config.label_ko : config.label_es}
        {reputation.avg_overall > 0 && (
          <>
            <Star className="w-2.5 h-2.5 fill-current" />
            {reputation.avg_overall.toFixed(1)}
          </>
        )}
      </button>
    );
  }

  return (
    <>
      {/* Inline reputation card */}
      <button
        onClick={() => enableModal && setShowDetail(true)}
        className="bg-gray-800/60 rounded-xl p-4 border border-gray-700 w-full text-left hover:bg-gray-800/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center`}
          >
            <TierIcon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-sm ${config.color}`}>
                {ko ? config.label_ko : config.label_es}
              </span>
              {reputation.avg_overall > 0 && (
                <div className="flex items-center gap-0.5">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-400 text-xs font-medium">
                    {reputation.avg_overall.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
            <p className="text-gray-400 text-xs">
              {reputation.total_sessions}{" "}
              {ko ? "세션" : "sesiones"}
            </p>
          </div>
          <TrendingUp className="w-4 h-4 text-gray-500" />
        </div>
      </button>

      {/* Detail modal */}
      {showDetail && (
        <div
          className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDetail(false)}
        >
          <div
            className="bg-gray-800 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl border border-gray-700 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-lg">
                {ko ? "평판 프로필" : "Perfil de Reputación"}
              </h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tier badge */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className={`w-14 h-14 rounded-full ${config.bg} flex items-center justify-center`}
              >
                <TierIcon className={`w-7 h-7 ${config.color}`} />
              </div>
              <div>
                <p className={`font-bold text-lg ${config.color}`}>
                  {ko ? config.label_ko : config.label_es}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {reputation.avg_overall > 0 && (
                    <>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-3.5 h-3.5 ${
                              n <= Math.round(reputation.avg_overall)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-gray-400 text-xs">
                        ({reputation.total_ratings_received})
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-700/40 rounded-lg p-3 text-center">
                <p className="text-white font-bold text-lg">
                  {reputation.total_sessions}
                </p>
                <p className="text-gray-400 text-xs">
                  {ko ? "총 세션" : "Total Sesiones"}
                </p>
              </div>
              <div className="bg-gray-700/40 rounded-lg p-3 text-center">
                <p className="text-white font-bold text-lg">
                  {reputation.avg_overall > 0
                    ? reputation.avg_overall.toFixed(1)
                    : "—"}
                </p>
                <p className="text-gray-400 text-xs">
                  {ko ? "평균 평점" : "Promedio"}
                </p>
              </div>
            </div>

            {/* Breakdown */}
            {reputation.avg_overall > 0 && (
              <div className="space-y-3 mb-6">
                <h4 className="text-gray-400 text-xs uppercase font-medium">
                  {ko ? "세부 평가" : "Desglose"}
                </h4>
                {[
                  {
                    label: ko ? "의사소통" : "Comunicación",
                    value: reputation.avg_communication,
                  },
                  {
                    label: ko ? "태도" : "Actitud",
                    value: reputation.avg_respect,
                  },
                  {
                    label: ko ? "도움 정도" : "Disposición",
                    value: reputation.avg_helpfulness,
                  },
                  {
                    label: ko ? "언어 실력" : "Habilidad",
                    value: reputation.avg_language_skill,
                  },
                ].map(
                  ({ label, value }) =>
                    value > 0 && (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-gray-300 text-sm flex-1">
                          {label}
                        </span>
                        <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${(value / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-xs w-6 text-right">
                          {value.toFixed(1)}
                        </span>
                      </div>
                    ),
                )}
              </div>
            )}

            {/* Badges */}
            {reputation.badges_earned && Object.keys(reputation.badges_earned).length > 0 && (
              <div>
                <h4 className="text-gray-400 text-xs uppercase font-medium mb-2">
                  {ko ? "배지" : "Insignias"}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(reputation.badges_earned).map(([badge, count], i) => (
                    <Badge
                      key={i}
                      className="bg-purple-500/20 text-purple-300 border-purple-500/30"
                    >
                      {badge} {count > 1 ? `×${count}` : ""}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
