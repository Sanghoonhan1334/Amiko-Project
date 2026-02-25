"use client";

import { useState, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, Video, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface DanceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export default function DanceUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: DanceUploadModalProps) {
  const { t } = useLanguage();
  const { user, token } = useAuth();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // 비디오 파일 선택
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith("video/")) {
      setError("비디오 파일만 업로드 가능합니다.");
      return;
    }

    // 파일 크기 검증 (100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError("비디오 파일 크기는 100MB를 초과할 수 없습니다.");
      return;
    }

    setVideoFile(file);
    setError(null);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setVideoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 썸네일 파일 선택
  const handleThumbnailFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드 가능합니다.");
      return;
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("이미지 파일 크기는 5MB를 초과할 수 없습니다.");
      return;
    }

    setThumbnailFile(file);
    setError(null);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnailPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 파일 업로드
  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch("/api/upload/image", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token || ""}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "파일 업로드 실패");
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !token) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!videoFile) {
      setError("비디오 파일을 선택해주세요.");
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // 1. 비디오 파일 업로드
      setUploadProgress(30);
      const videoUrl = await uploadFile(videoFile, "dance-videos");
      setUploadProgress(60);

      // 2. 썸네일 파일 업로드 (있는 경우)
      let thumbnailUrl: string | null = null;
      if (thumbnailFile) {
        thumbnailUrl = await uploadFile(thumbnailFile, "dance-thumbnails");
      }
      setUploadProgress(80);

      // 3. 비디오 정보 저장
      const response = await fetch("/api/dance/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          title: title.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "업로드 실패");
      }

      setUploadProgress(100);

      // 성공
      setVideoFile(null);
      setThumbnailFile(null);
      setTitle("");
      setVideoPreview(null);
      setThumbnailPreview(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";

      onUploadSuccess?.();
      setTimeout(() => {
        onClose();
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      console.error("[DanceUploadModal] 업로드 오류:", err);
      setError(
        err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.",
      );
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setVideoFile(null);
      setThumbnailFile(null);
      setTitle("");
      setVideoPreview(null);
      setThumbnailPreview(null);
      setError(null);
      setUploadProgress(0);
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
      onClose();
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[85vh] bg-white dark:bg-gray-900 mx-1 flex flex-col shadow-2xl rounded-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg md:text-xl font-bold">
            <Upload className="w-5 h-5 text-purple-600" />
            {t("dance.upload.title") || "영상 업로드"}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
            {t("dance.upload.description") ||
              "비디오 파일을 선택하여 업로드하세요."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* 비디오 파일 선택 */}
          <div className="space-y-2">
            <Label htmlFor="videoFile" className="text-sm font-semibold">
              {t("dance.upload.videoFile") || "비디오 파일 *"}
            </Label>
            {!videoFile ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                <input
                  ref={videoInputRef}
                  id="videoFile"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  disabled={uploading}
                  className="hidden"
                />
                <label
                  htmlFor="videoFile"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Video className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t("dance.upload.selectVideo") || "비디오 파일 선택"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {t("dance.upload.videoSizeLimit") || "최대 100MB"}
                  </span>
                </label>
              </div>
            ) : (
              <div className="relative border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {videoPreview && (
                    <div className="relative w-20 h-20 rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <video
                        src={videoPreview}
                        className="w-full h-full object-cover"
                        muted
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {videoFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeVideo}
                    disabled={uploading}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 썸네일 파일 선택 (선택) */}
          <div className="space-y-2">
            <Label htmlFor="thumbnailFile" className="text-sm font-semibold">
              {t("dance.upload.thumbnailFile") || "썸네일 이미지 (선택)"}
            </Label>
            {!thumbnailFile ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center hover:border-purple-500 transition-colors">
                <input
                  ref={thumbnailInputRef}
                  id="thumbnailFile"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailFileChange}
                  disabled={uploading}
                  className="hidden"
                />
                <label
                  htmlFor="thumbnailFile"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {t("dance.upload.selectThumbnail") || "썸네일 이미지 선택"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {t("dance.upload.imageSizeLimit") || "최대 5MB"}
                  </span>
                </label>
              </div>
            ) : (
              <div className="relative border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {thumbnailPreview && (
                    <div className="relative w-20 h-20 rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <Image
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {thumbnailFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(thumbnailFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeThumbnail}
                    disabled={uploading}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 제목 (선택) */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">
              {t("dance.upload.titleInput") || "제목 (선택)"}
            </Label>
            <Input
              id="title"
              type="text"
              placeholder={
                t("dance.upload.titlePlaceholder") || "영상 제목을 입력하세요"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              className="w-full"
            />
          </div>

          {/* 업로드 진행률 */}
          {uploading && uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>{t("dance.upload.uploading") || "업로드 중..."}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={uploading || !videoFile}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("dance.upload.uploading") || "업로드 중..."}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {t("dance.upload.submit") || "업로드"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
