"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Info,
  Upload,
  Share2,
  Play,
  Heart,
  MessageCircle,
  Eye,
} from "lucide-react";
import Image from "next/image";
import RandomPlayDanceSection from "../home/RandomPlayDanceSection";
import DanceGuideModal from "./DanceGuideModal";
import DanceUploadModal from "./DanceUploadModal";

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
  like_count?: number;
  comment_count?: number;
  view_count?: number;
  is_guide?: boolean; // 가이드 영상 여부 (운영자 영상)
}

export default function DanceTab() {
  const { t, language } = useLanguage();
  const [dancePlaylist, setDancePlaylist] = useState<DancePlaylist | null>(
    null,
  );
  const [danceVideos, setDanceVideos] = useState<DanceVideo[]>([]);
  const [danceLoading, setDanceLoading] = useState(true);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const loadDanceData = async () => {
    setDanceLoading(true);
    try {
      // 최신 플레이리스트 가져오기
      const playlistResponse = await fetch("/api/dance/playlist/current");
      if (playlistResponse.ok) {
        const playlistData = await playlistResponse.json();
        if (playlistData && playlistData.id) {
          setDancePlaylist(playlistData);
        } else {
          setDancePlaylist(null);
        }
      } else {
        console.error(
          "[DanceTab] 플레이리스트 조회 실패:",
          playlistResponse.status,
        );
        setDancePlaylist(null);
      }

      // 승인된 댄스 비디오 가져오기 (최신 12개, 가이드 영상 포함)
      const videosResponse = await fetch(
        "/api/dance/videos?limit=12&status=approved&includeGuide=true",
      );
      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        console.log("[DanceTab] 비디오 데이터:", videosData);
        if (videosData.success && videosData.videos) {
          console.log("[DanceTab] 비디오 개수:", videosData.videos.length);
          setDanceVideos(videosData.videos);
        } else {
          console.warn(
            "[DanceTab] 비디오 데이터가 없거나 success가 false:",
            videosData,
          );
          setDanceVideos([]);
        }
      } else {
        const errorData = await videosResponse.json().catch(() => ({}));
        console.error(
          "[DanceTab] 비디오 조회 실패:",
          videosResponse.status,
          errorData,
        );
        setDanceVideos([]);
      }
    } catch (error) {
      console.error("[DanceTab] 데이터 로딩 오류:", error);
      setDancePlaylist(null);
      setDanceVideos([]);
    } finally {
      setDanceLoading(false);
    }
  };

  useEffect(() => {
    loadDanceData();

    // 최초 방문 시 가이드 모달 자동 열기
    if (typeof window !== "undefined") {
      const hasViewedGuide = localStorage.getItem("danceGuideViewed");
      if (!hasViewedGuide) {
        // 최초 방문이면 모달 열기
        setIsGuideModalOpen(true);
        // localStorage에 저장 (다음부터는 안 뜨도록)
        localStorage.setItem("danceGuideViewed", "true");
      }
    }
  }, []);

  const handleUpload = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadSuccess = () => {
    // 업로드 성공 후 비디오 목록 새로고침
    loadDanceData();
  };

  const handleShare = () => {
    // TODO: 공유 기능 구현
    if (navigator.share) {
      navigator
        .share({
          title: t("dance.share.title"),
          text: t("dance.share.text"),
          url: window.location.href,
        })
        .catch((error) => {
          console.log("공유 실패:", error);
        });
    } else {
      // Fallback: 클립보드에 복사
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          alert(t("dance.share.copied"));
        })
        .catch((error) => {
          console.log("복사 실패:", error);
        });
    }
  };

  return (
    <div className="space-y-3 md:space-y-6 mt-20">
      {/* 플레이리스트 섹션 */}
      <RandomPlayDanceSection
        playlist={dancePlaylist}
        videos={danceVideos}
        loading={danceLoading}
        onPlaylistUpdate={loadDanceData}
        hideTitle={true}
        hideCTA={true}
        hideVideoGrid={true}
        hideCard={true}
        hideRibbon={true}
      />

      {/* 액션 버튼 섹션 */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-4 md:gap-6 py-2 sm:py-4">
        {/* Guía 버튼 */}
        <button
          onClick={() => setIsGuideModalOpen(true)}
          className="flex flex-col items-center gap-1 sm:gap-2 p-1.5 sm:p-4 rounded-full bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors group"
        >
          <div className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-purple-500 dark:bg-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Info className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
          </div>
          <span className="text-[10px] sm:text-sm md:text-base font-semibold text-purple-700 dark:text-purple-300">
            {t("dance.guide.button")}
          </span>
        </button>

        {/* Subir 버튼 */}
        <button
          onClick={handleUpload}
          className="flex flex-col items-center gap-1 sm:gap-2 p-1.5 sm:p-4 rounded-full bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors group"
        >
          <div className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-purple-500 dark:bg-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
          </div>
          <span className="text-[10px] sm:text-sm md:text-base font-semibold text-purple-700 dark:text-purple-300">
            {t("dance.upload.button")}
          </span>
        </button>

        {/* Compartir 버튼 */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1 sm:gap-2 p-1.5 sm:p-4 rounded-full bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors group"
        >
          <div className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-purple-500 dark:bg-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Share2 className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
          </div>
          <span className="text-[10px] sm:text-sm md:text-base font-semibold text-purple-700 dark:text-purple-300">
            {t("dance.share.button")}
          </span>
        </button>
      </div>

      {/* 비디오 그리드 (버튼 아래에 배치) */}
      {danceVideos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2">
          {danceVideos.slice(0, 12).map((video) => {
            const isLiked = false; // TODO: 좋아요 상태 관리
            const counts = {
              likes: video.like_count || 0,
              comments: video.comment_count || 0,
              views: video.view_count || 0,
            };
            const isGuide = video.is_guide || false;

            return (
              <div
                key={video.id}
                className="relative aspect-[9/14] bg-gray-100 dark:bg-gray-800 overflow-hidden cursor-pointer hover:opacity-80 transition-all hover:scale-105 group"
                onClick={() => {
                  // 조회수 증가
                  fetch(`/api/dance/videos/${video.id}/view`, {
                    method: "POST",
                  }).catch(console.error);
                  // 비디오 열기 (추후 구현)
                }}
              >
                {/* 사용자 프로필 (왼쪽 위) */}
                <div className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 z-10 flex items-center gap-1 sm:gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-1 py-0.5 sm:px-2 sm:py-1">
                  {video.user_avatar_url ? (
                    <div className="relative w-4 h-4 sm:w-5 sm:h-5 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={video.user_avatar_url}
                        alt={video.user_display_name || "User"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-500 flex-shrink-0 flex items-center justify-center">
                      <span className="text-white text-[10px] sm:text-xs font-bold">
                        {(video.user_display_name || "A")[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-white text-[10px] sm:text-xs font-medium truncate max-w-[50px] sm:max-w-[80px]">
                    {video.user_display_name || "Anónimo"}
                  </span>
                </div>

                {/* 가이드 영상 라벨 (오른쪽 위) */}
                {isGuide && (
                  <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 z-10 bg-yellow-500 text-white text-[9px] sm:text-xs font-bold px-1 py-0.5 sm:px-2 sm:py-0.5 rounded">
                    Video guía
                  </div>
                )}

                {/* 썸네일 URL이 유효하고 example.com이 아닐 때만 Image 컴포넌트 사용 */}
                {video.thumbnail_url &&
                video.thumbnail_url.startsWith("http") &&
                !video.thumbnail_url.includes("example.com") ? (
                  <Image
                    src={video.thumbnail_url}
                    alt={video.title || "Dance video"}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = parent.querySelector(
                          ".thumbnail-fallback",
                        ) as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }
                    }}
                  />
                ) : null}
                {/* 썸네일이 없거나 example.com이거나 로드 실패 시 표시 */}
                <div
                  className={`thumbnail-fallback w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 dark:from-purple-600 dark:via-pink-600 dark:to-red-600 ${video.thumbnail_url && video.thumbnail_url.startsWith("http") && !video.thumbnail_url.includes("example.com") ? "hidden" : ""}`}
                >
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* 하트, 댓글, 조회수 오버레이 */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 sm:p-2 flex items-center gap-1.5 sm:gap-3 text-white text-[10px] sm:text-xs">
                  {/* 하트 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: 좋아요 처리
                    }}
                    className="flex items-center gap-0.5 sm:gap-1 hover:scale-110 transition-transform"
                  >
                    <Heart
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isLiked ? "fill-red-500 text-red-500" : "text-red-500"}`}
                    />
                    <span>{counts.likes}</span>
                  </button>

                  {/* 댓글 */}
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400" />
                    <span>{counts.comments}</span>
                  </div>

                  {/* 조회수 */}
                  <div className="flex items-center gap-0.5 sm:gap-1 ml-auto">
                    <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400" />
                    <span className="truncate">{counts.views}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 가이드 모달 */}
      <DanceGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* 업로드 모달 */}
      <DanceUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
