"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Agora
const VideoRoom = dynamic(() => import("@/components/videocall/VideoRoom"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-sm">Connecting to video room...</p>
      </div>
    </div>
  ),
});

const VCPostSession = dynamic(() => import("@/components/videocall/VCPostSession"), {
  ssr: false,
});

function VideoRoomContent() {
  const searchParams = useSearchParams();

  // Room state: "call" | "post-session"
  const [roomPhase, setRoomPhase] = useState<"call" | "post-session">("call");

  // Read session ID from URL — all sensitive data comes from sessionStorage
  const sid = searchParams.get("sid") || searchParams.get("sessionId") || "";

  // Retrieve Agora credentials from sessionStorage (stored before navigation)
  const roomDataRaw = typeof window !== "undefined" ? sessionStorage.getItem(`vc_room_${sid}`) : null;
  const roomData = roomDataRaw ? JSON.parse(roomDataRaw) : null;

  const channel = roomData?.channel || "";
  const token = roomData?.token || "";
  const uid = roomData?.uid || 0;
  const appId = roomData?.appId || "";
  const sessionId = roomData?.sessionId || sid;
  const title = roomData?.title || "Video Call";
  const isHost = roomData?.isHost || false;
  const durationMinutes = roomData?.durationMinutes || 30;
  const tokenExpiresIn = roomData?.tokenExpiresIn || undefined;
  const hostName = roomData?.hostName || roomData?.title || "Host";

  // Clean up sessionStorage after reading (one-time use)
  useEffect(() => {
    if (sid) {
      sessionStorage.removeItem(`vc_room_${sid}`);
    }
  }, [sid]);

  if (!channel || !token || !appId) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-lg font-medium mb-2">Invalid Room Parameters</p>
          <p className="text-sm text-gray-400">
            Missing required connection parameters.
          </p>
          <button
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Phase 5: Show post-session view after leaving the call
  if (roomPhase === "post-session") {
    return (
      <VCPostSession
        sessionId={sessionId}
        hostName={hostName}
        isHost={isHost}
        durationMinutes={durationMinutes}
        onClose={() => window.close()}
      />
    );
  }

  return (
    <VideoRoom
      channel={channel}
      token={token}
      uid={uid}
      appId={appId}
      sessionId={sessionId}
      title={title}
      isHost={isHost}
      durationMinutes={durationMinutes}
      tokenExpiresIn={tokenExpiresIn}
      onLeave={() => setRoomPhase("post-session")}
    />
  );
}

export default function VideoRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VideoRoomContent />
    </Suspense>
  );
}
