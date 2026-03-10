"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ProfileSkeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Edit3,
  Save,
  X,
  Gift,
  Bell,
  Mail,
  Settings,
  Heart,
  Calendar,
  MessageSquare,
  User,
  MapPin,
  GraduationCap,
  Briefcase,
  Camera,
  Plus,
  Shield,
  CheckCircle,
  AlertCircle,
  Trophy,
  Users,
  Newspaper,
  Clock,
  TrendingUp,
  Copy,
  Check,
  Video,
  ChevronUp,
  ChevronDown,
  Fingerprint,
  Smartphone,
  Lock,
  ArrowRight,
  CreditCard,
  Ban,
  UserX,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import PointsRanking from "@/components/admin/PointsRanking";
import EventManagement from "@/components/admin/EventManagement";
import StorySettings from "./StorySettings";
import { KoreanUserProfile, LatinUserProfile } from "@/types/user";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { checkAuthAndRedirect, checkLevel2Auth } from "@/lib/auth-utils";
import {
  checkWebAuthnSupport,
  getBiometricAuthStatus,
  startBiometricRegistration,
  deleteBiometricCredential,
  checkPlatformAuthenticatorAvailable,
} from "@/lib/webauthnClient";
import { isAndroidDevice } from "@/lib/share-utils";
import ChargingTab from "../charging/ChargingTab";
import PointsCard from "./PointsCard";
import ChargingHeader from "./ChargingHeader";
import PaymentsTab from "../payments/PaymentsTab";
// 🚀 최적화: React Query hook 추가
import { useEventPoints } from "@/hooks/useEventPoints";
import UserBadge from "@/components/common/UserBadge";
import { getUserLevel } from "@/lib/user-level";
import AuthConfirmDialog from "@/components/common/AuthConfirmDialog";
import InquiryModal from "@/components/common/InquiryModal";
import ChatBanManagement from "@/components/admin/ChatBanManagement";

export default function MyTab() {
  const { t, language } = useLanguage();
  const { user, token } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  // 추천인 기능 비활성화: 코드/복사 상태 제거
  const referralCode: string | null = null;
  const [isPartnerRegistered, setIsPartnerRegistered] = useState(false);
  // const [dailyMissions, setDailyMissions] = useState<any>(null) // 출석체크 숨김 처리
  const [dailyEarnedPoints, setDailyEarnedPoints] = useState(0);
  const [isMissionsExpanded, setIsMissionsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  // Emails con acceso de administrador (verificación rápida local)
  const ADMIN_EMAILS = [
    "admin@amiko.com",
    "info@helloamiko.com",
    "eugenia.arevalo@gmail.com",
  ];
  // Verificación DB async (para admins no listados arriba)
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  // isAdmin es true si el email está en la lista O si la BD lo confirmó
  const isAdmin = (!!user?.email && ADMIN_EMAILS.includes(user.email)) || isAdminVerified;

  // 🚀 최적화: React Query로 포인트 및 랭킹 데이터 관리
  const {
    data: eventData,
    isLoading: pointsLoading,
    error: queryError,
    refetch,
  } = useEventPoints();

  // React Query에서 가져온 데이터 분리
  const rankingData = eventData?.rankingData || {
    ranking: [],
    userRank: null,
    totalUsers: 0,
  };

  // 인증 체크 - 아래 통합된 useEffect에서 처리 (중복 호출 제거)

  // URL 해시로 레벨 또는 포인트 섹션으로 스크롤
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkHashAndScroll = () => {
      const hash = window.location.hash;
      if (hash === "#my-level" || hash === "#my-points") {
        const targetId = hash.substring(1); // # 제거

        const scrollToTarget = () => {
          const element = document.getElementById(targetId);
          if (element) {
            // 요소 위치 계산
            const elementTop = element.offsetTop;
            const offset = 80; // 헤더 높이 고려

            // scrollIntoView와 window.scrollTo 모두 시도
            element.scrollIntoView({ behavior: "smooth", block: "start" });
            window.scrollTo({ top: elementTop - offset, behavior: "smooth" });
            return true;
          }
          return false;
        };

        // 모바일에서는 더 긴 딜레이 필요
        const isMobile = window.innerWidth < 768;
        const delays = isMobile
          ? [500, 1000, 1500, 2000]
          : [300, 600, 1000, 1500];

        delays.forEach((delay) => {
          setTimeout(() => {
            scrollToTarget();
          }, delay);
        });
      }
    };

    // 초기 체크 (마운트 시에만)
    // hashchange 이벤트는 헤더에서 직접 마이페이지 클릭 시 발생하지 않으므로 제거
    checkHashAndScroll();
  }, []);

  // 관리자 여부 API로 확인 (DB에 있지만 로컬 목록에 없는 경우 보완)
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.email || !token) return;
      try {
        const res = await fetch(
          `/api/admin/check?email=${encodeURIComponent(user.email)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setIsAdminVerified(!!data.isAdmin);
        }
      } catch {
        // 오류 시 로컬 이메일 목록 결과로 충분
      }
    };
    checkAdminStatus();
  }, [user?.email, token]);

  // 추천인 코드 조회 비활성화

  // 일일 미션 데이터 가져오기 - 출석체크 숨김 처리
  // useEffect(() => {
  //   if (user?.id) {
  //     fetchDailyMissions()
  //   }
  // }, [user?.id])

  // 포인트 업데이트 이벤트 리스너
  useEffect(() => {
    const handlePointsUpdate = () => {
      console.log("[MYTAB] pointsUpdated 이벤트 수신, 포인트 및 미션 리프레시");
      refetch(); // 랭킹 및 월간/총 포인트 리프레시
      // fetchDailyMissions() // 일일 미션 리프레시 - 출석체크 숨김 처리
    };

    window.addEventListener("pointsUpdated", handlePointsUpdate);
    return () => {
      window.removeEventListener("pointsUpdated", handlePointsUpdate);
    };
  }, [user?.id, refetch]);

  // const fetchDailyMissions = async () => {
  //   try {
  //     const today = new Date().toISOString().split('T')[0]
  //     const response = await fetch(`/api/points/daily-activity?userId=${user?.id}&date=${today}`)
  //     if (response.ok) {
  //       const data = await response.json()
  //       setDailyMissions(data.missions)
  //       setDailyEarnedPoints(data.earnedPoints)
  //     }
  //   } catch (error) {
  //     console.error('일일 미션 데이터 가져오기 실패:', error)
  //   }
  // }

  // 체크마크 생성 헬퍼 함수
  const renderCheckmarks = (count: number, max: number) => {
    const completedCount = Math.min(count, max);
    const checks = "✓".repeat(completedCount);
    const empties = "○".repeat(max - completedCount);
    const completedClass =
      completedCount === max ? "text-green-500" : "text-gray-400";

    return (
      <>
        <span className={completedClass}>{checks}</span>
        {empties && <span className="text-gray-300">{empties}</span>}
      </>
    );
  };

  const [editForm, setEditForm] = useState({
    full_name: "",
    korean_name: "",
    spanish_name: "",
    phone: "",
    one_line_intro: "",
    introduction: "",
    language: "ko",
    user_type: "student",
    university: "",
    major: "",
    grade: "",
    occupation: "",
    company: "",
    career: "",
    interests: [] as string[],
    profile_images: [] as string[],
    academic_info_public: false,
    job_info_public: false,
  });
  const [newInterest, setNewInterest] = useState("");

  // 추천인 코드 복사 함수
  const copyReferralCode = async () => {
    if (referralCode) {
      try {
        await navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("복사 실패:", error);
      }
    }
  };

  // 파트너 등록 여부 확인
  useEffect(() => {
    const checkPartnerStatus = async () => {
      if (user) {
        try {
          const response = await fetch(
            `/api/conversation-partners/check?userId=${user.id}`,
          );
          if (response.ok) {
            const data = await response.json();
            setIsPartnerRegistered(data.isRegistered);
          }
        } catch (error) {
          console.error("파트너 상태 확인 실패:", error);
        }
      }
    };
    checkPartnerStatus();
  }, [user]);

  // 파트너 등록은 인증 완료 시 자동으로 처리됨 (api/profile에서)

  const [showInterestSelector, setShowInterestSelector] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState<string[]>([]);
  const compactSwitchClass = "origin-right scale-75 sm:scale-100";

  const handleAccountDeletion = useCallback(async () => {
    if (!token) {
      setDeleteError(
        language === "ko"
          ? "다시 로그인 후 시도해주세요."
          : "Inicia sesión nuevamente e inténtalo otra vez.",
      );
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || result?.error) {
        setDeleteError(
          result?.error ||
            result?.message ||
            (language === "ko"
              ? "계정 삭제에 실패했습니다. 잠시 후 다시 시도해주세요."
              : "No se pudo eliminar la cuenta. Inténtalo de nuevo más tarde."),
        );
        setIsDeletingAccount(false);
        return;
      }

      // 삭제 성공 메시지 표시
      const hasWarnings = result?.warnings && result.warnings.length > 0;
      const failedOperations =
        result?.failedOperations || result?.warnings || [];

      let successMessage =
        result?.message ||
        (result?.success === false || hasWarnings
          ? language === "ko"
            ? "계정 삭제가 완료되었지만 일부 데이터 정리에 실패했습니다."
            : "La cuenta se eliminó, pero hubo problemas al limpiar algunos datos."
          : language === "ko"
            ? "계정이 삭제되었습니다."
            : "La cuenta se ha eliminado correctamente.");

      // 실패한 작업 목록이 있으면 상세 정보 추가
      if (failedOperations.length > 0) {
        console.warn("[ACCOUNT_DELETE] 실패한 작업 목록:", failedOperations);
        console.warn("[ACCOUNT_DELETE] 사용자 ID:", result?.userId);

        const failedDetails = failedOperations.join(", ");
        successMessage += `\n\n${language === "ko" ? "실패한 작업:" : "Operaciones fallidas:"} ${failedDetails}`;

        // 디버깅을 위해 콘솔에도 출력
        if (
          typeof window !== "undefined" &&
          window.location.hostname !== "localhost"
        ) {
          console.error("[ACCOUNT_DELETE] 실패한 작업 상세:", {
            userId: result?.userId,
            failedOperations: failedOperations,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // 다이얼로그 닫기 및 로딩 상태 해제 (성공/부분 실패 모두)
      setIsDeletingAccount(false);
      setShowDeleteDialog(false);

      // 성공 메시지 표시 (약간의 지연을 두어 다이얼로그가 먼저 닫히도록)
      setTimeout(() => {
        alert(successMessage);
      }, 100);

      if (typeof window !== "undefined") {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (storageError) {
          console.warn("[ACCOUNT_DELETE] 스토리지 정리 중 오류:", storageError);
        }
      }

      // 로그인 페이지로 리다이렉트
      router.push("/sign-in?accountDeleted=1");
      router.refresh();
    } catch (error) {
      console.error("[ACCOUNT_DELETE] 요청 실패:", error);
      setDeleteError(
        language === "ko"
          ? "계정 삭제 요청 중 오류가 발생했습니다."
          : "Ocurrió un error al procesar la eliminación de la cuenta.",
      );
      setIsDeletingAccount(false);
    }
  }, [language, router, token]);

  // 인증센터에서 가져온 관심사 목록
  const availableInterests = [
    "한국어",
    "한국문화",
    "음식",
    "여행",
    "영화",
    "음악",
    "스포츠",
    "패션",
    "게임",
    "기술",
    "경제",
    "언어교환",
    "K-POP",
    "드라마",
    "맛집",
    "독서",
    "댄스",
    "미술",
    "자연",
    "반려동물",
    "커피",
    "뷰티",
  ];
  const [profile, setProfile] = useState<any>(null);
  const [profileUser, setProfileUser] = useState<any>(null);

  // 한국인 여부 확인 (인증센터에서 확인된 정보)
  const isKorean = !!(profile?.is_korean || profileUser?.is_korean);

  // NOTE: showPartnerSection은 verificationStatus 선언 이후에 계산해야 하므로 아래에서 설정합니다.
  const [loading, setLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false); // 프로필 이미지 업로드 로딩
  const [authStatus, setAuthStatus] = useState({
    loading: true,
    smsVerified: false,
  });
  const [verificationStatus, setVerificationStatus] = useState<{
    isVerified: boolean;
    status: "none" | "email" | "sms" | "full";
    message: string;
    missingRequirements?: string[];
  }>({
    isVerified: false,
    status: "none",
    message: "인증이 필요합니다",
    missingRequirements: [],
  });
  const [notificationSettings, setNotificationSettings] = useState({
    pushEnabled: true, // 푸시 알림 마스터 스위치
    eventNotifications: true, // 이벤트 알림
    interactionNotifications: true, // 좋아요·댓글 알림
    newPostNotifications: true, // 새게시물 알림 (매일 오전 8:30)
  });

  // 보안 설정 상태
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricCredentials, setBiometricCredentials] = useState<any[]>([]);

  // 문의 모달 상태
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  // 파트너 섹션 노출 여부 계산 (국적 기준)
  const userCountry =
    (profile as any)?.country ||
    (profileUser as any)?.country ||
    user?.user_metadata?.country;
  const isKoreanByNationality =
    isKorean ||
    (profileUser as any)?.is_korean === true ||
    userCountry === "KR";
  const adminOverride = Boolean((profile as any)?.admin_partner_override);

  // 최종 표시 조건(국적 기준): (한국인) OR (관리자 오버라이드)
  const showPartnerSection = Boolean(isKoreanByNationality || adminOverride);

  // 디버그 로그/표시는 비활성화 (안정화 완료)

  // 프로필 사진 스와이프 관련 상태
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // 편집 폼 초기화
  const initializeEditForm = (profileData: any) => {
    setEditForm({
      full_name: profileData?.name || profileData?.full_name || "",
      korean_name: profileData?.korean_name || "",
      spanish_name: profileData?.spanish_name || "",
      phone: profileData?.phone || "",
      one_line_intro: profileData?.bio || profileData?.one_line_intro || "",
      introduction: profileData?.introduction || "",
      language: profileData?.native_language || profileData?.language || "ko",
      user_type: profileData?.userType || profileData?.user_type || "student",
      university: profileData?.university || "",
      major: profileData?.major || "",
      grade: profileData?.grade || "",
      occupation: profileData?.occupation || "",
      company: profileData?.company || "",
      career: profileData?.career || "",
      interests: profileData?.interests || [],
      profile_images:
        profileData?.profileImages?.map((img: any) => img.src) ||
        profileData?.profile_images ||
        [],
      academic_info_public: profileData?.academic_info_public ?? false,
      job_info_public: profileData?.job_info_public ?? false,
    });
  };

  // 공개 설정만 업데이트하는 함수
  const handleUpdatePrivacy = async (
    field: "academic_info_public" | "job_info_public",
    value: boolean,
  ) => {
    if (!user || !token) {
      alert(
        language === "ko"
          ? "로그인이 필요합니다."
          : "Se requiere inicio de sesión.",
      );
      return;
    }

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [field]: value,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        // editForm도 업데이트
        setEditForm((prev) => ({ ...prev, [field]: value }));
      } else {
        throw new Error("공개 설정 업데이트 실패");
      }
    } catch (error) {
      console.error("공개 설정 업데이트 오류:", error);
      alert(
        language === "ko"
          ? "공개 설정 업데이트에 실패했습니다. 다시 시도해주세요."
          : "Error al actualizar la configuración de privacidad. Inténtelo de nuevo.",
      );
    }
  };

  // 프로필 저장
  const handleSaveProfile = async () => {
    if (!user || !token) {
      alert(
        language === "ko"
          ? "로그인이 필요합니다."
          : "Se requiere inicio de sesión.",
      );
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setIsEditing(false);
        alert(
          language === "ko"
            ? "프로필이 성공적으로 저장되었습니다!"
            : "¡Perfil guardado exitosamente!",
        );
      } else {
        throw new Error("프로필 저장 실패");
      }
    } catch (error) {
      console.error("프로필 저장 오류:", error);
      alert(
        language === "ko"
          ? "프로필 저장에 실패했습니다. 다시 시도해주세요."
          : "Error al guardar el perfil. Inténtelo de nuevo.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 관심사 제거
  const handleRemoveInterest = (interestToRemove: string) => {
    setEditForm((prev) => ({
      ...prev,
      interests: prev.interests.filter(
        (interest) => interest !== interestToRemove,
      ),
    }));
  };

  // 관심사 선택 함수
  const handleInterestSelect = (interest: string) => {
    if (editForm.interests.includes(interest)) {
      // 이미 선택된 관심사면 제거
      setEditForm((prev) => ({
        ...prev,
        interests: prev.interests.filter((i) => i !== interest),
      }));
    } else if (editForm.interests.length < 5) {
      // 최대 5개까지만 선택 가능
      setEditForm((prev) => ({
        ...prev,
        interests: [...prev.interests, interest],
      }));
    }
  };

  // 닉네임 검증
  // 프로필 이미지 업로드 핸들러
  const handleProfileImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB를 초과할 수 없습니다.");
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/profile/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("프로필 이미지 업로드 성공:", result);

        // 프로필 상태 직접 업데이트
        if (result.avatar_url) {
          setProfile((prev) => ({
            ...prev,
            avatar_url: result.avatar_url,
          }));
        }

        // 프로필 다시 로드하여 업데이트된 이미지 반영
        await loadProfile();

        alert(t("profile.imageUpdatedSuccessfully"));
      } else {
        const error = await response.json();
        console.error("프로필 이미지 업로드 실패:", error);
        alert(
          `${t("profile.uploadFailed")}: ${error.error || t("profile.unknownError")}`,
        );
      }
    } catch (error) {
      console.error("프로필 이미지 업로드 오류:", error);
      alert(t("profile.uploadError"));
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 프로필 이미지 삭제 핸들러
  const handleDeleteProfileImage = async () => {
    try {
      const response = await fetch("/api/profile/delete-image", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        console.log("프로필 이미지 삭제 성공");
        await loadProfile(); // 프로필 다시 로드하여 업데이트된 상태 반영
        alert(
          language === "ko"
            ? "프로필 사진이 삭제되었습니다."
            : "Foto de perfil eliminada.",
        );
      } else {
        const error = await response.json();
        console.error("프로필 이미지 삭제 실패:", error);
        const errorMsg = language === "ko" ? error.error_ko : error.error_es;
        alert(
          language === "ko"
            ? `삭제 실패: ${errorMsg || "알 수 없는 오류"}`
            : `Error al eliminar: ${errorMsg || "Error desconocido"}`,
        );
      }
    } catch (error) {
      console.error("프로필 이미지 삭제 오류:", error);
      alert(
        language === "ko"
          ? "삭제 중 오류가 발생했습니다."
          : "Error durante la eliminación.",
      );
    }
  };

  // 인덱스별 프로필 이미지 삭제 핸들러
  const handleDeleteProfileImageByIndex = async (index: number) => {
    try {
      const response = await fetch("/api/profile/delete-image-by-index", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ index }),
      });

      if (response.ok) {
        console.log(`프로필 이미지 ${index + 1} 삭제 성공`);
        await loadProfile(); // 프로필 다시 로드하여 업데이트된 상태 반영
        alert(
          language === "ko"
            ? `프로필 사진 ${index + 1}이 삭제되었습니다.`
            : `Foto ${index + 1} eliminada.`,
        );
      } else {
        const error = await response.json();
        console.error("프로필 이미지 삭제 실패:", error);
        const errorMsg = language === "ko" ? error.error_ko : error.error_es;
        alert(
          language === "ko"
            ? `삭제 실패: ${errorMsg || "알 수 없는 오류"}`
            : `Error al eliminar: ${errorMsg || "Error desconocido"}`,
        );
      }
    } catch (error) {
      console.error("프로필 이미지 삭제 오류:", error);
      alert(
        language === "ko"
          ? "삭제 중 오류가 발생했습니다."
          : "Error durante la eliminación.",
      );
    }
  };

  // 프로필 데이터 로드 함수 (useCallback으로 안정화)
  const loadProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // API 호출 시도 (실패해도 빈 프로필 사용)
      if (token) {
        try {
          const response = await fetch("/api/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            setProfile(data.user || data.profile);
            setProfileUser(data.user); // user 객체도 따로 저장
            initializeEditForm(data.user || data.profile);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.log("API 호출 실패, 빈 프로필 사용");
        }
      }

      // API 실패 시 빈 프로필 설정
      setProfile(null);
      initializeEditForm(null);
    } catch (error) {
      console.error("프로필 로드 중 오류:", error);
      // 오류 시 빈 프로필 설정
      setProfile(null);
      initializeEditForm(null);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  // 프로필 데이터 로드
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // 인증 상태 확인 (Level 2 기준) - useCallback으로 안정화
  const checkVerificationStatus = useCallback(async () => {
    if (!user || !token) {
      setVerificationStatus({
        isVerified: false,
        status: "none",
        message: "로그인이 필요합니다",
      });
      return;
    }

    try {
      // /api/profile을 사용해서 사용자 정보 가져오기
      const response = await fetch(`/api/profile?userId=${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userProfile = data.user;

        // Level 2 인증 기준으로 확인
        const { canAccess, hasBadge, missingRequirements } =
          checkLevel2Auth(userProfile);

        setVerificationStatus({
          isVerified: canAccess || !!userProfile.verified_badge,
          status: canAccess ? "full" : "none",
          message: canAccess ? "인증 완료" : "인증이 필요합니다",
          missingRequirements: canAccess ? [] : missingRequirements,
        });
      } else {
        setVerificationStatus({
          isVerified: false,
          status: "none",
          message: "인증 정보를 확인할 수 없습니다",
        });
      }
    } catch (error) {
      console.error("인증 상태 확인 실패:", error);
      setVerificationStatus({
        isVerified: false,
        status: "none",
        message: "인증 상태를 확인할 수 없습니다",
      });
    }
  }, [user, token]);

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!user) {
        setAuthStatus({ loading: false, smsVerified: false });
        return;
      }

      // 실제 인증 상태 확인 (나중에 API 연동)
      setAuthStatus({ loading: false, smsVerified: true });
    };

    checkAuthStatus();
    checkVerificationStatus();
  }, [user, token, checkVerificationStatus]);

  // 인증 완료 플래그 확인 (인증센터에서 인증 완료 후 자동으로 상태 업데이트)
  // storage 이벤트 + visibility change로 감지 (2초 폴링 제거)
  useEffect(() => {
    const checkVerificationJustCompleted = async () => {
      const justCompleted = localStorage.getItem("verification_just_completed");
      if (justCompleted === "true" && user?.id) {
        console.log("[MYTAB] 인증 완료 플래그 감지, 인증 상태 다시 확인");
        localStorage.removeItem("verification_just_completed");

        // 데이터베이스 업데이트가 완료될 시간을 주기 위해 딜레이
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // 인증 상태 강제로 다시 확인 (캐시 무시)
        if (token) {
          try {
            const response = await fetch(
              `/api/profile?userId=${user.id}&_t=${Date.now()}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                  "Cache-Control": "no-cache",
                },
              },
            );

            if (response.ok) {
              const data = await response.json();
              const userProfile = data.user;
              const { canAccess, missingRequirements } =
                checkLevel2Auth(userProfile);

              setVerificationStatus({
                isVerified: canAccess || !!userProfile.verified_badge,
                status: canAccess ? "full" : "none",
                message: canAccess ? "인증 완료" : "인증이 필요합니다",
                missingRequirements: canAccess ? [] : missingRequirements,
              });
            }
          } catch (error) {
            console.error("[MYTAB] 인증 완료 후 상태 확인 실패:", error);
            checkVerificationStatus();
          }
        } else {
          checkVerificationStatus();
        }
      }
    };

    // 마운트 시 한 번 확인
    checkVerificationJustCompleted();

    // 다른 탭/페이지에서 localStorage 변경 시 감지
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "verification_just_completed" && e.newValue === "true") {
        checkVerificationJustCompleted();
      }
    };

    // 페이지 포커스 복귀 시 확인 (같은 탭 내 네비게이션 포함)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkVerificationJustCompleted();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.id, token, checkVerificationStatus]);

  // 알림 설정 로드
  useEffect(() => {
    const loadNotificationSettings = async () => {
      if (!user?.id || !token) return;

      try {
        const response = await fetch("/api/notifications/settings", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setNotificationSettings({
              pushEnabled: data.settings.push_enabled ?? true,
              eventNotifications:
                data.settings.event_notifications_enabled ?? true,
              interactionNotifications:
                data.settings.interaction_notifications_enabled ?? true,
              newPostNotifications:
                data.settings.new_post_notifications_enabled ?? true,
            });
          }
        }
      } catch (error) {
        console.error("알림 설정 로드 실패:", error);
      }
    };

    loadNotificationSettings();
  }, [user?.id, token]);

  // 알림 설정 변경 핸들러
  const handleNotificationChange = async (key: string, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: value,
    }));

    // 데이터베이스에 저장
    if (!user?.id || !token) return;

    try {
      const updateData: any = {};

      // 키 매핑
      if (key === "pushEnabled") updateData.push_enabled = value;
      else if (key === "eventNotifications")
        updateData.event_notifications_enabled = value;
      else if (key === "interactionNotifications")
        updateData.interaction_notifications_enabled = value;
      else if (key === "newPostNotifications")
        updateData.new_post_notifications_enabled = value;

      await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          ...updateData,
        }),
      });
    } catch (error) {
      console.error("알림 설정 저장 실패:", error);
      // 실패 시 롤백
      setNotificationSettings((prev) => ({
        ...prev,
        [key]: !value,
      }));
    }
  };

  // 지문 인증 상태 확인
  useEffect(() => {
    const checkBiometric = async () => {
      // WebAuthn 기본 지원 확인
      const support = checkWebAuthnSupport();
      const isAndroid = isAndroidDevice();
      const isMobile =
        typeof navigator !== "undefined" &&
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const hasPublicKeyCredential =
        typeof window !== "undefined" && !!window.PublicKeyCredential;
      // WebAuthn은 HTTPS 또는 localhost에서만 작동
      // 로컬 네트워크 IP는 HTTP이지만, Android에서는 실제로 작동할 수 있으므로 허용
      const isHTTPS =
        typeof window !== "undefined" &&
        (window.location.protocol === "https:" ||
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          // 로컬 네트워크 IP도 허용 (실제로는 제한적이지만 시도)
          window.location.hostname.match(
            /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./,
          ));

      console.log("[BIOMETRIC] 초기 확인:", {
        isSupported: support.isSupported,
        isAndroid,
        isMobile,
        hasPublicKeyCredential,
        isHTTPS,
        protocol:
          typeof window !== "undefined" ? window.location.protocol : "N/A",
        hostname:
          typeof window !== "undefined" ? window.location.hostname : "N/A",
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "N/A",
      });

      // Android 기기에서는 PublicKeyCredential만 있으면 지원하는 것으로 간주
      // (Android/Chrome에서는 isUserVerifyingPlatformAuthenticatorAvailable()이 false를 반환할 수 있음)
      // 또는 모바일 기기면 지문 인증이 가능할 가능성이 높음
      // HTTP 환경에서는 WebAuthn이 작동하지 않으므로 HTTPS 또는 localhost/로컬 IP 확인

      // Android 또는 모바일 기기이고 PublicKeyCredential이 있으면 지원하는 것으로 간주
      // Android Chrome에서는 실제로 지문 인증이 가능하므로, PublicKeyCredential만 있으면 OK
      if ((isAndroid || isMobile) && hasPublicKeyCredential && isHTTPS) {
        console.log(
          "[BIOMETRIC] 모바일 기기 + WebAuthn 지원 + HTTPS = 지문 인증 사용 가능",
        );
        setBiometricSupported(true);

        if (user?.id) {
          try {
            // 등록된 지문 확인
            const status = await getBiometricAuthStatus(user.id);
            console.log("[BIOMETRIC] 상태 확인 결과:", status);

            if (status.success && status.data) {
              const hasCredentials =
                status.data.hasCredentials &&
                status.data.credentials.length > 0;
              setBiometricEnabled(hasCredentials);
              setBiometricCredentials(status.data.credentials || []);
            } else {
              setBiometricEnabled(false);
              setBiometricCredentials([]);
            }
          } catch (error) {
            console.error("[BIOMETRIC] 상태 확인 실패:", error);
            setBiometricEnabled(false);
            setBiometricCredentials([]);
          }
        }
        return;
      }

      // HTTPS가 아닌 경우 (로컬 네트워크는 허용)
      // Android Chrome에서는 로컬 네트워크에서도 WebAuthn이 작동할 수 있으므로 시도
      if ((isAndroid || isMobile) && !isHTTPS) {
        console.warn("[BIOMETRIC] 모바일 기기지만 HTTPS가 아님");
        console.warn(
          "[BIOMETRIC] 현재 프로토콜:",
          typeof window !== "undefined" ? window.location.protocol : "N/A",
        );
        console.warn(
          "[BIOMETRIC] WebAuthn은 HTTPS에서만 완전히 작동하지만, Android에서는 시도해봅니다",
        );
        // Android에서는 HTTP에서도 시도 (실제로는 제한적이지만)
        if (isAndroid && hasPublicKeyCredential) {
          console.log("[BIOMETRIC] Android 기기 - HTTP 환경이지만 시도");
          setBiometricSupported(true);
          // 등록된 지문 확인은 생략 (HTTP에서는 API 호출이 제한적일 수 있음)
          setBiometricEnabled(false);
          setBiometricCredentials([]);
          return;
        }
        setBiometricSupported(false);
        setBiometricEnabled(false);
        setBiometricCredentials([]);
        return;
      }

      // Android 기기인데 PublicKeyCredential이 없는 경우 (드물지만 가능)
      if (isAndroid && !hasPublicKeyCredential) {
        console.warn("[BIOMETRIC] Android 기기지만 PublicKeyCredential 없음");
        setBiometricSupported(false);
        setBiometricEnabled(false);
        setBiometricCredentials([]);
        return;
      }

      if (!support.isSupported) {
        console.log("[BIOMETRIC] WebAuthn 기본 지원 안 됨");
        setBiometricSupported(false);
        setBiometricEnabled(false);
        setBiometricCredentials([]);
        return;
      }

      // iOS/Desktop: 플랫폼 인증기 사용 가능 여부 확인 (비동기)
      try {
        const platformAvailable = await checkPlatformAuthenticatorAvailable();
        console.log("[BIOMETRIC] 플랫폼 인증기 사용 가능:", platformAvailable);

        const isActuallySupported = platformAvailable || support.isSupported;

        console.log("[BIOMETRIC] 최종 지원 여부:", isActuallySupported, {
          platformAvailable,
          basicSupport: support.isSupported,
        });

        setBiometricSupported(isActuallySupported);

        if (isActuallySupported && user?.id) {
          try {
            // 등록된 지문 확인
            const status = await getBiometricAuthStatus(user.id);
            console.log("[BIOMETRIC] 상태 확인 결과:", status);

            if (status.success && status.data) {
              const hasCredentials =
                status.data.hasCredentials &&
                status.data.credentials.length > 0;
              setBiometricEnabled(hasCredentials);
              setBiometricCredentials(status.data.credentials || []);
            } else {
              // 에러가 있거나 데이터가 없으면 false로 설정
              setBiometricEnabled(false);
              setBiometricCredentials([]);
            }
          } catch (error) {
            console.error("[BIOMETRIC] 상태 확인 실패:", error);
            setBiometricEnabled(false);
            setBiometricCredentials([]);
          }
        } else {
          // 지원하지 않거나 사용자가 없으면 false
          setBiometricEnabled(false);
          setBiometricCredentials([]);
        }
      } catch (error) {
        console.error("[BIOMETRIC] 플랫폼 인증기 확인 실패:", error);
        // 에러가 나도 기본 WebAuthn 지원이 있으면 사용 가능으로 간주
        setBiometricSupported(support.isSupported);
        setBiometricEnabled(false);
        setBiometricCredentials([]);
      }
    };

    checkBiometric();
  }, [user?.id]);

  // 지문 등록 핸들러
  const handleEnableBiometric = async () => {
    if (!user?.id) {
      alert(
        language === "ko"
          ? "로그인이 필요합니다."
          : "Se requiere inicio de sesión.",
      );
      return;
    }

    try {
      const result = await startBiometricRegistration(
        user.id,
        user.email || "",
        user.user_metadata?.full_name || user.email || "",
      );

      if (result.success) {
        alert(
          language === "ko"
            ? "지문 인증이 등록되었습니다!"
            : "¡Autenticación de huella registrada!",
        );

        // 상태 재확인
        const status = await getBiometricAuthStatus(user.id);
        if (status.success && status.data) {
          setBiometricEnabled(
            status.data.hasCredentials && status.data.credentials.length > 0,
          );
          setBiometricCredentials(status.data.credentials || []);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("지문 등록 실패:", error);

      // 에러 타입에 따라 다른 메시지
      const errorMsg = error instanceof Error ? error.message : "";

      if (errorMsg.includes("abort") || errorMsg.includes("cancel")) {
        // 사용자가 취소한 경우
        console.log("사용자가 지문 등록을 취소함");
      } else {
        alert(
          language === "ko"
            ? "지문 등록에 실패했습니다. 기기가 지문 인증을 지원하는지 확인해주세요."
            : "Error al registrar huella. Verifique que su dispositivo soporte autenticación biométrica.",
        );
      }

      // 토글을 다시 꺼진 상태로
      setBiometricEnabled(false);
    }
  };

  // 지문 해제 핸들러
  const handleDisableBiometric = async () => {
    if (!user?.id || biometricCredentials.length === 0) {
      setBiometricEnabled(false);
      return;
    }

    const confirmMsg =
      language === "ko"
        ? "지문 인증을 해제하시겠습니까?"
        : "¿Desactivar autenticación de huella?";

    if (!confirm(confirmMsg)) {
      // 취소하면 토글을 다시 켜진 상태로
      setBiometricEnabled(true);
      return;
    }

    try {
      // 모든 등록된 인증기 삭제
      for (const cred of biometricCredentials) {
        await deleteBiometricCredential(user.id, cred.id);
      }

      alert(
        language === "ko"
          ? "지문 인증이 해제되었습니다."
          : "Autenticación de huella desactivada.",
      );
      setBiometricEnabled(false);
      setBiometricCredentials([]);
    } catch (error) {
      console.error("지문 해제 실패:", error);
      alert(
        language === "ko"
          ? "지문 해제에 실패했습니다."
          : "Error al desactivar huella.",
      );
      // 실패하면 토글을 다시 켜진 상태로
      setBiometricEnabled(true);
    }
  };

  // 프로필 사진 스와이프 핸들러들
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    const threshold = 50;

    // avatar_url과 profile_images를 모두 포함한 실제 전체 이미지 수
    const totalImages =
      (profile?.avatar_url ? 1 : 0) + (profile?.profile_images?.length || 0);

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // 왼쪽으로 스와이프 (다음 사진)
        setCurrentImageIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0));
      } else {
        // 오른쪽으로 스와이프 (이전 사진)
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
      }
    }

    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // 버튼이나 input 요소에서 발생한 이벤트는 무시
    const target = e.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.tagName === "INPUT" ||
      target.closest("button") ||
      target.closest("label")
    ) {
      return;
    }

    e.preventDefault();
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;

    // 버튼이나 input 요소에서 발생한 이벤트는 무시
    const target = e.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.tagName === "INPUT" ||
      target.closest("button") ||
      target.closest("label")
    ) {
      return;
    }

    const endX = e.clientX;
    const diff = startX - endX;
    const threshold = 50;

    // avatar_url과 profile_images를 모두 포함한 실제 전체 이미지 수
    const totalImages =
      (profile?.avatar_url ? 1 : 0) + (profile?.profile_images?.length || 0);

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        const newIndex =
          currentImageIndex < totalImages - 1 ? currentImageIndex + 1 : 0;
        setCurrentImageIndex(newIndex);
      } else {
        const newIndex =
          currentImageIndex > 0 ? currentImageIndex - 1 : totalImages - 1;
        setCurrentImageIndex(newIndex);
      }
    }

    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // 관리자 여부 확인: ADMIN_EMAILS 체크(즉시) + API 검증(비동기) — 상단 참고

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-600 dark:border-gray-400 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t("myTab.loading")}</p>
        </div>
      </div>
    );
  }

  // 프로필이 없을 때의 상태
  if (!profile) {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full">
          {/* 빈 프로필 상태 */}
          <div className="relative h-80 bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <User className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                {t("profile.setupProfile")}
              </h2>
              <p className="text-sm">{t("profile.editToComplete")}</p>
            </div>
          </div>

          {/* 편집 버튼 (모바일) */}
          <div className="px-4 py-2 bg-white md:hidden">
            <div className="flex items-center justify-between">
              <h1 className="text-base sm:text-lg font-semibold text-gray-800">
                {t("profile.myProfile")}
              </h1>
              <button
                onClick={() => setIsEditing(true)}
                className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-sm text-white"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 기본 정보 섹션 (편집 모드) */}
          <div className="px-4 py-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-blue-500" />
              <h2 className="font-semibold text-gray-800">
                {t("profile.academicCareerInfo")}
              </h2>
            </div>
            <p className="text-gray-600 text-sm">{t("profile.setupProfile")}</p>
          </div>
        </div>
      </div>
    );
  }

  // 운영자도 일반 사용자처럼 프로필 표시 (관리 기능은 👑 Admin 메뉴에서)

  // 틴더 스타일 메인 레이아웃
  return (
    <>
      <div className="min-h-screen bg-white">
        {/* 틴더 스타일 풀스크린 컨테이너 */}
        <div className="w-full">
          {/* 프로필 헤더 섹션 - 1:1 비율 정사각형 - 인증 완료 후에만 표시 */}
          {verificationStatus.isVerified && (
            <div className="relative flex justify-center">
              {/* 프로필 사진 스와이프 영역 - 최대 400px, 1:1 비율 */}
              <div
                className="relative w-full max-w-sm aspect-square bg-gray-100 overflow-hidden cursor-grab active:cursor-grabbing select-none"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              >
                {/* 프로필 사진들 */}
                {(() => {
                  const allImages = [];
                  if (profile?.avatar_url) {
                    allImages.push({
                      src: profile.avatar_url,
                      type: "avatar",
                      index: 0,
                    });
                  }
                  if (profile?.profile_images?.length > 0) {
                    profile.profile_images.forEach((src, index) => {
                      allImages.push({ src, type: "profile_image", index });
                    });
                  }

                  // 이미지가 없으면 카메라 UI 표시
                  if (allImages.length === 0) {
                    return (
                      <div className="w-full h-full flex-shrink-0 relative bg-gray-200 flex items-center justify-center">
                        <label className="text-center text-gray-500 cursor-pointer hover:text-gray-700 transition-colors">
                          <Camera className="w-16 h-16 mx-auto mb-2" />
                          <p className="text-sm">
                            {language === "es"
                              ? "Por favor agrega una foto de perfil"
                              : "프로필 사진을 추가해주세요"}
                          </p>
                          <p className="text-xs mt-1 text-gray-400">
                            {language === "es"
                              ? "Haz clic para subir"
                              : "클릭하여 업로드"}
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfileImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    );
                  }

                  // 이미지가 있으면 이미지들 표시
                  return (
                    <div
                      className="flex h-full transition-transform duration-300 ease-in-out"
                      style={{
                        transform: `translateX(-${currentImageIndex * 100}%)`,
                        userSelect: "none",
                        WebkitUserSelect: "none",
                      }}
                    >
                      {allImages.map((imageData, globalIndex) => (
                        <div
                          key={`${imageData.type}-${imageData.index}`}
                          className="w-full h-full flex-shrink-0 relative group"
                        >
                          <img
                            src={imageData.src}
                            alt={`프로필 ${globalIndex + 1}`}
                            className="w-full h-full object-cover pointer-events-none"
                            draggable={false}
                          />
                          {/* 사진 인디케이터 */}
                          <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                            {globalIndex + 1}/
                            {(() => {
                              const allImages = [];
                              if (profile?.avatar_url)
                                allImages.push(profile.avatar_url);
                              if (profile?.profile_images?.length > 0)
                                allImages.push(...profile.profile_images);
                              return allImages.length;
                            })()}
                          </div>
                          {/* 데스크톱용 호버 버튼들 - 모바일에서는 숨김 */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center hidden md:flex">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                              {/* 사진 변경 버튼 (첫 번째 사진에만) */}
                              {globalIndex === 0 && (
                                <label className="bg-white bg-opacity-90 rounded-full p-2 cursor-pointer hover:bg-opacity-100 transition-all">
                                  <Camera className="w-5 h-5 text-gray-700" />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfileImageUpload}
                                    className="hidden"
                                  />
                                </label>
                              )}
                              {/* 사진 삭제 버튼 */}
                              <button
                                onClick={() => {
                                  const confirmMsg =
                                    language === "ko"
                                      ? `프로필 사진 ${globalIndex + 1}을 삭제하시겠습니까?`
                                      : `¿Eliminar foto de perfil ${globalIndex + 1}?`;
                                  if (confirm(confirmMsg)) {
                                    if (imageData.type === "avatar") {
                                      handleDeleteProfileImage();
                                    } else {
                                      handleDeleteProfileImageByIndex(
                                        imageData.index,
                                      );
                                    }
                                  }
                                }}
                                className="bg-red-500 bg-opacity-90 rounded-full p-2 cursor-pointer hover:bg-opacity-100 transition-all"
                                title={
                                  language === "ko"
                                    ? `프로필 사진 ${globalIndex + 1} 삭제`
                                    : `Eliminar foto ${globalIndex + 1}`
                                }
                              >
                                <X className="w-5 h-5 text-white" />
                              </button>
                            </div>
                          </div>

                          {/* 모바일용 항상 보이는 작은 버튼들 */}
                          <div className="absolute top-2 left-2 flex gap-1 md:hidden">
                            {/* 사진 변경 버튼 (첫 번째 사진에만) */}
                            {globalIndex === 0 && (
                              <label className="bg-black bg-opacity-50 rounded-full p-1.5 cursor-pointer touch-manipulation">
                                <Camera className="w-3 h-3 text-white" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleProfileImageUpload}
                                  className="hidden"
                                />
                              </label>
                            )}
                            {/* 사진 삭제 버튼 */}
                            <button
                              onClick={() => {
                                const confirmMsg =
                                  language === "ko"
                                    ? `프로필 사진 ${globalIndex + 1}을 삭제하시겠습니까?`
                                    : `¿Eliminar foto de perfil ${globalIndex + 1}?`;
                                if (confirm(confirmMsg)) {
                                  if (imageData.type === "avatar") {
                                    handleDeleteProfileImage();
                                  } else {
                                    handleDeleteProfileImageByIndex(
                                      imageData.index,
                                    );
                                  }
                                }
                              }}
                              className="bg-red-500 bg-opacity-80 rounded-full p-1.5 cursor-pointer touch-manipulation"
                              title={
                                language === "ko"
                                  ? `프로필 사진 ${globalIndex + 1} 삭제`
                                  : `Eliminar foto ${globalIndex + 1}`
                              }
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* 하단 인디케이터 점들 */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {(() => {
                  const totalImages =
                    (profile?.avatar_url ? 1 : 0) +
                    (profile?.profile_images?.length || 0);
                  return totalImages > 1
                    ? Array.from({ length: totalImages }, (_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentImageIndex
                              ? "bg-white"
                              : "bg-white/50"
                          }`}
                        />
                      ))
                    : null;
                })()}
              </div>

              {/* 스와이프 힌트 (프로필 사진이 여러 장 있을 때만 표시) */}
              {(() => {
                const totalImages =
                  (profile?.avatar_url ? 1 : 0) +
                  (profile?.profile_images?.length || 0);
                return totalImages > 1 && currentImageIndex === 0 ? (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs animate-pulse">
                    {language === "ko"
                      ? "← 스와이프해서 더 보기 →"
                      : "← Desliza para ver más →"}
                  </div>
                ) : null;
              })()}

              {/* 이미지 업로드 로딩 오버레이 */}
              {isUploadingImage && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white font-semibold text-lg">
                      {language === "es"
                        ? "Subiendo foto..."
                        : "사진 업로드 중..."}
                    </p>
                    <p className="text-white/80 text-sm mt-2">
                      {language === "es"
                        ? "Por favor espera"
                        : "잠시만 기다려주세요"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 프로필 정보 오버레이 제거 - 깔끔한 사진만 표시 */}

          {/* 편집 버튼 (모바일) - 인증 완료 후에만 표시 */}
          {verificationStatus.isVerified && (
            <div className="px-4 py-2 bg-white md:hidden">
              <div className="flex items-center justify-between">
                <h1 className="text-base sm:text-lg font-semibold text-gray-800">
                  {t("profile.myProfile")}
                </h1>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shadow-sm border border-gray-200"
                        title={language === "ko" ? "취소" : "Cancelar"}
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-sm text-white"
                        title={language === "ko" ? "저장" : "Guardar"}
                      >
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shadow-sm border border-gray-200"
                    >
                      <Edit3 className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 인증 필요 배너 - 인증 미완료 시 표시 */}
          {!verificationStatus.isVerified && (
            <div className="mx-4 mt-4 mb-4">
              <button
                onClick={() => router.push("/verification-center")}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-lg p-4 shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-full p-2">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-base">
                        {language === "ko"
                          ? "인증이 필요합니다"
                          : "Se requiere autenticación"}
                      </p>
                      <p className="text-sm text-white/90 mt-0.5">
                        {language === "ko"
                          ? "인증센터에서 프로필을 완성해주세요"
                          : "Completa tu perfil en el centro de autenticación"}
                      </p>
                      {verificationStatus.missingRequirements &&
                        verificationStatus.missingRequirements.length > 0 && (
                          <p className="text-xs text-white/80 mt-1">
                            {language === "ko"
                              ? `누락된 항목: ${verificationStatus.missingRequirements.join(", ")}`
                              : `Faltan: ${verificationStatus.missingRequirements.join(", ")}`}
                          </p>
                        )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-white/90">
                    <span className="text-sm font-medium">
                      {language === "ko" ? "이동" : "Ir"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* 관심사 섹션 - 인증 완료 후에만 표시 */}
          {verificationStatus.isVerified && (
            <div className="px-4 py-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-pink-500" />
                  <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                    {t("profile.interests")}
                  </h2>
                </div>

                {/* 프로필 편집 버튼 (인증 완료시만) - 데스크톱에서만 표시 */}
                {verificationStatus.isVerified && (
                  <div className="hidden md:flex items-center gap-2">
                    {isEditing ? (
                      <>
                        {/* 취소 버튼 */}
                        <Button
                          onClick={() => setIsEditing(false)}
                          size="sm"
                          variant="outline"
                          className="text-xs px-3 py-1 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                        >
                          <X className="w-3 h-3 mr-1" />
                          {language === "ko" ? "취소" : "Cancelar"}
                        </Button>
                        {/* 저장 버튼 */}
                        <Button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          size="sm"
                          className="text-xs px-3 py-1 h-7 bg-gray-600 hover:bg-gray-700 text-white"
                        >
                          {isSaving ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                          ) : (
                            <Save className="w-3 h-3 mr-1" />
                          )}
                          {language === "ko" ? "저장" : "Guardar"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => setIsEditing(true)}
                        size="sm"
                        className="text-xs px-3 py-1 h-7 bg-gray-600 hover:bg-gray-700 text-white"
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        {t("profile.editProfile")}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  {/* 기존 관심사 표시 */}
                  <div className="flex flex-wrap gap-2">
                    {editForm.interests.map(
                      (interest: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 sm:px-3 bg-white text-gray-700 rounded-full text-xs sm:text-sm border border-gray-200 flex items-center gap-1 max-w-full truncate"
                        >
                          {(() => {
                            // 임시 하드코딩 번역 (디버깅용)
                            const hardcodedTranslations: Record<
                              string,
                              Record<string, string>
                            > = {
                              ko: {
                                "profile.interests.여행": "여행",
                                "profile.interests.한국문화": "한국문화",
                                "profile.interests.음악": "음악",
                                "profile.interests.영화": "영화",
                                "profile.interests.스포츠": "스포츠",
                                "profile.interests.패션": "패션",
                                "profile.interests.게임": "게임",
                                "profile.interests.기술": "기술",
                                "profile.interests.경제": "경제",
                                "profile.interests.언어교환": "언어교환",
                                "profile.interests.K-POP": "K-POP",
                                "profile.interests.드라마": "드라마",
                                "profile.interests.맛집": "맛집",
                                "profile.interests.독서": "독서",
                                "profile.interests.댄스": "댄스",
                                "profile.interests.미술": "미술",
                                "profile.interests.자연": "자연",
                                "profile.interests.반려동물": "반려동물",
                                "profile.interests.커피": "커피",
                                "profile.interests.뷰티": "뷰티",
                                "profile.interests.음식": "음식",
                                "profile.interests.한국어": "한국어",
                                여행: "여행",
                                한국문화: "한국문화",
                                음악: "음악",
                                영화: "영화",
                                스포츠: "스포츠",
                                패션: "패션",
                                게임: "게임",
                                기술: "기술",
                                경제: "경제",
                                언어교환: "언어교환",
                                "K-POP": "K-POP",
                                드라마: "드라마",
                                맛집: "맛집",
                                독서: "독서",
                                댄스: "댄스",
                                미술: "미술",
                                자연: "자연",
                                반려동물: "반려동물",
                                커피: "커피",
                                뷰티: "뷰티",
                                음식: "음식",
                                한국어: "한국어",
                              },
                              es: {
                                "profile.interests.여행": "Viajes",
                                "profile.interests.한국문화": "Cultura Coreana",
                                "profile.interests.음악": "Música",
                                "profile.interests.영화": "Películas",
                                "profile.interests.스포츠": "Deportes",
                                "profile.interests.패션": "Moda",
                                "profile.interests.게임": "Juegos",
                                "profile.interests.기술": "Tecnología",
                                "profile.interests.경제": "Economía",
                                "profile.interests.언어교환":
                                  "Intercambio de Idiomas",
                                "profile.interests.K-POP": "K-POP",
                                "profile.interests.드라마": "Dramas",
                                "profile.interests.맛집": "Restaurantes",
                                "profile.interests.독서": "Lectura",
                                "profile.interests.댄스": "Baile",
                                "profile.interests.미술": "Arte",
                                "profile.interests.자연": "Naturaleza",
                                "profile.interests.반려동물": "Mascotas",
                                "profile.interests.커피": "Café",
                                "profile.interests.뷰티": "Belleza",
                                "profile.interests.음식": "Comida",
                                "profile.interests.한국어": "Coreano",
                                여행: "Viajes",
                                한국문화: "Cultura Coreana",
                                음악: "Música",
                                영화: "Películas",
                                스포츠: "Deportes",
                                패션: "Moda",
                                게임: "Juegos",
                                기술: "Tecnología",
                                경제: "Economía",
                                언어교환: "Intercambio de Idiomas",
                                "K-POP": "K-POP",
                                드라마: "Dramas",
                                맛집: "Restaurantes",
                                독서: "Lectura",
                                댄스: "Baile",
                                미술: "Arte",
                                자연: "Naturaleza",
                                반려동물: "Mascotas",
                                커피: "Café",
                                뷰티: "Belleza",
                                음식: "Comida",
                                한국어: "Coreano",
                              },
                            };

                            const currentLang = language || "ko";
                            const hardcoded =
                              hardcodedTranslations[currentLang]?.[interest];
                            if (hardcoded) {
                              return hardcoded;
                            }

                            // interest가 이미 번역 키 형태인 경우 처리 (profile.interests. 제거)
                            if (interest.startsWith("profile.interests.")) {
                              const cleanInterest = interest.replace(
                                "profile.interests.",
                                "",
                              );
                              // 현지인(스페인어)이면 그냥 스페인어로 표시
                              if (currentLang === "es") {
                                return cleanInterest;
                              }
                              // 한국어 사용자면 번역 시도
                              const translated = t(
                                `profile.interests.${cleanInterest}`,
                              );
                              return translated || cleanInterest;
                            }

                            // 일반적인 경우: 그대로 번역 시도
                            const translated = t(
                              `profile.interests.${interest}`,
                            );
                            // 번역이 실패하면 (키 그대로 반환되면) 원본 반환
                            if (
                              translated &&
                              !translated.startsWith("profile.interests.")
                            ) {
                              return translated;
                            }
                            return interest;
                          })()}
                          <button
                            onClick={() => handleRemoveInterest(interest)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ),
                    )}
                  </div>

                  {/* 관심사 선택 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {language === "ko"
                          ? `관심사 선택 (${editForm.interests.length}/5)`
                          : `Seleccionar intereses (${editForm.interests.length}/5)`}
                      </span>
                      <Button
                        onClick={() =>
                          setShowInterestSelector(!showInterestSelector)
                        }
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        {showInterestSelector
                          ? language === "ko"
                            ? "숨기기"
                            : "Ocultar"
                          : language === "ko"
                            ? "관심사 선택"
                            : "Seleccionar"}
                      </Button>
                    </div>

                    {/* 관심사 선택 그리드 */}
                    {showInterestSelector && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {availableInterests.map((interest) => (
                          <Button
                            key={interest}
                            variant={
                              editForm.interests.includes(interest)
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => handleInterestSelect(interest)}
                            disabled={
                              !editForm.interests.includes(interest) &&
                              editForm.interests.length >= 5
                            }
                            className={`text-xs transition-all duration-200 ${
                              editForm.interests.includes(interest)
                                ? "bg-blue-200 text-blue-800 border-blue-300 shadow-sm"
                                : "hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm"
                            }`}
                          >
                            {(() => {
                              // 하드코딩된 번역 적용
                              const hardcodedTranslations: Record<
                                string,
                                Record<string, string>
                              > = {
                                ko: {
                                  한국어: "한국어",
                                  한국문화: "한국문화",
                                  음식: "음식",
                                  여행: "여행",
                                  영화: "영화",
                                  음악: "음악",
                                  스포츠: "스포츠",
                                  패션: "패션",
                                  게임: "게임",
                                  기술: "기술",
                                  경제: "경제",
                                  언어교환: "언어교환",
                                  "K-POP": "K-POP",
                                  드라마: "드라마",
                                  맛집: "맛집",
                                  독서: "독서",
                                  댄스: "댄스",
                                  미술: "미술",
                                  자연: "자연",
                                  반려동물: "반려동물",
                                  커피: "커피",
                                  뷰티: "뷰티",
                                },
                                es: {
                                  한국어: "Coreano",
                                  한국문화: "Cultura Coreana",
                                  음식: "Comida",
                                  여행: "Viajes",
                                  영화: "Películas",
                                  음악: "Música",
                                  스포츠: "Deportes",
                                  패션: "Moda",
                                  게임: "Juegos",
                                  기술: "Tecnología",
                                  경제: "Economía",
                                  언어교환: "Intercambio de Idiomas",
                                  "K-POP": "K-POP",
                                  드라마: "Dramas",
                                  맛집: "Restaurantes",
                                  독서: "Lectura",
                                  댄스: "Baile",
                                  미술: "Arte",
                                  자연: "Naturaleza",
                                  반려동물: "Mascotas",
                                  커피: "Café",
                                  뷰티: "Belleza",
                                },
                              };

                              const currentLang = language || "ko";
                              return (
                                hardcodedTranslations[currentLang]?.[
                                  interest
                                ] || interest
                              );
                            })()}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.interests?.length > 0 ? (
                    profile.interests.map((interest: string, index: number) => {
                      console.log(
                        "Interest:",
                        interest,
                        "Translation:",
                        t(`profile.interests.${interest}`),
                      );
                      return (
                        <span
                          key={index}
                          className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm border border-gray-200 max-w-full truncate"
                        >
                          {(() => {
                            // 임시 하드코딩 번역 (디버깅용)
                            const hardcodedTranslations: Record<
                              string,
                              Record<string, string>
                            > = {
                              ko: {
                                "profile.interests.여행": "여행",
                                "profile.interests.한국문화": "한국문화",
                                "profile.interests.음악": "음악",
                                "profile.interests.영화": "영화",
                                "profile.interests.스포츠": "스포츠",
                                "profile.interests.패션": "패션",
                                "profile.interests.게임": "게임",
                                "profile.interests.기술": "기술",
                                "profile.interests.경제": "경제",
                                "profile.interests.언어교환": "언어교환",
                                "profile.interests.K-POP": "K-POP",
                                "profile.interests.드라마": "드라마",
                                "profile.interests.맛집": "맛집",
                                "profile.interests.독서": "독서",
                                "profile.interests.댄스": "댄스",
                                "profile.interests.미술": "미술",
                                "profile.interests.자연": "자연",
                                "profile.interests.반려동물": "반려동물",
                                "profile.interests.커피": "커피",
                                "profile.interests.뷰티": "뷰티",
                                "profile.interests.음식": "음식",
                                "profile.interests.한국어": "한국어",
                                여행: "여행",
                                한국문화: "한국문화",
                                음악: "음악",
                                영화: "영화",
                                스포츠: "스포츠",
                                패션: "패션",
                                게임: "게임",
                                기술: "기술",
                                경제: "경제",
                                언어교환: "언어교환",
                                "K-POP": "K-POP",
                                드라마: "드라마",
                                맛집: "맛집",
                                독서: "독서",
                                댄스: "댄스",
                                미술: "미술",
                                자연: "자연",
                                반려동물: "반려동물",
                                커피: "커피",
                                뷰티: "뷰티",
                                음식: "음식",
                                한국어: "한국어",
                              },
                              es: {
                                "profile.interests.여행": "Viajes",
                                "profile.interests.한국문화": "Cultura Coreana",
                                "profile.interests.음악": "Música",
                                "profile.interests.영화": "Películas",
                                "profile.interests.스포츠": "Deportes",
                                "profile.interests.패션": "Moda",
                                "profile.interests.게임": "Juegos",
                                "profile.interests.기술": "Tecnología",
                                "profile.interests.경제": "Economía",
                                "profile.interests.언어교환":
                                  "Intercambio de Idiomas",
                                "profile.interests.K-POP": "K-POP",
                                "profile.interests.드라마": "Dramas",
                                "profile.interests.맛집": "Restaurantes",
                                "profile.interests.독서": "Lectura",
                                "profile.interests.댄스": "Baile",
                                "profile.interests.미술": "Arte",
                                "profile.interests.자연": "Naturaleza",
                                "profile.interests.반려동물": "Mascotas",
                                "profile.interests.커피": "Café",
                                "profile.interests.뷰티": "Belleza",
                                "profile.interests.음식": "Comida",
                                "profile.interests.한국어": "Coreano",
                                여행: "Viajes",
                                한국문화: "Cultura Coreana",
                                음악: "Música",
                                영화: "Películas",
                                스포츠: "Deportes",
                                패션: "Moda",
                                게임: "Juegos",
                                기술: "Tecnología",
                                경제: "Economía",
                                언어교환: "Intercambio de Idiomas",
                                "K-POP": "K-POP",
                                드라마: "Dramas",
                                맛집: "Restaurantes",
                                독서: "Lectura",
                                댄스: "Baile",
                                미술: "Arte",
                                자연: "Naturaleza",
                                반려동물: "Mascotas",
                                커피: "Café",
                                뷰티: "Belleza",
                                음식: "Comida",
                                한국어: "Coreano",
                              },
                            };

                            const currentLang = language || "ko";
                            const hardcoded =
                              hardcodedTranslations[currentLang]?.[interest];
                            if (hardcoded) {
                              console.log(
                                "Hardcoded translation found:",
                                interest,
                                "->",
                                hardcoded,
                              );
                              return hardcoded;
                            }

                            // interest가 이미 번역 키 형태인 경우 처리 (profile.interests. 제거)
                            if (interest.startsWith("profile.interests.")) {
                              const cleanInterest = interest.replace(
                                "profile.interests.",
                                "",
                              );
                              // 현지인(스페인어)이면 그냥 스페인어로 표시
                              if (currentLang === "es") {
                                return cleanInterest;
                              }
                              // 한국어 사용자면 번역 시도
                              const translated = t(
                                `profile.interests.${cleanInterest}`,
                              );
                              return translated || cleanInterest;
                            }

                            // 일반적인 경우: 그대로 번역 시도
                            const translated = t(
                              `profile.interests.${interest}`,
                            );
                            // 번역이 실패하면 (키 그대로 반환되면) 원본 반환
                            if (
                              translated &&
                              !translated.startsWith("profile.interests.")
                            ) {
                              return translated;
                            }
                            return interest;
                          })()}
                        </span>
                      );
                    })
                  ) : (
                    <span className="px-3 py-1 bg-white text-gray-500 rounded-full text-sm border border-gray-200">
                      {t("profile.noInterestsSet")}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 기본 정보 섹션 (학업/직업 정보) - 인증 완료 후에만 표시 */}
          {verificationStatus.isVerified && (
            <div className="px-4 py-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                  {t("profile.academicCareerInfo")}
                </h2>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  {/* 기본 정보 입력 필드들 */}
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-gray-600 text-xs sm:text-sm block mb-1">
                        {t("profile.koreanName")}
                      </label>
                      <Input
                        value={editForm.korean_name}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            korean_name: e.target.value,
                          }))
                        }
                        placeholder={
                          language === "ko"
                            ? "한국이름을 입력하세요"
                            : "Ingrese su nombre coreano"
                        }
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-gray-600 text-xs sm:text-sm block mb-1">
                        {t("profile.spanishName")}
                      </label>
                      <Input
                        value={editForm.spanish_name}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            spanish_name: e.target.value,
                          }))
                        }
                        placeholder={t("profile.spanishName") + "을 입력하세요"}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-gray-600 text-sm block mb-1">
                        {language === "ko" ? "사용자 타입" : "Tipo de usuario"}
                      </label>
                      <Select
                        value={editForm.user_type}
                        onValueChange={(value) =>
                          setEditForm((prev) => ({ ...prev, user_type: value }))
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">
                            {language === "ko" ? "학생" : "Estudiante"}
                          </SelectItem>
                          <SelectItem value="worker">
                            {language === "ko" ? "직장인" : "Trabajador"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 사용자 타입에 따른 입력 필드 */}
                    {editForm.user_type === "student" ? (
                      <>
                        <div>
                          <label className="text-gray-600 text-xs sm:text-sm block mb-1">
                            {t("profile.university")}
                          </label>
                          <Input
                            value={editForm.university}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                university: e.target.value,
                              }))
                            }
                            placeholder={
                              language === "ko"
                                ? "대학교를 입력하세요"
                                : "Ingrese su universidad"
                            }
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-gray-600 text-xs sm:text-sm block mb-1">
                            {t("profile.major")}
                          </label>
                          <Input
                            value={editForm.major}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                major: e.target.value,
                              }))
                            }
                            placeholder={
                              language === "ko"
                                ? "전공을 입력하세요"
                                : "Ingrese su carrera"
                            }
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-gray-600 text-xs sm:text-sm block mb-1">
                            {t("profile.grade")}
                          </label>
                          <Input
                            value={editForm.grade}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                grade: e.target.value,
                              }))
                            }
                            placeholder={
                              language === "ko"
                                ? "학년을 입력하세요"
                                : "Ingrese su año de estudio"
                            }
                            className="text-sm"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="text-gray-600 text-xs sm:text-sm block mb-1">
                            {t("profile.occupation")}
                          </label>
                          <Input
                            value={editForm.occupation}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                occupation: e.target.value,
                              }))
                            }
                            placeholder={
                              t("profile.occupation") + "을 입력하세요"
                            }
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-gray-600 text-xs sm:text-sm block mb-1">
                            {t("profile.company")}
                          </label>
                          <Input
                            value={editForm.company}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                company: e.target.value,
                              }))
                            }
                            placeholder={t("profile.company") + "을 입력하세요"}
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-gray-600 text-xs sm:text-sm block mb-1">
                            {t("profile.experience")}
                          </label>
                          <Input
                            value={editForm.career}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                career: e.target.value,
                              }))
                            }
                            placeholder={
                              t("profile.experience") + "을 입력하세요"
                            }
                            className="text-sm"
                          />
                        </div>
                      </>
                    )}

                    {/* 공개 설정 토글 */}
                    {editForm.user_type === "student" ? (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-700 block mb-1">
                            {language === "ko"
                              ? "학업 정보 공개"
                              : "Información académica pública"}
                          </label>
                          <p className="text-xs text-gray-500">
                            {language === "ko"
                              ? "대학교, 전공, 학년 정보를 다른 사용자에게 공개합니다"
                              : "Comparte tu universidad, carrera y año de estudio con otros usuarios"}
                          </p>
                        </div>
                        <Switch
                          checked={editForm.academic_info_public ?? false}
                          onCheckedChange={(checked) =>
                            setEditForm((prev) => ({
                              ...prev,
                              academic_info_public: checked,
                            }))
                          }
                          className={compactSwitchClass}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-700 block mb-1">
                            {language === "ko"
                              ? "직업 정보 공개"
                              : "Información profesional pública"}
                          </label>
                          <p className="text-xs text-gray-500">
                            {language === "ko"
                              ? "직업, 회사, 경력 정보를 다른 사용자에게 공개합니다"
                              : "Comparte tu ocupación, empresa y experiencia con otros usuarios"}
                          </p>
                        </div>
                        <Switch
                          checked={editForm.job_info_public ?? false}
                          onCheckedChange={(checked) =>
                            setEditForm((prev) => ({
                              ...prev,
                              job_info_public: checked,
                            }))
                          }
                          className={compactSwitchClass}
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-gray-600 text-sm block mb-1">
                        {t("profile.selfIntroduction")}
                      </label>
                      <Textarea
                        value={editForm.introduction}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            introduction: e.target.value,
                          }))
                        }
                        placeholder={
                          language === "ko"
                            ? "자기소개를 입력하세요"
                            : "Ingrese su autopresentación"
                        }
                        className="text-sm min-h-[80px]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 한국이름 */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs sm:text-sm">
                      {t("profile.koreanName")}
                    </span>
                    <span className="text-gray-800 text-xs sm:text-sm font-medium truncate max-w-[60%] text-right">
                      {profile?.korean_name ||
                        (language === "ko" ? "없음" : "Sin nombre coreano")}
                    </span>
                  </div>

                  {/* 구분선 */}
                  <div className="border-t border-gray-200"></div>

                  {/* 스페인어 이름 */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs sm:text-sm">
                      {t("profile.spanishName")}
                    </span>
                    <span className="text-gray-800 text-xs sm:text-sm font-medium truncate max-w-[60%] text-right">
                      {profile?.spanish_name ||
                        (language === "ko" ? "없음" : "Sin nombre español")}
                    </span>
                  </div>

                  {/* 구분선 */}
                  <div className="border-t border-gray-200"></div>

                  {/* 사용자 타입에 따른 정보 표시 */}
                  {profile?.userType === "student" ||
                  profile?.user_type === "student" ? (
                    <>
                      {/* 학력 정보 (대학생인 경우) */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-xs sm:text-sm">
                          {t("profile.university")}
                        </span>
                        <span className="text-gray-800 text-xs sm:text-sm font-medium">
                          {profile?.university ||
                            (language === "ko"
                              ? "대학교 없음"
                              : "Sin universidad")}
                        </span>
                      </div>

                      {/* 구분선 */}
                      <div className="border-t border-gray-200"></div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-xs sm:text-sm">
                          {t("profile.major")}
                        </span>
                        <span className="text-gray-800 text-xs sm:text-sm font-medium">
                          {profile?.major ||
                            (language === "ko" ? "전공 없음" : "Sin carrera")}
                        </span>
                      </div>

                      {/* 구분선 */}
                      <div className="border-t border-gray-200"></div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-xs sm:text-sm">
                          {t("profile.grade")}
                        </span>
                        <span className="text-gray-800 text-xs sm:text-sm font-medium">
                          {profile?.grade ||
                            (language === "ko"
                              ? "학년 없음"
                              : "Sin año de estudio")}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* 직업 정보 (직장인인 경우) */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-xs sm:text-sm">
                          {t("profile.occupation")}
                        </span>
                        <span className="text-gray-800 text-xs sm:text-sm font-medium truncate max-w-[60%] text-right">
                          {profile?.occupation || t("profile.noOccupation")}
                        </span>
                      </div>

                      {/* 구분선 */}
                      <div className="border-t border-gray-200"></div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-xs sm:text-sm">
                          {t("profile.company")}
                        </span>
                        <span className="text-gray-800 text-xs sm:text-sm font-medium truncate max-w-[60%] text-right">
                          {profile?.company || t("profile.noCompany")}
                        </span>
                      </div>

                      {/* 구분선 */}
                      <div className="border-t border-gray-200"></div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-xs sm:text-sm">
                          {t("profile.experience")}
                        </span>
                        <span className="text-gray-800 text-xs sm:text-sm font-medium truncate max-w-[60%] text-right">
                          {profile?.career || t("profile.noExperience")}
                        </span>
                      </div>
                    </>
                  )}

                  {/* 구분선 */}
                  <div className="border-t border-gray-200"></div>

                  {/* 공개 설정 토글 (편집 모드가 아닐 때) */}
                  {!isEditing && (
                    <>
                      {profile?.userType === "student" ||
                      profile?.user_type === "student" ? (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex-1">
                            <label className="text-sm font-medium text-gray-700 block mb-1">
                              {language === "ko"
                                ? "학업 정보 공개"
                                : "Información académica pública"}
                            </label>
                            <p className="text-xs text-gray-500">
                              {language === "ko"
                                ? "대학교, 전공, 학년 정보를 다른 사용자에게 공개합니다"
                                : "Comparte tu universidad, carrera y año de estudio con otros usuarios"}
                            </p>
                          </div>
                          <Switch
                            checked={profile?.academic_info_public ?? false}
                            onCheckedChange={(checked) =>
                              handleUpdatePrivacy(
                                "academic_info_public",
                                checked,
                              )
                            }
                            className={compactSwitchClass}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                          <div className="flex-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">
                              {language === "ko"
                                ? "직업 정보 공개"
                                : "Información profesional pública"}
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {language === "ko"
                                ? "직업, 회사, 경력 정보를 다른 사용자에게 공개합니다"
                                : "Comparte tu ocupación, empresa y experiencia con otros usuarios"}
                            </p>
                          </div>
                          <Switch
                            checked={profile?.job_info_public ?? false}
                            onCheckedChange={(checked) =>
                              handleUpdatePrivacy("job_info_public", checked)
                            }
                            className={compactSwitchClass}
                          />
                        </div>
                      )}
                      {/* 구분선 */}
                      <div className="border-t border-gray-200 mt-3"></div>
                    </>
                  )}

                  {/* 자기소개 */}
                  <div className="flex items-start justify-between">
                    <span className="text-gray-600 text-xs sm:text-sm">
                      {t("profile.selfIntroduction")}
                    </span>
                    <span className="text-gray-800 text-xs sm:text-sm font-medium text-right max-w-[60%]">
                      {profile?.introduction || t("profile.noSelfIntroduction")}
                    </span>
                  </div>

                  {/* 구분선 */}
                  <div className="border-t border-gray-200"></div>

                  {/* 화상 채팅 파트너 상태 표시 (한국인 인증 완료 시 자동 등록됨) */}
                  {showPartnerSection && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                          <span className="text-sm sm:text-base text-gray-700 font-semibold">
                            화상 채팅 파트너
                          </span>
                        </div>
                        {isPartnerRegistered ? (
                          <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-medium">
                            등록됨
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-gray-100 text-gray-600 rounded-full text-xs sm:text-sm font-medium">
                            인증 대기 중
                          </span>
                        )}
                      </div>
                      {isPartnerRegistered && (
                        <p className="text-xs text-gray-600 mt-2">
                          한국인 인증이 완료되어 화상 채팅 파트너로 자동
                          등록되었습니다.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 화상채팅 파트너와 설정 사이 여백 */}
          <div className="h-6"></div>

          {/* 설정 섹션 */}
          <div className="px-4 pb-4">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-start gap-3 p-5 border-b border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 text-white flex items-center justify-center">
                  <Settings className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {language === "ko"
                      ? "계정 및 환경 설정"
                      : "Configuraciones de cuenta"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettingsExpanded((prev) =>
                      prev.length > 0
                        ? []
                        : ["stories", "security", "notifications"],
                    )
                  }
                  className="px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  {settingsExpanded.length > 0
                    ? language === "ko"
                      ? "모두 접기"
                      : "Cerrar todo"
                    : language === "ko"
                      ? "모두 펼치기"
                      : "Abrir todo"}
                </button>
              </div>

              <Accordion
                type="multiple"
                value={settingsExpanded}
                onValueChange={setSettingsExpanded}
              >
                {/* 스토리 기능 숨김 처리 (미래 사용을 위해 주석 처리) */}
                {/* <AccordionItem value="stories" className="border-b border-gray-100">
                <AccordionTrigger className="px-5 py-4 hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-500 flex items-center justify-center">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {language === 'ko' ? '스토리 및 콘텐츠 관리' : 'Historias y contenido'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {language === 'ko'
                          ? '스토리 노출, 저장소, 개별 스토리를 한 곳에서 조정하세요.'
                          : 'Controla visibilidad, almacenamiento y ajustes individuales.'}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <StorySettings />
                </AccordionContent>
              </AccordionItem> */}

                {process.env.NEXT_PUBLIC_BIOMETRIC_ENABLED === "true" && (
                  <AccordionItem
                    value="security"
                    className="border-b border-gray-100"
                  >
                    <AccordionTrigger className="px-5 py-4 hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {language === "ko"
                              ? "보안 및 보호 옵션"
                              : "Seguridad y protección"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {language === "ko"
                              ? "지문 로그인과 등록된 기기를 확인하세요."
                              : "Revisa el inicio con huella y los dispositivos registrados."}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5 space-y-3">
                      {biometricSupported ? (
                        <>
                          <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-emerald-200">
                            <div className="flex items-center gap-3">
                              <Fingerprint className="w-5 h-5 text-emerald-600" />
                              <div>
                                <div className="font-medium text-gray-800 text-sm">
                                  {language === "ko"
                                    ? "지문 인증 로그인"
                                    : "Inicio con huella digital"}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {language === "ko"
                                    ? "빠르고 안전하게 로그인하세요"
                                    : "Inicia sesión rápido y seguro"}
                                </div>
                              </div>
                            </div>
                            <Switch
                              className={compactSwitchClass}
                              checked={biometricEnabled}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleEnableBiometric();
                                } else {
                                  handleDisableBiometric();
                                }
                              }}
                            />
                          </div>

                          {biometricEnabled &&
                            biometricCredentials.length > 0 && (
                              <div className="bg-white/60 rounded-lg p-3 space-y-2 border border-emerald-100">
                                <p className="text-xs font-medium text-emerald-800">
                                  {language === "ko"
                                    ? "등록된 기기:"
                                    : "Dispositivos registrados:"}
                                </p>
                                {biometricCredentials.map((cred, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2 text-xs text-emerald-700"
                                  >
                                    <Smartphone className="w-3 h-3" />
                                    <span>{cred.deviceName}</span>
                                    <span className="text-emerald-500">•</span>
                                    <span className="text-gray-500">
                                      {new Date(
                                        cred.lastUsedAt,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </>
                      ) : (
                        <div className="bg-white/70 border border-emerald-100 rounded-xl p-4 text-xs text-emerald-700">
                          {language === "ko"
                            ? "현재 기기는 지문 인증을 지원하지 않습니다. 지원 기기에서 다시 시도해주세요."
                            : "El dispositivo actual no admite huella digital. Inténtalo desde un dispositivo compatible."}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )}

                <AccordionItem value="notifications">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {language === "ko" ? "알림 설정" : "Notificaciones"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {language === "ko"
                            ? "이메일, 푸시 등 수신 방식을 직접 선택할 수 있어요."
                            : "Elige cómo recibir correos, avisos push y marketing."}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 space-y-3">
                    {/* 푸시 알림 마스터 스위치 */}
                    <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-amber-200">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-600" />
                        <div>
                          <div className="font-medium text-gray-800 text-xs">
                            {language === "ko"
                              ? "푸시 알림"
                              : "Notificaciones Push"}
                          </div>
                          <div className="text-xs text-gray-600">
                            {language === "ko"
                              ? "모든 푸시 알림을 받습니다 (웹 및 앱)"
                              : "Recibe todas las notificaciones push (web y app)"}
                          </div>
                        </div>
                      </div>
                      <Switch
                        className={compactSwitchClass}
                        checked={notificationSettings.pushEnabled}
                        onCheckedChange={(checked) =>
                          handleNotificationChange("pushEnabled", checked)
                        }
                      />
                    </div>

                    {/* 이벤트 알림 */}
                    <div
                      className={`flex items-center justify-between p-3 bg-white/80 rounded-xl border border-amber-200 ${!notificationSettings.pushEnabled ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <div>
                          <div className="font-medium text-gray-800 text-xs">
                            {language === "ko"
                              ? "이벤트 알림"
                              : "Notificaciones de eventos"}
                          </div>
                          <div className="text-xs text-gray-600">
                            {language === "ko"
                              ? "이벤트 및 프로모션 알림을 받습니다"
                              : "Recibe notificaciones de eventos y promociones"}
                          </div>
                        </div>
                      </div>
                      <Switch
                        className={compactSwitchClass}
                        checked={
                          notificationSettings.eventNotifications &&
                          notificationSettings.pushEnabled
                        }
                        onCheckedChange={(checked) =>
                          handleNotificationChange(
                            "eventNotifications",
                            checked,
                          )
                        }
                        disabled={!notificationSettings.pushEnabled}
                      />
                    </div>

                    {/* 좋아요·댓글 알림 */}
                    <div
                      className={`flex items-center justify-between p-3 bg-white/80 rounded-xl border border-amber-200 ${!notificationSettings.pushEnabled ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-amber-600" />
                        <div>
                          <div className="font-medium text-gray-800 text-xs">
                            {language === "ko"
                              ? "좋아요·댓글 알림"
                              : "Notificaciones de interacción"}
                          </div>
                          <div className="text-xs text-gray-600">
                            {language === "ko"
                              ? "내 글에 좋아요나 댓글이 달리면 즉시 알림을 받습니다"
                              : "Recibe notificaciones cuando alguien da me gusta o comenta en tus publicaciones"}
                          </div>
                        </div>
                      </div>
                      <Switch
                        className={compactSwitchClass}
                        checked={
                          notificationSettings.interactionNotifications &&
                          notificationSettings.pushEnabled
                        }
                        onCheckedChange={(checked) =>
                          handleNotificationChange(
                            "interactionNotifications",
                            checked,
                          )
                        }
                        disabled={!notificationSettings.pushEnabled}
                      />
                    </div>

                    {/* 새게시물 알림 */}
                    <div
                      className={`flex items-center justify-between p-3 bg-white/80 rounded-xl border border-amber-200 ${!notificationSettings.pushEnabled ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <div>
                          <div className="font-medium text-gray-800 text-xs">
                            {language === "ko"
                              ? "새게시물 알림"
                              : "Notificaciones de nuevas publicaciones"}
                          </div>
                          <div className="text-xs text-gray-600">
                            {language === "ko"
                              ? "매일 오전 8:30에 새로운 게시물을 요약해서 알려드립니다"
                              : "Recibe un resumen diario de nuevas publicaciones a las 8:30 AM"}
                          </div>
                        </div>
                      </div>
                      <Switch
                        className={compactSwitchClass}
                        checked={
                          notificationSettings.newPostNotifications &&
                          notificationSettings.pushEnabled
                        }
                        onCheckedChange={(checked) =>
                          handleNotificationChange(
                            "newPostNotifications",
                            checked,
                          )
                        }
                        disabled={!notificationSettings.pushEnabled}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 rounded-b-2xl">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!token}
                  className="w-full justify-center px-4 py-3 text-sm font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setDeleteConfirmText("");
                    setDeleteError(null);
                    setShowDeleteDialog(true);
                  }}
                >
                  {language === "ko" ? "계정 삭제" : "Eliminar cuenta"}
                </Button>
              </div>
            </div>
          </div>

          {/* 충전소 섹션 구분선 */}
          <div className="mx-4 my-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                <img
                  src="/misc/charging-title.png"
                  alt="충전소"
                  className="w-5 h-5"
                />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t("storeTab.title")}
                </span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
            </div>
          </div>

          {/* 충전소 섹션 */}
          <div className="px-4 py-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border-t border-blue-200 dark:border-blue-800">
            <ChargingHeader />
            <PointsCard />
            <ChargingTab />
          </div>

          {/* 하단 여백 */}
          <div className="h-20"></div>
        </div>
      </div>

      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) {
            setDeleteConfirmText("");
            setDeleteError(null);
            setIsDeletingAccount(false);
          }
        }}
      >
        <DialogContent
          className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl"
          showCloseButton={!isDeletingAccount}
        >
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              {language === "ko"
                ? "계정을 정말 삭제할까요?"
                : "¿Eliminar tu cuenta permanentemente?"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              {language === "ko"
                ? "계정을 삭제하면 개인정보와 포인트, 설정이 영구적으로 삭제되며 복구할 수 없습니다."
                : "La eliminación eliminará permanentemente tus datos personales, puntos y ajustes. No podrás deshacer esta acción."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <p>
              {language === "ko"
                ? "삭제를 진행하려면 아래 확인 문구를 입력해주세요."
                : "Para continuar, escribe la palabra de confirmación abajo."}
            </p>
            <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-3 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                {language === "ko" ? "삭제 시 처리 내용" : "Lo que sucederá"}
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  {language === "ko"
                    ? "개인정보, 알림 설정, 선호도 등 계정 정보가 모두 삭제됩니다."
                    : "Se eliminarán tu información personal, ajustes y preferencias."}
                </li>
                <li>
                  {language === "ko"
                    ? '작성한 게시글과 댓글은 더 이상 노출되지 않거나 "탈퇴한 사용자"로 표시됩니다.'
                    : 'Tus publicaciones y comentarios dejarán de mostrarse o aparecerán como "usuario eliminado".'}
                </li>
                <li>
                  {language === "ko"
                    ? "삭제 후에는 동일 이메일로 재가입이 가능하지만 기존 데이터는 복구되지 않습니다."
                    : "Podrás crear una nueva cuenta con el mismo correo, pero los datos anteriores no se podrán recuperar."}
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {language === "ko"
                ? '"DELETE" 를 대문자로 입력해주세요.'
                : 'Escribe "DELETE" en mayúsculas para confirmar.'}
            </label>
            <Input
              value={deleteConfirmText}
              onChange={(event) => setDeleteConfirmText(event.target.value)}
              placeholder="DELETE"
              disabled={isDeletingAccount}
            />
          </div>

          {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={isDeletingAccount}
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmText("");
                setDeleteError(null);
              }}
            >
              {language === "ko" ? "취소" : "Cancelar"}
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== "DELETE" || isDeletingAccount}
              onClick={handleAccountDeletion}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingAccount
                ? language === "ko"
                  ? "삭제 중..."
                  : "Eliminando..."
                : language === "ko"
                  ? "완전히 삭제하기"
                  : "Eliminar definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 인증 확인 다이얼로그 */}
      <AuthConfirmDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title={
          language === "ko" ? "인증이 필요합니다" : "Se requiere autenticación"
        }
        description={
          language === "ko"
            ? "프로필을 보려면 인증센터에서 프로필을 완성해주세요. 인증센터로 이동하시겠습니까?"
            : "Para ver tu perfil, completa tu perfil en el centro de autenticación. ¿Deseas ir al centro de autenticación?"
        }
        confirmText={
          language === "ko"
            ? "인증센터로 이동"
            : "Ir al centro de autenticación"
        }
        cancelText={language === "ko" ? "취소" : "Cancelar"}
      />
      {/* 문의 모달 */}
      <InquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
      />
    </>
  );
}
