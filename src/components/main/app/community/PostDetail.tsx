"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Languages, Share2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { TranslationService } from "@/lib/translation";
import { useRouter } from "next/navigation";
import CommentSection from "./CommentSection";
import { shareCommunityPost } from "@/lib/share-utils";
import AuthorName from "@/components/common/AuthorName";
import { communityEvents, marketingEvents } from "@/lib/analytics";

interface Post {
  id: string;
  title: string;
  content: string;
  images: string[];
  category?: string;
  view_count: number;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  is_pinned: boolean;
  is_hot: boolean;
  is_notice: boolean;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    full_name: string;
    profile_image?: string;
  };
  // 번역된 필드들
  translatedTitle?: string;
  translatedContent?: string;
}

interface PostDetailProps {
  postId: string;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPostLoaded?: (post: Post) => void;
  refreshTrigger?: number;
}

export default function PostDetail({
  postId,
  onBack,
  onEdit,
  onDelete,
  onPostLoaded,
  refreshTrigger,
}: PostDetailProps) {
  const { t, language } = useLanguage();
  const [readStartTime] = useState(Date.now());
  const [scrollDepth, setScrollDepth] = useState(0);
  const [maxScrollDepth, setMaxScrollDepth] = useState(0);
  const { user, token } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<"like" | "dislike" | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loadingRelatedPosts, setLoadingRelatedPosts] = useState(false);

  // 번역 서비스 초기화
  const translationService = TranslationService.getInstance();
  const [translating, setTranslating] = useState(false);

  // 운영자 권한 확인
  const checkAdminStatus = () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    // 운영자 이메일 목록
    const adminEmails = [
      "admin@amiko.com",
      "editor@amiko.com",
      "manager@amiko.com",
      "info@helloamiko.com",
      "eugenia.arevalo@gmail.com",
    ];

    // 운영자 ID 목록
    const adminIds = [
      "66623263-4c1d-4dce-85a7-cc1b21d01f70", // 현재 사용자 ID
    ];

    const isAdminUser =
      adminEmails.includes(user.email) || adminIds.includes(user.id);
    setIsAdmin(isAdminUser);
  };

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    loadPost();
    loadUserVote();
  }, [postId]);

  // 수정 후 데이터 새로고침 (조회수 증가 없이)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadPost(false);
    }
  }, [refreshTrigger]);

  // 같은 카테고리의 다른 게시글 목록 가져오기
  useEffect(() => {
    if (post?.category) {
      fetchRelatedPosts(post.category);
    }
  }, [post?.category, postId]);

  // 스크롤 추적 및 읽기 시간 추적
  useEffect(() => {
    if (!post) return;

    let readTimeInterval: NodeJS.Timeout;
    let scrollTimeout: NodeJS.Timeout;

    // 읽기 시간 추적 (30초마다)
    readTimeInterval = setInterval(() => {
      const readTimeSeconds = Math.floor((Date.now() - readStartTime) / 1000);
      if (readTimeSeconds > 0 && readTimeSeconds % 30 === 0) {
        communityEvents.readTime(postId, readTimeSeconds);
      }
    }, 30000);

    // 스크롤 깊이 추적
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const scrollPercent = Math.round(
          (scrollTop / (documentHeight - windowHeight)) * 100,
        );

        if (scrollPercent > maxScrollDepth) {
          setMaxScrollDepth(scrollPercent);
          communityEvents.scrollDepth(postId, scrollPercent);
        }

        // 스크롤 이벤트 (25%, 50%, 75%, 100%에서만)
        const milestones = [25, 50, 75, 100];
        if (milestones.includes(scrollPercent)) {
          marketingEvents.scroll(scrollPercent);
        }
      }, 100);
    };

    window.addEventListener("scroll", handleScroll);

    // 컴포넌트 언마운트 시 정리
    return () => {
      clearInterval(readTimeInterval);
      clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", handleScroll);

      // 최종 읽기 시간 전송
      const finalReadTime = Math.floor((Date.now() - readStartTime) / 1000);
      if (finalReadTime > 10) {
        communityEvents.readTime(postId, finalReadTime);
      }
    };
  }, [post, postId, readStartTime, maxScrollDepth]);

  const loadPost = async (incrementView = true) => {
    try {
      setLoading(true);
      const url = incrementView
        ? `/api/posts/${postId}`
        : `/api/posts/${postId}?skipView=true`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(t("freeboard.loadingPosts"));
      }

      const data = await response.json();
      setPost(data.post);

      // 부모 컴포넌트에 post 데이터 전달
      if (data.post && onPostLoaded) {
        onPostLoaded(data.post);
      }

      // 커뮤니티 퍼널 이벤트: 게시물 조회 (PostDetail 컴포넌트에서)
      if (data.post && incrementView) {
        communityEvents.viewPost(postId, data.post.title);
      }
    } catch (err) {
      console.error("게시물 로드 오류:", err);
      setError(
        err instanceof Error
          ? err.message
          : t("community.postDetail.errors.unknownError"),
      );
    } finally {
      setLoading(false);
    }
  };

  const loadUserVote = async () => {
    if (!user || !token) return;

    try {
      const response = await fetch(`/api/posts/${postId}/vote`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserVote(data.vote_type);
      }
    } catch (err) {
      console.error("투표 정보 로드 오류:", err);
    }
  };

  // 같은 카테고리의 다른 게시글 목록 가져오기
  const fetchRelatedPosts = async (category: string) => {
    try {
      setLoadingRelatedPosts(true);
      const params = new URLSearchParams({
        category: category,
        limit: "10",
        exclude: postId,
      });

      const response = await fetch(`/api/posts?${params}`);
      const data = await response.json();

      if (data.success && data.posts) {
        // 현재 게시글 제외하고 최대 10개만
        const filtered = data.posts
          .filter((p: Post) => p.id !== postId)
          .slice(0, 10);
        setRelatedPosts(filtered);
      }
    } catch (error) {
      console.error("관련 게시글 로드 실패:", error);
      setRelatedPosts([]);
    } finally {
      setLoadingRelatedPosts(false);
    }
  };

  // 게시물 번역 핸들러
  const handleTranslatePost = async (type: "title" | "content") => {
    if (!post || translating) return;

    setTranslating(true);

    try {
      const text = type === "title" ? post.title : post.content;
      const targetLang = language === "ko" ? "es" : "ko";

      const translatedText = await translationService.translate(
        text,
        targetLang,
      );

      setPost((prevPost) =>
        prevPost
          ? {
              ...prevPost,
              [`translated${type.charAt(0).toUpperCase() + type.slice(1)}`]:
                translatedText,
            }
          : null,
      );
    } catch (error) {
      console.error("번역 실패:", error);
      setError(t("freeboard.translatedFailed"));
    } finally {
      setTranslating(false);
    }
  };

  const handleVote = async (voteType: "like" | "dislike") => {
    if (!user || !token) {
      setError(t("community.postDetail.loginRequired"));
      return;
    }

    // 즉시 UI 업데이트 (Optimistic Update)
    const previousVote = userVote;
    const previousLikeCount = post?.like_count || 0;
    const previousDislikeCount = post?.dislike_count || 0;

    // 새로운 투표 상태 계산
    let newVote: "like" | "dislike" | null = voteType;
    let newLikeCount = previousLikeCount;
    let newDislikeCount = previousDislikeCount;

    if (previousVote === voteType) {
      // 같은 버튼을 다시 누르면 취소
      newVote = null;
      if (voteType === "like") {
        newLikeCount = Math.max(0, previousLikeCount - 1);
      } else {
        newDislikeCount = Math.max(0, previousDislikeCount - 1);
      }
    } else {
      // 다른 투표로 변경
      if (voteType === "like") {
        newLikeCount = previousLikeCount + 1;
        if (previousVote === "dislike") {
          newDislikeCount = Math.max(0, previousDislikeCount - 1);
        }
      } else {
        newDislikeCount = previousDislikeCount + 1;
        if (previousVote === "like") {
          newLikeCount = Math.max(0, previousLikeCount - 1);
        }
      }
    }

    // 즉시 UI 업데이트
    setUserVote(newVote);
    if (post) {
      setPost({
        ...post,
        like_count: newLikeCount,
        dislike_count: newDislikeCount,
      });
    }

    // 서버에 투표 요청 (백그라운드)
    try {
      const response = await fetch(`/api/posts/${postId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vote_type: voteType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "투표에 실패했습니다");
      }

      const data = await response.json();
      console.log("투표 성공:", data);

      // 커뮤니티 퍼널 이벤트: 게시물 좋아요
      if (voteType === "like" && data.vote_type === "like") {
        communityEvents.likePost(postId, true);
      }

      // 서버 응답으로 최종 동기화
      setUserVote(data.vote_type);
      if (post) {
        setPost({
          ...post,
          like_count: data.like_count,
          dislike_count: data.dislike_count,
        });
      }
    } catch (err) {
      console.error("투표 오류:", err);

      // 에러 발생 시 이전 상태로 롤백
      setUserVote(previousVote);
      if (post) {
        setPost({
          ...post,
          like_count: previousLikeCount,
          dislike_count: previousDislikeCount,
        });
      }

      setError(
        err instanceof Error ? err.message : "투표 처리 중 오류가 발생했습니다",
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === "es" ? "es-ES" : "ko-KR";
    return date.toLocaleString(locale);
  };

  const formatContent = (content: string) => {
    // 간단한 HTML 태그 처리 (실제로는 더 복잡한 마크다운 파서 사용 권장)
    return content
      .replace(/\n/g, "<br />")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");
  };

  const handleShare = async () => {
    if (!post) return;

    try {
      await shareCommunityPost(
        post.id,
        post.title,
        post.content,
        language as "ko" | "es",
      );
      // 커뮤니티 퍼널 이벤트: 게시물 공유
      communityEvents.sharePost(post.id, "native");
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-24 pb-12 min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {t("freeboard.loadingPosts")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex items-center justify-center pt-24 pb-12 min-h-[60vh]">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error || t("freeboard.postNotFound")}
          </p>
          <Button onClick={onBack} variant="outline">
            ← {t("freeboard.backToList")}
          </Button>
        </div>
      </div>
    );
  }

  const isAuthor = user && user.id === post.author?.id;
  const canManage = post.is_notice ? isAdmin : isAuthor || isAdmin; // 공지사항은 운영자만, 일반 게시글은 작성자이거나 운영자

  // console.log('PostDetail 권한 확인:', {
  //   userId: user?.id,
  //   postUserId: post.author?.id,
  //   isAuthor,
  //   isAdmin,
  //   canManage,
  //   onEdit: !!onEdit,
  //   onDelete: !!onDelete
  // })

  return (
    <div>
      <Card className="bg-white shadow-lg border border-gray-200 rounded-xl overflow-hidden">
        {/* 게시물 상세 */}
        <div className="p-4 md:p-6">
          {/* 게시물 헤더 */}
          <div className="flex items-start justify-between mb-3 md:mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg md:text-xl font-bold text-gray-800">
                  {post.translatedTitle || post.title}
                </h1>
                {post.translatedTitle && (
                  <span className="text-[10px] md:text-xs text-blue-500">
                    {t("freeboard.translated")}
                  </span>
                )}
              </div>
              <div className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
                <AuthorName
                  userId={post.author?.id}
                  name={
                    post.author?.nickname ||
                    post.author?.full_name ||
                    t("freeboard.anonymous")
                  }
                  profileImage={post.author?.profile_image}
                  className="font-medium text-gray-700"
                  avatarSize="sm"
                />
                <span>/ {formatDate(post.created_at)}</span>
              </div>
            </div>

            {/* 상태 배지 및 액션 버튼 */}
            <div className="flex items-center space-x-1 md:space-x-2">
              {post.is_pinned && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-700 text-xs"
                >
                  {t("freeboard.pinned")}
                </Badge>
              )}
              {post.is_hot && (
                <Badge
                  variant="secondary"
                  className="bg-red-100 text-red-700 text-xs"
                >
                  {t("freeboard.hot")}
                </Badge>
              )}

              <div className="flex flex-col space-y-1 md:space-y-2">
                {/* 수정/삭제 버튼 */}
                {canManage && (
                  <div className="flex space-x-1">
                    {(post.is_notice ? isAdmin : isAuthor || isAdmin) &&
                      onEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            console.log(
                              "수정 버튼 클릭됨, onEdit 함수:",
                              onEdit,
                            );
                            onEdit();
                          }}
                          className="text-xs px-2 py-1"
                        >
                          {post.is_notice
                            ? t("freeboard.editNotice")
                            : t("freeboard.edit")}
                        </Button>
                      )}
                    {(post.is_notice ? isAdmin : isAuthor || isAdmin) &&
                      onDelete && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            console.log(
                              "삭제 버튼 클릭됨, onDelete 함수:",
                              onDelete,
                            );
                            onDelete();
                          }}
                          className={`text-xs px-2 py-1 ${post.is_notice ? "text-red-600 border-red-600 hover:bg-red-50" : isAdmin && !isAuthor ? "text-red-600 border-red-600 hover:bg-red-50" : ""}`}
                        >
                          {post.is_notice
                            ? t("freeboard.deleteNotice")
                            : isAdmin && !isAuthor
                              ? t("freeboard.deleteAsAdmin")
                              : t("freeboard.delete")}
                        </Button>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 게시물 내용 */}
          <div className="mb-3 md:mb-6">
            {post.translatedContent && (
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <span className="text-[10px] md:text-xs text-blue-500">
                  {t("freeboard.translated")}
                </span>
              </div>
            )}
            <div
              className="prose max-w-none prose-sm md:prose-base"
              dangerouslySetInnerHTML={{
                __html: formatContent(post.translatedContent || post.content),
              }}
            />
          </div>

          {/* 이미지/영상/GIF 갤러리 */}
          {post.images && post.images.length > 0 && (
            <div className="mb-3 md:mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                {post.images.map((media, index) => {
                  // 파일 확장자로 타입 판단
                  const isVideo = media.match(/\.(mp4|webm|mov|avi|mkv)$/i);
                  const isGif = media.match(/\.gif$/i);

                  return (
                    <div key={index} className="relative group">
                      {isVideo ? (
                        <video
                          src={media}
                          controls
                          className="w-full h-auto object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(media, "_blank")}
                        >
                          {language === "es"
                            ? "Tu navegador no soporta el elemento de video."
                            : "브라우저가 비디오 태그를 지원하지 않습니다."}
                        </video>
                      ) : (
                        <img
                          src={media}
                          alt={
                            isGif
                              ? `GIF ${index + 1}`
                              : `첨부 이미지 ${index + 1}`
                          }
                          className="w-full h-auto object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(media, "_blank")}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 통계 및 액션 */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0 pt-3 md:pt-6 border-t">
            <div className="flex items-center space-x-4 md:space-x-6 text-xs md:text-sm text-gray-500">
              <div className="flex items-center">
                <span className="mr-1">👁️</span>
                <span>{post.view_count}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-1">💬</span>
                <span>{post.comment_count}</span>
              </div>
            </div>

            {/* 추천/비추천 버튼 */}
            <div className="flex items-center space-x-2 md:space-x-3">
              <button
                onClick={() => handleVote("like")}
                disabled={!user}
                className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-1 md:py-2 rounded-lg transition-all text-xs md:text-sm ${
                  userVote === "like"
                    ? "bg-green-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-600"
                } ${!user ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span className="text-base md:text-lg">👍</span>
                <span className="font-medium">{post.like_count}</span>
              </button>

              <button
                onClick={() => handleVote("dislike")}
                disabled={!user}
                className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-1 md:py-2 rounded-lg transition-all text-xs md:text-sm ${
                  userVote === "dislike"
                    ? "bg-red-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600"
                } ${!user ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span className="text-base md:text-lg">👎</span>
                <span className="font-medium">{post.dislike_count}</span>
              </button>

              {!user && (
                <span className="text-[10px] md:text-xs text-gray-500 ml-1 md:ml-2">
                  {t("freeboard.loginToVote")}
                </span>
              )}

              {/* 공유 버튼 */}
              <button
                onClick={handleShare}
                className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-1 md:py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer text-xs md:text-sm"
              >
                <Share2 className="w-3 h-3 md:w-4 md:h-4" />
                <span className="font-medium">{t("freeboard.share")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="border-t border-gray-200">
          <CommentSection
            postId={post.id}
            onCommentCountChange={(count) => {
              // 댓글 수가 변경되면 게시물 정보 업데이트
              setPost((prev) =>
                prev ? { ...prev, comment_count: count } : null,
              );
            }}
          />
        </div>

        {/* 같은 카테고리 게시글 목록 */}
        {relatedPosts.length > 0 && (
          <div className="border-t border-gray-200">
            {/* 헤더 */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {language === "ko"
                  ? "같은 게시판의 다른 글"
                  : "Otros posts en este foro"}
              </h3>
            </div>

            {/* 데스크톱: 테이블 형태 (md 이상) */}
            <div className="hidden md:block overflow-x-auto bg-white dark:bg-gray-900">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-16">
                      {language === "ko" ? "번호" : "No."}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {language === "ko" ? "제목" : "Título"}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-24">
                      {language === "ko" ? "작성자" : "Autor"}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-28">
                      {language === "ko" ? "날짜" : "Fecha"}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-20">
                      {language === "ko" ? "조회" : "Vistas"}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900">
                  {relatedPosts.map((relatedPost, index) => (
                    <tr
                      key={relatedPost.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                      onClick={() => {
                        router.push(`/community/post/${relatedPost.id}`);
                      }}
                    >
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm font-medium">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {relatedPost.is_pinned && (
                            <span className="text-yellow-500 text-sm">📌</span>
                          )}
                          {relatedPost.is_hot && (
                            <span className="text-red-500 text-sm">🔥</span>
                          )}
                          {relatedPost.images &&
                            relatedPost.images.length > 0 && (
                              <span
                                className="text-blue-500 text-sm"
                                title={
                                  language === "es"
                                    ? `${relatedPost.images.length} archivo(s)`
                                    : `${relatedPost.images.length}개 첨부`
                                }
                              >
                                📎
                              </span>
                            )}
                          <span className="text-gray-900 dark:text-gray-100 truncate max-w-md text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {relatedPost.title}
                          </span>
                          {relatedPost.comment_count > 0 && (
                            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                              [{relatedPost.comment_count}]
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400 text-sm">
                        <AuthorName
                          userId={relatedPost.author?.id}
                          name={
                            relatedPost.author?.full_name ||
                            t("freeboard.anonymous")
                          }
                          profileImage={relatedPost.author?.profile_image}
                          avatarSize="sm"
                          showAvatar={true}
                        />
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                        {formatDate(relatedPost.created_at)}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                        {relatedPost.view_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 모바일: 카드 형태 (md 미만) */}
            <div className="md:hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {relatedPosts.map((relatedPost, index) => (
                  <div
                    key={relatedPost.id}
                    className="px-4 py-3 active:bg-gray-50 dark:active:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => {
                      router.push(`/community/post/${relatedPost.id}`);
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {/* 번호 */}
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium min-w-[24px]">
                        {index + 1}
                      </span>

                      {/* 제목 및 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          {relatedPost.is_pinned && (
                            <span className="text-yellow-500 text-xs">📌</span>
                          )}
                          {relatedPost.is_hot && (
                            <span className="text-red-500 text-xs">🔥</span>
                          )}
                          {relatedPost.images &&
                            relatedPost.images.length > 0 && (
                              <span className="text-blue-500 text-xs">📎</span>
                            )}
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {relatedPost.title}
                          </h4>
                          {relatedPost.comment_count > 0 && (
                            <span className="text-blue-500 text-xs">
                              [{relatedPost.comment_count}]
                            </span>
                          )}
                        </div>

                        {/* 메타 정보 */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <AuthorName
                            userId={relatedPost.author?.id}
                            name={
                              relatedPost.author?.full_name ||
                              t("freeboard.anonymous")
                            }
                            profileImage={relatedPost.author?.profile_image}
                            avatarSize="sm"
                            showAvatar={true}
                          />
                          <span>•</span>
                          <span>{formatDate(relatedPost.created_at)}</span>
                          <span>•</span>
                          <span>
                            {language === "ko" ? "조회" : "Vistas"}{" "}
                            {relatedPost.view_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {loadingRelatedPosts && (
          <div className="border-t border-gray-200 px-4 py-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-2"></div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {language === "ko" ? "로딩 중..." : "Cargando..."}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
