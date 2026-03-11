"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
} from "agora-rtc-sdk-ng";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageCircle,
  Hand,
  ScreenShare,
  ScreenShareOff,
  Heart,
  ThumbsUp,
  PartyPopper,
  Smile,
  Send,
  Clock,
  Users,
  X,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Subtitles,
  Settings,
  Flag,
  Loader2,
  Circle,
  Square,
  Shield,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CaptionOverlay from "@/components/videocall/CaptionOverlay";
import CaptionSettings from "@/components/videocall/CaptionSettings";
import GlossaryTooltip from "@/components/videocall/GlossaryTooltip";
import { useBrowserSTT } from "@/hooks/useBrowserSTT";
import { useCaptionStream } from "@/hooks/useCaptionStream";
import { useTranslationStream, useTranslationPreferences } from "@/hooks/useTranslationStream";

interface VideoRoomProps {
  channel: string;
  token: string;
  uid: number;
  appId: string;
  sessionId: string;
  title: string;
  durationMinutes?: number;
  isHost?: boolean;
  tokenExpiresIn?: number;
  onLeave?: () => void;
}

interface ChatMessage {
  id: string;
  sender: string;
  senderUid: number;
  text: string;
  timestamp: number;
  type: "text" | "reaction" | "system";
}

const REACTIONS = [
  { emoji: "❤️", icon: Heart },
  { emoji: "👍", icon: ThumbsUp },
  { emoji: "🎉", icon: PartyPopper },
  { emoji: "😊", icon: Smile },
  { emoji: "👋", icon: Hand },
];

export default function VideoRoom({
  channel,
  token,
  uid,
  appId,
  sessionId,
  title,
  durationMinutes = 30,
  isHost = false,
  onLeave,
}: VideoRoomProps) {
  const { t } = useLanguage();
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null);
  const supabaseChannelRef = useRef<ReturnType<
    ReturnType<typeof createSupabaseBrowserClient>["channel"]
  > | null>(null);

  const [localAudioTrack, setLocalAudioTrack] =
    useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] =
    useState<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [hasMic, setHasMic] = useState(true);
  const [hasCamera, setHasCamera] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [floatingReactions, setFloatingReactions] = useState<
    { id: string; emoji: string }[]
  >([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Caption state ──
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [showCaptionSettings, setShowCaptionSettings] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // ── Phase 5: Consent & Recording state ──
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentRecording, setConsentRecording] = useState(false);
  const [consentTranscription, setConsentTranscription] = useState(false);
  const [consentTranslation, setConsentTranslation] = useState(false);
  const [consentSaved, setConsentSaved] = useState(false);
  const [recordingState, setRecordingState] = useState<"idle" | "requesting" | "recording" | "stopped">("idle");
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [allConsented, setAllConsented] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [captionPrefs, setCaptionPrefs] = useState<{
    captions_enabled: boolean;
    font_size: "small" | "medium" | "large";
    position: "top" | "bottom";
    speaking_language: "ko" | "es" | "en";
  }>({
    captions_enabled: true,
    font_size: "medium",
    position: "bottom",
    speaking_language: "es",
  });
  const [localCaptions, setLocalCaptions] = useState<
    { id?: string; speaker_uid?: number; speaker_name?: string; content: string; language: string; is_final: boolean; timestamp_ms: number }[]
  >([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const tracksRef = useRef<{
    audio: IMicrophoneAudioTrack | null;
    video: ICameraVideoTrack | null;
  }>({ audio: null, video: null });

  // ── Glossary state ──
  const [glossaryMatches, setGlossaryMatches] = useState<
    Array<{ term: string; translation: string; description?: string; category: string; rule: string }>
  >([]);
  const glossaryRef = useRef<
    Array<{ term_original: string; term_translated: string; description: string; category: string; translation_rule: string; source_language: string }>
  >([]);

  // ── Caption hooks ──
  const { captions: streamCaptions } = useCaptionStream({
    sessionId,
    enabled: captionsEnabled && captionPrefs.captions_enabled,
  });

  const handleLocalCaption = useCallback(
    (evt: { speaker_uid?: number; speaker_name?: string; content: string; language: string; is_final: boolean; timestamp_ms: number }) => {
      setLocalCaptions((prev) => {
        // Replace last partial from same speaker, or append
        if (!evt.is_final) {
          const lastIdx = prev.findLastIndex(
            (c) => c.speaker_uid === evt.speaker_uid && !c.is_final
          );
          if (lastIdx >= 0) {
            const updated = [...prev];
            updated[lastIdx] = evt;
            return updated.slice(-50);
          }
        }
        return [...prev, evt].slice(-50);
      });
    },
    []
  );

  const { isListening: sttListening, isSupported: sttSupported } = useBrowserSTT({
    sessionId,
    uid,
    enabled: captionsEnabled && captionPrefs.captions_enabled,
    speakingLanguage: captionPrefs.speaking_language,
    onCaption: handleLocalCaption,
  });

  // Merge local (immediate) and stream (from other participants) captions
  const allCaptions = [...streamCaptions, ...localCaptions]
    .sort((a, b) => a.timestamp_ms - b.timestamp_ms)
    .slice(-50);

  // ── Glossary matching: scan latest caption for cultural terms ──
  useEffect(() => {
    if (!captionsEnabled || allCaptions.length === 0 || glossaryRef.current.length === 0) return;
    const latest = allCaptions[allCaptions.length - 1];
    if (!latest?.is_final) return;

    const text = latest.content.toLowerCase();
    const matches = glossaryRef.current
      .filter((g) => text.includes(g.term_original.toLowerCase()))
      .map((g) => ({
        term: g.term_original,
        translation: g.term_translated,
        description: g.description || undefined,
        category: g.category,
        rule: g.translation_rule,
      }));

    if (matches.length > 0) setGlossaryMatches(matches);
  }, [allCaptions, captionsEnabled]);

  // ── Phase 3: Translation hooks ──
  const {
    preferences: translationPrefs,
    updatePreferences: updateTranslationPrefs,
  } = useTranslationPreferences();

  const { translations } = useTranslationStream({
    sessionId,
    enabled: captionsEnabled && captionPrefs.captions_enabled && translationPrefs.display_mode !== "original_only",
    targetLanguage: translationPrefs.target_language,
  });

  // ── Load caption preferences on mount ──
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const res = await fetch("/api/users/me/caption-preferences?module=vc");
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) {
            setCaptionPrefs(data.preferences);
          }
        }
      } catch {
        // Use defaults
      }
    };
    loadPrefs();
  }, []);

  // ── Load cultural glossary on mount ──
  useEffect(() => {
    const loadGlossary = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase
          .from("amiko_meet_cultural_glossaries")
          .select("term_original, term_translated, description, category, translation_rule, source_language")
          .eq("is_active", true);
        if (data) glossaryRef.current = data;
      } catch {
        // Non-critical
      }
    };
    loadGlossary();
  }, []);

  // ── Save caption preferences when they change ──
  const updateCaptionPrefs = useCallback(
    async (updates: Partial<typeof captionPrefs>) => {
      const newPrefs = { ...captionPrefs, ...updates };
      setCaptionPrefs(newPrefs);
      try {
        await fetch("/api/users/me/caption-preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...updates, module: "vc" }),
        });
      } catch {
        // Non-critical
      }
    },
    [captionPrefs]
  );

  // ── Start/stop caption task when host toggles ──
  const handleToggleCaptions = useCallback(async () => {
    const newState = !captionsEnabled;
    setCaptionsEnabled(newState);

    // If host, also start/stop the STT task on backend
    if (isHost) {
      try {
        const endpoint = newState ? "start" : "stop";
        await fetch(`/api/video/sessions/${sessionId}/captions/${endpoint}`, {
          method: "POST",
        });
      } catch {
        // Non-critical — local captions still work
      }
    }
  }, [captionsEnabled, isHost, sessionId]);

  // --- Supabase Realtime Chat Channel ---
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const realtimeChannel = supabase.channel(`vc-room:${sessionId}`, {
      config: { broadcast: { self: false } },
    });

    realtimeChannel
      .on("broadcast", { event: "chat" }, ({ payload }) => {
        if (!mountedRef.current) return;
        setChatMessages((prev) => [
          ...prev,
          {
            id: payload.id,
            sender: payload.sender,
            senderUid: payload.senderUid,
            text: payload.text,
            timestamp: payload.timestamp,
            type: "text",
          },
        ]);
        setUnreadCount((prev) => prev + 1);
      })
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        if (!mountedRef.current) return;
        const reactionId = `remote-${Date.now()}-${Math.random()}`;
        setFloatingReactions((prev) => [
          ...prev,
          { id: reactionId, emoji: payload.emoji },
        ]);
        setTimeout(() => {
          setFloatingReactions((prev) =>
            prev.filter((r) => r.id !== reactionId),
          );
        }, 2500);
        setChatMessages((prev) => [
          ...prev,
          {
            id: payload.id,
            sender: payload.sender,
            senderUid: payload.senderUid,
            text: payload.emoji,
            timestamp: payload.timestamp,
            type: "reaction",
          },
        ]);
      })
      .on("broadcast", { event: "system" }, ({ payload }) => {
        if (!mountedRef.current) return;
        setChatMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            sender: "system",
            senderUid: 0,
            text: payload.text,
            timestamp: Date.now(),
            type: "system",
          },
        ]);
      })
      .subscribe();

    supabaseChannelRef.current = realtimeChannel;

    return () => {
      supabase.removeChannel(realtimeChannel);
      supabaseChannelRef.current = null;
    };
  }, [sessionId]);

  // --- Initialize Agora Client ---
  useEffect(() => {
    mountedRef.current = true;
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    clientRef.current = client;

    const init = async () => {
      try {
        client.on("user-joined", (user) => {
          setRemoteUsers((prev) => {
            const exists = prev.find((u) => u.uid === user.uid);
            if (exists) return prev;
            return [...prev, user];
          });
          broadcastSystem(`A new user joined`);
        });

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === "video") {
            setRemoteUsers((prev) =>
              prev.map((u) => (u.uid === user.uid ? user : u)),
            );
          }
          if (mediaType === "audio") {
            user.audioTrack?.play();
          }
        });

        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "video") {
            setRemoteUsers((prev) =>
              prev.map((u) => (u.uid === user.uid ? user : u)),
            );
          }
        });

        client.on("user-left", (user) => {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
          broadcastSystem(`User ${user.uid} left`);
        });

        await client.join(appId, channel, token, uid);
        if (!mountedRef.current) return;

        // Create audio and video tracks independently so a missing device
        // doesn't block the entire connection (mirrors Google Meet behaviour).
        let audioTrack: IMicrophoneAudioTrack | null = null;
        let videoTrack: ICameraVideoTrack | null = null;

        try {
          audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          if (!mountedRef.current) {
            audioTrack.close();
            return;
          }
        } catch (e) {
          console.warn("[VideoRoom] Microphone not available:", e);
          if (mountedRef.current) setHasMic(false);
        }

        try {
          videoTrack = await AgoraRTC.createCameraVideoTrack();
          if (!mountedRef.current) {
            videoTrack.close();
            return;
          }
        } catch (e) {
          console.warn("[VideoRoom] Camera not available:", e);
          if (mountedRef.current) setHasCamera(false);
        }

        if (!mountedRef.current) {
          audioTrack?.close();
          videoTrack?.close();
          return;
        }

        tracksRef.current = { audio: audioTrack, video: videoTrack };
        if (audioTrack) setLocalAudioTrack(audioTrack);
        if (videoTrack) setLocalVideoTrack(videoTrack);

        const tracksToPublish = [audioTrack, videoTrack].filter(Boolean) as (
          | IMicrophoneAudioTrack
          | ICameraVideoTrack
        )[];
        if (tracksToPublish.length > 0) {
          await client.publish(tracksToPublish);
          if (!mountedRef.current) return;
        }

        if (videoTrack && localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }

        setConnected(true);
        addLocalSystemMessage(t("vcMarketplace.videoRoom.connected"));
        broadcastSystem(`User ${uid} joined`);

        // Report presence join to backend
        fetch(`/api/video/sessions/${sessionId}/presence/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            device_info: {
              platform: navigator.platform,
              language: navigator.language,
              screen: `${screen.width}x${screen.height}`,
            },
          }),
        }).catch(() => {});
      } catch (err: any) {
        // OPERATION_ABORTED is thrown by Agora when the client is torn down
        // mid-operation (e.g. component unmount). Suppress it — it is not a
        // real error that the user needs to see.
        if (
          err?.code === "OPERATION_ABORTED" ||
          err?.message?.includes("OPERATION_ABORTED")
        ) {
          return;
        }
        console.error("[VideoRoom] Init error:", err);
        if (mountedRef.current) {
          setError(err.message || "Failed to connect to video service");
        }
      }
    };

    init();

    return () => {
      mountedRef.current = false;
      tracksRef.current.audio?.close();
      tracksRef.current.video?.close();
      screenTrackRef.current?.close();
      const state = client.connectionState;
      if (
        state === "CONNECTED" ||
        state === "CONNECTING" ||
        state === "RECONNECTING"
      ) {
        client.leave().catch(() => {});
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setParticipantCount(remoteUsers.length + 1);
  }, [remoteUsers]);

  useEffect(() => {
    if (!connected || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleLeaveRef.current();
          return 0;
        }
        // Show warning at 5 min and 1 min marks
        if (prev === 300) {
          addLocalSystemMessage("⚠️ 5 minutes remaining");
        }
        if (prev === 60) {
          addLocalSystemMessage("⚠️ 1 minute remaining");
        }
        if (prev === 10) {
          addLocalSystemMessage("⚠️ Session closing in 10 seconds");
        }
        return prev - 1;
      });
    }, 1000);

    // Sync with server timer every 60 seconds
    const timerSync = setInterval(async () => {
      try {
        const res = await fetch(`/api/video/sessions/${sessionId}/timer`);
        const data = await res.json();
        if (data.status === "completed") {
          handleLeaveRef.current();
        } else if (typeof data.remaining_seconds === "number") {
          setTimeLeft(data.remaining_seconds);
        }
      } catch {
        // Sync failed, continue with local timer
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(timerSync);
    };
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (showChat) setUnreadCount(0);
  }, [showChat]);

  const addLocalSystemMessage = (text: string) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: "system",
        senderUid: 0,
        text,
        timestamp: Date.now(),
        type: "system",
      },
    ]);
  };

  const broadcastSystem = (text: string) => {
    supabaseChannelRef.current?.send({
      type: "broadcast",
      event: "system",
      payload: { text },
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleToggleAudio = useCallback(async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioOn);
      setIsAudioOn((prev) => !prev);
    }
  }, [localAudioTrack, isAudioOn]);

  const handleToggleVideo = useCallback(async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoOn);
      setIsVideoOn((prev) => !prev);
    }
  }, [localVideoTrack, isVideoOn]);

  const handleScreenShare = useCallback(async () => {
    if (!clientRef.current) return;

    if (isScreenSharing) {
      if (screenTrackRef.current) {
        await clientRef.current.unpublish(screenTrackRef.current);
        screenTrackRef.current.close();
        screenTrackRef.current = null;
      }
      if (localVideoTrack) {
        await clientRef.current.publish(localVideoTrack);
        if (localVideoRef.current) {
          localVideoTrack.play(localVideoRef.current);
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack(
          {},
          "disable",
        );
        const track = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;

        if (localVideoTrack) {
          await clientRef.current.unpublish(localVideoTrack);
        }

        await clientRef.current.publish(track);
        screenTrackRef.current = track;

        track.on("track-ended", () => {
          handleScreenShare();
        });

        if (localVideoRef.current) {
          track.play(localVideoRef.current);
        }

        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen share error:", err);
      }
    }
  }, [isScreenSharing, localVideoTrack]);

  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: `msg-${uid}-${Date.now()}`,
      sender: `User ${uid}`,
      senderUid: uid,
      text: chatInput.trim(),
      timestamp: Date.now(),
      type: "text",
    };
    setChatMessages((prev) => [...prev, msg]);
    supabaseChannelRef.current?.send({
      type: "broadcast",
      event: "chat",
      payload: msg,
    });
    setChatInput("");
  }, [chatInput, uid]);

  const handleReaction = useCallback(
    (emoji: string) => {
      const reactionId = `local-${Date.now()}`;
      setFloatingReactions((prev) => [...prev, { id: reactionId, emoji }]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== reactionId));
      }, 2500);

      const msg: ChatMessage = {
        id: `react-${uid}-${Date.now()}`,
        sender: `User ${uid}`,
        senderUid: uid,
        text: emoji,
        timestamp: Date.now(),
        type: "reaction",
      };
      setChatMessages((prev) => [...prev, msg]);

      supabaseChannelRef.current?.send({
        type: "broadcast",
        event: "reaction",
        payload: { ...msg, emoji },
      });
      setShowReactions(false);
    },
    [uid],
  );

  const handleLeave = useCallback(async () => {
    // Report presence leave to backend
    fetch(`/api/video/sessions/${sessionId}/presence/leave`, {
      method: "POST",
    }).catch(() => {});

    tracksRef.current.audio?.close();
    tracksRef.current.video?.close();
    screenTrackRef.current?.close();
    await clientRef.current?.leave().catch(() => {});
    if (onLeave) onLeave();
    else window.close();
  }, [onLeave, sessionId]);

  // Keep a ref to the latest handleLeave so timer intervals never capture a stale version
  const handleLeaveRef = useRef(handleLeave);
  useEffect(() => {
    handleLeaveRef.current = handleLeave;
  }, [handleLeave]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // ── Phase 5: Consent handlers ──
  const handleSaveConsent = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`/api/video/sessions/${sessionId}/consents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          recording_consent: consentRecording,
          transcription_consent: consentTranscription,
          translation_consent: consentTranslation,
        }),
      });
      setConsentSaved(true);
      setShowConsentModal(false);

      // Broadcast consent update
      supabaseChannelRef.current?.send({
        type: "broadcast",
        event: "consent_update",
        payload: { userId: uid, recording: consentRecording },
      });

      // Refresh consent status
      const res = await fetch(`/api/video/sessions/${sessionId}/consents`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllConsented(data.all_recording_consent);
      }
    } catch {
      // consent save failed
    }
  }, [sessionId, uid, consentRecording, consentTranscription, consentTranslation]);

  // Listen for consent broadcasts from other participants
  useEffect(() => {
    const channel = supabaseChannelRef.current;
    if (!channel) return;

    const handleConsentUpdate = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`/api/video/sessions/${sessionId}/consents`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAllConsented(data.all_recording_consent);
        }
      } catch {}
    };

    channel.on("broadcast", { event: "consent_update" }, handleConsentUpdate);
    return () => {
      channel.off("broadcast", { event: "consent_update" });
    };
  }, [sessionId]);

  // ── Phase 5: Recording handlers ──
  const handleStartRecording = useCallback(async () => {
    if (!allConsented) {
      setShowConsentModal(true);
      return;
    }

    setRecordingState("requesting");

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Create server-side recording record
      const res = await fetch(`/api/video/sessions/${sessionId}/recording/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ recording_type: "audio" }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("[Recording] Start failed:", err.error);
        setRecordingState("idle");
        return;
      }

      const data = await res.json();
      setRecordingId(data.recording?.id || null);

      // Start browser-side MediaRecorder
      try {
        const audioStream = tracksRef.current.audio?.getMediaStreamTrack();
        if (audioStream) {
          const stream = new MediaStream([audioStream]);
          const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
          recordedChunksRef.current = [];

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              recordedChunksRef.current.push(e.data);
            }
          };

          recorder.start(1000); // collect data every second
          mediaRecorderRef.current = recorder;
          setRecordingState("recording");

          // Notify others
          supabaseChannelRef.current?.send({
            type: "broadcast",
            event: "recording_started",
            payload: { userId: uid },
          });
        }
      } catch (mediaErr) {
        console.error("[Recording] MediaRecorder error:", mediaErr);
        setRecordingState("idle");
      }
    } catch {
      setRecordingState("idle");
    }
  }, [sessionId, uid, allConsented]);

  const handleStopRecording = useCallback(async () => {
    try {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
      mediaRecorderRef.current = null;

      setRecordingState("stopped");

      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Upload recorded audio to Supabase Storage
      const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
      const fileName = `vc-recordings/${sessionId}/${Date.now()}.webm`;

      const { data: uploadData } = await supabase.storage
        .from("recordings")
        .upload(fileName, blob, { contentType: "audio/webm" });

      const storageUrl = uploadData?.path
        ? supabase.storage.from("recordings").getPublicUrl(uploadData.path).data.publicUrl
        : undefined;

      // Update server-side recording record
      await fetch(`/api/video/sessions/${sessionId}/recording/stop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          recording_id: recordingId,
          storage_url: storageUrl,
          storage_path: fileName,
          file_size_bytes: blob.size,
          format: "webm",
        }),
      });

      // Notify others
      supabaseChannelRef.current?.send({
        type: "broadcast",
        event: "recording_stopped",
        payload: { userId: uid },
      });

      recordedChunksRef.current = [];
    } catch (err) {
      console.error("[Recording] Stop error:", err);
    }
  }, [sessionId, uid, recordingId]);

  const isLowTime = timeLeft <= 300;

  const totalParticipants = remoteUsers.length + 1;
  const gridCols =
    totalParticipants <= 1
      ? "grid-cols-1"
      : totalParticipants <= 4
        ? "grid-cols-2"
        : totalParticipants <= 9
          ? "grid-cols-3"
          : "grid-cols-4";

  return (
    <div className="fixed inset-0 z-[99999] bg-gray-900 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-medium text-sm truncate max-w-[200px]">
            {title}
          </h3>
          <Badge
            variant="secondary"
            className="text-xs bg-gray-700 text-gray-200"
          >
            <Users className="w-3 h-3 mr-1" />
            {participantCount}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1 text-sm font-mono ${
              isLowTime ? "text-red-400 animate-pulse" : "text-gray-300"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={toggleFullscreen}
            className="text-gray-400 hover:text-white"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 z-10">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Device warning banners */}
      {(!hasMic || !hasCamera) && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 flex flex-col gap-1 z-10 items-center">
          {!hasMic && (
            <div className="bg-yellow-500/90 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
              <MicOff className="w-3.5 h-3.5 flex-shrink-0" />
              No microphone detected — audio disabled
            </div>
          )}
          {!hasCamera && (
            <div className="bg-yellow-500/90 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
              <VideoOff className="w-3.5 h-3.5 flex-shrink-0" />
              No camera detected — video disabled
            </div>
          )}
        </div>
      )}

      {/* Video grid */}
      <div className="flex-1 p-2 overflow-hidden">
        <div className={`grid ${gridCols} gap-2 h-full`}>
          {/* Local video */}
          <div className="relative rounded-lg overflow-hidden bg-gray-800">
            <div ref={localVideoRef} className="w-full h-full" />
            {!isVideoOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <span className="text-2xl text-white font-bold">
                    {uid.toString().charAt(0)}
                  </span>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-1">
              <Badge
                variant="secondary"
                className="text-[10px] bg-black/50 text-white backdrop-blur-sm"
              >
                {t("vcMarketplace.videoRoom.you")}
              </Badge>
              {!isAudioOn && (
                <Badge
                  variant="secondary"
                  className="bg-red-500/70 text-white text-[10px]"
                >
                  <MicOff className="w-2.5 h-2.5" />
                </Badge>
              )}
            </div>
          </div>

          {/* Remote users */}
          {remoteUsers.map((user) => (
            <RemoteVideoPlayer key={user.uid} user={user} />
          ))}
        </div>
      </div>

      {/* Caption overlay */}
      <CaptionOverlay
        captions={allCaptions}
        translations={translations}
        displayMode={translationPrefs.display_mode}
        position={captionPrefs.position}
        fontSize={captionPrefs.font_size}
        visible={captionsEnabled && captionPrefs.captions_enabled}
        currentUid={uid}
      />

      {/* Cultural glossary tooltip */}
      <GlossaryTooltip matches={glossaryMatches} />

      {/* Caption settings panel */}
      <CaptionSettings
        visible={showCaptionSettings}
        onClose={() => setShowCaptionSettings(false)}
        preferences={captionPrefs}
        onUpdate={updateCaptionPrefs}
        translationPreferences={translationPrefs}
        onUpdateTranslation={updateTranslationPrefs}
      />

      {/* Floating reactions */}
      {floatingReactions.map((r) => (
        <div
          key={r.id}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl z-20 pointer-events-none animate-bounce"
        >
          {r.emoji}
        </div>
      ))}

      {/* Chat panel */}
      {showChat && (
        <div className="absolute right-0 top-12 bottom-20 w-80 bg-gray-800/95 backdrop-blur-sm border-l border-gray-700 flex flex-col z-10">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
            <span className="text-white text-sm font-medium">
              {t("vcMarketplace.videoRoom.chat")}
            </span>
            <button
              onClick={() => setShowChat(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`${
                  msg.type === "system"
                    ? "text-center"
                    : msg.type === "reaction"
                      ? "text-center"
                      : ""
                }`}
              >
                {msg.type === "system" ? (
                  <span className="text-[10px] text-gray-500 italic">
                    {msg.text}
                  </span>
                ) : msg.type === "reaction" ? (
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-2xl">{msg.text}</span>
                    <span className="text-[10px] text-gray-500">
                      {msg.sender}
                    </span>
                  </div>
                ) : (
                  <div
                    className={`rounded-lg px-2.5 py-1.5 ${
                      msg.senderUid === uid
                        ? "bg-purple-600/50 ml-6"
                        : "bg-gray-700/50 mr-6"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-medium block ${
                        msg.senderUid === uid
                          ? "text-purple-300"
                          : "text-blue-400"
                      }`}
                    >
                      {msg.senderUid === uid
                        ? t("vcMarketplace.videoRoom.you")
                        : msg.sender}
                    </span>
                    <span className="text-xs text-gray-200">{msg.text}</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-2 border-t border-gray-700 flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendChat();
              }}
              placeholder={t("vcMarketplace.videoRoom.typeMessage")}
              className="h-8 text-xs bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            />
            <Button
              size="sm"
              onClick={handleSendChat}
              className="h-8 w-8 p-0 bg-purple-500 hover:bg-purple-600"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Reactions popup */}
      {showReactions && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-gray-800/95 backdrop-blur-sm rounded-full px-3 py-2 flex gap-2 z-10">
          {REACTIONS.map((r, i) => (
            <button
              key={i}
              onClick={() => handleReaction(r.emoji)}
              className="text-2xl hover:scale-125 transition-transform p-1"
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-800/80 backdrop-blur-sm">
        <button
          onClick={handleToggleAudio}
          disabled={!hasMic}
          title={!hasMic ? "No microphone detected" : undefined}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            !hasMic
              ? "bg-gray-700 text-gray-500 cursor-not-allowed opacity-50"
              : isAudioOn
                ? "bg-gray-600 hover:bg-gray-500 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          {isAudioOn && hasMic ? (
            <Mic className="w-5 h-5" />
          ) : (
            <MicOff className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={handleToggleVideo}
          disabled={!hasCamera}
          title={!hasCamera ? "No camera detected" : undefined}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            !hasCamera
              ? "bg-gray-700 text-gray-500 cursor-not-allowed opacity-50"
              : isVideoOn
                ? "bg-gray-600 hover:bg-gray-500 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          {isVideoOn && hasCamera ? (
            <Video className="w-5 h-5" />
          ) : (
            <VideoOff className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={handleScreenShare}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isScreenSharing
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gray-600 hover:bg-gray-500 text-white"
          }`}
        >
          {isScreenSharing ? (
            <ScreenShareOff className="w-5 h-5" />
          ) : (
            <ScreenShare className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={() => setShowReactions(!showReactions)}
          className="w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-500 text-white flex items-center justify-center transition-colors"
        >
          <Smile className="w-5 h-5" />
        </button>

        <button
          onClick={() => setShowChat(!showChat)}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            showChat
              ? "bg-purple-500 hover:bg-purple-600 text-white"
              : "bg-gray-600 hover:bg-gray-500 text-white"
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          {!showChat && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Captions toggle */}
        <button
          onClick={handleToggleCaptions}
          title={sttSupported ? undefined : "Speech recognition not supported in this browser"}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            captionsEnabled
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-gray-600 hover:bg-gray-500 text-white"
          }`}
        >
          <Subtitles className="w-5 h-5" />
          {captionsEnabled && sttListening && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 animate-pulse" />
          )}
        </button>

        {/* Caption settings */}
        {captionsEnabled && (
          <button
            onClick={() => setShowCaptionSettings(!showCaptionSettings)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              showCaptionSettings
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* Phase 5: Consent button */}
        <button
          onClick={() => setShowConsentModal(true)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            consentSaved
              ? "bg-green-600/30 text-green-400 hover:bg-green-600/50"
              : "bg-gray-700 hover:bg-gray-600 text-gray-300"
          }`}
          title={consentSaved ? (t("vcMarketplace.consent.saved") || "Consent saved") : (t("vcMarketplace.consent.title") || "Consents")}
        >
          <Shield className="w-4 h-4" />
        </button>

        {/* Phase 5: Recording button */}
        {recordingState === "idle" && (
          <button
            onClick={handleStartRecording}
            title={allConsented ? (t("vcMarketplace.recording.start") || "Start recording") : (t("vcMarketplace.recording.needConsent") || "All must consent first")}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              allConsented
                ? "bg-gray-700 hover:bg-gray-600 text-red-400"
                : "bg-gray-700 text-gray-500 cursor-not-allowed opacity-50"
            }`}
          >
            <Circle className="w-4 h-4" />
          </button>
        )}
        {recordingState === "requesting" && (
          <button disabled className="w-10 h-10 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center cursor-not-allowed">
            <Loader2 className="w-4 h-4 animate-spin" />
          </button>
        )}
        {recordingState === "recording" && (
          <button
            onClick={handleStopRecording}
            title={t("vcMarketplace.recording.stop") || "Stop recording"}
            className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors animate-pulse"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>
        )}

        {/* Report button */}
        <button
          onClick={() => setShowReportModal(true)}
          className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-yellow-400 flex items-center justify-center transition-colors"
          title={t("vcMarketplace.moderation.reportButton")}
        >
          <Flag className="w-4 h-4" />
        </button>

        <button
          onClick={handleLeave}
          className="w-14 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      {/* Phase 5: Recording indicator */}
      {recordingState === "recording" && (
        <div className="absolute top-14 right-4 z-10">
          <Badge className="bg-red-600 text-white animate-pulse flex items-center gap-1.5 text-xs px-2 py-1">
            <Circle className="w-2.5 h-2.5 fill-current" />
            {t("vcMarketplace.recording.active") || "REC"}
          </Badge>
        </div>
      )}

      {/* Phase 5: Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-700">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">
                  {t("vcMarketplace.consent.title") || "Session Consents"}
                </h3>
                <p className="text-gray-400 text-xs">
                  {t("vcMarketplace.consent.subtitle") || "Choose what you agree to"}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <label className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 cursor-pointer hover:bg-gray-700/70 transition-colors">
                <input
                  type="checkbox"
                  checked={consentRecording}
                  onChange={(e) => setConsentRecording(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-500 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <p className="text-white text-sm font-medium">
                    {t("vcMarketplace.consent.recording") || "Recording"}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {t("vcMarketplace.consent.recordingDesc") || "Allow audio recording of this session"}
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 cursor-pointer hover:bg-gray-700/70 transition-colors">
                <input
                  type="checkbox"
                  checked={consentTranscription}
                  onChange={(e) => setConsentTranscription(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-500 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <p className="text-white text-sm font-medium">
                    {t("vcMarketplace.consent.transcription") || "Transcription"}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {t("vcMarketplace.consent.transcriptionDesc") || "Allow speech-to-text transcription"}
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 cursor-pointer hover:bg-gray-700/70 transition-colors">
                <input
                  type="checkbox"
                  checked={consentTranslation}
                  onChange={(e) => setConsentTranslation(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-500 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <p className="text-white text-sm font-medium">
                    {t("vcMarketplace.consent.translation") || "Translation"}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {t("vcMarketplace.consent.translationDesc") || "Allow real-time translation"}
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConsentModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
              >
                {t("vcMarketplace.consent.cancel") || "Cancel"}
              </button>
              <button
                onClick={handleSaveConsent}
                className="flex-1 py-2.5 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                {t("vcMarketplace.consent.save") || "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 4: Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-sm font-medium flex items-center gap-2">
                <Flag className="w-4 h-4 text-yellow-400" />
                {t("vcMarketplace.moderation.reportTitle")}
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reason selector */}
            <div className="space-y-2 mb-3">
              <label className="text-gray-400 text-xs">{t("vcMarketplace.moderation.reason")}</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-gray-700 text-gray-200 text-sm rounded px-3 py-2 border border-gray-600"
              >
                <option value="">{t("vcMarketplace.moderation.selectReason")}</option>
                <option value="harassment">{t("vcMarketplace.moderation.reasons.harassment")}</option>
                <option value="insults">{t("vcMarketplace.moderation.reasons.insults")}</option>
                <option value="spam">{t("vcMarketplace.moderation.reasons.spam")}</option>
                <option value="offensive_content">{t("vcMarketplace.moderation.reasons.offensive")}</option>
                <option value="inappropriate_behavior">{t("vcMarketplace.moderation.reasons.inappropriate")}</option>
                <option value="other">{t("vcMarketplace.moderation.reasons.other")}</option>
              </select>
            </div>

            {/* Description */}
            <div className="space-y-2 mb-4">
              <label className="text-gray-400 text-xs">{t("vcMarketplace.moderation.description")}</label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="w-full bg-gray-700 text-gray-200 text-sm rounded px-3 py-2 border border-gray-600 resize-none"
                rows={3}
                placeholder={t("vcMarketplace.moderation.descriptionPlaceholder")}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2 rounded text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
              >
                {t("vcMarketplace.moderation.cancel")}
              </button>
              <button
                onClick={async () => {
                  if (!reportReason) return;
                  setReportSubmitting(true);
                  try {
                    const res = await fetch(`/api/video/sessions/${sessionId}/moderation/report`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        reason: reportReason,
                        description: reportDescription || undefined,
                      }),
                    });
                    if (res.ok) {
                      setShowReportModal(false);
                      setReportReason("");
                      setReportDescription("");
                    }
                  } catch {}
                  setReportSubmitting(false);
                }}
                disabled={!reportReason || reportSubmitting}
                className="flex-1 py-2 rounded text-sm bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
              >
                {reportSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                {t("vcMarketplace.moderation.submit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RemoteVideoPlayer({ user }: { user: IAgoraRTCRemoteUser }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user.videoTrack && containerRef.current) {
      user.videoTrack.play(containerRef.current);
    }
    return () => {
      user.videoTrack?.stop();
    };
  }, [user.videoTrack]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-800">
      <div ref={containerRef} className="w-full h-full" />
      {!user.videoTrack && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <span className="text-2xl text-white font-bold">
              {user.uid.toString().charAt(0)}
            </span>
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2">
        <Badge
          variant="secondary"
          className="text-[10px] bg-black/50 text-white backdrop-blur-sm"
        >
          User {user.uid}
        </Badge>
      </div>
    </div>
  );
}
