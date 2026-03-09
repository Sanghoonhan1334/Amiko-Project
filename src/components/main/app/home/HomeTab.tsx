"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import SplashSequence from "@/components/splash/SplashSequence";
import {
  Calendar,
  Users,
  TrendingUp,
  Eye,
  Clock,
  Heart,
  MessageSquare,
  Brain,
  Newspaper,
  Activity,
  Play,
  Palette,
  Image as ImageIcon,
  ChevronRight,
  MessageCircle,
  Bell,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { YouTubeVideo } from "@/lib/youtube";
import RandomPlayDanceSection from "./RandomPlayDanceSection";

interface Event {
  id: string;
  title: string;
  description: string;
  image: string;
  bannerMobile?: string;
  bannerDesktop?: string;
  date: string;
  participants: number;
}

interface HotPost {
  id: string;
  title: string;
  content: string;
  author: string;
  likes: number;
  comments: number;
  views: number;
  createdAt: string;
  category?: string;
}

interface PopularTest {
  id: string;
  title: string;
  description: string;
  participants: number;
  image: string;
  category: string;
  route?: string;
}

interface OnlineUser {
  id: string;
  name: string;
  profileImage: string;
  isOnline: boolean;
}

interface RecentStory {
  id: string;
  user_name: string;
  user_profile_image?: string;
  image_url?: string;
  text_content?: string;
  created_at: string;
  likes?: number;
}

interface GalleryPost {
  id: string;
  title: string;
  image: string;
  likes: number;
  createdAt: string;
}

interface ChatRoom {
  id: string;
  title: string;
  image?: string;
  memberCount: number;
  lastMessageAt?: string;
}

interface Poll {
  id: string;
  title: string;
  image?: string;
  totalVotes: number;
  createdAt: string;
}

interface NewsItem {
  id: string;
  title: string;
  createdAt: string;
  likes: number;
  comments: number;
  views: number;
}

interface DanceSong {
  id: string;
  song_title: string;
  artist_name: string;
  youtube_video_id?: string;
  display_order: number;
}

interface DancePlaylist {
  id: string;
  week_number: number;
  week_label: string;
  songs: DanceSong[];
}

interface DanceVideo {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url?: string;
  title?: string;
}

export default function HomeTab() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 스플래시 애니메이션 상태
  const [showSplash, setShowSplash] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const [currentEvents, setCurrentEvents] = useState<Event[]>([]);
  const [hotPosts, setHotPosts] = useState<HotPost[]>([]);
  const [popularTests, setPopularTests] = useState<PopularTest[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [recentStories, setRecentStories] = useState<RecentStory[]>([]);
  const [notices, setNotices] = useState<HotPost[]>([]);
  const [fanArtPosts, setFanArtPosts] = useState<GalleryPost[]>([]);
  const [idolPhotoPosts, setIdolPhotoPosts] = useState<GalleryPost[]>([]);
  const [hotChatRooms, setHotChatRooms] = useState<ChatRoom[]>([]);
  const [currentPolls, setCurrentPolls] = useState<Poll[]>([]);
  const [kNoticiaNews, setKNoticiaNews] = useState<NewsItem[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [youtubeLoading, setYoutubeLoading] = useState(true);
  const [dancePlaylist, setDancePlaylist] = useState<DancePlaylist | null>(
    null,
  );
  const [danceVideos, setDanceVideos] = useState<DanceVideo[]>([]);
  const [danceLoading, setDanceLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isAutoSliding, setIsAutoSliding] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);

  // 스토리 뷰어 상태
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [viewerStories, setViewerStories] = useState<RecentStory[]>([]);

  // 스플래시 애니메이션 초기화
  useEffect(() => {
    setIsClient(true);

    // URL에 splash=true가 있으면 스플래시 표시 (로고 클릭)
    const shouldShowSplash = searchParams.get("splash") === "true";

    if (shouldShowSplash) {
      setShowSplash(true);
      // URL에서 쿼리 파라미터 제거
      router.replace("/main?tab=home", { scroll: false });
    } else {
      // 초기 로드 시에만 스플래시 표시 (하루에 한 번만)
      const lastSplashDate = localStorage.getItem("amiko_last_splash_date");
      const today = new Date().toDateString();

      if (lastSplashDate !== today) {
        setShowSplash(true);
        localStorage.setItem("amiko_last_splash_date", today);
      }
    }
  }, [searchParams, router]);

  // 스플래시 표시 시 body에 클래스 추가/제거
  useEffect(() => {
    if (showSplash) {
      document.body.classList.add("splash-active");
    } else {
      document.body.classList.remove("splash-active");
    }

    return () => {
      document.body.classList.remove("splash-active");
    };
  }, [showSplash]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Mostrar modal de privacidad cuando termine el loading (si no se ha leído ya)
  useEffect(() => {
    if (!isClient) return;
    if (!loading) {
      try {
        const read = localStorage.getItem("amiko_privacy_readed");
        if (!read) {
          setShowPrivacyModal(true);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [loading, isClient]);

  const handleAcceptPrivacy = () => {
    try {
      localStorage.setItem("amiko_privacy_readed", "true");
    } catch (e) {
      // ignore
    }
    setShowPrivacyModal(false);
  };

  // 이벤트 자동 슬라이드
  useEffect(() => {
    if (currentEvents.length > 1 && isAutoSliding) {
      const interval = setInterval(() => {
        setCurrentEventIndex((prev) => (prev + 1) % currentEvents.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentEvents.length, isAutoSliding]);

  // 마우스 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartY(e.clientY);
    setIsAutoSliding(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX;
    const deltaY = Math.abs(e.clientY - dragStartY);

    // 수직 드래그가 수평 드래그보다 크면 무시 (페이지 스크롤 방지)
    if (deltaY > Math.abs(deltaX)) {
      setIsDragging(false);
      setTimeout(() => setIsAutoSliding(true), 3000);
      return;
    }

    if (Math.abs(deltaX) > 50) {
      // 최소 드래그 거리
      if (deltaX > 0) {
        // 오른쪽으로 드래그 - 이전 이벤트
        setCurrentEventIndex(
          (prev) => (prev - 1 + currentEvents.length) % currentEvents.length,
        );
      } else {
        // 왼쪽으로 드래그 - 다음 이벤트
        setCurrentEventIndex((prev) => (prev + 1) % currentEvents.length);
      }
    }

    setIsDragging(false);
    setTimeout(() => setIsAutoSliding(true), 3000);
  };

  // 터치 스와이프 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragStartX(touch.clientX);
    setDragStartY(touch.clientY);
    setIsAutoSliding(false);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - dragStartX;
    const deltaY = Math.abs(touch.clientY - dragStartY);

    // 수직 스와이프가 수평 스와이프보다 크면 무시
    if (deltaY > Math.abs(deltaX)) {
      setTimeout(() => setIsAutoSliding(true), 3000);
      return;
    }

    if (Math.abs(deltaX) > 50) {
      // 최소 스와이프 거리
      if (deltaX > 0) {
        // 오른쪽으로 스와이프 - 이전 이벤트
        setCurrentEventIndex(
          (prev) => (prev - 1 + currentEvents.length) % currentEvents.length,
        );
      } else {
        // 왼쪽으로 스와이프 - 다음 이벤트
        setCurrentEventIndex((prev) => (prev + 1) % currentEvents.length);
      }
    }

    setTimeout(() => setIsAutoSliding(true), 3000);
  };

  // 실제 데이터 로딩 함수들
  const loadCurrentEvents = async () => {
    try {
      const response = await fetch("/api/home-banners");
      if (!response.ok) throw new Error("Failed to fetch banners");
      const data = await response.json();
      const banners: Event[] = (data.banners || []).map((b: any) => ({
        id: b.id,
        title: language === "ko" ? (b.title_ko || b.title_es) : (b.title_es || b.title_ko),
        description: language === "ko"
          ? (b.description_ko || b.description_es || "")
          : (b.description_es || b.description_ko || ""),
        image: b.image_url,
        bannerMobile: b.image_url,
        bannerDesktop: b.image_url,
        date: b.link_url || "",
        participants: 0,
      }));
      setCurrentEvents(banners);
    } catch (error) {
      console.error("이벤트 로딩 실패:", error);
      setCurrentEvents([]);
    }
  };

  const loadHotPosts = async () => {
    try {
      console.log("Loading hot posts from database...");

      // 실제 데이터베이스에서 인기글(is_hot = true 또는 좋아요 많은 글) 가져오기
      const response = await fetch("/api/posts/popular?filter=hot&limit=5");

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error("Failed to fetch hot posts");
      }

      const data = await response.json();
      console.log("API Response:", data);

      console.log("[loadHotPosts] 🔍 API 응답 데이터 분석:", {
        hasPosts: !!data.posts,
        isArray: Array.isArray(data.posts),
        postsCount: data.posts?.length || 0,
        firstPost: data.posts?.[0],
      });

      if (data.posts && Array.isArray(data.posts)) {
        // 공지사항 제외 필터링
        const filteredPosts = data.posts.filter((post: any) => !post.is_notice);

        // 데이터 포맷팅
        const formattedPosts = filteredPosts.map((post: any) => {
          console.log("[loadHotPosts] 📝 포스트 처리:", {
            id: post.id,
            title: post.title,
            is_notice: post.is_notice,
            category: post.category,
          });

          // 카테고리 이름 설정
          let categoryName =
            post.category || (language === "ko" ? "자유" : "Libre");

          // 작성자 이름 처리 ('익명' 번역)
          let authorName =
            post.user?.korean_name ||
            post.user?.spanish_name ||
            post.user?.full_name ||
            (language === "ko" ? "익명" : "Anónimo");
          if (authorName === "익명") {
            authorName = language === "ko" ? "익명" : "Anónimo";
          }

          return {
            id: post.id,
            title: post.title,
            content: post.content,
            author: authorName,
            likes: post.like_count || 0,
            comments: post.comment_count || 0,
            views: post.view_count || 0,
            createdAt: formatTimeAgo(post.created_at),
            category: categoryName,
          };
        });

        console.log(
          "[loadHotPosts] ✅ 포맷팅 완료 (공지사항 제외):",
          formattedPosts.length,
          "개",
        );
        console.log("[loadHotPosts] 📋 첫 번째 포스트:", formattedPosts[0]);

        // 5개로 제한
        setHotPosts(formattedPosts.slice(0, 5));
      } else {
        console.log("[loadHotPosts] ❌ posts 배열 없음 또는 빈 배열");
        setHotPosts([]);
      }
    } catch (error) {
      console.error("핫 포스트 로딩 실패:", error);
      setHotPosts([]);
    }
  };

  const loadPopularTests = async () => {
    try {
      // API에서 실제 퀴즈 데이터 가져오기
      const response = await fetch("/api/quizzes");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          const formattedTests = data.data
            .map((quiz: any) => ({
              id: quiz.slug || quiz.id,
              title: quiz.title,
              description: quiz.description,
              participants: quiz.total_participants || 0,
              image: quiz.thumbnail_url || "/misc/placeholder.png",
              category: quiz.category,
              route: `/quiz/${quiz.slug || quiz.id}`,
            }))
            // 참여자 순으로 정렬
            .sort((a: any, b: any) => b.participants - a.participants);

          // 1줄(3개)만 표시
          setPopularTests(formattedTests.slice(0, 4));
        } else {
          setPopularTests([]);
        }
      } else {
        setPopularTests([]);
      }
    } catch (error) {
      console.error("인기 테스트 로딩 실패:", error);
      setPopularTests([]);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      // 온라인 사용자 API 호출
      const response = await fetch("/api/users/online");

      if (!response.ok) {
        console.error("온라인 사용자 API 응답 오류:", response.status);
        setOnlineUsers([]);
        return;
      }

      const data = await response.json();
      const users = data.users || [];

      // API에서 받은 실제 데이터 사용
      setOnlineUsers(users);

      console.log("온라인 사용자 로딩 완료:", users);
    } catch (error) {
      console.error("온라인 사용자 로딩 실패:", error);
      setOnlineUsers([]);
    }
  };

  const loadRecentStories = async () => {
    // 스토리 기능이 비활성화되어 있으면 로드하지 않음
    if (process.env.NEXT_PUBLIC_ENABLE_STORIES !== "true") {
      setRecentStories([]);
      return;
    }

    try {
      console.log("Loading recent stories...");

      const response = await fetch("/api/stories?isPublic=true&limit=6");

      if (!response.ok) {
        throw new Error(`Failed to fetch stories: ${response.status}`);
      }

      const data = await response.json();

      if (data.stories && data.stories.length > 0) {
        setRecentStories(data.stories);
      } else {
        setRecentStories([]);
      }
    } catch (error) {
      console.error("최근 스토리 로딩 실패:", error);
      setRecentStories([]);
    }
  };

  const loadNotices = async () => {
    try {
      const response = await fetch(
        "/api/posts?is_notice=true&limit=10&sort=created_at",
      );

      if (!response.ok) {
        setNotices([]);
        return;
      }

      const data = await response.json();

      if (data.posts && data.posts.length > 0) {
        // 데이터 포맷팅
        const formattedNotices = data.posts.slice(0, 3).map((post: any) => {
          let authorName =
            post.author?.korean_name ||
            post.author?.spanish_name ||
            post.author?.full_name ||
            (language === "ko" ? "관리자" : "Administrador");
          // '익명'을 언어에 맞게 변환
          if (authorName === "익명") {
            authorName = language === "ko" ? "익명" : "Anónimo";
          }

          return {
            id: post.id,
            title: post.title,
            content: post.content,
            author: authorName,
            likes: post.like_count || 0,
            comments: post.comment_count || 0,
            views: post.view_count || 0,
            createdAt: formatTimeAgo(post.created_at),
            category: post.category || "공지사항",
          };
        });

        setNotices(formattedNotices);
      } else {
        setNotices([]);
      }
    } catch (error) {
      setNotices([]);
    }
  };

  // 유틸리티 함수 (메모이제이션)
  const formatTimeAgo = useCallback(
    (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60),
      );

      if (diffInMinutes < 60) {
        return language === "ko"
          ? `${diffInMinutes}분 전`
          : `hace ${diffInMinutes} min`;
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        return language === "ko" ? `${hours}시간 전` : `hace ${hours}h`;
      } else {
        const days = Math.floor(diffInMinutes / 1440);
        return language === "ko" ? `${days}일 전` : `hace ${days} días`;
      }
    },
    [language],
  );

  const loadGalleryPosts = async () => {
    try {
      // 팬아트 포스트 로드 (fan_art 테이블)
      const fanArtResponse = await fetch("/api/fanart?sort=popular");
      if (fanArtResponse.ok) {
        const fanArtData = await fanArtResponse.json();
        if (fanArtData && Array.isArray(fanArtData)) {
          const formattedPosts = fanArtData.slice(0, 4).map((post: any) => ({
            id: post.id,
            title: post.title || "",
            image: post.image_url || "/misc/placeholder.png",
            likes: post.likes_count || 0,
            createdAt: formatTimeAgo(post.created_at),
          }));
          setFanArtPosts(formattedPosts);
        }
      }

      // 아이돌 사진 포스트 로드 (idol_memes 테이블)
      const idolResponse = await fetch("/api/idol-photos?sort=popular");
      if (idolResponse.ok) {
        const idolData = await idolResponse.json();
        if (idolData && Array.isArray(idolData)) {
          const formattedPosts = idolData.slice(0, 4).map((post: any) => ({
            id: post.id,
            title: post.title || "",
            image:
              post.media_url || post.thumbnail_url || "/misc/placeholder.png",
            likes: post.likes_count || 0,
            createdAt: formatTimeAgo(post.created_at),
          }));
          setIdolPhotoPosts(formattedPosts);
        }
      }
    } catch (error) {
      console.error("갤러리 포스트 로딩 실패:", error);
    }
  };

  const loadHotChatRoomsAndPolls = async () => {
    try {
      // 사용자가 만든 채팅방 로드 (아미코 채팅방 제외)
      const chatRoomResponse = await fetch("/api/chat/rooms");
      if (chatRoomResponse.ok) {
        const chatRoomData = await chatRoomResponse.json();
        if (
          chatRoomData.success &&
          chatRoomData.rooms &&
          chatRoomData.rooms.length > 0
        ) {
          // 아미코 채팅방 제외 (이름이나 설명에 amiko, 아미코, equipo, administradores 포함된 것 제외)
          const filteredRooms = chatRoomData.rooms.filter((room: any) => {
            const name = room.name?.toLowerCase() || "";
            const description = room.description?.toLowerCase() || "";
            const isAmikoRoom =
              name.includes("amiko") ||
              name.includes("아미코") ||
              name.includes("equipo") ||
              name.includes("administradores") ||
              description.includes("amiko") ||
              description.includes("아미코") ||
              description.includes("administradores coreanos");
            return (
              !isAmikoRoom &&
              room.type === "fanclub" &&
              room.is_active !== false
            );
          });

          // 최근 업데이트된 순으로 정렬하고 최대 3개만 표시
          const sortedRooms = filteredRooms
            .sort((a: any, b: any) => {
              const dateA = new Date(
                a.updated_at || a.created_at || 0,
              ).getTime();
              const dateB = new Date(
                b.updated_at || b.created_at || 0,
              ).getTime();
              return dateB - dateA;
            })
            .slice(0, 3);

          if (sortedRooms.length > 0) {
            const formattedChatRooms = sortedRooms.map((room: any) => ({
              id: room.id,
              title: room.name || "Chat Room",
              image: room.thumbnail_url || "/misc/placeholder.png",
              memberCount: room.participant_count || 0,
              lastMessageAt: room.updated_at
                ? formatTimeAgo(room.updated_at)
                : undefined,
            }));
            setHotChatRooms(formattedChatRooms);
          } else {
            setHotChatRooms([]);
          }
        } else {
          setHotChatRooms([]);
        }
      }

      // 투표 데이터 로드 (투표수 조건 없이 모든 활성 투표 표시)
      const pollResponse = await fetch("/api/polls?status=active&limit=10");
      if (pollResponse.ok) {
        const pollData = await pollResponse.json();
        if (pollData.polls && pollData.polls.length > 0) {
          const formattedPolls = pollData.polls.slice(0, 4).map((poll: any) => {
            const imageUrl = poll.image_url || poll.options?.[0]?.image_url;
            // placeholder 이미지는 null로 처리
            const validImageUrl =
              imageUrl && !imageUrl.includes("placeholder") ? imageUrl : null;

            return {
              id: poll.id,
              title: poll.question || poll.title,
              image: validImageUrl,
              totalVotes: poll.total_votes || 0,
              createdAt: formatTimeAgo(poll.created_at),
            };
          });
          setCurrentPolls(formattedPolls);
        }
      }
    } catch (error) {
      console.error("채팅방/투표 로딩 실패:", error);
    }
  };

  const loadKNoticiaNews = async () => {
    try {
      const response = await fetch("/api/news?limit=5");

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.newsItems && data.newsItems.length > 0) {
          const formattedNews = data.newsItems.map((news: any) => ({
            id: news.id,
            title: language === "ko" ? news.title : news.title_es || news.title,
            createdAt: formatTimeAgo(news.created_at),
            likes: news.like_count || 0,
            comments: news.comment_count || 0,
            views: news.view_count || 0,
          }));
          setKNoticiaNews(formattedNews);
        } else {
          setKNoticiaNews([]);
        }
      } else {
        console.error("뉴스 로딩 실패:", response.status, response.statusText);
        setKNoticiaNews([]);
      }
    } catch (error) {
      console.error("뉴스 로딩 오류:", error);
      setKNoticiaNews([]);
    }
  };

  const loadYoutubeVideos = async () => {
    setYoutubeLoading(true);
    try {
      // 하드코딩된 AMIKO 채널 영상 (API 할당량 절약)
      const videos = [
        {
          id: "cZxLM4-mSrw",
          title: "AMIKO Official Video 1",
          thumbnail: "https://img.youtube.com/vi/cZxLM4-mSrw/maxresdefault.jpg",
          duration: "",
          publishedAt: new Date().toISOString(),
          url: "https://www.youtube.com/watch?v=cZxLM4-mSrw",
        },
        {
          id: "do4aDyGZmgM",
          title: "AMIKO Official Video 2",
          thumbnail: "https://img.youtube.com/vi/do4aDyGZmgM/maxresdefault.jpg",
          duration: "",
          publishedAt: new Date().toISOString(),
          url: "https://www.youtube.com/watch?v=do4aDyGZmgM",
        },
      ];

      setYoutubeVideos(videos);
      console.log("✅ YouTube 영상 로드 완료 (하드코딩):", videos.length, "개");
    } catch (error) {
      console.error("YouTube 비디오 로딩 실패:", error);
      setYoutubeVideos([]);
    } finally {
      setYoutubeLoading(false);
    }
  };

  const loadDanceData = async () => {
    setDanceLoading(true);
    try {
      // 최신 플레이리스트 가져오기
      const playlistResponse = await fetch("/api/dance/playlist/current");
      if (playlistResponse.ok) {
        const playlistData = await playlistResponse.json();
        console.log("[HomeTab] 플레이리스트 데이터:", playlistData);
        // id가 null이 아니고 songs가 있는 경우에만 설정
        if (playlistData && playlistData.id) {
          setDancePlaylist(playlistData);
        } else {
          setDancePlaylist(null);
        }
      } else {
        console.error(
          "[HomeTab] 플레이리스트 조회 실패:",
          playlistResponse.status,
        );
        setDancePlaylist(null);
      }
      // 승인된 댄스 비디오 가져오기 (최신 12개)
      const videosResponse = await fetch(
        "/api/dance/videos?limit=12&status=approved",
      );
      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        setDanceVideos(videosData.videos || []);
      }
    } catch (error) {
      console.error("댄스 데이터 로딩 실패:", error);
      setDancePlaylist(null);
    } finally {
      setDanceLoading(false);
    }
  };

  // 모든 데이터 로딩
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDanceData(),
        loadCurrentEvents(),
        loadHotPosts(),
        loadPopularTests(),
        loadRecentStories(),
        loadNotices(),
        loadGalleryPosts(),
        loadKNoticiaNews(),
        loadYoutubeVideos(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 데이터 로딩
  useEffect(() => {
    loadAllData();
  }, [language]);

  // 페이지가 다시 포커스될 때 데이터 새로고침 (뉴스 업데이트 반영)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 뉴스 데이터만 새로고침 (전체 새로고침은 부담이 클 수 있음)
        loadKNoticiaNews();
        loadHotPosts();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const formatNumber = useCallback((num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  }, []);

  const categoryMap = useMemo(
    () => ({
      공지사항: language === "ko" ? "공지" : "Aviso",
      Anuncios: "Aviso",
      자유게시판: language === "ko" ? "자유" : "Libre",
      "Foro Libre": "Libre",
      Libre: "Libre",
      "K-POP": "K-POP",
      "Foro K-POP": "K-POP",
      "K-Drama": "Drama",
      "Foro K-Drama": "Drama",
      뷰티: language === "ko" ? "뷰티" : "Beauty",
      "Foro de Belleza": "Beauty",
      한국어: language === "ko" ? "한국어" : "Coreano",
      "Foro de Coreano": "Coreano",
      스페인어: language === "ko" ? "스페인어" : "Español",
      "Foro de Español": "Español",
    }),
    [language],
  );

  const shortenCategoryName = useCallback(
    (category: string) => {
      return categoryMap[category] || category.substring(0, 6);
    },
    [categoryMap],
  );

  // 스플래시 애니메이션 표시
  if (!isClient) {
    return (
      <div className="min-h-screen body-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-600 dark:border-gray-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {language === "ko" ? "로딩 중..." : "Cargando..."}
          </p>
        </div>
      </div>
    );
  }

  if (showSplash) {
    return <SplashSequence onComplete={handleSplashComplete} />;
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        {/* 이벤트 스켈레톤 */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>

        {/* 온라인 사용자 스켈레톤 */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <div className="flex space-x-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-12 rounded-full" />
            ))}
          </div>
        </div>

        {/* 핫 포스트 스켈레톤 */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-28" />
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>

        {/* 인기 테스트 스켈레톤 */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 모바일 버전 - 기존 그대로 */}
      <div className="md:hidden space-y-6 px-2 pt-6 pb-4">
        {/* Random Play Dance 섹션 */}
        {/* <RandomPlayDanceSection
          playlist={dancePlaylist}
          videos={danceVideos}
          loading={danceLoading}
          onPlaylistUpdate={loadDanceData}
          hideVideoGrid={true}
        /> */}
        {/* 1. Post Populares - 지금 커뮤니티에서 핫한 글 */}
        {/* 지금 커뮤니티에서 핫한 글 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {t("home.sections.hotPosts")}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/community/freeboard")}
              className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
            >
              {language === "ko" ? "더 보기" : "Ver Más"}
            </Button>
          </div>

          {hotPosts.length > 0 ? (
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-0">
                <div className="divide-y">
                  {hotPosts.map((post, index) => (
                    <div
                      key={post.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors px-3 py-1"
                      onClick={() =>
                        router.push(`/community/post/${post.id}?from=home`)
                      }
                    >
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-700 border-0 px-1.5 py-0.5 font-medium text-[10px] whitespace-nowrap">
                          {shortenCategoryName(post.category || "Libre")}
                        </Badge>
                        <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex-1 line-clamp-1">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-0.5">
                            <Heart className="w-3 h-3 text-red-500" />
                            <span>{post.likes}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <MessageSquare className="w-3 h-3 text-blue-500" />
                            <span>{post.comments}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Eye className="w-3 h-3" />
                            <span>{formatNumber(post.views)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  {language === "ko"
                    ? "핫한 게시글이 없습니다"
                    : "No hay posts populares"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 2. K-noticias - 오늘의 K-Noticia */}
        {/* 오늘의 K-Noticia - 모바일 버전 */}
        {/* K-Noticia 뉴스 섹션 */}
        <div className="space-y-3 md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src="/icons/home-news.png"
                alt="K-Noticia"
                className="w-8 h-8 object-contain mr-2"
              />
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {t("home.sections.kNoticia")}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/community/news")}
              className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
            >
              {language === "ko" ? "더 보기" : "Ver Más"}
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {kNoticiaNews.length > 0 ? (
                  kNoticiaNews.map((news) => (
                    <div
                      key={news.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors px-3 py-1"
                      onClick={() =>
                        router.push(`/community/news?id=${news.id}&from=home`)
                      }
                    >
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-700 border-0 px-1.5 py-0.5 font-medium text-[10px] whitespace-nowrap">
                          {t("home.sections.news")}
                        </Badge>
                        <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex-1 line-clamp-1">
                          {news.title}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-0.5">
                            <Heart className="w-3 h-3 text-red-500" />
                            <span>{news.likes}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <MessageSquare className="w-3 h-3 text-blue-500" />
                            <span>{news.comments}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Eye className="w-3 h-3" />
                            <span>{formatNumber(news.views)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <img
                      src="/icons/home-news.png"
                      alt="K-Noticia"
                      className="w-8 h-8 mx-auto mb-2 opacity-40"
                    />
                    <p className="text-gray-500 text-xs">
                      {language === "ko"
                        ? "뉴스가 없습니다"
                        : "No hay noticias"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Evento - 현재 진행 이벤트 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t("home.sections.currentEvents")}
            </h2>
          </div>

          {currentEvents.length > 0 ? (
            <Card className="relative overflow-hidden rounded-lg">
              <CardContent className="p-0">
                <div
                  id="event-container"
                  className="relative aspect-[2/1] w-full overflow-hidden rounded-lg cursor-grab active:cursor-grabbing select-none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => setIsDragging(false)}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <div
                    className="flex h-full transition-transform duration-700 ease-in-out"
                    style={{
                      transform: `translateX(-${currentEventIndex * 100}%)`,
                    }}
                  >
                    {currentEvents.map((event, index) => (
                      <div
                        key={event.id}
                        className="relative w-full h-full flex-shrink-0 cursor-pointer rounded-lg overflow-hidden"
                        onClick={() => {
                          if (event.id === "event-korean-meeting") {
                            router.push("/main?tab=event&show=korean-meeting");
                          } else if (event.id === "event-opening") {
                            router.push("/main?tab=event");
                          }
                        }}
                      >
                        {/* 배너 이미지 */}
                        <Image
                          src={
                            event.image ||
                            event.bannerMobile ||
                            "/banners/event-banner.png"
                          }
                          alt={event.title}
                          fill
                          className="object-contain"
                          priority={index === 0}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 이벤트 인디케이터 */}
                {currentEvents.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    {currentEvents.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentEventIndex
                            ? "bg-white"
                            : "bg-white/50"
                        }`}
                        onClick={() => setCurrentEventIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  {language === "ko"
                    ? "진행 중인 이벤트가 없습니다"
                    : "No hay eventos en curso"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 4. Anuncio - 공지사항 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t("home.sections.announcements")}
            </h2>
          </div>

          {/* 공지사항 목록 - 실제 데이터 */}
          <div className="space-y-2">
            {notices.length > 0 ? (
              notices.map((notice) => (
                <Card
                  key={notice.id}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    router.push(`/community/post/${notice.id}?from=home`)
                  }
                >
                  <CardContent className="py-1 px-3">
                    <div className="flex md:flex-row flex-col md:items-center gap-2 md:gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <Badge className="bg-green-100 text-green-700 border-0 px-2 py-0.5 font-medium text-xs">
                          {t("home.sections.announcement")}
                        </Badge>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1 line-clamp-1">
                          {notice.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span>{notice.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          <span>{notice.comments}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{notice.views}</span>
                        </div>
                        <div className="flex items-center gap-1 hidden md:flex">
                          <Clock className="w-4 h-4" />
                          <span className="text-gray-500">
                            {notice.createdAt}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-gray-500 text-sm">
                    {language === "ko"
                      ? "공지사항이 없습니다"
                      : "No hay anuncios"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* 인기 심리테스트 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {t("home.sections.popularTests")}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/community/tests")}
              className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
            >
              {language === "ko" ? "더 보기" : "Ver Más"}
            </Button>
          </div>

          {popularTests.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {popularTests.map((test) => (
                <div
                  key={test.id}
                  className="cursor-pointer group"
                  onClick={() => router.push(test.route || "/community/tests")}
                >
                  <div className="relative mb-3">
                    <img
                      src={test.image}
                      alt={test.title}
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      className="w-full h-32 md:h-48 lg:h-56 xl:h-64 object-contain rounded-lg"
                    />
                  </div>

                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2 line-clamp-2">
                    {test.title}
                  </h3>

                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <Play className="w-3 h-3" />
                    <span>
                      {formatNumber(test.participants)}
                      {language === "ko" ? "명" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  {language === "ko"
                    ? "인기 테스트가 없습니다"
                    : "No hay tests populares"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 팬아트 & 아이돌 사진 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* 팬아트 */}
          {/* <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/icons/home-fanart.png"
                  alt="팬아트"
                  className="w-5 h-5 object-contain"
                />
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {t("home.sections.fanArt")}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/community/fanart")}
                className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
              >
                {language === "ko" ? "더 보기" : "Ver Más"}
              </Button>
            </div>

            <Card>
              <CardContent className="p-2">
                <div className="grid grid-cols-2 gap-2">
                  {fanArtPosts.length > 0 ? (
                    fanArtPosts.slice(0, 4).map((post) => (
                      <div
                        key={post.id}
                        className="cursor-pointer group"
                        onClick={() =>
                          router.push(`/community/fanart/${post.id}?from=home`)
                        }
                      >
                        <div className="relative aspect-square overflow-hidden rounded-lg mb-1">
                          <img
                            src={post.image}
                            alt={post.title}
                            loading="lazy"
                            decoding="async"
                            fetchPriority="low"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                          {post.title}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Heart className="w-3 h-3" />
                          <span>
                            {post.likes} · {post.createdAt}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-4">
                      <img
                        src="/icons/home-fanart.png"
                        alt="팬아트"
                        className="w-5 h-5 mx-auto mb-2 opacity-40"
                      />
                      <p className="text-gray-500 text-xs">
                        {language === "ko"
                          ? "팬아트가 없습니다"
                          : "No hay fan art"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div> */}

          {/* 아이돌 사진 */}
          {/* <div className="space-y-2 pt-16 md:pt-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/icons/home-idol.png"
                  alt="아이돌 사진"
                  className="w-5 h-5 object-contain"
                />
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {t("home.sections.idolPhotos")}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/community/idol-photos")}
                className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
              >
                {language === "ko" ? "더 보기" : "Ver Más"}
              </Button>
            </div>

            <Card>
              <CardContent className="p-2">
                <div className="grid grid-cols-2 gap-2">
                  {idolPhotoPosts.length > 0 ? (
                    idolPhotoPosts.slice(0, 4).map((post) => (
                      <div
                        key={post.id}
                        className="cursor-pointer group"
                        onClick={() =>
                          router.push(
                            `/community/idol-photos/${post.id}?from=home`,
                          )
                        }
                      >
                        <div className="relative aspect-square overflow-hidden rounded-lg mb-1">
                          <img
                            src={post.image}
                            alt={post.title}
                            loading="lazy"
                            decoding="async"
                            fetchPriority="low"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                          {post.title}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Heart className="w-3 h-3" />
                          <span>
                            {post.likes} · {post.createdAt}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-4">
                      <img
                        src="/icons/home-idol.png"
                        alt="아이돌 사진"
                        className="w-5 h-5 mx-auto mb-2 opacity-40"
                      />
                      <p className="text-gray-500 text-xs">
                        {language === "ko"
                          ? "아이돌 사진이 없습니다"
                          : "No hay fotos de ídolos"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div> */}
        </div>

        {/* 화상채팅 온라인 인원 - 모바일 버전 - 미구현으로 숨김 */}
        {/* <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('home.sections.videoChatOnline')}
            </h2>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            {onlineUsers.length}{language === 'ko' ? '명' : ''}
          </Badge>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 overflow-x-auto">
              {onlineUsers.length > 0 ? (
                onlineUsers.map((user) => (
                  <div key={user.id} className="flex flex-col items-center min-w-16">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.profileImage} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-xs font-semibold">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                      {user.name}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center w-full py-4 text-sm text-gray-400">
                  {language === 'ko' ? '현재 온라인 사용자가 없습니다' : 'No hay usuarios en línea'}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => router.push('/main?tab=meet')}
              >
                <Users className="w-4 h-4 mr-1" />
                {t('home.community.seeMore')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* 지금 핫 한 채팅방 & 지금 투표 - 숨김 처리 (당분간 사용 안 함) */}
        {false && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 지금 핫 한 채팅방 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src="/icons/Zona de K-Cultura.png"
                    alt="K-Culture Zone"
                    className="w-5 h-5 object-contain"
                  />
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {t("home.sections.hotChatRooms")}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/community/k-chat")}
                  className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
                >
                  {language === "ko" ? "더 보기" : "Ver Más"}
                </Button>
              </div>

              <Card>
                <CardContent className="p-2">
                  {hotChatRooms.length > 0 ? (
                    <div className="space-y-2">
                      {hotChatRooms.map((room) => (
                        <div
                          key={room.id}
                          className="cursor-pointer group"
                          onClick={() =>
                            router.push(
                              `/community/k-chat/${room.id}?from=home`,
                            )
                          }
                        >
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg">
                              <img
                                src={room.image || "/misc/placeholder.png"}
                                alt={room.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                                {room.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <Users className="w-3 h-3" />
                                <span>
                                  {room.memberCount} ·{" "}
                                  {room.lastMessageAt || "지금"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <img
                        src="/icons/Zona de K-Cultura.png"
                        alt="K-Culture Zone"
                        className="w-8 h-8 mx-auto mb-2 opacity-40"
                      />
                      <p className="text-gray-500 text-xs">
                        {language === "ko"
                          ? "핫 한 채팅방이 없습니다"
                          : "No hay chats calientes"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 지금 투표 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src="/icons/Zona de K-Cultura.png"
                    alt="K-Culture Zone"
                    className="w-5 h-5 object-contain"
                  />
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {t("home.sections.currentPolls")}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/community/polls")}
                  className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
                >
                  {language === "ko" ? "더 보기" : "Ver Más"}
                </Button>
              </div>

              <Card>
                <CardContent className="p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {currentPolls.length > 0 ? (
                      currentPolls.slice(0, 4).map((poll) => (
                        <div
                          key={poll.id}
                          className="cursor-pointer group"
                          onClick={() => router.push(`/community/polls`)}
                        >
                          <div className="relative aspect-square overflow-hidden rounded-lg mb-1">
                            {poll.image ? (
                              <img
                                src={poll.image}
                                alt={poll.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-yellow-50 via-yellow-100 to-orange-50 flex items-center justify-center">
                                <img
                                  src="/icons/Encuestas.png"
                                  alt="Poll"
                                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-sm"
                                />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                            {poll.title}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <TrendingUp className="w-3 h-3" />
                            <span>
                              {poll.totalVotes} · {poll.createdAt}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-4">
                        <img
                          src="/icons/Zona de K-Cultura.png"
                          alt="K-Culture Zone"
                          className="w-8 h-8 mx-auto mb-2 opacity-40"
                        />
                        <p className="text-gray-500 text-xs">
                          {language === "ko"
                            ? "진행 중인 투표가 없습니다"
                            : "No hay votaciones activas"}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* 최근 스토리 - 그리드 레이아웃 - 환경 변수로 제어 */}
        {process.env.NEXT_PUBLIC_ENABLE_STORIES === "true" && (
          <div className="space-y-3 md:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img
                  src="/icons/story.png"
                  alt="Stories"
                  className="w-5 h-5 object-contain mr-2"
                />
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {t("home.sections.recentStories")}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/community/stories")}
                className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
              >
                {language === "ko" ? "더 보기" : "Ver Más"}
              </Button>
            </div>

            <Card>
              <CardContent className="p-3">
                {recentStories.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {recentStories.slice(0, 8).map((story, idx) => (
                      <div
                        key={story.id}
                        className="cursor-pointer group"
                        onClick={() => {
                          const userStories = recentStories.filter(
                            (s) => s.user_name === story.user_name,
                          );
                          if (userStories.length > 0) {
                            setViewerStories(userStories);
                            setSelectedStoryIndex(
                              userStories.findIndex((s) => s.id === story.id),
                            );
                            setShowStoryViewer(true);
                          }
                        }}
                      >
                        <div className="relative aspect-square overflow-hidden rounded-lg mb-2">
                          {story.image_url ? (
                            <img
                              src={story.image_url}
                              alt={story.user_name}
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                              <span className="text-white font-bold text-2xl">
                                {story.user_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 mb-1 line-clamp-1">
                          {story.user_name}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <Heart className="w-3 h-3 text-red-500" />
                          <span>{story.likes || 0}</span>
                          <span className="text-gray-400">·</span>
                          <span>{formatTimeAgo(story.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <img
                      src="/icons/story.png"
                      alt="Stories"
                      className="w-8 h-8 mx-auto mb-2 opacity-40"
                    />
                    <p className="text-gray-500 text-xs">
                      {language === "ko"
                        ? "스토리가 없습니다"
                        : "No hay historias"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* AMIKO 최근 영상 */}
        {/* <div className="space-y-3 md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-red-600" />
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {t("home.sections.recentVideos")}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                window.open(
                  "https://www.youtube.com/@AMIKO_Officialstudio",
                  "_blank",
                )
              }
              className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
            >
              {language === "ko" ? "더 보기" : "Ver Más"}
            </Button>
          </div>

          <Card>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-3">
                {youtubeVideos.length > 0 ? (
                  youtubeVideos.slice(0, 2).map((video) => (
                    <div
                      key={video.id}
                      className="cursor-pointer group"
                      onClick={() => window.open(video.url, "_blank")}
                    >
                      <div className="relative aspect-square overflow-hidden rounded-lg mb-2 bg-gray-100">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-[6px] px-1 rounded z-10">
                          {video.duration}
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-white fill-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : youtubeLoading ? (
                  <div className="col-span-2 text-center py-4">
                    <Play className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse" />
                    <p className="text-gray-500 text-xs">
                      {language === "ko"
                        ? "영상을 불러오는 중..."
                        : "Cargando videos..."}
                    </p>
                  </div>
                ) : (
                  <div className="col-span-2 text-center py-4">
                    <Play className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">
                      {language === "ko"
                        ? "영상을 불러올 수 없습니다."
                        : "No se pueden cargar los videos."}
                    </p>
                    <p className="text-gray-400 text-[10px] mt-1">
                      {language === "ko"
                        ? "YouTube API 설정을 확인해주세요."
                        : "Verifica la configuración de la API de YouTube."}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div> */}

        {/* AMIKO 제휴사 */}
        {/* <div className="space-y-3 md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {t("home.sections.partners")}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/community/partners")}
              className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
            >
              {language === "ko" ? "더 보기" : "Ver Más"}
            </Button>
          </div>

          <Card>
            <CardContent className="p-3">
              <div className="grid grid-cols-3 gap-3">
                <div
                  className="cursor-pointer group"
                  onClick={() => router.push("/community/partners")}
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <img
                      src="/logos/para-fans-logo.jpg"
                      alt="Para Fans"
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform"
                      draggable={false}
                    />
                  </div>
                </div>

                <div
                  className="cursor-pointer group"
                  onClick={() => router.push("/community/partners")}
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <img
                      src="/logos/acu-point-logo.jpg"
                      alt="Acu-Point"
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                      draggable={false}
                    />
                  </div>
                </div>

                <div
                  className="cursor-pointer group"
                  onClick={() => router.push("/community/partners")}
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <img
                      src="/logos/socios-placeholder.jpg"
                      alt="Partner"
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform"
                      draggable={false}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div> */}
      </div>

      {/* 데스크톱 버전 - 한 줄 세로 레이아웃 */}
      <div className="hidden md:block max-w-4xl mx-auto px-2 md:px-4 lg:px-6 pt-20 pb-4">
        <div className="space-y-4">
          {/* Random Play Dance 섹션 */}
          {/* <RandomPlayDanceSection
            playlist={dancePlaylist}
            videos={danceVideos}
            loading={danceLoading}
            onPlaylistUpdate={loadDanceData}
            hideVideoGrid={true}
          /> */}

          {/* 1. Post Populares - 지금 커뮤니티에서 핫한 글 - 데스크톱 전용 3열 그리드 */}
          {/* 지금 커뮤니티에서 핫한 글 - 데스크톱 전용 3열 그리드 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {t("home.sections.hotPosts")}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/community/freeboard")}
                className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
              >
                {language === "ko" ? "더 보기" : "Ver Más"}
              </Button>
            </div>

            {hotPosts.length > 0 ? (
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-0">
                  <div className="divide-y">
                    {hotPosts.map((post, index) => (
                      <div
                        key={post.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors px-3 py-1"
                        onClick={() =>
                          router.push(`/community/post/${post.id}?from=home`)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <Badge className="bg-gray-100 text-gray-700 border-0 px-2 py-0.5 font-medium text-xs">
                            {shortenCategoryName(
                              post.category ||
                                (language === "ko" ? "자유" : "Libre"),
                            )}
                          </Badge>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1 line-clamp-1">
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4 text-red-500" />
                              <span>{post.likes}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4 text-blue-500" />
                              <span>{post.comments}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{formatNumber(post.views)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-gray-500">
                                {post.createdAt}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-md">
                <CardContent className="p-12 text-center">
                  <TrendingUp className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-xl">
                    {language === "ko"
                      ? "핫한 게시글이 없습니다"
                      : "No hay posts populares"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 2. K-noticias - 오늘의 K-Noticia - 데스크톱 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/icons/home-news.png"
                  alt="K-Noticia"
                  className="w-8 h-8 object-contain"
                />
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {t("home.sections.kNoticia")}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/community/news")}
                className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
              >
                {language === "ko" ? "더 보기" : "Ver Más"}
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {kNoticiaNews.length > 0 ? (
                    kNoticiaNews.map((news) => (
                      <div
                        key={news.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors px-4 py-3"
                        onClick={() =>
                          router.push(`/community/news?id=${news.id}&from=home`)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <Badge className="bg-purple-100 text-purple-700 border-0 px-2 py-0.5 font-medium text-xs whitespace-nowrap">
                            {t("home.sections.news")}
                          </Badge>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1 line-clamp-1">
                            {news.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4 text-red-500" />
                              <span>{news.likes}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4 text-blue-500" />
                              <span>{news.comments}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{formatNumber(news.views)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <img
                        src="/icons/home-news.png"
                        alt="K-Noticia"
                        className="w-12 h-12 mx-auto mb-3 opacity-40"
                      />
                      <p className="text-gray-500 text-sm">
                        {language === "ko"
                          ? "뉴스가 없습니다"
                          : "No hay noticias"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. Evento - 현재 진행 이벤트 - 데스크톱 전용 대형 슬라이드 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {t("home.sections.currentEvents")}
              </h2>
            </div>

            <Card className="relative shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden bg-transparent border-none rounded-lg">
              <CardContent className="p-0 bg-transparent">
                <div
                  id="event-container-desktop"
                  className="relative aspect-[2/1] w-full max-w-[320px] sm:max-w-[480px] md:max-w-[640px] lg:max-w-[800px] mx-auto overflow-hidden rounded-lg cursor-grab active:cursor-grabbing select-none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => setIsDragging(false)}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {currentEvents.length > 0 ? (
                    <div
                      className="flex h-full transition-transform duration-1000 ease-in-out"
                      style={{
                        transform: `translateX(-${currentEventIndex * 100}%)`,
                      }}
                    >
                      {currentEvents.map((event, index) => (
                        <div
                          key={event.id}
                          className="relative w-full h-full flex-shrink-0 cursor-pointer rounded-lg overflow-hidden"
                          onClick={() => {
                            if (event.id === "event-korean-meeting") {
                              router.push(
                                "/main?tab=event&show=korean-meeting",
                              );
                            } else if (event.id === "event-opening") {
                              router.push("/main?tab=event");
                            }
                          }}
                        >
                          {/* 배너 이미지 */}
                          <Image
                            src={
                              event.image ||
                              event.bannerDesktop ||
                              "/banners/event-banner.png"
                            }
                            alt={event.title}
                            fill
                            className="object-cover"
                            priority={index === 0}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-500 dark:text-gray-400">
                        {language === "ko"
                          ? "진행 중인 이벤트가 없습니다"
                          : "No hay eventos en curso"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 인기 심리테스트 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {t("home.sections.popularTests")}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/community/tests")}
                className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
              >
                {language === "ko" ? "더 보기" : "Ver Más"}
              </Button>
            </div>

            {popularTests.length > 0 ? (
              <>
                <div className="grid grid-cols-2 min-[500px]:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                  {popularTests.slice(0, 3).map((test) => (
                    <div
                      key={test.id}
                      className="cursor-pointer group"
                      onClick={() =>
                        router.push(test.route || "/community/tests")
                      }
                    >
                      <div className="relative mb-3">
                        <img
                          src={test.image}
                          alt={test.title}
                          loading="lazy"
                          decoding="async"
                          fetchPriority="low"
                          className="w-full h-32 md:h-48 lg:h-56 xl:h-64 object-contain rounded-lg"
                        />
                      </div>

                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2 line-clamp-2">
                        {test.title}
                      </h3>

                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <Play className="w-3 h-3" />
                        <span>
                          {formatNumber(test.participants)}
                          {language === "ko" ? "명" : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <Card className="shadow-2xl">
                <CardContent className="p-8 text-center">
                  <Brain className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    {language === "ko"
                      ? "인기 테스트가 없습니다"
                      : "No hay tests populares"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 팬아트 & 아이돌 사진 - 데스크톱 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 팬아트 */}
            {/* <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src="/icons/home-fanart.png"
                    alt="팬아트"
                    className="w-5 h-5 object-contain"
                  />
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {language === "ko" ? "팬아트" : "Fan Art"}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/community/fanart")}
                  className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
                >
                  {language === "ko" ? "더 보기" : "Ver Más"}
                </Button>
              </div>

              <Card>
                <CardContent className="p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {fanArtPosts.length > 0 ? (
                      fanArtPosts.slice(0, 4).map((post) => (
                        <div
                          key={post.id}
                          className="cursor-pointer group"
                          onClick={() =>
                            router.push(
                              `/community/fanart/${post.id}?from=home`,
                            )
                          }
                        >
                          <div className="relative aspect-square overflow-hidden rounded-lg mb-1">
                            <img
                              src={post.image}
                              alt={post.title}
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                            {post.title}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Heart className="w-3 h-3" />
                            <span>
                              {post.likes} · {post.createdAt}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-4">
                        <img
                          src="/icons/home-fanart.png"
                          alt="팬아트"
                          className="w-5 h-5 mx-auto mb-2 opacity-40"
                        />
                        <p className="text-gray-500 text-xs">
                          {language === "ko"
                            ? "팬아트가 없습니다"
                            : "No hay fan art"}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div> */}

            {/* 아이돌 사진 */}
            {/* <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src="/icons/home-idol.png"
                    alt="아이돌 사진"
                    className="w-5 h-5 object-contain"
                  />
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {language === "ko" ? "아이돌 사진" : "Fotos de Ídolos"}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/community/idol-photos")}
                  className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
                >
                  {language === "ko" ? "더 보기" : "Ver Más"}
                </Button>
              </div>

              <Card>
                <CardContent className="p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {idolPhotoPosts.length > 0 ? (
                      idolPhotoPosts.slice(0, 4).map((post) => (
                        <div
                          key={post.id}
                          className="cursor-pointer group"
                          onClick={() =>
                            router.push(
                              `/community/idol-photos/${post.id}?from=home`,
                            )
                          }
                        >
                          <div className="relative aspect-square overflow-hidden rounded-lg mb-1">
                            <img
                              src={post.image}
                              alt={post.title}
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                            {post.title}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Heart className="w-3 h-3" />
                            <span>
                              {post.likes} · {post.createdAt}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-4">
                        <img
                          src="/icons/home-idol.png"
                          alt="아이돌 사진"
                          className="w-5 h-5 mx-auto mb-2 opacity-40"
                        />
                        <p className="text-gray-500 text-xs">
                          {language === "ko"
                            ? "아이돌 사진이 없습니다"
                            : "No hay fotos de ídolos"}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div> */}
          </div>

          {/* 화상채팅 온라인 인원 - 데스크톱 전용 사이드바 - 미구현으로 숨김 */}
          {false && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {t("home.sections.videoChatOnline")}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={() => router.push("/main?tab=meet")}
                >
                  <Users className="w-5 h-5 mr-2" />
                  {language === "ko" ? "더 보기" : "Ver Más"}
                </Button>
              </div>

              <Card className="shadow-md">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {onlineUsers.length > 0 ? (
                      onlineUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                        >
                          <div className="relative">
                            <Avatar className="w-12 h-12 shadow-md border-2 border-white dark:border-gray-800 group-hover:scale-105 transition-transform">
                              <AvatarImage
                                src={user.profileImage}
                                alt={user.name}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-sm font-semibold">
                                {user.name
                                  ? user.name.charAt(0).toUpperCase()
                                  : "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 shadow-md">
                              <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                              {user.name}
                            </h3>
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                              {t("home.community.online")}
                            </p>
                          </div>
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center py-4 text-sm text-gray-400">
                        {language === "ko"
                          ? "현재 온라인 사용자가 없습니다"
                          : "No hay usuarios en línea"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 지금 핫 한 채팅방 & 지금 투표 - 데스크톱 - 숨김 처리 (당분간 사용 안 함) */}
          {false && (
            <div className="grid grid-cols-2 gap-4">
              {/* 지금 핫 한 채팅방 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {language === "ko"
                        ? "지금 핫 한 채팅방!"
                        : "¡Chats Calientes!"}
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/community/k-chat")}
                    className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
                  >
                    {language === "ko" ? "더 보기" : "Ver Más"}
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-2">
                    {hotChatRooms.length > 0 ? (
                      <div className="space-y-2">
                        {hotChatRooms.map((room) => (
                          <div
                            key={room.id}
                            className="cursor-pointer group"
                            onClick={() =>
                              router.push(
                                `/community/k-chat/${room.id}?from=home`,
                              )
                            }
                          >
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg">
                                <img
                                  src={room.image || "/misc/placeholder.png"}
                                  alt={room.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                                  {room.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  <Users className="w-3 h-3" />
                                  <span>
                                    {room.memberCount} ·{" "}
                                    {room.lastMessageAt || "지금"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-xs">
                          {language === "ko"
                            ? "핫 한 채팅방이 없습니다"
                            : "No hay chats calientes"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 지금 투표 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-orange-600" />
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {language === "ko" ? "지금 투표!" : "¡Vota Ahora!"}
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/community/polls")}
                    className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
                  >
                    {language === "ko" ? "더 보기" : "Ver Más"}
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-2">
                    <div className="grid grid-cols-2 gap-2">
                      {currentPolls.length > 0 ? (
                        currentPolls.slice(0, 4).map((poll) => (
                          <div
                            key={poll.id}
                            className="cursor-pointer group"
                            onClick={() =>
                              router.push(`/main?tab=community&poll=${poll.id}`)
                            }
                          >
                            <div className="relative aspect-square overflow-hidden rounded-lg mb-1">
                              {poll.image ? (
                                <img
                                  src={poll.image}
                                  alt={poll.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-yellow-50 via-yellow-100 to-orange-50 flex items-center justify-center">
                                  <img
                                    src="/icons/Encuestas.png"
                                    alt="Poll"
                                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-sm"
                                  />
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                              {poll.title}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <TrendingUp className="w-3 h-3" />
                              <span>
                                {poll.totalVotes} · {poll.createdAt}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-4">
                          <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-xs">
                            {language === "ko"
                              ? "진행 중인 투표가 없습니다"
                              : "No hay votaciones activas"}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* 최근 스토리 - 데스크톱 - 환경 변수로 제어 */}
          {process.env.NEXT_PUBLIC_ENABLE_STORIES === "true" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src="/icons/story.png"
                    alt="Stories"
                    className="w-5 h-5 object-contain"
                  />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {t("home.sections.recentStories")}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/community/stories")}
                  className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
                >
                  {language === "ko" ? "더 보기" : "Ver Más"}
                </Button>
              </div>

              <Card>
                <CardContent className="p-3">
                  {recentStories.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {recentStories.slice(0, 3).map((story) => (
                        <div
                          key={story.id}
                          className="cursor-pointer group"
                          onClick={() => {
                            const userStories = recentStories.filter(
                              (s) => s.user_name === story.user_name,
                            );
                            if (userStories.length > 0) {
                              setViewerStories(userStories);
                              setSelectedStoryIndex(
                                userStories.findIndex((s) => s.id === story.id),
                              );
                              setShowStoryViewer(true);
                            }
                          }}
                        >
                          <div className="relative aspect-square overflow-hidden rounded-lg mb-2">
                            {story.image_url ? (
                              <img
                                src={story.image_url}
                                alt={story.user_name}
                                loading="lazy"
                                decoding="async"
                                fetchPriority="low"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                <span className="text-white font-bold text-2xl">
                                  {story.user_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1 line-clamp-1 font-medium">
                            {story.user_name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Heart className="w-3 h-3 text-red-500" />
                            <span>{story.likes || 0}</span>
                            <span className="text-gray-400">·</span>
                            <span>{formatTimeAgo(story.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <img
                        src="/icons/story.png"
                        alt="Stories"
                        className="w-12 h-12 mx-auto mb-3 opacity-40"
                      />
                      <p className="text-gray-500 text-sm">
                        {language === "ko"
                          ? "스토리가 없습니다"
                          : "No hay historias"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* AMIKO 최근 영상 - 데스크톱 */}
          {/* <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {t("home.sections.recentVideos")}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(
                    "https://www.youtube.com/@AMIKO_Officialstudio",
                    "_blank",
                  )
                }
                className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
              >
                {language === "ko" ? "더 보기" : "Ver Más"}
              </Button>
            </div>

            <Card>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-3">
                  {youtubeVideos.length > 0 ? (
                    youtubeVideos.slice(0, 2).map((video) => (
                      <div
                        key={video.id}
                        className="cursor-pointer group"
                        onClick={() => window.open(video.url, "_blank")}
                      >
                        <div className="relative aspect-video overflow-hidden rounded-lg mb-2 bg-gray-100">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            loading="lazy"
                            decoding="async"
                            fetchPriority="low"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
                            {video.duration}
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                              <Play className="w-8 h-8 text-white fill-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : youtubeLoading ? (
                    <div className="col-span-2 text-center py-6">
                      <Play className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-pulse" />
                      <p className="text-gray-500 text-sm">
                        {language === "ko"
                          ? "영상을 불러오는 중..."
                          : "Cargando videos..."}
                      </p>
                    </div>
                  ) : (
                    <div className="col-span-2 text-center py-6">
                      <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">
                        {language === "ko"
                          ? "영상을 불러올 수 없습니다."
                          : "No se pueden cargar los videos."}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {language === "ko"
                          ? "YouTube API 설정을 확인해주세요."
                          : "Verifica la configuración de la API de YouTube."}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div> */}

          {/* Socios de AMIKO - 데스크톱 */}
          {/* <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {language === "ko" ? "AMIKO 파트너" : "Socios de AMIKO"}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/community/partners")}
                className="rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-1.5"
              >
                {language === "ko" ? "더 보기" : "Ver Más"}
              </Button>
            </div>

            <Card>
              <CardContent className="p-3">
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className="cursor-pointer group"
                    onClick={() => router.push("/community/partners")}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <img
                        src="/logos/para-fans-logo.jpg"
                        alt="Para Fans"
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform"
                        draggable={false}
                      />
                    </div>
                  </div>

                  <div
                    className="cursor-pointer group"
                    onClick={() => router.push("/community/partners")}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <img
                        src="/logos/acu-point-logo.jpg"
                        alt="Acu-Point"
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                        draggable={false}
                      />
                    </div>
                  </div>

                  <div
                    className="cursor-pointer group"
                    onClick={() => router.push("/community/partners")}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <img
                        src="/logos/socios-placeholder.jpg"
                        alt="Partner"
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform"
                        draggable={false}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div> */}
        </div>
      </div>

      {/* Privacy modal shown after loading if not yet accepted */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="max-w-sm w-[340px] bg-white dark:bg-gray-900 rounded-2xl p-4">
          <DialogTitle className="text-lg font-bold">
            {language === "ko" ? "개인정보 처리방침" : "Política de Privacidad"}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            {language === "ko"
              ? "앱 사용 전 개인정보 처리방침을 확인해 주세요. 자세한 내용은 전체 정책에서 볼 수 있습니다."
              : "Por favor revisa la Política de Privacidad antes de usar la app. Puedes ver el texto completo en la página de privacidad."}
          </DialogDescription>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => router.push("/privacy")}>
              {language === "ko" ? "Ver" : "Ver"}
            </Button>
            <Button onClick={handleAcceptPrivacy}>
              {language === "ko" ? "읽음" : "He leído"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 스토리 뷰어 모달 */}
      <Dialog open={showStoryViewer} onOpenChange={setShowStoryViewer}>
        <DialogContent className="max-w-sm w-[320px] max-h-[500px] bg-black border-none p-0 rounded-2xl overflow-hidden">
          <DialogTitle className="sr-only">Story Viewer</DialogTitle>
          <DialogDescription className="sr-only">
            Viewing story from{" "}
            {viewerStories[selectedStoryIndex]?.user_name || "User"}
          </DialogDescription>
          {viewerStories.length > 0 && (
            <>
              {/* 진행 바 */}
              <div className="absolute top-0 left-0 right-0 z-[10005] p-3 flex gap-1">
                {viewerStories.map((_, index) => (
                  <div
                    key={index}
                    className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                  >
                    <div
                      className={`h-full transition-all duration-500 ${
                        index < selectedStoryIndex
                          ? "bg-white"
                          : index === selectedStoryIndex
                            ? "bg-white animate-pulse"
                            : "bg-white/30"
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* 스토리 이미지 */}
              {viewerStories[selectedStoryIndex] && (
                <div
                  className="relative w-full flex items-center justify-center"
                  style={{ aspectRatio: "9/16", minHeight: "320px" }}
                >
                  <img
                    src={
                      viewerStories[selectedStoryIndex].image_url ||
                      "/icons/default-avatar.png"
                    }
                    alt={viewerStories[selectedStoryIndex].user_name}
                    className="w-full h-full object-cover"
                  />

                  {/* 사용자 정보 */}
                  <div className="absolute top-12 left-3 flex items-center gap-2 text-white">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                      {viewerStories[selectedStoryIndex].user_profile_image ? (
                        <img
                          src={
                            viewerStories[selectedStoryIndex].user_profile_image
                          }
                          alt={viewerStories[selectedStoryIndex].user_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {viewerStories[selectedStoryIndex].user_name
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm">
                        {viewerStories[selectedStoryIndex].user_name}
                      </p>
                    </div>
                  </div>

                  {/* 텍스트 컨텐츠 */}
                  {viewerStories[selectedStoryIndex].text_content && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                      <p className="text-white text-sm">
                        {viewerStories[selectedStoryIndex].text_content}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 닫기 버튼 */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20 z-[10006]"
                onClick={() => setShowStoryViewer(false)}
              >
                <span className="text-2xl">×</span>
              </Button>

              {/* 좌우 네비게이션 */}
              {selectedStoryIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-[10006] w-10 h-10"
                  onClick={() => setSelectedStoryIndex(selectedStoryIndex - 1)}
                >
                  ‹
                </Button>
              )}
              {selectedStoryIndex < viewerStories.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-[10006] w-10 h-10"
                  onClick={() => setSelectedStoryIndex(selectedStoryIndex + 1)}
                >
                  ›
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
