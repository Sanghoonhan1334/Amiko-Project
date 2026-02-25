"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, Sparkles, Users, Calendar } from "lucide-react";
import { initializePushNotifications } from "@/lib/push-notifications";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function PushNotificationConsentModal() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (!user) return;

    // 이미 동의했는지 확인
    const hasConsented =
      localStorage.getItem("amiko-push-consent") === "accepted";

    // 브라우저 알림 권한이 이미 허용된 경우도 동의한 것으로 간주
    const browserPermissionGranted =
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted";

    // 이미 동의했거나 브라우저 권한이 허용된 경우 모달 표시 안 함
    if (hasConsented || browserPermissionGranted) {
      return;
    }

    // If Chrome has blocked notifications (user previously denied), skip the consent
    // modal entirely — requestPermission() won't show a dialog when already 'denied'.
    // There is nothing we can do programmatically; the user must manually reset it.
    const browserPermissionDenied =
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "denied";
    if (browserPermissionDenied) {
      return;
    }

    const consentDeclinedDate = localStorage.getItem(
      "amiko-push-consent-declined-date",
    );

    // 거부한 경우, 7일 후에 다시 물어보기
    if (consentDeclinedDate) {
      const declinedDate = new Date(consentDeclinedDate);
      const daysSinceDeclined =
        (Date.now() - declinedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceDeclined < 7) {
        // 7일이 안 지났으면 표시 안 함
        return;
      }
    }

    // 로그인 후 2초 뒤에 표시 (사용자가 페이지를 볼 시간을 줌)
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [user]);

  const handleAccept = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // ⚠️ Chrome requires Notification.requestPermission() to be called DIRECTLY
      // from the user gesture handler, as the very first async operation.
      // Multiple async hops before this call cause Chrome to block the prompt silently.
      if (typeof window !== "undefined" && "Notification" in window) {
        // If already denied, we cannot show a dialog — guide the user to unblock manually.
        if (Notification.permission === "denied") {
          setIsBlocked(true);
          setIsLoading(false);
          return;
        }

        if (Notification.permission === "default") {
          const permission = await Notification.requestPermission();
          if (permission === "denied") {
            setIsBlocked(true);
            setIsLoading(false);
            return;
          }
          if (permission !== "granted") {
            localStorage.setItem("amiko-push-consent", "declined");
            localStorage.setItem(
              "amiko-push-consent-declined-date",
              new Date().toISOString(),
            );
            setIsOpen(false);
            setIsLoading(false);
            return;
          }
        }
      }

      // 푸시 알림 구독 시도 (permission already granted above, SW registration + subscription)
      const success = await initializePushNotifications(user.id);

      if (success) {
        // 동의 완료 표시
        localStorage.setItem("amiko-push-consent", "accepted");
        localStorage.setItem("amiko-push-subscribed", "true");
        localStorage.removeItem("amiko-push-consent-declined-date");
        setIsOpen(false);
      } else {
        // 구독 실패 - 브라우저 권한 상태와 관계없이 구독이 실패했으므로 declined 처리
        localStorage.setItem("amiko-push-consent", "declined");
        localStorage.setItem("amiko-push-subscribed", "false");
        localStorage.setItem(
          "amiko-push-consent-declined-date",
          new Date().toISOString(),
        );
        setIsOpen(false);
      }
    } catch (error) {
      console.error("푸시 알림 구독 실패:", error);

      // 에러 발생 - 구독이 실패했으므로 declined 처리
      localStorage.setItem("amiko-push-consent", "declined");
      localStorage.setItem("amiko-push-subscribed", "false");
      localStorage.setItem(
        "amiko-push-consent-declined-date",
        new Date().toISOString(),
      );
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    localStorage.setItem("amiko-push-consent", "declined");
    localStorage.setItem(
      "amiko-push-consent-declined-date",
      new Date().toISOString(),
    );
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const isSpanish = language === "es";

  // Show unblock instructions when Chrome has the permission hard-blocked
  if (isBlocked) {
    return (
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleDecline();
        }}
      >
        <DialogContent
          className="sm:max-w-md max-w-[90vw] p-0 max-h-[90vh] overflow-y-auto"
          showCloseButton={false}
        >
          <div className="relative bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 p-4 sm:p-6 pb-6 sm:pb-8">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-4 border-2 border-white/30">
                  <Bell className="w-8 h-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-xl font-bold text-white text-center mb-2">
                {isSpanish
                  ? "Notificaciones bloqueadas"
                  : "알림이 차단되어 있습니다"}
              </DialogTitle>
              <DialogDescription className="text-white/90 text-center text-sm">
                {isSpanish
                  ? "Chrome bloqueó los permisos. Debes activarlos manualmente."
                  : "Chrome이 알림을 차단했습니다. 직접 허용해 주세요."}
              </DialogDescription>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-2 list-none">
              {isSpanish ? (
                <>
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-500">1.</span> Haz
                    clic en el <span className="font-semibold">🔒 candado</span>{" "}
                    (o ℹ️) junto a la URL
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-500">2.</span> Busca{" "}
                    <span className="font-semibold">
                      &quot;Notificaciones&quot;
                    </span>{" "}
                    y cámbialo a{" "}
                    <span className="font-semibold text-green-600">
                      &quot;Permitir&quot;
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-500">3.</span>{" "}
                    Recarga la página y vuelve a intentarlo
                  </li>
                </>
              ) : (
                <>
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-500">1.</span> URL
                    옆의 <span className="font-semibold">🔒 자물쇠</span> (또는
                    ℹ️)를 클릭하세요
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-500">2.</span>{" "}
                    <span className="font-semibold">&quot;알림&quot;</span>을
                    찾아{" "}
                    <span className="font-semibold text-green-600">
                      &quot;허용&quot;
                    </span>
                    으로 변경하세요
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-500">3.</span>{" "}
                    페이지를 새로고침하고 다시 시도하세요
                  </li>
                </>
              )}
            </ol>
            <Button
              onClick={handleDecline}
              variant="outline"
              className="w-full border-gray-300 text-sm"
            >
              {isSpanish ? "Entendido" : "확인"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleDecline();
      }}
    >
      <DialogContent
        className="sm:max-w-md max-w-[90vw] p-0 max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        {/* 그라데이션 배경 헤더 */}
        <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-4 sm:p-6 pb-6 sm:pb-8">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            {/* 아이콘 */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-xl"></div>
                <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-4 border-2 border-white/30">
                  <Bell className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* 제목 */}
            <DialogTitle className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
              {isSpanish
                ? "¿Te gustaría recibir notificaciones?"
                : "알림을 받아보시겠어요?"}
            </DialogTitle>

            <DialogDescription className="text-white/90 text-center text-sm sm:text-base">
              {isSpanish
                ? "No te pierdas eventos importantes"
                : "중요한 소식을 놓치지 마세요"}
            </DialogDescription>

            {/* 작은 하트 이모지 */}
            <div className="flex justify-center mt-2">
              <span className="text-2xl animate-pulse">✨</span>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* 운영자 사진들 */}
          <div className="flex justify-center items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="relative group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-3 border-white shadow-lg overflow-hidden ring-2 ring-blue-200 group-hover:ring-blue-300 transition-all">
                {/* Pablo 사진 */}
                <img
                  src="/images/operators/Pablo.jpg"
                  alt="Pablo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // 이미지 로드 실패 시 그라데이션 배경 + 아이콘 표시
                    const target = e.currentTarget;
                    target.style.display = "none";
                    const fallback = document.createElement("div");
                    fallback.className =
                      "w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center";
                    fallback.innerHTML =
                      '<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                    target.parentElement?.appendChild(fallback);
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white shadow-md">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl text-gray-400 font-light">
              +
            </div>
            <div className="relative group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 border-3 border-white shadow-lg overflow-hidden ring-2 ring-pink-200 group-hover:ring-pink-300 transition-all">
                {/* Samuel 사진 */}
                <img
                  src="/images/operators/Samuel.jpg"
                  alt="Samuel"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // 이미지 로드 실패 시 그라데이션 배경 + 아이콘 표시
                    const target = e.currentTarget;
                    target.style.display = "none";
                    const fallback = document.createElement("div");
                    fallback.className =
                      "w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center";
                    fallback.innerHTML =
                      '<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                    target.parentElement?.appendChild(fallback);
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1 border-2 border-white shadow-md">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          {/* 설명 텍스트 */}
          <div className="space-y-2 sm:space-y-3 text-center">
            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
              {isSpanish ? (
                <>
                  Reuniones con los{" "}
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    operadores de Amiko
                  </span>
                  ,
                  <span className="font-semibold text-pink-600 dark:text-pink-400">
                    {" "}
                    eventos
                  </span>{" "}
                  y más
                  <br />
                  ¿Te gustaría recibir notificaciones importantes?
                </>
              ) : (
                <>
                  Amiko 운영자들과의{" "}
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    모임
                  </span>
                  ,
                  <span className="font-semibold text-pink-600 dark:text-pink-400">
                    {" "}
                    이벤트
                  </span>{" "}
                  등<br />
                  중요한 알림을 받아보시겠어요?
                </>
              )}
            </p>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 pt-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>
                {isSpanish
                  ? "Puedes cambiar esto en cualquier momento en configuración"
                  : "언제든지 설정에서 변경할 수 있습니다"}
              </span>
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button
              onClick={handleDecline}
              variant="outline"
              className="flex-1 border-gray-300 hover:bg-gray-50 text-sm sm:text-base py-2 sm:py-2.5"
              disabled={isLoading}
            >
              {isSpanish ? "Ahora no" : "나중에"}
            </Button>
            <Button
              onClick={handleAccept}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all text-sm sm:text-base py-2 sm:py-2.5"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs sm:text-sm">
                    {isSpanish ? "Configurando..." : "설정 중..."}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">
                    {isSpanish ? "Sí, recibir notificaciones" : "알림 받기"}
                  </span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
