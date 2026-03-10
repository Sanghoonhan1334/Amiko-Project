"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import {
  Circle,
  Square,
  Loader2,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RecordingControlsProps {
  sessionId: string;
  userId: string;
  isInitiator?: boolean;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
}

type RecordingState =
  | "idle"
  | "requesting"
  | "waiting_consent"
  | "recording"
  | "stopped";
type ConsentState = "pending" | "granted" | "denied";

export default function RecordingControls({
  sessionId,
  userId,
  isInitiator = false,
  onRecordingStart,
  onRecordingStop,
}: RecordingControlsProps) {
  const { language } = useLanguage();
  const ko = language === "ko";

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [consentState, setConsentState] = useState<ConsentState>("pending");
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabaseChannelRef = useRef<ReturnType<
    ReturnType<typeof createSupabaseBrowserClient>["channel"]
  > | null>(null);

  const t = useCallback(
    (key: string) => {
      const translations: Record<string, Record<string, string>> = {
        requestRecording: {
          ko: "녹화 요청",
          es: "Solicitar Grabación",
        },
        stopRecording: { ko: "녹화 중지", es: "Detener Grabación" },
        recording: { ko: "녹화 중", es: "Grabando" },
        waitingConsent: { ko: "동의 대기 중...", es: "Esperando consentimiento..." },
        consentRequest: {
          ko: "상대방이 녹화를 요청했습니다",
          es: "El otro participante solicita grabar esta sesión",
        },
        accept: { ko: "동의", es: "Aceptar" },
        decline: { ko: "거절", es: "Rechazar" },
        consentGranted: { ko: "녹화 동의됨", es: "Grabación aceptada" },
        consentDenied: {
          ko: "녹화가 거부되었습니다",
          es: "Grabación rechazada",
        },
        consentRequired: {
          ko: "모든 참가자의 동의가 필요합니다",
          es: "Se requiere consentimiento de todos",
        },
      };
      return translations[key]?.[ko ? "ko" : "es"] ?? key;
    },
    [ko],
  );

  // Listen for recording consent events via Supabase Realtime
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(`vc-recording:${sessionId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "recording_request" }, ({ payload }) => {
        if (payload.requesterId !== userId) {
          setRecordingId(payload.recordingId);
          setShowConsentModal(true);
        }
      })
      .on("broadcast", { event: "recording_consent" }, ({ payload }) => {
        if (payload.consented) {
          setConsentState("granted");
          setRecordingState("recording");
          onRecordingStart?.();
        } else {
          setConsentState("denied");
          setRecordingState("idle");
          setError(t("consentDenied"));
          setTimeout(() => setError(null), 3000);
        }
      })
      .on("broadcast", { event: "recording_stop" }, () => {
        setRecordingState("stopped");
        onRecordingStop?.();
      })
      .subscribe();

    supabaseChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRequestRecording = useCallback(async () => {
    setRecordingState("requesting");
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `/api/meet/sessions/${sessionId}/recording`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "start" }),
        },
      );

      if (!res.ok) throw new Error("Failed to start recording request");
      const data = await res.json();
      setRecordingId(data.recording?.id || null);
      setRecordingState("waiting_consent");

      // Broadcast recording request to other participants
      supabaseChannelRef.current?.send({
        type: "broadcast",
        event: "recording_request",
        payload: {
          requesterId: userId,
          recordingId: data.recording?.id,
        },
      });
    } catch {
      setRecordingState("idle");
      setError(ko ? "녹화 요청 실패" : "Error al solicitar grabación");
      setTimeout(() => setError(null), 3000);
    }
  }, [sessionId, userId, ko]);

  const handleConsentResponse = useCallback(
    async (consented: boolean) => {
      setShowConsentModal(false);
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        await fetch(`/api/meet/sessions/${sessionId}/recording`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "consent",
            recording_id: recordingId,
            consented,
          }),
        });

        // Broadcast consent decision
        supabaseChannelRef.current?.send({
          type: "broadcast",
          event: "recording_consent",
          payload: { userId, consented },
        });

        if (consented) {
          setRecordingState("recording");
          onRecordingStart?.();
        }
      } catch {
        // Consent submission failed — silently ignore
      }
    },
    [sessionId, recordingId, userId, onRecordingStart],
  );

  const handleStopRecording = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`/api/meet/sessions/${sessionId}/recording`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: "stop", recording_id: recordingId }),
      });

      supabaseChannelRef.current?.send({
        type: "broadcast",
        event: "recording_stop",
        payload: { userId },
      });

      setRecordingState("stopped");
      onRecordingStop?.();
    } catch {
      // Stop failed — silently ignore
    }
  }, [sessionId, recordingId, userId, onRecordingStop]);

  return (
    <>
      {/* Recording button in controls bar */}
      {recordingState === "idle" && (
        <button
          onClick={handleRequestRecording}
          title={t("requestRecording")}
          className="w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-500 text-white flex items-center justify-center transition-colors"
        >
          <Circle className="w-5 h-5 text-red-400" />
        </button>
      )}

      {recordingState === "requesting" && (
        <button
          disabled
          className="w-12 h-12 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center cursor-not-allowed"
        >
          <Loader2 className="w-5 h-5 animate-spin" />
        </button>
      )}

      {recordingState === "waiting_consent" && (
        <button
          disabled
          title={t("waitingConsent")}
          className="w-12 h-12 rounded-full bg-yellow-600/50 text-yellow-300 flex items-center justify-center cursor-not-allowed animate-pulse"
        >
          <Circle className="w-5 h-5" />
        </button>
      )}

      {recordingState === "recording" && (
        <button
          onClick={handleStopRecording}
          title={t("stopRecording")}
          className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>
      )}

      {/* Recording indicator */}
      {recordingState === "recording" && (
        <div className="absolute top-14 right-4 z-10">
          <Badge className="bg-red-600 text-white animate-pulse flex items-center gap-1.5 text-xs px-2 py-1">
            <Circle className="w-2.5 h-2.5 fill-current" />
            {t("recording")}
          </Badge>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 z-20">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Consent modal overlay */}
      {showConsentModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Circle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">
                  {ko ? "녹화 요청" : "Solicitud de Grabación"}
                </h3>
                <p className="text-gray-400 text-xs">
                  {t("consentRequired")}
                </p>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-6">
              {t("consentRequest")}
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleConsentResponse(false)}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <X className="w-4 h-4 mr-1" />
                {t("decline")}
              </Button>
              <Button
                onClick={() => handleConsentResponse(true)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-1" />
                {t("accept")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
