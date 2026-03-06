"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
  ArrowLeft,
  ArrowUp,
  Send,
  Users,
  Image as ImageIcon,
  X,
  RotateCw,
  Shield,
  Ban,
  UserMinus,
  Settings,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import UserBadge from "@/components/common/UserBadge";

interface Message {
  id: string;
  message: string;
  image_url?: string;
  user_id: string;
  created_at: string;
  status?: "sending" | "sent" | "failed"; // 메시지 전송 상태
  user_profiles?: {
    display_name?: string;
    avatar_url?: string;
    profile_image?: string;
    total_points?: number;
  };
  users?: {
    email?: string;
    full_name?: string;
    korean_name?: string;
    spanish_name?: string;
    user_metadata?: {
      name?: string;
    };
  };
}

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  participant_count: number;
  owner_id?: string;
}

// 색상 팔레트 정의
const colorPalettes = [
  {
    background: "#FFF9C4", // 노란색
    avatarBg: "#EDE7F6",
    avatarText: "#6B46C1",
    inputBg: "#FFE7EF",
    inputText: "#6B46C1",
    imageBg: "#E0F7F4",
    imageText: "#00695C",
    messageBg: "#FFFFFF",
    otherMessageBg: "#EDE7F6",
    otherMessageText: "#6B46C1",
  },
  {
    background: "#E3F2FD", // 파란색
    avatarBg: "#BBDEFB",
    avatarText: "#1565C0",
    inputBg: "#E1F5FE",
    inputText: "#0277BD",
    imageBg: "#F3E5F5",
    imageText: "#7B1FA2",
    messageBg: "#FFFFFF",
    otherMessageBg: "#BBDEFB",
    otherMessageText: "#1565C0",
  },
  {
    background: "#F1F8E9", // 연두색
    avatarBg: "#DCEDC8",
    avatarText: "#558B2F",
    inputBg: "#E8F5E9",
    inputText: "#2E7D32",
    imageBg: "#FFF3E0",
    imageText: "#E65100",
    messageBg: "#FFFFFF",
    otherMessageBg: "#DCEDC8",
    otherMessageText: "#558B2F",
  },
  {
    background: "#FCE4EC", // 핑크색
    avatarBg: "#F8BBD0",
    avatarText: "#C2185B",
    inputBg: "#FCE4EC",
    inputText: "#C2185B",
    imageBg: "#E0F2F1",
    imageText: "#00695C",
    messageBg: "#FFFFFF",
    otherMessageBg: "#F8BBD0",
    otherMessageText: "#C2185B",
  },
  {
    background: "#E8EAF6", // 보라색
    avatarBg: "#C5CAE9",
    avatarText: "#3949AB",
    inputBg: "#EDE7F6",
    inputText: "#5E35B1",
    imageBg: "#FFF9C4",
    imageText: "#F57F17",
    messageBg: "#FFFFFF",
    otherMessageBg: "#C5CAE9",
    otherMessageText: "#3949AB",
  },
  {
    background: "#FFF3E0", // 오렌지색
    avatarBg: "#FFE0B2",
    avatarText: "#E65100",
    inputBg: "#FFF8E1",
    inputText: "#F57F17",
    imageBg: "#E1F5FE",
    imageText: "#0277BD",
    messageBg: "#FFFFFF",
    otherMessageBg: "#FFE0B2",
    otherMessageText: "#E65100",
  },
];

// roomId를 기반으로 색상 팔레트 선택
const getColorPalette = (roomId: string) => {
  if (!roomId) {
    return colorPalettes[0];
  }

  // 더 나은 해시 함수: djb2 알고리즘 변형
  let hash = 5381;
  for (let i = 0; i < roomId.length; i++) {
    hash = (hash << 5) + hash + roomId.charCodeAt(i);
  }

  // 절대값을 사용하여 인덱스 계산
  const index = Math.abs(hash) % colorPalettes.length;
  const selectedPalette = colorPalettes[index];

  console.log(
    "[getColorPalette] RoomId:",
    roomId,
    "Hash:",
    hash,
    "Index:",
    index,
    "Color:",
    selectedPalette.background,
  );

  return selectedPalette;
};

export default function ChatRoomClient({
  roomId,
  hideHeader = false,
}: {
  roomId: string;
  hideHeader?: boolean;
}) {
  const { user, token, loading: authLoading, refreshSession } = useAuth();
  const router = useRouter();
  const { t, language } = useLanguage();

  // Shared browser Supabase client
  const authSupabase = useMemo(() => {
    return createSupabaseBrowserClient();
  }, []);

  // 비로그인 조회/로그인 동작 모두 동일 클라이언트 사용
  const anonSupabase = authSupabase;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [userRole, setUserRole] = useState<
    "owner" | "admin" | "moderator" | "member"
  >("member");
  const [isOperator, setIsOperator] = useState(false); // 운영자 여부 (admin_users 테이블)
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [showBanMenu, setShowBanMenu] = useState<string | null>(null); // 채팅금지 드롭다운 메뉴 표시
  const [realtimeEnabled, setRealtimeEnabled] = useState(true); // Realtime 기본 활성화, 실패 시 polling fallback
  const [lastReadAt, setLastReadAt] = useState<string | null>(null); // 마지막 읽은 시간
  const [hasMoreOlderMessages, setHasMoreOlderMessages] = useState(true);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const profileCache = useRef<
    Map<
      string,
      {
        display_name?: string;
        avatar_url?: string;
        profile_image?: string;
        total_points: number;
      }
    >
  >(new Map());
  const deletedMessageIdsRef = useRef<Set<string>>(new Set()); // 삭제된 메시지 ID 추적
  const messagesContainerRef = useRef<HTMLDivElement>(null); // 메시지 컨테이너 참조
  const updateReadStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 읽음 상태 업데이트 디바운스
  const imageUrlCache = useRef<Map<string, string>>(new Map()); // 이미지 URL 캐시 (성능 최적화)
  const messagesRef = useRef<Message[]>([]); // polling에서 최신 메시지 상태 참조
  const chatCacheKey = useMemo(() => `amiko-chat-cache:${roomId}`, [roomId]);
  const chatCursorKey = useMemo(() => `amiko-chat-cursor:${roomId}`, [roomId]);
  const chatCacheTtlMs = 24 * 60 * 60 * 1000;
  const messagePageSize = 20;

  // 색상 팔레트 가져오기 (useMemo로 메모이제이션) - early return 이전에 배치
  const palette = useMemo(() => {
    if (!roomId) {
      // 기본 팔레트 반환
      return colorPalettes[0];
    }
    const selectedPalette = getColorPalette(roomId);
    console.log("[ChatRoomClient] RoomId:", roomId);
    console.log("[ChatRoomClient] Selected Palette:", selectedPalette);
    console.log(
      "[ChatRoomClient] Background Color:",
      selectedPalette.background,
    );
    return selectedPalette;
  }, [roomId]);

  // 메시지 스크롤 useEffect - early return 이전에 배치
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined" || !roomId) return;

    try {
      const cacheableMessages = messages
        .filter(
          (message) =>
            !message.id.startsWith("temp-") && message.status !== "failed",
        )
        .slice(-200);

      const cachePayload = JSON.stringify({
        savedAt: Date.now(),
        messages: cacheableMessages,
      });
      const latestMessageTime =
        cacheableMessages[cacheableMessages.length - 1]?.created_at;

      try {
        localStorage.setItem(chatCacheKey, cachePayload);
      } catch {
        // localStorage 저장 실패 시 sessionStorage 폴백
      }

      try {
        sessionStorage.setItem(chatCacheKey, cachePayload);
      } catch {
        // sessionStorage 저장 실패는 무시
      }

      if (latestMessageTime) {
        try {
          localStorage.setItem(chatCursorKey, latestMessageTime);
        } catch {
          // localStorage 저장 실패 시 sessionStorage 폴백
        }
        try {
          sessionStorage.setItem(chatCursorKey, latestMessageTime);
        } catch {
          // sessionStorage 저장 실패는 무시
        }
      }
    } catch {
      // 캐시 저장 실패는 무시
    }
  }, [messages, roomId, chatCacheKey, chatCursorKey]);

  // Prevent default browser drag behavior - early return 이전에 배치
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showBanMenu && !target.closest(".ban-menu-container")) {
        setShowBanMenu(null);
      }
    };

    if (showBanMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showBanMenu]);

  // 사용자 프로필 가져오기 (캐시 활용) - early return 이전에 정의
  const fetchUserProfile = useCallback(
    async (userId: string) => {
      // 캐시에서 먼저 확인
      if (profileCache.current.has(userId)) {
        return profileCache.current.get(userId)!;
      }

      try {
        // 비로그인 사용자도 프로필 조회 가능하도록 anon client 사용
        const supabaseClient = user && token ? authSupabase : anonSupabase;
        // 프로필 조회
        const { data: profile } = await supabaseClient
          .from("user_profiles")
          .select("display_name, avatar_url")
          .eq("user_id", userId)
          .maybeSingle();

        // total_points 폴백
        let totalPoints = 0;
        if (!totalPoints) {
          const { data: pointsRow } = await authSupabase
            .from("user_points")
            .select("total_points")
            .eq("user_id", userId)
            .maybeSingle();
          totalPoints = pointsRow?.total_points ?? 0;
        }

        const userProfile = {
          display_name: profile?.display_name,
          avatar_url: profile?.avatar_url,
          profile_image: profile?.profile_image,
          total_points: totalPoints,
        };

        // 캐시에 저장
        profileCache.current.set(userId, userProfile);
        return userProfile;
      } catch {
        // 에러 시 기본값 반환 및 캐시 저장
        const defaultProfile = {
          display_name: undefined,
          avatar_url: undefined,
          profile_image: undefined,
          total_points: 0,
        };
        profileCache.current.set(userId, defaultProfile);
        return defaultProfile;
      }
    },
    [user, token, authSupabase, anonSupabase],
  );

  // 중복 메시지 방지 헬퍼 함수 - early return 이전에 정의
  const addMessageSafely = (newMessage: Message) => {
    setMessages((prev) => {
      // 삭제된 메시지는 무시
      if (deletedMessageIdsRef.current.has(newMessage.id)) {
        if (process.env.NODE_ENV === "development") {
          console.log("🚫 삭제된 메시지 무시:", newMessage.id);
        }
        return prev;
      }

      // 이미 처리된 메시지인지 확인
      if (processedMessageIds.current.has(newMessage.id)) {
        return prev;
      }

      // 배열에도 이미 있는지 확인 (이중 체크)
      const exists = prev.some((m) => m.id === newMessage.id);
      if (exists) {
        return prev;
      }

      // 새 메시지 추가
      processedMessageIds.current.add(newMessage.id);
      if (process.env.NODE_ENV === "development") {
        console.log("✅ 새 메시지 추가:", newMessage.id);
      }
      return [...prev, newMessage];
    });
  };

  // 채팅 초기화 함수들 - early return 이전에 정의
  const fetchRoom = async (retryCount = 0) => {
    try {
      // 비로그인 사용자도 채팅방 정보를 볼 수 있도록 anon client 사용
      const supabaseClient = user && token ? authSupabase : anonSupabase;

      const { data, error } = await supabaseClient
        .from("chat_rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (error) {
        // 로그인한 사용자의 경우에만 세션 갱신 시도
        if (
          user &&
          token &&
          (error.message?.includes("JWT") ||
            error.message?.includes("expired") ||
            error.code === "PGRST301")
        ) {
          console.log("[CHAT] 인증 에러 감지, 세션 갱신 시도...");
          if (retryCount < 2 && refreshSession) {
            const refreshed = await refreshSession();
            if (refreshed) {
              console.log("[CHAT] 세션 갱신 성공, 재시도...");
              return fetchRoom(retryCount + 1);
            }
          }
        }
        // 비로그인 사용자의 경우 에러를 무시하고 계속 진행
        if (!user || !token) {
          console.log(
            "[CHAT] 비로그인 사용자, 채팅방 조회 실패하지만 계속 진행",
          );
          return;
        }
        throw error;
      }

      setRoom(data);

      if (user) {
        const { data: participant } = await authSupabase
          .from("chat_room_participants")
          .select("role, last_read_at")
          .eq("room_id", roomId)
          .eq("user_id", user.id)
          .single();

        if (participant) {
          setUserRole(participant.role as any);
          setLastReadAt(participant.last_read_at || null);
        }
      }
    } catch (error) {
      console.error("Error fetching room:", error);
    }
  };

  const enrichMessages = useCallback(
    async (rawMessages: Message[]) => {
      return Promise.all(
        rawMessages.map(async (msg) => {
          const userProfile = await fetchUserProfile(msg.user_id);
          const supabaseClient = user && token ? authSupabase : anonSupabase;
          let userInfo = null;
          try {
            const { data: userData } = await supabaseClient
              .from("users")
              .select("full_name, korean_name, spanish_name")
              .eq("id", msg.user_id)
              .single();
            userInfo = userData;
          } catch (error) {
            console.error("Error fetching user info:", error);
          }

          return {
            ...msg,
            user_profiles: userProfile,
            users: userInfo,
          };
        }),
      );
    },
    [user, token, authSupabase, anonSupabase, fetchUserProfile],
  );

  const fetchMessages = async (retryCount = 0) => {
    try {
      // 비로그인 사용자도 채팅을 볼 수 있도록, 로그인 여부에 따라 다른 client 사용
      const supabaseClient = user && token ? authSupabase : anonSupabase;

      let cachedMessages: Message[] = [];
      if (typeof window !== "undefined") {
        try {
          const rawCache =
            localStorage.getItem(chatCacheKey) ||
            sessionStorage.getItem(chatCacheKey);
          if (rawCache) {
            const parsed = JSON.parse(rawCache);
            const isValidCache = parsed && Array.isArray(parsed.messages);
            const isFresh =
              parsed?.savedAt && Date.now() - parsed.savedAt < chatCacheTtlMs;

            if (isValidCache && isFresh) {
              cachedMessages = parsed.messages
                .filter(
                  (msg: Message) => !deletedMessageIdsRef.current.has(msg.id),
                )
                .sort(
                  (a: Message, b: Message) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime(),
                )
                .slice(-messagePageSize);

              if (cachedMessages.length > 0) {
                processedMessageIds.current = new Set(
                  cachedMessages.map((m) => m.id),
                );
                setMessages(cachedMessages);
                setLoading(false);
              }
            } else if (!isFresh) {
              try {
                localStorage.removeItem(chatCacheKey);
                sessionStorage.removeItem(chatCacheKey);
                localStorage.removeItem(chatCursorKey);
                sessionStorage.removeItem(chatCursorKey);
              } catch {
                // 캐시 정리 실패는 무시
              }
            }
          }
        } catch {
          // 캐시 파싱 실패는 무시
        }
      }

      const { data, error } = await supabaseClient
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(messagePageSize);

      if (error) {
        console.error("❌ Error fetching messages:", error);

        // 로그인한 사용자의 경우에만 세션 갱신 시도
        if (
          user &&
          token &&
          (error.message?.includes("JWT") ||
            error.message?.includes("expired") ||
            error.code === "PGRST301")
        ) {
          console.log("[CHAT] 메시지 로드 인증 에러 감지, 세션 갱신 시도...");
          if (retryCount < 2 && refreshSession) {
            const refreshed = await refreshSession();
            if (refreshed) {
              console.log("[CHAT] 세션 갱신 성공, 메시지 재시도...");
              return fetchMessages(retryCount + 1);
            }
          }
        }
        // 비로그인 사용자의 경우 에러를 무시하고 빈 배열 반환
        if (!user || !token) {
          console.log(
            "[CHAT] 비로그인 사용자, 메시지 조회 실패하지만 계속 진행",
          );
          setMessages([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      const latestMessages = (data || []).reverse();

      // 삭제된 메시지 필터링
      const activeMessages = latestMessages.filter(
        (msg) => !deletedMessageIdsRef.current.has(msg.id),
      );
      const messagesWithProfiles = await enrichMessages(activeMessages);

      const mergedMessages = [...messagesWithProfiles]
        .filter((msg) => !deletedMessageIdsRef.current.has(msg.id))
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );

      processedMessageIds.current = new Set(mergedMessages.map((m) => m.id));
      setMessages(mergedMessages);
      setHasMoreOlderMessages((data || []).length === messagePageSize);

      const latestMergedTime =
        mergedMessages[mergedMessages.length - 1]?.created_at;
      if (latestMergedTime && typeof window !== "undefined") {
        try {
          localStorage.setItem(chatCursorKey, latestMergedTime);
        } catch {
          // localStorage 저장 실패 시 sessionStorage 폴백
        }
        try {
          sessionStorage.setItem(chatCursorKey, latestMergedTime);
        } catch {
          // sessionStorage 저장 실패는 무시
        }
      }

      console.log("📨 초기 메시지 로드:", mergedMessages.length, "개");
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadOlderMessages = useCallback(async () => {
    if (loadingOlderMessages || !hasMoreOlderMessages) return;

    const currentMessages = messagesRef.current;
    const oldestMessage = currentMessages[0];
    if (!oldestMessage?.created_at) return;

    const container = messagesContainerRef.current;
    const previousScrollHeight = container?.scrollHeight || 0;
    const previousScrollTop = container?.scrollTop || 0;

    setLoadingOlderMessages(true);
    try {
      const supabaseClient = user && token ? authSupabase : anonSupabase;
      const { data, error } = await supabaseClient
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .lt("created_at", oldestMessage.created_at)
        .order("created_at", { ascending: false })
        .limit(messagePageSize);

      if (error) {
        throw error;
      }

      const olderRaw = (data || []).reverse();
      const olderActive = olderRaw.filter(
        (msg) => !deletedMessageIdsRef.current.has(msg.id),
      );
      const olderMessages = await enrichMessages(olderActive);

      setMessages((prev) => {
        const olderUnique = olderMessages.filter(
          (msg) => !prev.some((existing) => existing.id === msg.id),
        );
        if (olderUnique.length === 0) return prev;
        return [...olderUnique, ...prev];
      });

      if ((data || []).length < messagePageSize) {
        setHasMoreOlderMessages(false);
      }

      requestAnimationFrame(() => {
        if (!messagesContainerRef.current) return;
        const newScrollHeight = messagesContainerRef.current.scrollHeight;
        messagesContainerRef.current.scrollTop =
          newScrollHeight - previousScrollHeight + previousScrollTop;
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ Older message load error:", error);
      }
    } finally {
      setLoadingOlderMessages(false);
    }
  }, [
    loadingOlderMessages,
    hasMoreOlderMessages,
    user,
    token,
    authSupabase,
    anonSupabase,
    roomId,
    messagePageSize,
    enrichMessages,
  ]);

  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    console.log("🔄 Polling started (5초 간격으로 최적화)");
    pollingIntervalRef.current = setInterval(() => {
      fetchNewMessages();
    }, 5000); // 1.5초 → 5초로 변경하여 성능 최적화
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const fetchNewMessages = async () => {
    try {
      const currentMessages = messagesRef.current;
      const lastMessage = currentMessages[currentMessages.length - 1];
      const lastMessageTime =
        lastMessage?.created_at || new Date(0).toISOString();

      // 비로그인 사용자도 새 메시지를 볼 수 있도록 anon client 사용
      const supabaseClient = user && token ? authSupabase : anonSupabase;

      const { data, error } = await supabaseClient
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .gt("created_at", lastMessageTime)
        .order("created_at", { ascending: true });

      if (error) {
        // 비로그인 사용자의 경우 에러를 무시
        if (!user || !token) {
          return;
        }
        throw error;
      }

      if (data && data.length > 0) {
        const unseenMessages = data.filter(
          (msg) => !processedMessageIds.current.has(msg.id),
        );

        if (unseenMessages.length === 0) {
          return;
        }

        console.log("🔄 Polling: 새 메시지", unseenMessages.length, "개 발견");

        const messagesWithProfiles = await Promise.all(
          unseenMessages.map(async (msg) => {
            const userProfile = await fetchUserProfile(msg.user_id);
            // users 테이블에서 실제 이름 가져오기 (비로그인 사용자도 조회 가능하도록 anon client 사용)
            const supabaseClient = user && token ? authSupabase : anonSupabase;
            let userInfo = null;
            try {
              const { data: userData } = await supabaseClient
                .from("users")
                .select("full_name, korean_name, spanish_name")
                .eq("id", msg.user_id)
                .single();
              userInfo = userData;
            } catch (error) {
              console.error("Error fetching user info:", error);
            }

            return {
              ...msg,
              user_profiles: userProfile,
              users: userInfo,
            };
          }),
        );

        messagesWithProfiles.forEach((msg) => addMessageSafely(msg));
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ Polling error (non-critical):", error);
      }
    }
  };

  const subscribeToMessages = () => {
    // Realtime이 비활성화된 경우 Polling만 사용
    if (!realtimeEnabled) {
      return;
    }

    // 비로그인 사용자는 Realtime 구독 불가 (Polling만 사용)
    if (!user || !token) {
      return;
    }

    try {
      if (channelRef.current) {
        try {
          authSupabase.removeChannel(channelRef.current);
        } catch {
          // 채널 제거 오류 무시
        }
        channelRef.current = null;
      }

      let channel;
      try {
        const topic = `room:${roomId}:messages`;
        channel = authSupabase
          .channel(topic, { config: { private: true } })
          .on("broadcast", { event: "INSERT" }, async (payload) => {
            try {
              const rawMessage = payload.payload?.new as Message;

              if (!rawMessage?.id) {
                return;
              }

              const userProfile = await fetchUserProfile(rawMessage.user_id);
              // users 테이블에서 실제 이름 가져오기 (비로그인 사용자도 조회 가능하도록 anon client 사용)
              const supabaseClient =
                user && token ? authSupabase : anonSupabase;
              let userInfo = null;
              try {
                const { data: userData } = await supabaseClient
                  .from("users")
                  .select("full_name, korean_name, spanish_name")
                  .eq("id", rawMessage.user_id)
                  .single();
                userInfo = userData;
              } catch {
                // 사용자 정보 조회 실패는 무시
              }

              const newMessage = {
                ...rawMessage,
                user_profiles: userProfile,
                users: userInfo,
              };

              addMessageSafely(newMessage);
            } catch {
              // Realtime 메시지 처리 오류 무시
            }
          })
          .on("broadcast", { event: "DELETE" }, async () => {
            await fetchMessages();
          })
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log("🎉 Realtime 연결 성공:", topic);
              stopPolling();
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              // Realtime 연결 실패 시 비활성화하고 Polling만 사용
              setRealtimeEnabled(false);
              startPolling();
              if (channelRef.current) {
                try {
                  authSupabase.removeChannel(channelRef.current);
                } catch {
                  // 무시
                }
                channelRef.current = null;
              }
            }
          });

        channelRef.current = channel;
      } catch {
        // Realtime 구독 실패 시 비활성화
        setRealtimeEnabled(false);
        startPolling();
        channelRef.current = null;
      }
    } catch {
      // Realtime 구독 실패 시 비활성화
      setRealtimeEnabled(false);
      startPolling();
      channelRef.current = null;
    }
  };

  const updateReadStatusViaApi = useCallback(
    async (lastReadAt?: string) => {
      if (!user) return null;

      try {
        const {
          data: { session },
        } = await authSupabase.auth.getSession();
        const accessToken = session?.access_token || token;

        if (!accessToken) {
          return null;
        }

        const response = await fetch("/api/chat/update-read-status", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomId,
            userId: user.id,
            lastReadAt,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            "[ChatRoomClient] 읽음 상태 API 업데이트 실패:",
            errorText,
          );
          return null;
        }

        const result = await response.json();
        if (!result?.success) {
          console.error("[ChatRoomClient] 읽음 상태 API 응답 실패:", result);
          return null;
        }

        return result.lastReadAt || lastReadAt || new Date().toISOString();
      } catch (error) {
        console.error("[ChatRoomClient] 읽음 상태 API 호출 실패:", error);
        return null;
      }
    },
    [user, token, authSupabase, roomId],
  );

  const joinRoom = async () => {
    if (!user) return;

    try {
      const now = new Date().toISOString();
      const updatedAt = await updateReadStatusViaApi(now);

      if (updatedAt) {
        setLastReadAt(updatedAt);
      }
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  const leaveRoom = async () => {
    if (!user) return;

    try {
      const now = new Date().toISOString();
      const updatedAt = await updateReadStatusViaApi(now);
      if (updatedAt) {
        setLastReadAt(updatedAt);
      }
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  // 읽음 상태 업데이트 함수 (디바운스 적용)
  const updateReadStatus = useCallback(async () => {
    if (!user || !roomId) return;

    // 기존 타임아웃 취소
    if (updateReadStatusTimeoutRef.current) {
      clearTimeout(updateReadStatusTimeoutRef.current);
    }

    // 500ms 후에 읽음 상태 업데이트 (디바운스)
    updateReadStatusTimeoutRef.current = setTimeout(async () => {
      try {
        const now = new Date().toISOString();
        const updatedAt = await updateReadStatusViaApi(now);

        if (!updatedAt) {
          console.error(
            "[ChatRoomClient] 읽음 상태 업데이트 실패: API returned no data",
          );
        } else {
          setLastReadAt(updatedAt);
          console.log("[ChatRoomClient] 읽음 상태 업데이트 완료:", {
            roomId,
            userId: user.id,
            last_read_at: updatedAt,
          });
        }
      } catch (error) {
        console.error("[ChatRoomClient] 읽음 상태 업데이트 실패:", error);
      }
    }, 500);
  }, [user, roomId, updateReadStatusViaApi]);

  // 스크롤 감지 및 읽음 상태 업데이트
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer || !user) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      // 맨 아래에서 100px 이내에 있으면 읽음 상태 업데이트
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      const isNearTop = scrollTop < 80;

      if (isNearBottom) {
        updateReadStatus();
      }

      if (isNearTop) {
        void loadOlderMessages();
      }
    };

    messagesContainer.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    // 컴포넌트 언마운트 시 정리
    return () => {
      messagesContainer.removeEventListener("scroll", handleScroll);
      if (updateReadStatusTimeoutRef.current) {
        clearTimeout(updateReadStatusTimeoutRef.current);
      }
    };
  }, [user, roomId, updateReadStatus, loadOlderMessages]);

  // 메시지가 추가될 때 자동으로 읽음 상태 업데이트 (맨 아래에 있을 때만)
  useEffect(() => {
    if (!messagesContainerRef.current || !user || messages.length === 0) return;

    const container = messagesContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (isNearBottom) {
      updateReadStatus();
    }
  }, [messages.length, user, roomId, updateReadStatus]);

  // 운영자 권한 체크 useEffect
  useEffect(() => {
    const checkOperatorStatus = async () => {
      if (!user?.id && !user?.email) return;

      try {
        const params = new URLSearchParams();
        if (user?.id) params.append("userId", user.id);
        if (user?.email) params.append("email", user.email);

        const response = await fetch(`/api/admin/check?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setIsOperator(data.isAdmin || false);
        }
      } catch {
        setIsOperator(false);
      }
    };

    if (user) {
      checkOperatorStatus();
    }
  }, [user]);

  // 채팅 초기화 useEffect - early return 이전에 배치
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || !user.id) {
      return;
    }

    // 회원가입한 모든 사용자가 채팅 사용 가능 - 로그인 여부만 확인
    console.log("✅ 사용자 로그인 확인 완료 - 채팅 시작");

    fetchRoom();
    fetchMessages();
    // 로그인한 사용자만 채팅방에 참여 (비로그인 사용자는 조회만 가능)
    if (user && user.id) {
      joinRoom();
      subscribeToMessages();
    }

    return () => {
      void leaveRoom();
      if (channelRef.current) {
        authSupabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user, authSupabase, authLoading, refreshSession, router]);

  // 로딩 중일 때 표시
  if (authLoading) {
    console.log("[ChatRoomClient] 로딩 중...");
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-600 dark:border-gray-400 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {t("auth.checkingAuth")}
          </p>
        </div>
      </div>
    );
  }

  // 비로그인 사용자도 채팅을 볼 수 있도록 로그인 체크 제거
  // 메시지 전송 시에만 로그인 체크를 수행

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processImageFile(file);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    processImageFile(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileName = `chat/${Date.now()}_${file.name}`;
      const { data, error } = await authSupabase.storage
        .from("images")
        .upload(fileName, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = authSupabase.storage.from("images").getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    // 회원가입한 모든 사용자가 채팅 사용 가능 - 로그인 여부만 확인
    if (!user || !user.id) {
      alert(t("auth.loginRequired"));
      router.push("/sign-in?redirect=/community/k-chat");
      return;
    }

    if ((!newMessage.trim() && !selectedImage) || uploading) return;

    // tempMessage를 함수 스코프로 이동
    let tempMessage: Message | null = null;

    try {
      setUploading(true);

      let imageUrl: string | null = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          alert("Error al subir la imagen");
          setUploading(false);
          return;
        }
      }

      const messageData: any = {
        room_id: roomId,
        user_id: user.id,
        message: newMessage.trim() || "",
      };

      if (imageUrl) {
        messageData.image_url = imageUrl;
      }

      // 현재 사용자의 실명 정보 가져오기 (Optimistic UI용)
      let currentUserInfo = null;
      try {
        const { data: userData } = await authSupabase
          .from("users")
          .select("full_name, korean_name, spanish_name")
          .eq("id", user.id)
          .single();
        currentUserInfo = userData;
      } catch (error) {
        console.error("Error fetching current user info:", error);
      }

      // user_profiles 정보도 가져오기
      const currentUserProfile = await fetchUserProfile(user.id);

      // ⚡ Optimistic UI: DB에 insert하기 전에 먼저 UI에 추가
      tempMessage = {
        id: `temp-${Date.now()}`, // 임시 ID
        message: newMessage.trim() || "",
        image_url: imageUrl || undefined,
        user_id: user.id,
        created_at: new Date().toISOString(),
        status: "sending", // 전송 중 상태
        users: currentUserInfo,
        user_profiles: currentUserProfile,
      };

      console.log("🚀 Optimistic UI: 메시지 즉시 표시");
      setMessages((prev) => [...prev, tempMessage!]);

      // 입력 필드 즉시 비우기
      setNewMessage("");
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // 인증 재확인 (DB insert 전) - user만 확인
      if (!user) {
        alert(t("auth.loginRequired"));
        router.push("/sign-in?redirect=/community/k-chat");
        // Optimistic UI에서 추가한 메시지 제거
        if (tempMessage) {
          setMessages((prev) => prev.filter((m) => m.id !== tempMessage!.id));
        }
        setUploading(false);
        return;
      }

      // DB에 insert
      const { data, error } = await authSupabase
        .from("chat_messages")
        .insert(messageData)
        .select()
        .single();

      if (error) {
        // 인증 에러인 경우
        if (
          error.message?.includes("JWT") ||
          error.message?.includes("auth") ||
          error.code === "PGRST301" ||
          error.message?.includes("permission") ||
          error.message?.includes("row-level security")
        ) {
          alert(t("auth.loginRequired"));
          router.push("/sign-in?redirect=/community/k-chat");
          // Optimistic UI에서 추가한 메시지 제거
          if (tempMessage) {
            setMessages((prev) => prev.filter((m) => m.id !== tempMessage!.id));
          }
          setUploading(false);
          return;
        }
        throw error;
      }

      console.log("✅ DB에 메시지 저장 완료:", data.id);

      // 현재 사용자의 실명 정보 가져오기
      let userInfo = null;
      try {
        const { data: userData } = await authSupabase
          .from("users")
          .select("full_name, korean_name, spanish_name")
          .eq("id", user.id)
          .single();
        userInfo = userData;
      } catch (error) {
        console.error("Error fetching user info:", error);
      }

      // user_profiles 정보도 가져오기
      const userProfile = await fetchUserProfile(user.id);

      // 임시 메시지를 실제 메시지로 교체 (상태: sent, users 정보 포함)
      if (data && tempMessage) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessage!.id
              ? {
                  ...data,
                  status: "sent" as const,
                  users: userInfo,
                  user_profiles: userProfile,
                }
              : msg,
          ),
        );
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);

      // 실패 시 상태를 'failed'로 변경 (제거하지 않음!)
      if (tempMessage) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessage!.id
              ? { ...msg, status: "failed" as const }
              : msg,
          ),
        );
      }
    } finally {
      setUploading(false);
    }
  };

  // 카카오톡 스타일 재전송 함수
  const retrySendMessage = async (failedMessage: Message) => {
    if (!user) return;

    try {
      setUploading(true);

      // 상태를 'sending'으로 변경
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === failedMessage.id
            ? { ...msg, status: "sending" as const }
            : msg,
        ),
      );

      const messageData: any = {
        room_id: roomId,
        user_id: user.id,
        message: failedMessage.message || "",
      };

      if (failedMessage.image_url) {
        messageData.image_url = failedMessage.image_url;
      }

      // DB에 insert
      const { data, error } = await authSupabase
        .from("chat_messages")
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      console.log("✅ 재전송 성공:", data.id);

      // 실패한 메시지를 실제 메시지로 교체
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === failedMessage.id
            ? { ...data, status: "sent" as const }
            : msg,
        ),
      );
    } catch (error) {
      console.error("❌ 재전송 실패:", error);
      // 상태를 다시 'failed'로
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === failedMessage.id
            ? { ...msg, status: "failed" as const }
            : msg,
        ),
      );
    } finally {
      setUploading(false);
    }
  };

  // 카카오톡 스타일 메시지 삭제 함수
  const deleteFailedMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  // 채팅방 관리 기능
  const banUser = async (userId: string, reason: string = "") => {
    if (
      !user ||
      (userRole !== "owner" && userRole !== "admin" && userRole !== "moderator")
    ) {
      alert("No tienes permiso");
      return;
    }

    try {
      // 1. 추방 기록 생성
      await authSupabase.from("chat_bans").insert({
        room_id: roomId,
        user_id: userId,
        banned_by: user.id,
        reason: reason || "Expulsado por administrador",
        ban_type: "permanent",
      });

      // 2. 참여자 목록에서 제거
      await authSupabase
        .from("chat_room_participants")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", userId);

      alert("Usuario expulsado");

      // 채팅방 새로고침
      fetchRoom();
    } catch (error) {
      console.error("Error banning user:", error);
      alert("Error al expulsar usuario");
    }
  };

  const isAdmin = () => {
    return (
      userRole === "owner" || userRole === "admin" || userRole === "moderator"
    );
  };

  // 운영자 권한 확인 (admin_users 테이블 기반)
  const isOperatorUser = () => {
    return isOperator || user?.is_admin || false;
  };

  // 채팅금지 기능 (운영자 전용)
  const chatBanUser = async (
    userId: string,
    banDays: number | null,
    reason: string = "",
  ) => {
    // 운영자 권한만 체크 (전체 채팅방이므로 방장/부방장 개념 없음)
    if (!user || !isOperatorUser()) {
      alert(
        language === "ko"
          ? "운영자만 채팅금지를 할 수 있습니다."
          : "Solo los operadores pueden prohibir el chat.",
      );
      return;
    }

    try {
      // 기간 계산
      let expiresAt: string | null = null;
      let banType: "temporary" | "permanent" = "temporary";

      if (banDays === null) {
        // 영구 추방 (최후의 수단) - 참여자 목록에서 제거
        banType = "permanent";
        await authSupabase
          .from("chat_room_participants")
          .delete()
          .eq("room_id", roomId)
          .eq("user_id", userId);
      } else {
        // 임시 채팅금지 - 참여자 목록은 유지 (채팅만 금지)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + banDays);
        expiresAt = expiryDate.toISOString();
      }

      // 채팅금지 기록 생성 (기존 기록이 있으면 업데이트)
      const { error: upsertError } = await authSupabase
        .from("chat_bans")
        .upsert(
          {
            room_id: roomId,
            user_id: userId,
            banned_by: user.id,
            reason:
              reason ||
              (banDays === null
                ? language === "ko"
                  ? "운영자에 의해 영구 추방됨"
                  : "Expulsado permanentemente por operador"
                : language === "ko"
                  ? `채팅금지 ${banDays}일`
                  : `Prohibición de chat por ${banDays} días`),
            ban_type: banType,
            expires_at: expiresAt,
          },
          {
            onConflict: "room_id,user_id",
          },
        );

      if (upsertError) {
        console.error("Error banning user chat:", upsertError);
        alert(
          language === "ko"
            ? "채팅금지에 실패했습니다."
            : "Error al prohibir el chat",
        );
        return;
      }

      const banMessage =
        banDays === null
          ? language === "ko"
            ? "사용자가 영구 추방되었습니다."
            : "Usuario expulsado permanentemente."
          : language === "ko"
            ? `채팅금지 ${banDays}일이 적용되었습니다.`
            : `Prohibición de chat por ${banDays} días aplicada.`;

      alert(banMessage);

      // 채팅방 새로고침
      fetchRoom();
      setShowBanMenu(null);
    } catch (error) {
      console.error("Error banning user chat:", error);
      alert(
        language === "ko"
          ? "채팅금지 중 오류가 발생했습니다."
          : "Error al prohibir el chat",
      );
    }
  };

  // 메시지 삭제 (작성자 본인 또는 관리자)
  const deleteMessage = async (messageId: string, messageUserId: string) => {
    // 권한 확인: 본인 또는 관리자/운영자
    const canDelete =
      user?.id === messageUserId ||
      user?.is_admin ||
      isAdmin() ||
      isOperatorUser();

    if (!canDelete) {
      alert(
        language === "ko"
          ? "메시지를 삭제할 권한이 없습니다."
          : "No tienes permiso para eliminar este mensaje.",
      );
      return;
    }

    if (
      !confirm(
        language === "ko"
          ? "이 메시지를 삭제하시겠습니까?"
          : "¿Deseas eliminar este mensaje?",
      )
    ) {
      return;
    }

    try {
      // API 엔드포인트를 통해 삭제 (서버 사이드에서 운영자 권한 체크 및 RLS 우회)
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("메시지 삭제 오류:", errorText);
        alert(
          language === "ko"
            ? "메시지 삭제에 실패했습니다."
            : "Error al eliminar el mensaje.",
        );
        return;
      }

      const result = await response.json();

      if (!result.success) {
        console.error("메시지 삭제 오류:", result.error);
        alert(
          language === "ko"
            ? result.error || "메시지 삭제에 실패했습니다."
            : result.error || "Error al eliminar el mensaje.",
        );
        return;
      }

      // 삭제된 메시지 ID 추적에 추가
      deletedMessageIdsRef.current.add(messageId);

      // UI에서 즉시 제거
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      console.log("✅ 메시지 삭제 완료:", messageId);
    } catch (error) {
      console.error("메시지 삭제 중 오류:", error);
      alert(
        language === "ko"
          ? "메시지 삭제 중 오류가 발생했습니다."
          : "Error al eliminar el mensaje.",
      );
    }
  };

  // 참여자 목록 가져오기
  const fetchParticipants = async () => {
    try {
      const { data, error } = await authSupabase
        .from("chat_room_participants")
        .select("user_id, role")
        .eq("room_id", roomId)
        .order("role", { ascending: false });

      if (error) {
        console.error("Error fetching participants:", error);
        throw error;
      }

      console.log("Participants data:", data);

      // user_id로 사용자 정보 가져오기
      const participantsWithUserInfo = await Promise.all(
        (data || []).map(async (participant) => {
          try {
            // user_profiles 테이블에서 프로필 정보 가져오기
            const { data: profileData } = await authSupabase
              .from("user_profiles")
              .select("display_name, avatar_url")
              .eq("user_id", participant.user_id)
              .maybeSingle();
            let totalPoints3 = 0;
            if (!totalPoints3) {
              const { data: pointsRow3 } = await authSupabase
                .from("user_points")
                .select("total_points")
                .eq("user_id", participant.user_id)
                .maybeSingle();
              totalPoints3 = pointsRow3?.total_points ?? 0;
            }

            // users 테이블에서 실제 이름 가져오기
            let userInfo = null;
            try {
              const { data: userData } = await authSupabase
                .from("users")
                .select("full_name, korean_name, spanish_name")
                .eq("id", participant.user_id)
                .single();
              userInfo = userData;
            } catch (error) {
              console.error("Error fetching user info:", error);
            }

            return {
              ...participant,
              user_profiles: {
                ...(profileData || {}),
                display_name: profileData?.display_name,
                avatar_url: profileData?.avatar_url,
                profile_image: profileData?.profile_image,
                total_points: totalPoints3,
              },
              users: userInfo,
            };
          } catch (error) {
            console.error(
              "Error fetching profile for participant:",
              participant.user_id,
              error,
            );
            return {
              ...participant,
              user_profiles: null,
            };
          }
        }),
      );

      console.log("Participants with info:", participantsWithUserInfo);
      setParticipants(participantsWithUserInfo);
    } catch (error) {
      console.error("Error fetching participants:", error);
      alert("Error al cargar participantes");
    }
  };

  // 신고 목록 가져오기
  const fetchReports = async () => {
    try {
      const { data, error } = await authSupabase
        .from("chat_reports")
        .select("*")
        .eq("room_id", roomId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reports:", error);
        throw error;
      }

      // 신고된 사용자와 신고한 사용자 정보 가져오기
      const reportsWithUserInfo = await Promise.all(
        (data || []).map(async (report) => {
          try {
            // 신고된 사용자 정보
            const { data: reportedProfile } = await authSupabase
              .from("user_profiles")
              .select("display_name")
              .eq("user_id", report.reported_user_id)
              .maybeSingle();

            // 신고한 사용자 정보
            const { data: reporterProfile } = await authSupabase
              .from("user_profiles")
              .select("display_name")
              .eq("user_id", report.reporter_id)
              .maybeSingle();

            return {
              ...report,
              reported_user_name: reportedProfile?.display_name || "Usuario",
              reporter_name: reporterProfile?.display_name || "Usuario",
            };
          } catch (error) {
            console.error("Error fetching report user info:", error);
            return {
              ...report,
              reported_user_name: "Usuario",
              reporter_name: "Usuario",
            };
          }
        }),
      );

      console.log("Reports with info:", reportsWithUserInfo);
      setReports(reportsWithUserInfo);
    } catch (error) {
      console.error("Error fetching reports:", error);
      alert("Error al cargar denuncias");
    }
  };

  // 역할 변경
  const changeRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await authSupabase
        .from("chat_room_participants")
        .update({ role: newRole })
        .eq("room_id", roomId)
        .eq("user_id", userId);

      if (error) throw error;
      alert("Rol actualizado");
      fetchParticipants();
    } catch (error) {
      console.error("Error changing role:", error);
      alert("Error al actualizar rol");
    }
  };

  // 신고 처리
  const handleReport = async (
    reportId: string,
    action: "resolve" | "dismiss",
  ) => {
    try {
      const { error } = await authSupabase
        .from("chat_reports")
        .update({
          status: action === "resolve" ? "resolved" : "dismissed",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", reportId);

      if (error) throw error;
      alert(action === "resolve" ? "Denuncia resuelta" : "Denuncia descartada");
      fetchReports();
    } catch (error) {
      console.error("Error handling report:", error);
      alert("Error al procesar denuncia");
    }
  };

  const getUserName = (message: Message) => {
    // 1순위: users 테이블의 실제 이름 (full_name, korean_name, spanish_name)
    if (message.users) {
      // korean_name이 있으면 우선 사용
      if (message.users.korean_name) {
        return message.users.korean_name;
      }
      // spanish_name이 있으면 사용
      if (message.users.spanish_name) {
        return message.users.spanish_name;
      }
      // full_name이 있으면 사용
      if (message.users.full_name) {
        return message.users.full_name;
      }
    }

    // 2순위: user_profiles의 display_name (fallback)
    if (message.user_profiles?.display_name) {
      let name = message.user_profiles.display_name;
      // # 이후 부분 제거
      if (name.includes("#")) {
        name = name.split("#")[0];
      }
      return name;
    }

    // 3순위: users의 user_metadata name
    if (message.users?.user_metadata?.name) {
      return message.users.user_metadata.name;
    }

    // 4순위: email에서 추출
    if (message.users?.email) {
      return message.users.email.split("@")[0];
    }

    // 5순위: 기본값
    return "Usuario";
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Ahora";
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400)
      return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
    return `Hace ${Math.floor(diffInSeconds / 86400)}d`;
  };

  // 로딩 상태는 early return하지 않고 레이아웃 구조를 유지

  // CSS 변수로 색상 적용
  const chatRoomStyle: React.CSSProperties & Record<string, string> = {
    "--chat-bg": palette.background,
    "--chat-avatar-bg": palette.avatarBg,
    "--chat-avatar-text": palette.avatarText,
    "--chat-input-bg": palette.inputBg,
    "--chat-input-text": palette.inputText,
    "--chat-image-bg": palette.imageBg,
    "--chat-image-text": palette.imageText,
    "--chat-message-bg": palette.messageBg,
    "--chat-other-message-bg": palette.otherMessageBg,
    "--chat-other-message-text": palette.otherMessageText,
    backgroundColor: palette.background,
  };

  return (
    <div
      className={`flex flex-col ${hideHeader ? "h-full" : "h-screen h-dvh"}`}
      style={chatRoomStyle}
    >
      {/* Header and Settings Panel Container */}
      {!hideHeader && (
        <div className="sticky top-0 z-[100] bg-white">
          {/* Header */}
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* 뒤로가기 버튼 - 더 눈에 띄게 */}
                <button
                  onClick={() => router.push("/community/k-chat")}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
                  title="Atrás"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
                <div>
                  <h1 className="font-semibold text-lg">{room?.name}</h1>
                  <p className="text-sm text-gray-600">
                    {room?.participant_count || 0} participants
                  </p>
                </div>
              </div>

              {/* 설정 버튼 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("설정 버튼 클릭:", {
                    showSettings,
                    userRole,
                    isAdmin: isAdmin(),
                    hideHeader,
                  });
                  setShowSettings(!showSettings);
                }}
                className="hover:bg-gray-100"
                title={language === "ko" ? "채팅방 설정" : "Configuración"}
                style={{ pointerEvents: "auto" }}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* 관리 설정 패널 */}
          {showSettings && (
            <div className="border-b border-gray-200 px-4 py-4 shadow-md bg-white">
              <div className="max-w-4xl mx-auto">
                {isAdmin() ? (
                  <>
                    <h3 className="font-semibold mb-2 text-lg">
                      {language === "ko"
                        ? "채팅방 관리"
                        : "Administración de sala de chat"}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {language === "ko" ? "역할: " : "Rol: "}
                      <span className="font-medium">
                        {userRole === "owner"
                          ? language === "ko"
                            ? "방장"
                            : "Anfitrión"
                          : userRole === "admin"
                            ? language === "ko"
                              ? "부방장"
                              : "Subanfitrión"
                            : userRole === "moderator"
                              ? language === "ko"
                                ? "모더레이터"
                                : "Moderador"
                              : language === "ko"
                                ? "일반 멤버"
                                : "Miembro"}
                      </span>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          fetchParticipants();
                          setShowParticipantsModal(true);
                        }}
                        className="flex-1"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        <span>
                          {language === "ko"
                            ? "참가자 관리"
                            : "Administrar participantes"}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          fetchReports();
                          setShowReportsModal(true);
                        }}
                        className="flex-1"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        <span>
                          {language === "ko"
                            ? "신고 관리"
                            : "Administrar denuncias"}
                        </span>
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-600 text-sm">
                      {language === "ko"
                        ? "채팅방 관리 권한이 없습니다. 방장이나 부방장만 관리할 수 있습니다."
                        : "No tienes permisos para administrar esta sala. Solo el anfitrión o subanfitrión pueden administrar."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={
          {
            backgroundColor: palette.background,
            background: palette.background,
            // CSS 변수도 함께 설정
            "--message-bg": palette.background,
          } as React.CSSProperties & { "--message-bg": string }
        }
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {/* 로딩 상태 표시 */}
          {authLoading || loading ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center animate-in fade-in duration-300">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {authLoading ? "Verificando sesión..." : "Cargando chat..."}
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              <div className="flex justify-center mb-3">
                {hasMoreOlderMessages ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void loadOlderMessages()}
                    disabled={loadingOlderMessages}
                    className="bg-white/90 border-gray-300 hover:bg-white"
                  >
                    {loadingOlderMessages ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2" />
                        {language === "ko"
                          ? "이전 메시지 불러오는 중..."
                          : "Cargando mensajes anteriores..."}
                      </>
                    ) : (
                      <>
                        <ArrowUp className="w-4 h-4 mr-2" />
                        {language === "ko"
                          ? "이전 메시지 보기"
                          : "Ver mensajes anteriores"}
                      </>
                    )}
                  </Button>
                ) : (
                  <p className="text-xs text-gray-500">
                    {language === "ko"
                      ? "가장 오래된 메시지입니다."
                      : "Has llegado al mensaje más antiguo."}
                  </p>
                )}
              </div>

              {messages.map((message, index) => {
                const isOwn = message.user_id === user?.id;
                // 고유한 키 생성 (id + index)
                const uniqueKey = `${message.id}-${index}`;

                // 마지막 읽은 메시지 위치 확인
                const messageTime = new Date(message.created_at).getTime();
                const lastReadTime = lastReadAt
                  ? new Date(lastReadAt).getTime()
                  : 0;
                const isUnread = messageTime > lastReadTime;
                const isLastReadMessage =
                  lastReadAt &&
                  messageTime <= lastReadTime &&
                  (index === messages.length - 1 ||
                    (index < messages.length - 1 &&
                      new Date(messages[index + 1].created_at).getTime() >
                        lastReadTime));

                return (
                  <React.Fragment key={uniqueKey}>
                    {/* 마지막 읽은 메시지 구분선 */}
                    {isLastReadMessage && user && (
                      <div className="flex items-center gap-2 my-4 px-4">
                        <div className="flex-1 border-t border-blue-400 border-dashed"></div>
                        <span className="text-xs text-blue-500 font-medium px-2 py-1 bg-blue-50 rounded-full">
                          {language === "ko"
                            ? "여기까지 읽음"
                            : "Leído hasta aquí"}
                        </span>
                        <div className="flex-1 border-t border-blue-400 border-dashed"></div>
                      </div>
                    )}
                    <div
                      className={`flex ${isOwn ? "justify-end" : "justify-start"} ${isUnread && !isOwn ? "opacity-90" : ""}`}
                    >
                      <div
                        className={`flex gap-3 max-w-xs md:max-w-md ${isOwn ? "flex-row-reverse" : ""}`}
                      >
                        {/* Avatar */}
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                          style={
                            {
                              backgroundColor: isOwn
                                ? palette.avatarBg
                                : palette.otherMessageBg,
                              color: isOwn
                                ? palette.avatarText
                                : palette.otherMessageText,
                            } as React.CSSProperties
                          }
                        >
                          {(() => {
                            const avatarUrl =
                              message.user_profiles?.avatar_url ||
                              message.user_profiles?.profile_image;
                            if (avatarUrl) {
                              // Supabase Storage URL을 공개 URL로 변환 (캐시 사용)
                              let publicUrl = avatarUrl;
                              if (
                                avatarUrl &&
                                avatarUrl.trim() !== "" &&
                                !avatarUrl.startsWith("http")
                              ) {
                                // 캐시 확인
                                if (imageUrlCache.current.has(avatarUrl)) {
                                  publicUrl =
                                    imageUrlCache.current.get(avatarUrl)!;
                                } else {
                                  try {
                                    const {
                                      data: { publicUrl: convertedUrl },
                                    } = anonSupabase.storage
                                      .from("profile-images")
                                      .getPublicUrl(avatarUrl);
                                    publicUrl = convertedUrl;
                                    imageUrlCache.current.set(
                                      avatarUrl,
                                      publicUrl,
                                    ); // 캐시 저장
                                  } catch (error) {
                                    console.error(
                                      "[ChatRoomClient] 프로필 이미지 URL 변환 실패:",
                                      error,
                                    );
                                  }
                                }
                              }
                              return (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={publicUrl}
                                  alt={getUserName(message)}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // 이미지 로드 실패 시 이니셜 표시
                                    e.currentTarget.style.display = "none";
                                    const parent =
                                      e.currentTarget.parentElement;
                                    if (parent) {
                                      const fallback =
                                        document.createElement("span");
                                      fallback.className =
                                        "text-sm font-semibold";
                                      fallback.style.color = isOwn
                                        ? palette.avatarText
                                        : palette.otherMessageText;
                                      fallback.textContent = getUserName(
                                        message,
                                      )
                                        .charAt(0)
                                        .toUpperCase();
                                      parent.appendChild(fallback);
                                    }
                                  }}
                                />
                              );
                            }
                            return (
                              <span
                                className="text-sm font-semibold"
                                style={
                                  {
                                    color: isOwn
                                      ? palette.avatarText
                                      : palette.otherMessageText,
                                  } as React.CSSProperties
                                }
                              >
                                {getUserName(message).charAt(0).toUpperCase()}
                              </span>
                            );
                          })()}
                        </div>

                        {/* Message */}
                        <div
                          className={`${isOwn ? "items-end" : "items-start"} flex flex-col`}
                        >
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-xs text-gray-600">
                              {getUserName(message)}
                              <UserBadge
                                totalPoints={
                                  message.user_profiles?.total_points || 0
                                }
                                isVip={false}
                                size="sm"
                              />
                            </span>
                            {/* 메시지 삭제 버튼 (본인 또는 관리자/운영자) */}
                            {(isOwn || user?.is_admin || isAdmin()) && (
                              <button
                                onClick={() =>
                                  deleteMessage(message.id, message.user_id)
                                }
                                className="text-red-400 hover:text-red-600 transition-colors"
                                title="메시지 삭제"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                            {/* 채팅금지 버튼 (운영자만, 자신 제외) */}
                            {isOperatorUser() && !isOwn && (
                              <div className="relative ban-menu-container">
                                <button
                                  onClick={() => {
                                    setShowBanMenu(
                                      showBanMenu === message.id
                                        ? null
                                        : message.id,
                                    );
                                  }}
                                  className="text-red-400 hover:text-red-600 transition-colors"
                                  title={
                                    language === "ko"
                                      ? "채팅금지"
                                      : "Prohibir chat"
                                  }
                                >
                                  <Ban className="w-3 h-3" />
                                </button>
                                {showBanMenu === message.id && (
                                  <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px] ban-menu-container">
                                    <button
                                      onClick={() => {
                                        if (
                                          confirm(
                                            language === "ko"
                                              ? `${getUserName(message)}님에게 채팅금지 1일을 적용하시겠습니까?`
                                              : `¿Prohibir el chat por 1 día a ${getUserName(message)}?`,
                                          )
                                        ) {
                                          chatBanUser(message.user_id, 1);
                                        }
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg"
                                    >
                                      {language === "ko" ? "1일" : "1 día"}
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (
                                          confirm(
                                            language === "ko"
                                              ? `${getUserName(message)}님에게 채팅금지 3일을 적용하시겠습니까?`
                                              : `¿Prohibir el chat por 3 días a ${getUserName(message)}?`,
                                          )
                                        ) {
                                          chatBanUser(message.user_id, 3);
                                        }
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                                    >
                                      {language === "ko" ? "3일" : "3 días"}
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (
                                          confirm(
                                            language === "ko"
                                              ? `${getUserName(message)}님에게 채팅금지 7일을 적용하시겠습니까?`
                                              : `¿Prohibir el chat por 7 días a ${getUserName(message)}?`,
                                          )
                                        ) {
                                          chatBanUser(message.user_id, 7);
                                        }
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                                    >
                                      {language === "ko" ? "7일" : "7 días"}
                                    </button>
                                    <div className="border-t border-gray-200"></div>
                                    <button
                                      onClick={() => {
                                        if (
                                          confirm(
                                            language === "ko"
                                              ? `${getUserName(message)}님을 영구 추방하시겠습니까? (최후의 수단)`
                                              : `¿Expulsar permanentemente a ${getUserName(message)}? (Último recurso)`,
                                          )
                                        ) {
                                          chatBanUser(message.user_id, null);
                                        }
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 font-semibold last:rounded-b-lg"
                                    >
                                      {language === "ko"
                                        ? "영구 추방"
                                        : "Expulsar"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div
                            className={`rounded-lg px-3 py-2 ${
                              isOwn
                                ? "border"
                                : "bg-white text-gray-900 border border-gray-200"
                            }`}
                            style={
                              isOwn
                                ? ({
                                    backgroundColor: palette.otherMessageBg,
                                    color: palette.otherMessageText,
                                    borderColor: palette.avatarBg,
                                  } as React.CSSProperties)
                                : {}
                            }
                          >
                            {message.image_url && (
                              <div className="mb-2 -mx-1">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={message.image_url}
                                  alt="Chat image"
                                  className="rounded-lg max-w-[300px] max-h-[400px] cursor-pointer hover:opacity-90 transition-opacity object-contain"
                                  onClick={() =>
                                    window.open(message.image_url, "_blank")
                                  }
                                  style={{ maxWidth: "min(300px, 80vw)" }}
                                />
                              </div>
                            )}
                            {message.message && (
                              <p
                                className={`text-sm whitespace-pre-wrap ${message.image_url ? "mt-2" : ""}`}
                              >
                                {message.message}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1 px-1">
                            <span className="text-xs text-gray-500">
                              {getTimeAgo(message.created_at)}
                            </span>
                            {/* 카카오톡 스타일 메시지 상태 (자신의 메시지만) */}
                            {isOwn && message.status && (
                              <div className="flex items-center gap-1 ml-1">
                                {message.status === "sending" && (
                                  <div className="animate-spin text-gray-400">
                                    <RotateCw className="w-3 h-3" />
                                  </div>
                                )}
                                {message.status === "sent" && (
                                  <span className="text-xs text-blue-500">
                                    ✓
                                  </span>
                                )}
                                {message.status === "failed" && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-red-500">
                                      ✗
                                    </span>
                                    <button
                                      onClick={() => retrySendMessage(message)}
                                      className="text-red-400 hover:text-red-600 transition-colors"
                                      title="재전송"
                                    >
                                      <RotateCw className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        deleteFailedMessage(message.id)
                                      }
                                      className="text-red-400 hover:text-red-600 transition-colors"
                                      title="삭제"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - 로딩 중이거나 인증되지 않은 사용자는 숨김 */}
      {/* 비로그인 사용자에게 로그인 안내 표시 */}
      {!(authLoading || loading) && (!user || !user.id) && (
        <div
          className="border-t border-gray-200"
          style={{ backgroundColor: palette.inputBg } as React.CSSProperties}
        >
          <div className="max-w-4xl mx-auto px-4 py-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {language === "ko"
                ? "메시지를 보내려면 로그인이 필요합니다."
                : "Inicia sesión para enviar mensajes."}
            </p>
            <button
              onClick={() =>
                router.push(
                  "/sign-in?redirect=" +
                    encodeURIComponent(window.location.pathname),
                )
              }
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {t("auth.loginButton")}
            </button>
          </div>
        </div>
      )}

      {/* ⚠️ 강화: user와 user.id가 반드시 있어야만 입력 필드 표시 */}
      {!(authLoading || loading) && user && user.id && (
        <div
          className="border-t border-gray-200"
          style={{ backgroundColor: palette.inputBg } as React.CSSProperties}
        >
          <div
            style={
              isDragging
                ? ({
                    border: "2px dashed " + palette.avatarBg,
                  } as React.CSSProperties)
                : {}
            }
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragging && (
              <div
                className="text-center py-8 font-semibold"
                style={{ color: palette.inputText } as React.CSSProperties}
              >
                Arrastra la imagen aquí para subir
              </div>
            )}
            <form
              onSubmit={sendMessage}
              className="max-w-4xl mx-auto px-4 py-3"
            >
              {/* Image Preview - Above input area */}
              {imagePreview && (
                <div className="mb-2 relative inline-block">
                  <div
                    className="relative w-24 h-24 border rounded-lg overflow-hidden"
                    style={
                      {
                        backgroundColor: palette.imageBg,
                      } as React.CSSProperties
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-300 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-400"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!user || uploading}
                  style={
                    {
                      backgroundColor: palette.imageBg,
                      borderColor: palette.imageBg,
                      color: palette.imageText,
                    } as React.CSSProperties
                  }
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.opacity = "0.8";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none"
                  style={
                    {
                      backgroundColor: palette.messageBg,
                      borderColor: palette.avatarBg,
                      focusRingColor: palette.avatarBg,
                    } as React.CSSProperties
                  }
                  onFocus={(e) => {
                    e.target.style.borderColor = palette.avatarBg;
                    e.target.style.boxShadow = `0 0 0 2px ${palette.avatarBg}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = palette.avatarBg;
                    e.target.style.boxShadow = "none";
                  }}
                  disabled={!user || uploading}
                />
                <Button
                  type="submit"
                  disabled={
                    !user || (!newMessage.trim() && !selectedImage) || uploading
                  }
                  className="px-6"
                  style={
                    {
                      backgroundColor: palette.otherMessageBg,
                      borderColor: palette.avatarBg,
                      color: palette.otherMessageText,
                    } as React.CSSProperties
                  }
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.opacity = "0.8";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  {uploading ? (
                    <div
                      className="animate-spin rounded-full h-5 w-5 border-b-2"
                      style={{ borderColor: "#6B46C1" }}
                    />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 참여자 관리 모달 */}
      {showParticipantsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Participantes</h3>
              <button onClick={() => setShowParticipantsModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {participants.length === 0 ? (
                <p className="text-gray-500 text-center">
                  No hay participantes
                </p>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant) => {
                    // 메시지에서 사용하는 getUserName 로직과 동일하게
                    let username = "Usuario";

                    // 1순위: users 테이블의 실제 이름
                    if (participant.users) {
                      if (participant.users.korean_name) {
                        username = participant.users.korean_name;
                      } else if (participant.users.spanish_name) {
                        username = participant.users.spanish_name;
                      } else if (participant.users.full_name) {
                        username = participant.users.full_name;
                      }
                    }

                    // 2순위: user_profiles의 display_name (fallback)
                    if (!username || username === "Usuario") {
                      if (participant.user_profiles?.display_name) {
                        username = participant.user_profiles.display_name;
                        // # 이후 부분 제거
                        if (username.includes("#")) {
                          username = username.split("#")[0];
                        }
                      }
                    }

                    const isCurrentUser = participant.user_id === user?.id;
                    const canModify = userRole === "owner" && !isCurrentUser;
                    const canKick =
                      (userRole === "owner" ||
                        userRole === "admin" ||
                        userRole === "moderator") &&
                      !isCurrentUser &&
                      participant.role !== "owner"; // 방장은 추방 불가

                    return (
                      <div
                        key={participant.user_id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{username}</p>
                            <p className="text-sm text-gray-500">
                              {participant.role === "owner"
                                ? "Anfitrión"
                                : participant.role === "admin"
                                  ? "Subanfitrión"
                                  : participant.role === "moderator"
                                    ? "Moderador"
                                    : "Miembro"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {canModify && (
                            <select
                              value={participant.role}
                              onChange={(e) =>
                                changeRole(participant.user_id, e.target.value)
                              }
                              className="border rounded px-2 py-1 text-sm"
                            >
                              <option value="member">Miembro</option>
                              <option value="moderator">Moderador</option>
                              <option value="admin">Subanfitrión</option>
                            </select>
                          )}
                          {canKick && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    language === "ko"
                                      ? `${username}님을 채팅방에서 추방하시겠습니까?`
                                      : `¿Expulsar a ${username} de la sala?`,
                                  )
                                ) {
                                  banUser(
                                    participant.user_id,
                                    language === "ko"
                                      ? "관리자에 의해 추방됨"
                                      : "Expulsado por administrador",
                                  );
                                  fetchParticipants();
                                }
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title={
                                language === "ko" ? "추방하기" : "Expulsar"
                              }
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 신고 관리 모달 */}
      {showReportsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Denuncias</h3>
              <button onClick={() => setShowReportsModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {reports.length === 0 ? (
                <p className="text-gray-500 text-center">
                  No hay denuncias pendientes
                </p>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => {
                    const reportedName = report.reported_user_name || "Usuario";
                    const reporterName = report.reporter_name || "Usuario";

                    return (
                      <div key={report.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">
                              Denunciado: {reportedName}
                            </p>
                            <p className="text-xs text-gray-500">
                              Denunciante: {reporterName}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          {report.reason}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReport(report.id, "dismiss")}
                            className="flex-1"
                          >
                            Descartar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`¿Expulsar a ${reportedName}?`)) {
                                banUser(report.reported_user_id, report.reason);
                                handleReport(report.id, "resolve");
                              }
                            }}
                            className="flex-1"
                          >
                            Expulsar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
