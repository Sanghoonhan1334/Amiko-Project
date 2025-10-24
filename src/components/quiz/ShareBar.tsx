"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Share2, Instagram, MessageCircle, Copy, CirclePlay } from "lucide-react"; // TikTok 대체 아이콘: CirclePlay

type Props = {
  title: string;     // 예: result.titulo
  imageUrl?: string; // 결과 대표 이미지(선택)
};

export default function ShareBar({ title, imageUrl }: Props) {
  const [pageUrl, setPageUrl] = useState<string>("");

  useEffect(() => {
    // SSR 안전 처리
    if (typeof window !== "undefined") {
      setPageUrl(window.location.href);
    }
  }, []);

  const shareText = useMemo(
    () =>
      `Mi resultado en AMIKO: ${title}\nDescubre tu posición ideal de idol: ${pageUrl}`,
    [title, pageUrl]
  );

  const notify = (msg: string) => {
    // 간단 토스트 대체
    if (typeof window !== "undefined") {
      // 브라우저 기본 알림
      // 필요시 toast 라이브러리 연결 가능
      alert(msg);
    }
  };

  const webShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "AMIKO",
          text: shareText,
          url: pageUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        notify("Enlace copiado al portapapeles.");
      }
    } catch {
      /* 취소 등 무시 */
    }
  };

  const copyFallback = async () => {
    await navigator.clipboard.writeText(shareText);
    notify("Enlace copiado al portapapeles.");
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  // Instagram/TikTok은 웹 직접 딥링크 제한 → 복사 폴백 제공
  const shareInstagram = () => copyFallback();
  const shareTikTok = () => copyFallback();

  const IconButton = ({
    onClick,
    children,
    label,
    ringClass,
  }: {
    onClick: () => void;
    children: React.ReactNode;
    label: string;
    ringClass?: string;
  }) => (
    <motion.button
      type="button"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-label={label}
      className={`size-12 rounded-full bg-white/90 backdrop-blur shadow-md flex items-center justify-center ${ringClass ?? ""}`}
    >
      {children}
    </motion.button>
  );

  return (
    <div className="mt-8 pb-4">
      {/* 전체 타입 보기 링크 위쪽/아래쪽 배치는 페이지에서 결정 */}
      <div className="mt-4 flex items-center justify-center gap-4">
        {/* 시스템 공유(또는 복사) */}
        <IconButton onClick={webShare} label="Compartir (Sistema)">
          <Share2 className="size-6 text-gray-700" />
        </IconButton>

        {/* Instagram */}
        <IconButton
          onClick={shareInstagram}
          label="Compartir en Instagram"
          ringClass="ring-1 ring-pink-200"
        >
          <Instagram className="size-6 text-pink-500" />
        </IconButton>

        {/* TikTok (웹 제한 → 복사 폴백) */}
        <IconButton
          onClick={shareTikTok}
          label="Compartir en TikTok"
          ringClass="ring-1 ring-gray-200"
        >
          <CirclePlay className="size-6 text-black" />
        </IconButton>

        {/* WhatsApp */}
        <IconButton
          onClick={shareWhatsApp}
          label="Compartir en WhatsApp"
          ringClass="ring-1 ring-green-200"
        >
          <MessageCircle className="size-6 text-green-600" />
        </IconButton>
      </div>
    </div>
  );
}
