"use client";

import { Suspense } from "react";
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

function VideoRoomContent() {
  const searchParams = useSearchParams();

  const channel = searchParams.get("channel") || "";
  const token = searchParams.get("token") || "";
  const uid = parseInt(searchParams.get("uid") || "0");
  const appId = searchParams.get("appId") || "";
  const sessionId = searchParams.get("sessionId") || "";
  const title = searchParams.get("title") || "Video Call";
  const isHost = searchParams.get("isHost") === "true";
  const durationMinutes = searchParams.get("durationMinutes")
    ? parseInt(searchParams.get("durationMinutes")!)
    : 30;
  const tokenExpiresIn = searchParams.get("tokenExpiresIn")
    ? parseInt(searchParams.get("tokenExpiresIn")!)
    : undefined;

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
      onLeave={() => window.close()}
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
