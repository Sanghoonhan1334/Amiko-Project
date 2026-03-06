"use client";

import dynamic from "next/dynamic";

// 초기 렌더링에 불필요한 컴포넌트는 동적 로딩으로 JS 번들 축소
const ScrollToTop = dynamic(() => import("@/components/common/ScrollToTop"), {
  ssr: false,
});
const GlobalChatButton = dynamic(
  () => import("@/components/common/GlobalChatButton"),
  { ssr: false }
);
const FaviconBadge = dynamic(
  () => import("@/components/common/FaviconBadge"),
  { ssr: false }
);
const HistoryManager = dynamic(
  () => import("@/components/common/HistoryManager"),
  { ssr: false }
);
const DeepLinkHandler = dynamic(
  () => import("@/components/common/DeepLinkHandler"),
  { ssr: false }
);
const PushNotificationInitializer = dynamic(
  () =>
    import("@/components/notifications/PushNotificationInitializer").then(
      (mod) => ({ default: mod.PushNotificationInitializer })
    ),
  { ssr: false }
);

export default function LazyComponents() {
  return (
    <>
      <PushNotificationInitializer />
      <DeepLinkHandler />
      <HistoryManager />
      <ScrollToTop />
      <GlobalChatButton />
      <FaviconBadge />
    </>
  );
}
