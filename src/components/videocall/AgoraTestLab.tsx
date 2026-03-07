"use client";

import { useState, useCallback, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  FlaskConical,
  Play,
  RefreshCw,
  Copy,
  Check,
  Mic,
  MicOff,
  Camera,
  VideoOff,
  Wifi,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import VideoRoom from "./VideoRoom";

interface TestRoomData {
  token: string;
  appId: string;
  uid: number;
  channel: string;
}

type DeviceStatus = "checking" | "ok" | "denied" | "missing";

interface DevicesState {
  mic: DeviceStatus;
  camera: DeviceStatus;
  network: DeviceStatus;
}

function randomChannelName() {
  const adj = [
    "blue",
    "red",
    "swift",
    "cool",
    "happy",
    "bright",
    "dark",
    "wild",
  ];
  const noun = [
    "tiger",
    "koala",
    "panda",
    "river",
    "moon",
    "star",
    "cloud",
    "wave",
  ];
  const num = Math.floor(Math.random() * 1000);
  return `${adj[Math.floor(Math.random() * adj.length)]}-${noun[Math.floor(Math.random() * noun.length)]}-${num}`;
}

async function checkDevices(): Promise<Pick<DevicesState, "mic" | "camera">> {
  const result: Pick<DevicesState, "mic" | "camera"> = {
    mic: "missing",
    camera: "missing",
  };
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasMicDevice = devices.some((d) => d.kind === "audioinput");
    const hasCameraDevice = devices.some((d) => d.kind === "videoinput");
    if (!hasMicDevice && !hasCameraDevice) return result;
    if (hasMicDevice) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        stream.getTracks().forEach((t) => t.stop());
        result.mic = "ok";
      } catch (e: any) {
        result.mic = e?.name === "NotFoundError" ? "missing" : "denied";
      }
    }
    if (hasCameraDevice) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
        stream.getTracks().forEach((t) => t.stop());
        result.camera = "ok";
      } catch (e: any) {
        result.camera = e?.name === "NotFoundError" ? "missing" : "denied";
      }
    }
  } catch {
    // mediaDevices not available
  }
  return result;
}

export default function AgoraTestLab() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<"create" | "join">("create");
  const [channelInput, setChannelInput] = useState(randomChannelName);
  const [joinInput, setJoinInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roomData, setRoomData] = useState<TestRoomData | null>(null);
  const [copied, setCopied] = useState(false);
  const [devices, setDevices] = useState<DevicesState>({
    mic: "checking",
    camera: "checking",
    network: "checking",
  });

  useEffect(() => {
    if (!isExpanded) return;
    let cancelled = false;
    setDevices({ mic: "checking", camera: "checking", network: "checking" });
    checkDevices().then(({ mic, camera }) => {
      if (cancelled) return;
      const network: DeviceStatus = navigator.onLine ? "ok" : "missing";
      setDevices({ mic, camera, network });
    });
    return () => {
      cancelled = true;
    };
  }, [isExpanded]);

  const handleRefreshChannel = useCallback(() => {
    setChannelInput(randomChannelName());
    setError("");
  }, []);

  const handleStartTest = useCallback(async () => {
    const name = mode === "join" ? joinInput.trim() : channelInput.trim();
    if (!name) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/agora/test-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelName: mode === "join" ? joinInput.trim() : channelInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("vcMarketplace.error"));
      setRoomData(data);
    } catch (err: any) {
      setError(err.message || t("vcMarketplace.error"));
    } finally {
      setLoading(false);
    }
  }, [channelInput, joinInput, mode, t]);

  const handleCopyChannel = useCallback(() => {
    navigator.clipboard.writeText(channelInput.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [channelInput]);

  const handleLeave = useCallback(() => {
    setRoomData(null);
    setChannelInput(randomChannelName());
    setJoinInput("");
    setMode("create");
  }, []);

  if (roomData) {
    return (
      <VideoRoom
        channel={roomData.channel}
        token={roomData.token}
        uid={roomData.uid}
        appId={roomData.appId}
        sessionId={`test-${roomData.channel}`}
        title={`${t("vcTestLab.testRoom")}: ${roomData.channel}`}
        durationMinutes={1}
        onLeave={handleLeave}
      />
    );
  }

  if (!user) return null;

  const noDevicesAtAll =
    devices.mic !== "checking" &&
    devices.camera !== "checking" &&
    devices.mic !== "ok" &&
    devices.camera !== "ok";

  function DeviceStatusIcon({ status }: { status: DeviceStatus }) {
    if (status === "checking")
      return <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />;
    if (status === "ok")
      return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    if (status === "denied")
      return <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />;
    return <XCircle className="w-3.5 h-3.5 text-red-500" />;
  }

  const deviceItems: {
    icon: typeof Mic;
    offIcon: typeof MicOff;
    labelKey: string;
    status: DeviceStatus;
  }[] = [
    {
      icon: Mic,
      offIcon: MicOff,
      labelKey: "vcTestLab.checkMic",
      status: devices.mic,
    },
    {
      icon: Camera,
      offIcon: VideoOff,
      labelKey: "vcTestLab.checkCamera",
      status: devices.camera,
    },
    {
      icon: Wifi,
      offIcon: Wifi,
      labelKey: "vcTestLab.checkNetwork",
      status: devices.network,
    },
  ];

  return (
    <div className="rounded-2xl border border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20 overflow-hidden">
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-purple-100/50 dark:hover:bg-purple-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
            {t("vcTestLab.title")}
          </span>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-purple-300 text-purple-500 dark:border-purple-600 dark:text-purple-400"
          >
            {t("vcTestLab.badge")}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-purple-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-purple-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          <div className="flex gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              {t("vcTestLab.info")}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {deviceItems.map(
              ({ icon: Icon, offIcon: OffIcon, labelKey, status }) => {
                const isOk = status === "ok";
                const isChecking = status === "checking";
                const ActiveIcon = isOk || isChecking ? Icon : OffIcon;
                return (
                  <div
                    key={labelKey}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-colors ${
                      isOk
                        ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                        : isChecking
                          ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                          : status === "denied"
                            ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
                            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                    }`}
                  >
                    <ActiveIcon
                      className={`w-5 h-5 ${
                        isOk
                          ? "text-green-500"
                          : isChecking
                            ? "text-gray-400"
                            : status === "denied"
                              ? "text-yellow-500"
                              : "text-red-400"
                      }`}
                    />
                    <span
                      className={`text-[10px] text-center font-medium ${
                        isOk
                          ? "text-green-700 dark:text-green-400"
                          : isChecking
                            ? "text-gray-500"
                            : status === "denied"
                              ? "text-yellow-700 dark:text-yellow-400"
                              : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {t(labelKey)}
                    </span>
                    <DeviceStatusIcon status={status} />
                  </div>
                );
              },
            )}
          </div>

          {noDevicesAtAll && (
            <div className="flex gap-2 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700 dark:text-yellow-300 leading-relaxed">
                {t("vcTestLab.noDevices")}
              </p>
            </div>
          )}

          {(devices.mic === "denied" || devices.camera === "denied") && (
            <div className="flex gap-2 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700 dark:text-yellow-300 leading-relaxed">
                {t("vcTestLab.permissionDenied")}
              </p>
            </div>
          )}

          {/* Mode selector */}
          <div className="flex rounded-xl overflow-hidden border border-purple-200 dark:border-purple-700">
            <button
              onClick={() => {
                setMode("create");
                setError("");
              }}
              className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                mode === "create"
                  ? "bg-purple-500 text-white"
                  : "bg-transparent text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
              }`}
            >
              {t("vcTestLab.createRoom")}
            </button>
            <button
              onClick={() => {
                setMode("join");
                setError("");
              }}
              className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                mode === "join"
                  ? "bg-purple-500 text-white"
                  : "bg-transparent text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
              }`}
            >
              {t("vcTestLab.joinRoom")}
            </button>
          </div>

          {mode === "create" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {t("vcTestLab.channelName")}
              </label>
              <div className="flex gap-2">
                <Input
                  value={channelInput}
                  onChange={(e) => {
                    setChannelInput(e.target.value);
                    setError("");
                  }}
                  placeholder={t("vcTestLab.channelPlaceholder")}
                  className="h-9 text-sm flex-1"
                  maxLength={64}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefreshChannel}
                  className="h-9 w-9 p-0 flex-shrink-0"
                  title={t("vcTestLab.generateRandom")}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyChannel}
                  className="h-9 w-9 p-0 flex-shrink-0"
                  title={t("vcTestLab.copyChannel")}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                {t("vcTestLab.shareHint")}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {t("vcTestLab.joinCode")}
              </label>
              <Input
                value={joinInput}
                onChange={(e) => {
                  setJoinInput(e.target.value);
                  setError("");
                }}
                placeholder={t("vcTestLab.joinCodePlaceholder")}
                className="h-9 text-sm"
                maxLength={64}
                autoFocus
              />
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                {t("vcTestLab.joinCodeHint")}
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            onClick={handleStartTest}
            disabled={
              loading ||
              (mode === "create" ? !channelInput.trim() : !joinInput.trim()) ||
              devices.mic === "checking" ||
              devices.camera === "checking"
            }
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white h-10 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("vcTestLab.connecting")}
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                {noDevicesAtAll
                  ? t("vcTestLab.startAudioOnly")
                  : t("vcTestLab.startTest")}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
