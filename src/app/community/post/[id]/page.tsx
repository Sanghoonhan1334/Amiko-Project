"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PostDetail from "@/components/main/app/community/PostDetail";
import PostEditModal from "@/components/main/app/community/PostEditModal";
import Header from "@/components/layout/Header";
import { useLanguage } from "@/context/LanguageContext";

interface Post {
  id: string;
  title: string;
  content: string;
  images?: string[];
  category?: string;
  view_count?: number;
  like_count?: number;
  dislike_count?: number;
  comment_count?: number;
  created_at?: string;
  updated_at?: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    profile_image?: string;
    nickname?: string;
  };
  gallery?: {
    id: string;
    slug: string;
    name_ko: string;
  };
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const [post, setPost] = useState<Post | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const postId = params.id as string;

  const handleBack = () => {
    const fromHome = searchParams.get("from") === "home";
    router.push(fromHome ? "/main?tab=home" : "/community/freeboard");
  };

  const handlePostUpdated = (updatedPost: Post) => {
    // 게시글 정보 업데이트
    setPost({ ...post, ...updatedPost });
    setShowEditModal(false);
    setEditingPost(null);
    // PostDetail 컴포넌트에 데이터 새로고침 트리거
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 기존 Header 컴포넌트 사용 */}
      <Header />

      <div className="max-w-4xl mx-auto px-0 pt-20 pb-8 md:px-4 md:pt-32 md:pb-6">
        {/* 뒤로가기 버튼 */}
        <div className="mb-2 md:mb-4 px-4 md:px-0">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4 py-1 md:py-2"
          >
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            {t("freeboard.backToList")}
          </Button>
        </div>

        {/* 게시글 상세 내용 */}
        <PostDetail
          postId={postId}
          onBack={handleBack}
          onPostLoaded={(loadedPost) => setPost(loadedPost)}
          refreshTrigger={refreshTrigger}
          onEdit={() => {
            setEditingPost(post);
            setShowEditModal(true);
          }}
          onDelete={async () => {
            if (
              confirm(
                `${t("freeboard.deleteConfirm")}\n${t("freeboard.deleteConfirmDescription")}`,
              )
            ) {
              try {
                console.log("게시물 삭제 시도:", postId);

                // 토큰 가져오기
                const token = localStorage.getItem("amiko_token");
                if (!token) {
                  alert(t("auth.loginRequired"));
                  return;
                }

                // DELETE API 호출
                const response = await fetch(`/api/posts/${postId}`, {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(
                    errorData.error || t("freeboard.deleteFailed"),
                  );
                }

                const result = await response.json();
                console.log("삭제 성공:", result);

                alert(t("freeboard.deleteSuccess"));
                handleBack(); // 성공 시에만 뒤로가기
              } catch (error) {
                console.error("게시물 삭제 오류:", error);
                alert(
                  error instanceof Error
                    ? error.message
                    : t("freeboard.deleteError"),
                );
              }
            }
          }}
        />

        {/* 게시글 수정 모달 */}
        <PostEditModal
          post={
            editingPost
              ? {
                  ...editingPost,
                  category: editingPost.category || "자유게시판",
                }
              : null
          }
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingPost(null);
          }}
          onSave={(updatedPost) => handlePostUpdated(updatedPost as Post)}
        />
      </div>
    </div>
  );
}
