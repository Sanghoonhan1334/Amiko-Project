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
import GalleryCarousel from "@/components/common/GalleryCarousel";
import HeroEventCarousel from "@/components/common/HeroEventCarousel";
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
  Megaphone,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { YouTubeVideo } from "@/lib/youtube";

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
  description?: string;
  participants: number;
  image: string;
  category?: string;
  route?: string;
  createdAt?: string;
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

export default function HomeTab() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 스플래시 애니메이션 상태
  const [showSplash, setShowSplash] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const [currentEvents, setCurrentEvents] = useState<Event[]>([
    {
      id: "1",
      title: "한국어 모임",
      description: "2주에 한번씩 한국어 모임을 진행합니다!",
      date: "2024.12.25",
      image: "/sample-images/banners/korean-meetup.png",
      participants: 45,
    },
    {
      id: "2",
      title: "K-POP Concert Night",
      description: "K-POP 콘서트 나이트에 참여하세요!",
      date: "2024.12.30",
      image: "/sample-images/banners/kpop-concert.png",
      participants: 120,
    },
    {
      id: "3",
      title: "K-Drama Watch Party",
      description: "K-드라마 시청 파티",
      date: "2025.01.05",
      image: "/sample-images/banners/kdrama-party.png",
      participants: 78,
    },
    {
      id: "4",
      title: "한국 요리 클래스",
      description: "비빔밥과 김치찌개 만들기",
      date: "2025.01.10",
      image: "/sample-images/banners/korean-meetup.png",
      participants: 35,
    },
    {
      id: "5",
      title: "K-Beauty Workshop",
      description: "한국 뷰티 트렌드 체험",
      date: "2025.01.15",
      image: "/sample-images/banners/kpop-concert.png",
      participants: 92,
    },
    {
      id: "6",
      title: "한글 캘리그라피",
      description: "한글의 아름다움을 배워요",
      date: "2025.01.20",
      image: "/sample-images/banners/kdrama-party.png",
      participants: 56,
    },
  ]);
  const [hotPosts, setHotPosts] = useState<HotPost[]>([
    {
      id: "1",
      title: "한국 화장품 브랜드 추천해주세요",
      content: "한국에 처음 와서 화장품을 사려고 하는데...",
      author: "María González",
      category: "beauty",
      likes: 45,
      comments: 12,
      views: 234,
      createdAt: "2시간 전",
    },
    {
      id: "2",
      title: "K-pop 콘서트 갔다온 후기",
      content: "드디어 꿈에 그리던 콘서트에...",
      author: "Carlos Silva",
      category: "culture",
      likes: 89,
      comments: 23,
      views: 456,
      createdAt: "5시간 전",
    },
    {
      id: "3",
      title: "서울 맛집 추천",
      content: "명동에서 먹은 비빔밥이 정말 맛있었어요!",
      author: "김민지",
      category: "food",
      likes: 34,
      comments: 8,
      views: 189,
      createdAt: "1일 전",
    },
    {
      id: "4",
      title: "한국 패션 트렌드 2024",
      content: "올해 한국에서 유행하는 패션 아이템이나...",
      author: "Sofía Rodríguez",
      category: "fashion",
      likes: 56,
      comments: 15,
      views: 312,
      createdAt: "3시간 전",
    },
  ]);
  const [popularTests, setPopularTests] = useState<PopularTest[]>([
    {
      id: "mbti-with-kpop-stars",
      title:
        language === "ko"
          ? "K-POP 스타와 함께하는 MBTI"
          : "MBTI con Estrellas K-POP",
      image: "/quizzes/mbti-with-kpop-stars/cover/cover.png",
      participants: 2345,
      createdAt: "1일 전",
      route: "/community/tests/mbti-with-kpop-stars",
    },
    {
      id: "idol-roles",
      title:
        language === "ko"
          ? "아이돌 그룹 내 나의 역할은?"
          : "Tu Rol en un Grupo Idol",
      image: "/quizzes/idol-roles/cover/cover.png",
      participants: 1876,
      createdAt: "2일 전",
      route: "/community/tests/idol-roles",
    },
    {
      id: "korean-level",
      title:
        language === "ko"
          ? "나의 한국어 실력은?"
          : "¿Cuál es tu Nivel de Coreano?",
      image: "/quizzes/korean-level/cover/cover.png",
      participants: 1654,
      createdAt: "3일 전",
      route: "/community/tests/korean-level",
    },
    {
      id: "idol-position",
      title:
        language === "ko"
          ? "아이돌 그룹 내 나의 포지션은?"
          : "Tu Posición en un Grupo Idol",
      image: "/quizzes/idol-position/cover/cover.png",
      participants: 1432,
      createdAt: "4일 전",
      route: "/community/tests/idol-position",
    },
    {
      id: "fortune",
      title: language === "ko" ? "오늘의 운세" : "Tu Fortuna de Hoy",
      image: "/quizzes/fortune/cover/cover.png",
      participants: 1234,
      createdAt: "5일 전",
      route: "/community/tests/fortune",
    },
    {
      id: "zodiac",
      title:
        language === "ko"
          ? "별자리로 보는 K-POP 궁합"
          : "Compatibilidad K-POP por Zodiaco",
      image: "/quizzes/zodiac/cover/cover.png",
      participants: 1123,
      createdAt: "6일 전",
      route: "/community/tests/zodiac",
    },
  ]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [recentStories, setRecentStories] = useState<RecentStory[]>([]);
  const [notices, setNotices] = useState<HotPost[]>([
    {
      id: "1",
      title: "커뮤니티 이용 규칙 안내",
      content: "안녕하세요! Amiko 커뮤니티를 이용해주셔서 감사합니다...",
      author: "Amiko",
      category: "notice",
      likes: 45,
      comments: 0,
      views: 567,
      createdAt: "1일 전",
    },
    {
      id: "2",
      title: "새로운 기능 업데이트 안내",
      content: "이번 업데이트에서 새로운 기능들이 추가되었습니다...",
      author: "Amiko",
      category: "notice",
      likes: 32,
      comments: 5,
      views: 423,
      createdAt: "2일 전",
    },
    {
      id: "3",
      title: "서버 점검 안내 (12/25)",
      content: "12월 25일 오전 2시부터 4시까지 서버 점검이 있습니다...",
      author: "Amiko",
      category: "notice",
      likes: 28,
      comments: 3,
      views: 389,
      createdAt: "3일 전",
    },
  ]);
  const [fanArtPosts, setFanArtPosts] = useState<GalleryPost[]>([
    {
      id: "1",
      title: "K-POP Fan Art",
      image: "/sample-images/galleries/kpop-fanart-1.png",
      likes: 156,
      createdAt: "1일 전",
    },
    {
      id: "2",
      title: "Concert Vibes",
      image: "/sample-images/galleries/kpop-fanart-2.png",
      likes: 203,
      createdAt: "2일 전",
    },
    {
      id: "3",
      title: "K-Drama Scene",
      image: "/sample-images/galleries/kdrama-scene.png",
      likes: 178,
      createdAt: "3일 전",
    },
    {
      id: "4",
      title: "Korean Culture",
      image: "/sample-images/galleries/korean-culture.png",
      likes: 145,
      createdAt: "4일 전",
    },
    {
      id: "5",
      title: "Fashion Style",
      image: "/sample-images/galleries/fashion-beauty.png",
      likes: 192,
      createdAt: "5일 전",
    },
    {
      id: "6",
      title: "Street Art",
      image: "/sample-images/galleries/kpop-fanart-1.png",
      likes: 167,
      createdAt: "6일 전",
    },
  ]);
  const [idolPhotoPosts, setIdolPhotoPosts] = useState<GalleryPost[]>([
    {
      id: "1",
      title: "K-POP Fan Art",
      image: "/sample-images/galleries/kpop-fanart-1.png",
      likes: 234,
      createdAt: "1일 전",
    },
    {
      id: "2",
      title: "Concert Vibes",
      image: "/sample-images/galleries/kpop-fanart-2.png",
      likes: 198,
      createdAt: "2일 전",
    },
    {
      id: "3",
      title: "K-Drama Scene",
      image: "/sample-images/galleries/kdrama-scene.png",
      likes: 189,
      createdAt: "3일 전",
    },
    {
      id: "4",
      title: "Korean Culture",
      image: "/sample-images/galleries/korean-culture.png",
      likes: 167,
      createdAt: "4일 전",
    },
    {
      id: "5",
      title: "Fashion & Beauty",
      image: "/sample-images/galleries/fashion-beauty.png",
      likes: 211,
      createdAt: "5일 전",
    },
    {
      id: "6",
      title: "Korean Food",
      image: "/sample-images/galleries/food-1.png",
      likes: 178,
      createdAt: "6일 전",
    },
  ]);
  const [hotChatRooms, setHotChatRooms] = useState<ChatRoom[]>([
    {
      id: "1",
      title: "BTS 팬클럽",
      image: "/sample-images/galleries/kpop-fanart-1.png",
      memberCount: 234,
    },
    {
      id: "2",
      title: "한국어 공부방",
      image: "/sample-images/galleries/kdrama-scene.png",
      memberCount: 156,
    },
    {
      id: "3",
      title: "K-Drama 토론방",
      image: "/sample-images/galleries/kpop-fanart-2.png",
      memberCount: 189,
    },
    {
      id: "4",
      title: "K-POP 댄스 커버",
      image: "/sample-images/galleries/kpop-fanart-2.png",
      memberCount: 142,
    },
    {
      id: "5",
      title: "한식 레시피",
      image: "/sample-images/galleries/food-1.png",
      memberCount: 198,
    },
    {
      id: "6",
      title: "K-뷰티 팁",
      image: "/sample-images/galleries/fashion-beauty.png",
      memberCount: 167,
    },
  ]);
  const [currentPolls, setCurrentPolls] = useState<Poll[]>([
    {
      id: "1",
      title: "가장 좋아하는 K-POP 그룹은?",
      image: "/sample-images/galleries/kpop-fanart-1.png",
      totalVotes: 593,
      createdAt: "2일 전",
    },
    {
      id: "2",
      title: "어떤 K-드라마 장르를 좋아하세요?",
      image: "/sample-images/galleries/kdrama-scene.png",
      totalVotes: 477,
      createdAt: "1일 전",
    },
    {
      id: "3",
      title: "좋아하는 한식은?",
      image: "/sample-images/galleries/food-1.png",
      totalVotes: 521,
      createdAt: "3일 전",
    },
    {
      id: "4",
      title: "추천하고 싶은 K-뷰티 브랜드는?",
      image: "/sample-images/galleries/fashion-beauty.png",
      totalVotes: 389,
      createdAt: "4일 전",
    },
    {
      id: "5",
      title: "가보고 싶은 한국 도시는?",
      image: "/sample-images/galleries/korean-culture.png",
      totalVotes: 612,
      createdAt: "5일 전",
    },
    {
      id: "6",
      title: "다음 시즌 기대되는 드라마는?",
      image: "/sample-images/galleries/kdrama-scene.png",
      totalVotes: 445,
      createdAt: "6일 전",
    },
  ]);
  const [kNoticiaNews, setKNoticiaNews] = useState<NewsItem[]>([
    {
      id: "1",
      title: "K-POP 최신 소식: 새로운 그룹 데뷔 예정",
      likes: 234,
      comments: 45,
      views: 1234,
      createdAt: "2시간 전",
    },
    {
      id: "2",
      title: "K-드라마 신작 공개: 로맨스 장르 인기",
      likes: 189,
      comments: 32,
      views: 987,
      createdAt: "5시간 전",
    },
    {
      id: "3",
      title: "한국 문화 축제 개최: 서울에서 대규모 행사",
      likes: 156,
      comments: 28,
      views: 756,
      createdAt: "1일 전",
    },
    {
      id: "4",
      title: "K-뷰티 트렌드 2024: 글로우 메이크업 인기",
      likes: 267,
      comments: 51,
      views: 1456,
      createdAt: "3시간 전",
    },
    {
      id: "5",
      title: "한국 요리 세계화: 미슐린 스타 레스토랑 증가",
      likes: 198,
      comments: 38,
      views: 1123,
      createdAt: "6시간 전",
    },
    {
      id: "6",
      title: "K-패션 트렌드: 한복 리메이크 열풍",
      likes: 223,
      comments: 42,
      views: 1089,
      createdAt: "8시간 전",
    },
  ]);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [youtubeLoading, setYoutubeLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [currentFanArtIndex, setCurrentFanArtIndex] = useState(0);
  const [currentIdolPhotoIndex, setCurrentIdolPhotoIndex] = useState(0);
  const [isAutoSliding, setIsAutoSliding] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);

  // 스토리 뷰어 상태
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [viewerStories, setViewerStories] = useState<RecentStory[]>([]);

  // 스플래시 애니메이션 비활성화
  useEffect(() => {
    setIsClient(true);
    // 스플래시 애니메이션 완전 비활성화
    setShowSplash(false);
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

  // 이벤트 자동 슬라이드 (6개씩)
  useEffect(() => {
    if (currentEvents.length > 6 && isAutoSliding) {
      const interval = setInterval(() => {
        setCurrentEventIndex((prev) => {
          const nextIndex = prev + 6;
          return nextIndex >= currentEvents.length ? 0 : nextIndex;
        });
      }, 5000); // 5초마다 자동 롤링
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
          (prev) => (prev - 1 + currentEvents.length) % currentEvents.length
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
          (prev) => (prev - 1 + currentEvents.length) % currentEvents.length
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
      // 임시 하드코딩된 이벤트 데이터
      // 이벤트 추가 방법: 아래 주석을 해제하고 내용을 수정하세요
      const mockEvents = [
        {
          id: "event-1",
          title:
            language === "ko"
              ? "AMIKO 그랜드 런칭"
              : "Gran Lanzamiento de AMIKO",
          description:
            language === "ko"
              ? "한국 문화 교류 플랫폼 AMIKO가 새롭게 시작합니다!"
              : "¡La plataforma de intercambio cultural coreano AMIKO comienza de nuevo!",
          image: null,
          bannerMobile: null,
          bannerDesktop: null,
          date: language === "ko" ? "지금 바로" : "Ahora mismo",
          participants: 0,
        },
        // 추가 이벤트 예시 1 (필요시 주석 해제)
        // ,{
        //   id: 'event-2',
        //   title: language === 'ko' ? '한국어 모임' : 'Reunión de Coreano',
        //   description: language === 'ko' ? '2주에 한번씩 한국어 모임을 진행합니다!' : '¡Reunión de coreano cada 2 semanas!',
        //   image: null,
        //   bannerMobile: null,
        //   bannerDesktop: null,
        //   date: language === 'ko' ? '2주마다 진행' : 'Cada 2 semanas',
        //   participants: 45
        // }
        // 추가 이벤트 예시 2 (필요시 주석 해제)
        // ,{
        //   id: 'event-3',
        //   title: language === 'ko' ? 'K-POP 댄스 워크샵' : 'Taller de Baile K-POP',
        //   description: language === 'ko' ? '인기 K-POP 안무를 함께 배워요!' : '¡Aprende coreografías populares de K-POP!',
        //   image: null,
        //   bannerMobile: null,
        //   bannerDesktop: null,
        //   date: language === 'ko' ? '매주 토요일' : 'Todos los sábados',
        //   participants: 32
        // }
      ];

      setCurrentEvents(mockEvents);
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

      console.log("[loadHotPosts] API 응답 데이터 분석:", {
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
          console.log("[loadHotPosts] 포스트 처리:", {
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
          "[loadHotPosts] 포맷팅 완료 (공지사항 제외):",
          formattedPosts.length,
          "개"
        );
        console.log("[loadHotPosts] 첫 번째 포스트:", formattedPosts[0]);

        // 3개로 제한
        setHotPosts(formattedPosts.slice(0, 3));
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
          setPopularTests(formattedTests.slice(0, 3));
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
        "/api/posts?is_notice=true&limit=10&sort=created_at"
      );

      if (!response.ok) {
        setNotices([]);
        return;
      }

      const data = await response.json();

      if (data.posts && data.posts.length > 0) {
        // 데이터 포맷팅 - 3개만 표시
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
        (now.getTime() - date.getTime()) / (1000 * 60)
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
    [language]
  );

  const loadGalleryPosts = async () => {
    try {
      // 팬아트 포스트 - 하드코딩된 갤러리 이미지 사용
      const fanArtGalleryImages = [
        {
          id: "1",
          title: "K-POP Fan Art 1",
          image: "/sample-images/galleries/kpop-fanart-1.png",
          likes: 156,
          createdAt: "1일 전",
        },
        {
          id: "2",
          title: "K-POP Fan Art 2",
          image: "/sample-images/galleries/kpop-fanart-2.png",
          likes: 203,
          createdAt: "2일 전",
        },
        {
          id: "3",
          title: "K-Drama Scene",
          image: "/sample-images/galleries/kdrama-scene.png",
          likes: 178,
          createdAt: "3일 전",
        },
        {
          id: "4",
          title: "Korean Culture",
          image: "/sample-images/galleries/korean-culture.png",
          likes: 192,
          createdAt: "4일 전",
        },
        {
          id: "5",
          title: "Fashion & Beauty",
          image: "/sample-images/galleries/fashion-beauty.png",
          likes: 145,
          createdAt: "5일 전",
        },
        {
          id: "6",
          title: "Korean Food",
          image: "/sample-images/galleries/food-1.png",
          likes: 167,
          createdAt: "6일 전",
        },
      ];
      setFanArtPosts(fanArtGalleryImages);

      // 아이돌 사진 포스트 - 하드코딩된 커버 이미지 사용
      const idolCoverImages = [
        {
          id: "1",
          title: "Danielle",
          image: "/covers/danielle.png",
          likes: 245,
          createdAt: "1일 전",
        },
        {
          id: "2",
          title: "Haerin",
          image: "/covers/haerin.png",
          likes: 312,
          createdAt: "2일 전",
        },
        {
          id: "3",
          title: "Hanni",
          image: "/covers/hanni.png",
          likes: 189,
          createdAt: "3일 전",
        },
        {
          id: "4",
          title: "Hyein",
          image: "/covers/hyein.png",
          likes: 276,
          createdAt: "4일 전",
        },
        {
          id: "5",
          title: "Minji",
          image: "/covers/minji.png",
          likes: 298,
          createdAt: "5일 전",
        },
        {
          id: "6",
          title: "Jennie",
          image: "/covers/jennie.png",
          likes: 421,
          createdAt: "6일 전",
        },
      ];
      setIdolPhotoPosts(idolCoverImages);
    } catch (error) {
      console.error("갤러리 포스트 로딩 실패:", error);
    }
  };

  const loadHotChatRoomsAndPolls = async () => {
    try {
      // 핫한 채팅방 - 하드코딩된 프로필 이미지 사용
      const hotChatRoomImages = [
        {
          id: "1",
          title: "K-POP 팬클럽",
          image: "/sample-images/profiles/samples (1).png",
          memberCount: 234,
          lastMessageAt: "5분 전",
        },
        {
          id: "2",
          title: "K-Drama 토론방",
          image: "/sample-images/profiles/samples (2).png",
          memberCount: 189,
          lastMessageAt: "10분 전",
        },
        {
          id: "3",
          title: "한국어 공부",
          image: "/sample-images/profiles/samples (3).png",
          memberCount: 156,
          lastMessageAt: "15분 전",
        },
        {
          id: "4",
          title: "한식 레시피",
          image: "/sample-images/profiles/samples (4).png",
          memberCount: 142,
          lastMessageAt: "20분 전",
        },
        {
          id: "5",
          title: "K-Beauty 팁",
          image: "/sample-images/profiles/samples (5).png",
          memberCount: 198,
          lastMessageAt: "25분 전",
        },
        {
          id: "6",
          title: "한국 여행",
          image: "/sample-images/profiles/samples (6).png",
          memberCount: 167,
          lastMessageAt: "30분 전",
        },
      ];
      setHotChatRooms(hotChatRoomImages);

      // 투표 데이터 로드 - 일시적으로 비활성화 (API 500 에러 방지)
      // const pollResponse = await fetch('/api/polls?status=active&limit=10')
      // if (pollResponse.ok) {
      //   const pollData = await pollResponse.json()
      //   if (pollData.polls && pollData.polls.length > 0) {
      //     const formattedPolls = pollData.polls
      //       .slice(0, 4)
      //       .map((poll: any) => {
      //         const imageUrl = poll.image_url || poll.options?.[0]?.image_url
      //         // placeholder 이미지는 null로 처리
      //         const validImageUrl = (imageUrl && !imageUrl.includes('placeholder')) ? imageUrl : null
      //
      //         return {
      //           id: poll.id,
      //           title: poll.question || poll.title,
      //           image: validImageUrl,
      //           totalVotes: poll.total_votes || 0,
      //           createdAt: formatTimeAgo(poll.created_at)
      //         }
      //       })
      //     setCurrentPolls(formattedPolls)
      //   }
      // }
    } catch (error) {
      console.error("채팅방/투표 로딩 실패:", error);
    }
  };

  const loadKNoticiaNews = async () => {
    try {
      const response = await fetch("/api/news?limit=3");

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

  // 모든 데이터 로딩
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCurrentEvents(), // 3개 이벤트
        // loadHotPosts(), // 샘플 데이터 사용
        // loadPopularTests(), // 샘플 데이터 사용
        // loadOnlineUsers(),
        // loadRecentStories(),
        // loadNotices(), // 샘플 데이터 사용
        loadGalleryPosts(), // 커버 이미지 사용
        loadHotChatRoomsAndPolls(), // 프로필 이미지 사용
        // loadKNoticiaNews(), // 샘플 데이터 사용
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
      공지사항: language === "ko" ? "Notice" : "Aviso",
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
    [language]
  );

  const shortenCategoryName = useCallback(
    (category: string) => {
      return categoryMap[category] || category.substring(0, 6);
    },
    [categoryMap]
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

  // 스플래시 비활성화됨
  // if (showSplash) {
  //   return <SplashSequence onComplete={handleSplashComplete} />
  // }

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
      {/* 현재 진행 이벤트 - 히어로 스타일 캐러셀 (전체 브라우저 너비, 최상단 배치) */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-28">
        <HeroEventCarousel
          items={currentEvents}
          onItemClick={() => router.push("/main?tab=event&show=korean-meeting")}
          autoSlide={isAutoSliding}
        />
      </div>

      {/* 모바일 버전 - 임시 숨김 (나중에 완전 삭제 예정) */}
      <div className="hidden space-y-6 p-4">
        {/* 공지사항 - 맨 위에 배치 */}
        {/* 현재 진행 이벤트 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg text-gray-900 dark:text-gray-100">
              {t("home.sections.currentEvents")}
            </h2>
          </div>

          {currentEvents.length > 0 ? (
            <Card className="relative overflow-hidden rounded-lg">
              <CardContent className="p-0">
                <div
                  id="event-container"
                  className="relative h-40 md:h-48 overflow-hidden rounded-lg cursor-grab active:cursor-grabbing select-none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => setIsDragging(false)}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <div
                    className="flex transition-transform duration-700 ease-in-out"
                    style={{
                      transform: `translateX(-${currentEventIndex * 100}%)`,
                    }}
                  >
                    {currentEvents.slice(0, 2).map((event, index) => (
                      <div
                        key={event.id}
                        className="relative w-full flex-shrink-0 cursor-pointer bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg"
                        style={{ height: "min(450px, 50vh)" }}
                        onClick={() => {
                          router.push("/main?tab=event&show=korean-meeting");
                        }}
                      >
                        {/* 텍스트 기반 배너 */}
                        <div className="absolute bottom-8 left-8 text-left text-white">
                          <h3 className="text-lg sm:text-2xl md:text-2xl mb-2">
                            {event.title}
                          </h3>
                          <p className="text-base sm:text-base text-white/90 mb-1">
                            {event.description}
                          </p>
                          <p className="text-xs sm:text-base text-white/80">
                            {event.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 이벤트 인디케이터 */}
                {currentEvents.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    {currentEvents.slice(0, 2).map((_, index) => (
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
                <p className="text-gray-500 text-base">
                  {language === "ko"
                    ? "진행 중인 이벤트가 없습니다"
                    : "No hay eventos en curso"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 공지사항 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-green-600" />
            <h2 className="text-lg text-gray-900 dark:text-gray-100">
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
                        <h3 className="text-base text-gray-900 dark:text-gray-100 flex-1 line-clamp-1">
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
                  <p className="text-gray-500 text-base">
                    {language === "ko"
                      ? "공지사항이 없습니다"
                      : "No hay anuncios"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* 지금 커뮤니티에서 핫한 글 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <h2 className="text-lg text-gray-900 dark:text-gray-100">
                {t("home.sections.hotPosts")}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/community/freeboard")}
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
                        <h3 className="text-xs text-gray-900 dark:text-gray-100 flex-1 line-clamp-1">
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
                <p className="text-gray-500 text-base">
                  {language === "ko"
                    ? "핫한 게시글이 없습니다"
                    : "No hay posts populares"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 인기 심리테스트 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg text-gray-900 dark:text-gray-100">
                {t("home.sections.popularTests")}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/community/tests")}
            >
              {language === "ko" ? "더 보기" : "Ver Más"}
            </Button>
          </div>

          {popularTests.length > 0 ? (
            <div className="grid grid-cols-2 min-[500px]:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
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
                      className="w-full h-32 md:h-48 lg:h-56 xl:h-64 object-contain rounded-lg"
                    />
                  </div>

                  <h3 className="text-gray-900 dark:text-gray-100 text-base mb-2 line-clamp-2">
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
                <p className="text-gray-500 text-base">
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/icons/Fan art.png"
                  alt="팬아트"
                  className="w-8 h-8 object-contain"
                />
                <h2 className="text-base text-gray-900 dark:text-gray-100">
                  {t("home.sections.fanArt")}
                </h2>
              </div>
              <button
                onClick={() => router.push("/community/fanart")}
                className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"
              >
                <span>{language === "ko" ? "더 보기" : "Ver Más"}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
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
                        <div
                          className="relative overflow-hidden rounded-lg"
                          style={{ aspectRatio: "8/13" }}
                        >
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          {/* Title overlay at bottom */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-xs text-white font-medium line-clamp-1">
                              {post.title}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-white/90 mt-0.5">
                              <Heart className="w-3 h-3" />
                              <span>
                                {post.likes} · {post.createdAt}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-4">
                      <img
                        src="/icons/Fan art.png"
                        alt="팬아트"
                        className="w-8 h-8 mx-auto mb-2 opacity-40"
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
          </div>

          {/* 아이돌 사진 */}
          <div className="space-y-2 pt-16 md:pt-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/icons/Foto de idol.png"
                  alt="아이돌 사진"
                  className="w-8 h-8 object-contain"
                />
                <h2 className="text-base text-gray-900 dark:text-gray-100">
                  {t("home.sections.idolPhotos")}
                </h2>
              </div>
              <button
                onClick={() => router.push("/community/idol-photos")}
                className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"
              >
                <span>{language === "ko" ? "더 보기" : "Ver Más"}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
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
                            `/community/idol-photos/${post.id}?from=home`
                          )
                        }
                      >
                        <div
                          className="relative overflow-hidden rounded-lg"
                          style={{ aspectRatio: "8/13" }}
                        >
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          {/* Title overlay at bottom */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-xs text-white font-medium line-clamp-1">
                              {post.title}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-white/90 mt-0.5">
                              <Heart className="w-3 h-3" />
                              <span>
                                {post.likes} · {post.createdAt}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-4">
                      <img
                        src="/icons/Foto de idol.png"
                        alt="아이돌 사진"
                        className="w-8 h-8 mx-auto mb-2 opacity-40"
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
          </div>
        </div>

        {/* 화상채팅 온라인 인원 - 모바일 버전 - 미구현으로 숨김 */}
        {/* <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <h2 className="text-lg text-gray-900 dark:text-gray-100">
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
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-xs ">
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
                <div className="flex items-center justify-center w-full py-4 text-base text-gray-400">
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
      </div> */}

        {/* 지금 핫 한 채팅방 & 지금 투표 */}
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
                <h2 className="text-base text-gray-900 dark:text-gray-100">
                  {t("home.sections.hotChatRooms")}
                </h2>
              </div>
              <button
                onClick={() => router.push("/community/k-chat")}
                className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"
              >
                <span>{language === "ko" ? "더 보기" : "Ver Más"}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
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
                          router.push(`/community/k-chat/${room.id}?from=home`)
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
                            <p className="text-base font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
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
                <h2 className="text-base text-gray-900 dark:text-gray-100">
                  {t("home.sections.currentPolls")}
                </h2>
              </div>
              <button
                onClick={() => router.push("/community/polls")}
                className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"
              >
                <span>{language === "ko" ? "더 보기" : "Ver Más"}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
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

        {/* 오늘의 K-Noticia - 모바일 버전 */}
        {/* K-Noticia 뉴스 섹션 */}
        <div className="space-y-3 md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/icons/k-magazine.png"
                alt="K-Noticia"
                width={20}
                height={20}
                className="object-contain mr-2"
                priority
              />
              <h2 className="text-base text-gray-900 dark:text-gray-100">
                {t("home.sections.kNoticia")}
              </h2>
            </div>
            <button
              onClick={() => router.push("/community/news")}
              className="flex items-center gap-1 text-purple-500 hover:text-purple-600 text-xs"
            >
              <span>{language === "ko" ? "더 보기" : "Ver Más"}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {kNoticiaNews.length > 0 ? (
                  kNoticiaNews.slice(0, 3).map((news) => (
                    <div
                      key={news.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors px-3 py-2"
                      onClick={() =>
                        router.push(`/community/news?id=${news.id}&from=home`)
                      }
                    >
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-700 border-0 px-1.5 py-0.5 font-medium text-[10px] whitespace-nowrap">
                          {t("home.sections.news")}
                        </Badge>
                        <h3 className="text-xs text-gray-900 dark:text-gray-100 flex-1 line-clamp-1">
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
                    <Image
                      src="/icons/k-magazine.png"
                      alt="K-Noticia"
                      width={32}
                      height={32}
                      className="mx-auto mb-2 opacity-40"
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
                <h2 className="text-base text-gray-900 dark:text-gray-100">
                  {t("home.sections.recentStories")}
                </h2>
              </div>
              <button
                onClick={() => router.push("/community/stories")}
                className="flex items-center gap-1 text-purple-500 hover:text-purple-600 text-xs"
              >
                <span>{language === "ko" ? "더 보기" : "Ver Más"}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
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
                            (s) => s.user_name === story.user_name
                          );
                          if (userStories.length > 0) {
                            setViewerStories(userStories);
                            setSelectedStoryIndex(
                              userStories.findIndex((s) => s.id === story.id)
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
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                              <span className="text-white text-2xl">
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
        <div className="space-y-3 md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-red-600" />
              <h2 className="text-base text-gray-900 dark:text-gray-100">
                {t("home.sections.recentVideos")}
              </h2>
            </div>
            <button
              onClick={() =>
                window.open(
                  "https://www.youtube.com/@AMIKO_Officialstudio",
                  "_blank"
                )
              }
              className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"
            >
              <span>{language === "ko" ? "더 보기" : "Ver Más"}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
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
                        {/* YouTube 재생 아이콘 */}
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
        </div>

        {/* AMIKO 제휴사 */}
        <div className="space-y-3 md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-base text-gray-900 dark:text-gray-100">
                {t("home.sections.partners")}
              </h2>
            </div>
            <button
              onClick={() => router.push("/community/partners")}
              className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs"
            >
              <span>{language === "ko" ? "더 보기" : "Ver Más"}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
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
        </div>
      </div>

      {/* 반응형 버전 - 3열 게시판 - 전체 너비 */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] py-8 bg-white dark:bg-gray-800/50">
        <div className="w-inside mx-auto">
          {/* 공지사항 & 핫한 글 & K-Noticia - 반응형 레이아웃 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* 공지사항 */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between pt-10">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg text-gray-900 dark:text-gray-100">
                    {language === "ko" ? "공지" : "Anuncios"}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-500 dark:hover:text-gray-400 dark:hover:bg-gray-800"
                  onClick={() => router.push("/community/freeboard")}
                >
                  <Megaphone className="w-5 h-5 mr-2" />
                  {language === "ko" ? "더 보기" : "Ver Más"}
                </Button>
              </div>

              {notices.length > 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {notices.slice(0, 3).map((announcement) => (
                        <div
                          key={announcement.id}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors px-3 py-3"
                          onClick={() =>
                            router.push(
                              `/community/freeboard/${announcement.id}`
                            )
                          }
                        >
                          <h3 className="text-base text-gray-900 dark:text-gray-100 line-clamp-1">
                            {announcement.title}
                          </h3>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-md">
                  <CardContent className="p-12 text-center">
                    <Megaphone className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-2xl">
                      {language === "ko"
                        ? "공지사항이 없습니다"
                        : "No hay anuncios"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 지금 커뮤니티에서 핫한 글 */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between pt-10">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg text-gray-900 dark:text-gray-100">
                    {t("home.sections.hotPosts")}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-500 dark:hover:text-gray-400 dark:hover:bg-gray-800"
                  onClick={() => router.push("/community/freeboard")}
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  {language === "ko" ? "더 보기" : "Ver Más"}
                </Button>
              </div>

              {hotPosts.length > 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {hotPosts.slice(0, 3).map((post, index) => (
                        <div
                          key={post.id}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors px-3 py-3"
                          onClick={() =>
                            router.push(`/community/post/${post.id}?from=home`)
                          }
                        >
                          <h3 className="text-base text-gray-900 dark:text-gray-100 line-clamp-1">
                            {post.title}
                          </h3>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-md">
                  <CardContent className="p-12 text-center">
                    <TrendingUp className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-2xl">
                      {language === "ko"
                        ? "핫한 게시글이 없습니다"
                        : "No hay posts populares"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 오늘의 K-Noticia */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between pt-10">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg text-gray-900 dark:text-gray-100">
                    {t("home.sections.kNoticia")}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-500 dark:hover:text-gray-400 dark:hover:bg-gray-800"
                  onClick={() => router.push("/community/news")}
                >
                  <Newspaper className="w-5 h-5 mr-2" />
                  {language === "ko" ? "더 보기" : "Ver Más"}
                </Button>
              </div>

              {kNoticiaNews.length > 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {kNoticiaNews.slice(0, 3).map((news) => (
                        <div
                          key={news.id}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors px-3 py-3"
                          onClick={() =>
                            router.push(
                              `/community/news?id=${news.id}&from=home`
                            )
                          }
                        >
                          <h3 className="text-base text-gray-900 dark:text-gray-100 line-clamp-1">
                            {news.title}
                          </h3>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-md">
                  <CardContent className="p-12 text-center">
                    <Newspaper className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-2xl">
                      {language === "ko"
                        ? "뉴스가 없습니다"
                        : "No hay noticias"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 나머지 섹션들을 위한 컨테이너 */}
      <div className="w-full">
        <div className="w-inside mx-auto space-y-3 md:space-y-4 px-[5px] md:px-0">
          {/* 인기 심리테스트 & 팬아트 - 나란히 배치 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* 인기 심리테스트 */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between pt-10">
                <div className="flex items-center gap-2">
                  <h2 className="text-base md:text-2xl  text-gray-900 dark:text-gray-100">
                    {t("home.sections.popularTests")}
                  </h2>
                </div>
                <button
                  onClick={() => router.push("/community/tests")}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-400 font-medium"
                >
                  <span>{language === "ko" ? "더 보기" : "Ver Más"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {popularTests.slice(0, 3).map((test) => (
                <div
                  key={test.id}
                  className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
                  onClick={() => router.push(`/community/tests/${test.id}`)}
                  style={{ aspectRatio: "8 / 13" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
                    <img
                      src={test.image}
                      alt={test.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 text-white">
                      <h3 className="text-xs md:text-base line-clamp-2 mb-1">
                        {test.title}
                      </h3>
                      <p className="text-xs text-white/90">
                        {test.participants}{" "}
                        {language === "ko" ? "명 참여" : "participants"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>

            {/* 팬아트 */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between pt-10">
                <div className="flex items-center gap-2">
                  <h2 className="text-base md:text-2xl  text-gray-900 dark:text-gray-100">
                    {language === "ko" ? "팬아트" : "Fan Art"}
                  </h2>
                </div>
                <button
                  onClick={() => router.push("/community/fanart")}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-400 font-medium"
                >
                  <span>{language === "ko" ? "더 보기" : "Ver Más"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {fanArtPosts.slice(0, 3).map((post) => (
                <div
                  key={post.id}
                  className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
                  onClick={() =>
                    router.push(`/community/fanart/${post.id}?from=home`)
                  }
                  style={{ aspectRatio: "8 / 13" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== "/misc/placeholder.png") {
                          target.src = "/misc/placeholder.png";
                        }
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 text-white">
                      <h3 className="text-xs md:text-base line-clamp-2 mb-1">
                        {post.title}
                      </h3>
                      <p className="text-xs text-white/90">
                        {post.likes} likes ·{" "}
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>

          {/* 아이돌 사진 - Responsive Grid */}
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between pt-10">
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-2xl  text-gray-900 dark:text-gray-100">
                  {language === "ko" ? "아이돌 사진" : "Fotos de Ídolos"}
                </h2>
              </div>
              <button
                onClick={() => router.push("/community/idol-photos")}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-400 font-medium"
              >
                <span>{language === "ko" ? "더 보기" : "Ver Más"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              {idolPhotoPosts.slice(0, 6).map((post) => (
                <div
                  key={post.id}
                  className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
                  onClick={() =>
                    router.push(`/community/idol-photos/${post.id}?from=home`)
                  }
                  style={{ aspectRatio: "8 / 13" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== "/misc/placeholder.png") {
                          target.src = "/misc/placeholder.png";
                        }
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 text-white">
                      <h3 className="text-xs md:text-base line-clamp-2 mb-1">
                        {post.title}
                      </h3>
                      <p className="text-xs text-white/90">
                        {post.likes} likes ·{" "}
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AMIKO 최근 영상 - 반응형 - 전체 너비 */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] py-8 bg-gray-50 dark:bg-gray-900/50">
        <div className="w-inside mx-auto">
          <div className="flex items-center justify-between mb-4 md:mb-6 pt-10">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl text-gray-900 dark:text-gray-100">
                {t("home.sections.recentVideos")}
              </h2>
            </div>
            <button
              onClick={() =>
                window.open(
                  "https://www.youtube.com/@AMIKO_Officialstudio",
                  "_blank"
                )
              }
              className="flex items-center gap-1 text-gray-600 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-400 text-sm font-medium"
            >
              <span>{language === "ko" ? "더 보기" : "Ver Más"}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {youtubeVideos.length > 0 ? (
              youtubeVideos.slice(0, 2).map((video) => (
                <div
                  key={video.id}
                  className="cursor-pointer group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all"
                  onClick={() => window.open(video.url, "_blank")}
                >
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
                      {video.duration}
                    </div>
                    {/* YouTube 재생 아이콘 */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : youtubeLoading ? (
              <div className="col-span-2 text-center py-12">
                <Play className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-pulse" />
                <p className="text-gray-500 text-sm">
                  {language === "ko"
                    ? "영상을 불러오는 중..."
                    : "Cargando videos..."}
                </p>
              </div>
            ) : (
              <div className="col-span-2 text-center py-12">
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
        </div>
      </div>

      {/* 나머지 섹션들을 위한 컨테이너 */}
      <div className="w-full">
        <div className="w-inside mx-auto space-y-3 md:space-y-4">
          {/* 화상채팅 온라인 인원 - 데스크톱 전용 사이드바 - 미구현으로 숨김 */}

          {/* 화상채팅 온라인 인원 - 데스크톱 전용 사이드바 - 미구현으로 숨김 */}
          {/* <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-lg text-gray-900 dark:text-gray-100">
                    {t('home.sections.videoChatOnline')}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={() => router.push('/main?tab=meet')}
                >
                  <Users className="w-5 h-5 mr-2" />
                  {language === 'ko' ? '더 보기' : 'Ver Más'}
                </Button>
              </div>
              
              <Card className="shadow-md">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {onlineUsers.length > 0 ? (
                      onlineUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
                          <div className="relative">
                            <Avatar className="w-12 h-12 shadow-md border-2 border-white dark:border-gray-800 group-hover:scale-105 transition-transform">
                              <AvatarImage src={user.profileImage} alt={user.name} />
                              <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-base ">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 shadow-md">
                              <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                              {user.name}
                            </h3>
                            <p className="text-base text-green-600 dark:text-green-400 font-medium">{t('home.community.online')}</p>
                          </div>
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center py-4 text-base text-gray-400">
                        {language === 'ko' ? '현재 온라인 사용자가 없습니다' : 'No hay usuarios en línea'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div> */}

          {/* 지금 핫 한 채팅방 - Responsive Grid */}
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between pt-10">
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-2xl  text-gray-900 dark:text-gray-100">
                  {language === "ko"
                    ? "지금 핫 한 채팅방"
                    : "Chats Calientes"}
                </h2>
              </div>
              <button
                onClick={() => router.push("/community/k-chat")}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-400 font-medium"
              >
                <span>{language === "ko" ? "더 보기" : "Ver Más"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {hotChatRooms.slice(0, 3).map((room) => (
                <div
                  key={room.id}
                  className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
                  onClick={() =>
                    router.push(`/community/k-chat/${room.id}?from=home`)
                  }
                  style={{ aspectRatio: "13 / 8" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
                    <img
                      src={room.image}
                      alt={room.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 text-white">
                      <h3 className="text-xs md:text-base line-clamp-2 mb-1">
                        {room.title}
                      </h3>
                      <p className="text-xs text-white/90">
                        {room.memberCount} members
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 지금 투표 - Responsive Grid */}
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between pt-10">
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-2xl text-gray-900 dark:text-gray-100">
                  {language === "ko" ? "지금 투표" : "Vota Ahora"}
                </h2>
              </div>
              <button
                onClick={() => router.push("/community/polls")}
                className="flex items-center gap-1 text-base text-gray-600 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-400 font-medium"
              >
                <span>{language === "ko" ? "더 보기" : "Ver Más"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {currentPolls.slice(0, 4).map((poll) => (
                <div
                  key={poll.id}
                  className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
                  onClick={() =>
                    router.push(`/main?tab=community&poll=${poll.id}`)
                  }
                  style={{ aspectRatio: "8 / 13" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-red-500 to-pink-400">
                    <img
                      src={poll.image}
                      alt={poll.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 text-white">
                      <h3 className="text-xs md:text-base line-clamp-2 mb-1">
                        {poll.title}
                      </h3>
                      <p className="text-xs text-white/90">
                        {poll.totalVotes} votes
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* 최근 스토리 - 반응형 - 환경 변수로 제어 */}
          {process.env.NEXT_PUBLIC_ENABLE_STORIES === "true" && (
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src="/icons/story.png"
                    alt="Stories"
                    className="w-5 h-5 object-contain"
                  />
                  <h2 className="text-lg text-gray-900 dark:text-gray-100">
                    {t("home.sections.recentStories")}
                  </h2>
                </div>
                <button
                  onClick={() => router.push("/community/stories")}
                  className="flex items-center gap-1 text-purple-500 hover:text-purple-600 text-base"
                >
                  <span>{language === "ko" ? "더 보기" : "Ver Más"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <Card>
                <CardContent className="p-2 md:p-3">
                  {recentStories.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                      {recentStories.slice(0, 3).map((story) => (
                        <div
                          key={story.id}
                          className="cursor-pointer group"
                          onClick={() => {
                            const userStories = recentStories.filter(
                              (s) => s.user_name === story.user_name
                            );
                            if (userStories.length > 0) {
                              setViewerStories(userStories);
                              setSelectedStoryIndex(
                                userStories.findIndex((s) => s.id === story.id)
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
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                <span className="text-white text-2xl">
                                  {story.user_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-base text-gray-700 dark:text-gray-300 mb-1 line-clamp-1 font-medium">
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
                      <p className="text-gray-500 text-base">
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
        </div>
      </div>

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
                          <span className="text-white text-base">
                            {viewerStories[selectedStoryIndex].user_name
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-base">
                        {viewerStories[selectedStoryIndex].user_name}
                      </p>
                    </div>
                  </div>

                  {/* 텍스트 컨텐츠 */}
                  {viewerStories[selectedStoryIndex].text_content && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                      <p className="text-white text-base">
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
