"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Globe,
  Phone,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { countries } from "@/constants/countries";
import {
  signUpEvents,
  marketingEvents,
  trackStartSignup,
  trackSignupInput,
  trackSignupSubmit,
  trackSignupSuccess,
  trackCTAClick,
  trackSignUpFormStart,
  trackSignUpRequiredInfoCompleted,
  trackSignUpVerificationCompleted,
  trackSignUpSubmit as trackSignUpSubmitEvent,
  trackSignUpSuccess as trackSignUpSuccessEvent,
} from "@/lib/analytics";
import EmailVerification from "@/components/auth/EmailVerification";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { Capacitor } from "@capacitor/core";

export default function SignUpPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "form" | "verify-choice" | "email" | "sms" | "complete"
  >("form");
  const [emailVerified, setEmailVerified] = useState(false);
  const [isEmailVerifying, setIsEmailVerifying] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false); // 인증 코드 발송 여부 추적 (중복 방지)
  const [smsVerified, setSmsVerified] = useState(false);
  const [isSmsVerifying, setIsSmsVerifying] = useState(false);
  const [smsCodeSent, setSmsCodeSent] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [smsTimeLeft, setSmsTimeLeft] = useState(300);
  const [smsCanResend, setSmsCanResend] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    isKorean: false,
    birthDate: "",
    phone: "",
  });

  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    hasNumber: false,
    hasSpecial: false,
    noRepeated: false,
  });

  const [authData, setAuthData] = useState({
    email: "",
    nationality: "",
    isEmailVerified: false, // 이메일 인증은 실제로 완료해야 함
    biometricEnabled: false,
  });

  const [ageError, setAgeError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [requiredInfoCompletedTracked, setRequiredInfoCompletedTracked] =
    useState(false);

  // 가입 퍼널 이벤트: 회원가입 시작
  useEffect(() => {
    try {
      signUpEvents.startSignUp();
      signUpEvents.formStart();
      // Standardized event
      trackStartSignup();
      // 요청된 GA4 이벤트: 회원가입 폼 입력 시작
      trackSignUpFormStart();
    } catch (e) {
      console.error("[SIGNUP] 초기 analytics 이벤트 오류:", e);
    }

    // 히스토리 초기화 - 모바일 뒤로가기 방지
    if (typeof window !== "undefined") {
      // 히스토리가 비어있으면 랜딩 페이지를 히스토리에 추가
      if (window.history.state === null) {
        window.history.replaceState({ index: 0 }, "", "/");
        window.history.pushState({ index: 1 }, "", "/sign-up");
      }
    }
  }, []);

  // 필수 정보 입력 완료 감지
  useEffect(() => {
    if (requiredInfoCompletedTracked) return;

    // isPasswordValid를 여기서 계산 (선언 전 사용 방지)
    const isPasswordValid = Object.values(passwordChecks).every(
      (check) => check,
    );

    const isRequiredInfoCompleted =
      formData.name &&
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      formData.country &&
      formData.birthDate &&
      isPasswordValid &&
      formData.password === formData.confirmPassword &&
      !ageError &&
      !emailError;

    if (isRequiredInfoCompleted) {
      // 요청된 GA4 이벤트: 필수 정보 입력 완료
      try {
        trackSignUpRequiredInfoCompleted();
        setRequiredInfoCompletedTracked(true);
      } catch (e) {
        console.error(
          "[SIGNUP] trackSignUpRequiredInfoCompleted 이벤트 오류:",
          e,
        );
        setRequiredInfoCompletedTracked(true); // 에러가 나도 추적 완료로 표시
      }
    }
  }, [
    formData,
    passwordChecks,
    ageError,
    emailError,
    requiredInfoCompletedTracked,
  ]);

  const calculateAge = (value: string) => {
    if (!value) return null;
    const today = new Date();
    const birth = new Date(value);
    if (Number.isNaN(birth.getTime())) return null;
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // 비밀번호 검증
    if (field === "password") {
      validatePassword(value);
    }

    // 이메일 검증 (오타 감지)
    if (field === "email") {
      validateEmail(value);
      // 가입 퍼널 이벤트: 이메일 입력
      if (value.length > 0) {
        try {
          signUpEvents.enterEmail();
          // Standardized event
          trackSignupInput("email");
        } catch (e) {
          console.error("[SIGNUP] enterEmail 이벤트 오류:", e);
        }
      }
    }

    // 가입 퍼널 이벤트: 비밀번호 입력
    if (field === "password" && value.length > 0) {
      try {
        signUpEvents.enterPassword();
        // Standardized event
        trackSignupInput("password");
      } catch (e) {
        console.error("[SIGNUP] enterPassword 이벤트 오류:", e);
      }
    }

    // Standardized events for other fields
    if (value.length > 0 && ["name", "birthDate", "country"].includes(field)) {
      try {
        trackSignupInput(field);
      } catch (e) {
        console.error("[SIGNUP] trackSignupInput 이벤트 오류:", e);
      }
    }

    if (field === "birthDate") {
      const age = calculateAge(value);
      if (!value) {
        setAgeError(t("auth.birthDateRequired"));
      } else if (age === null) {
        setAgeError(t("auth.birthDateInvalid"));
      } else if (age < 13) {
        setAgeError(t("auth.ageRestriction"));
      } else {
        setAgeError(null);
        // 가입 퍼널 이벤트: 생년월일 입력
        try {
          signUpEvents.enterBirthdate();
          signUpEvents.enterBirthday();
          signUpEvents.birthdayOk();
        } catch (e) {
          console.error("[SIGNUP] 생년월일 이벤트 오류:", e);
        }
      }
    }
  };

  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noRepeated: !/(.)\1{2,}/.test(password), // 3개 이상 연속된 문자 방지
    };
    setPasswordChecks(checks);

    // 비밀번호 검증 통과 시 이벤트
    if (Object.values(checks).every((check) => check)) {
      try {
        signUpEvents.passwordOk();
      } catch (e) {
        console.error("[SIGNUP] passwordOk 이벤트 오류:", e);
      }
    }
  };

  const validateEmail = (email: string) => {
    if (!email || email.length === 0) {
      setEmailError(null);
      return;
    }

    // 기본 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError(
        language === "ko"
          ? "올바른 이메일 형식이 아닙니다."
          : "Formato de correo electrónico inválido.",
      );
      return;
    }

    // 도메인 추출
    const domain = email.split("@")[1]?.toLowerCase() || "";

    // 일반적인 이메일 도메인 오타 패턴
    const commonTypos: Record<string, string[]> = {
      "gmail.com": [
        "gamil.com",
        "gmai.com",
        "gmaill.com",
        "gmal.com",
        "gmial.com",
        "gmaol.com",
      ],
      "yahoo.com": [
        "yhoo.com",
        "yahooo.com",
        "yaho.com",
        "yahoo.co",
        "yhooo.com",
      ],
      "naver.com": ["naverr.com", "naver.co", "naverr.co"],
      "hotmail.com": [
        "hotmai.com",
        "hotmaill.com",
        "hotmal.com",
        "hotmial.com",
      ],
      "outlook.com": ["outlok.com", "outlok.co", "outlook.co"],
      "daum.net": ["daumm.net", "daum.ne"],
      "hanmail.net": ["hanmai.net", "hanmaill.net"],
      "icloud.com": ["icloud.co", "icloudd.com"],
      "live.com": ["live.co", "livve.com"],
    };

    // 오타 감지
    for (const [correctDomain, typos] of Object.entries(commonTypos)) {
      if (typos.includes(domain)) {
        const suggestion = correctDomain;
        setEmailError(
          language === "ko"
            ? `이메일 도메인에 오타가 있는 것 같습니다. "${suggestion}"를 확인해주세요.`
            : `Parece que hay un error tipográfico en el dominio del correo. Por favor verifica "${suggestion}".`,
        );
        return;
      }
    }

    // 오타가 없으면 에러 제거
    setEmailError(null);
  };

  const isPasswordValid = Object.values(passwordChecks).every((check) => check);

  const handleCountryChange = (countryCode: string) => {
    const selectedCountry =
      countries && Array.isArray(countries)
        ? countries.find((c) => c.code === countryCode)
        : null;
    setFormData((prev) => ({
      ...prev,
      country: countryCode,
      isKorean: selectedCountry?.isKorean || false,
    }));
  };

  // 뒤로가기 함수
  const handleGoBack = () => {
    switch (currentStep) {
      case "verify-choice":
        setCurrentStep("form");
        break;
      case "email":
        // 전화번호가 있으면 선택 화면으로, 없으면 폼으로
        setCurrentStep(formData.phone ? "verify-choice" : "form");
        break;
      case "sms":
        setCurrentStep("verify-choice");
        break;
      case "complete":
        setCurrentStep("form");
        break;
      default:
        // form 단계에서는 메인 페이지로 이동
        router.push("/");
    }
  };

  // 이메일 인증 코드 발송
  const handleSendEmailCode = useCallback(async () => {
    if (!formData.email) return;

    // 이미 발송했으면 중복 방지
    if (emailCodeSent) {
      console.log("[SIGNUP] 인증 코드가 이미 발송되었습니다. 중복 발송 방지.");
      return;
    }

    setIsEmailVerifying(true);
    try {
      const response = await fetch("/api/verify/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "email",
          target: formData.email,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || result.message || "인증코드 발송에 실패했습니다.",
        );
      }

      // 발송 완료 플래그 설정
      setEmailCodeSent(true);

      // 자동 발송 시에는 알림을 표시하지 않음 (사용자가 버튼을 눌렀을 때만 표시)
      if (currentStep === "email") {
        // 이메일 인증 단계에서는 조용히 발송
      } else {
        alert(
          language === "ko"
            ? "이메일로 인증코드가 발송되었습니다."
            : "Se ha enviado el código de verificación por correo electrónico.",
        );
      }
    } catch (error) {
      console.error("이메일 인증코드 발송 실패:", error);
      alert(
        error instanceof Error
          ? error.message
          : language === "ko"
            ? "인증코드 발송에 실패했습니다."
            : "Error al enviar el código de verificación.",
      );
    } finally {
      setIsEmailVerifying(false);
    }
  }, [formData.email, language, currentStep, emailCodeSent]);

  // 이메일 인증 코드 확인
  const handleVerifyEmailCode = async (code: string) => {
    setIsEmailVerifying(true);
    try {
      const response = await fetch("/api/verify/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "email",
          target: formData.email,
          code: code,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || result.message || "인증코드가 올바르지 않습니다.",
        );
      }

      // 이메일 인증 완료
      setEmailVerified(true);
      setAuthData((prev) => ({ ...prev, isEmailVerified: true }));

      // 요청된 GA4 이벤트: 인증 완료
      try {
        trackSignUpVerificationCompleted("email");
      } catch (e) {
        console.error(
          "[SIGNUP] trackSignUpVerificationCompleted 이벤트 오류:",
          e,
        );
      }

      alert(
        language === "ko"
          ? "이메일 인증이 완료되었습니다."
          : "Verificación de correo electrónico completada.",
      );

      // 이메일 인증 완료 → 바로 회원가입 진행
      await handleSignUp();
    } catch (error) {
      console.error("이메일 인증 실패:", error);
      alert(
        error instanceof Error
          ? error.message
          : language === "ko"
            ? "인증코드가 올바르지 않습니다."
            : "El código de verificación es incorrecto.",
      );
    } finally {
      setIsEmailVerifying(false);
    }
  };

  // 이메일 인증 단계로 이동 시 자동으로 코드 발송 (한 번만)
  useEffect(() => {
    if (
      currentStep === "email" &&
      formData.email &&
      !emailVerified &&
      !emailCodeSent
    ) {
      handleSendEmailCode();
    }
  }, [
    currentStep,
    formData.email,
    emailVerified,
    emailCodeSent,
    handleSendEmailCode,
  ]);

  // 이메일이 변경되면 발송 플래그 리셋 (다른 이메일로 변경 시 재발송 가능하도록)
  useEffect(() => {
    setEmailCodeSent(false);
  }, [formData.email]);

  // ===== SMS 인증 로직 =====

  // SMS 타이머
  useEffect(() => {
    if (currentStep === "sms" && smsCodeSent && smsTimeLeft > 0) {
      const timer = setTimeout(() => setSmsTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (smsTimeLeft === 0 && smsCodeSent) {
      setSmsCanResend(true);
    }
  }, [currentStep, smsCodeSent, smsTimeLeft]);

  // SMS 단계 진입 시 자동 발송
  useEffect(() => {
    if (currentStep === "sms" && formData.phone && !smsCodeSent) {
      handleSendSmsCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // SMS 인증코드 발송
  const handleSendSmsCode = async () => {
    if (!formData.phone || !formData.country) return;

    setIsSmsVerifying(true);
    setSmsError(null);
    try {
      const selectedCountry = countries.find(
        (c) => c.code === formData.country,
      );
      const phoneCode = selectedCountry?.phoneCode || "";
      const cleanDigits = formData.phone.replace(/\D/g, "");
      // 이미 국가번호가 포함되어 있으면 그대로, 아니면 국가번호 + 번호
      const fullPhone = formData.phone.startsWith("+")
        ? formData.phone
        : `${phoneCode}${cleanDigits}`;

      const response = await fetch("/api/verify/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "sms",
          target: fullPhone,
          nationality: formData.country,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        // Mostrar detalles del error del servidor para diagnóstico
        const errorDetail = result.detail ? ` (${result.detail})` : "";
        const errorMessage =
          result.message ||
          result.error ||
          (language === "ko"
            ? "SMS 인증코드 발송에 실패했습니다."
            : "Error al enviar el código de verificación por SMS.");
        throw new Error(`${errorMessage}${errorDetail}`);
      }

      setSmsCodeSent(true);
      setSmsTimeLeft(300);
      setSmsCanResend(false);
      setSmsCode("");
    } catch (error) {
      console.error("SMS 인증코드 발송 실패:", error);
      setSmsError(
        error instanceof Error
          ? error.message
          : language === "ko"
            ? "SMS 발송에 실패했습니다."
            : "Error al enviar SMS.",
      );
    } finally {
      setIsSmsVerifying(false);
    }
  };

  // SMS 인증코드 확인
  const handleVerifySmsCode = async () => {
    if (smsCode.length !== 6) return;

    setIsSmsVerifying(true);
    setSmsError(null);
    try {
      const selectedCountry = countries.find(
        (c) => c.code === formData.country,
      );
      const phoneCode = selectedCountry?.phoneCode || "";
      const cleanDigits = formData.phone.replace(/\D/g, "");
      const fullPhone = formData.phone.startsWith("+")
        ? formData.phone
        : `${phoneCode}${cleanDigits}`;

      const response = await fetch("/api/verify/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "sms",
          target: fullPhone,
          code: smsCode,
          nationality: formData.country,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error ||
            result.message ||
            (language === "ko"
              ? "인증코드가 올바르지 않습니다."
              : "El código de verificación es incorrecto."),
        );
      }

      setSmsVerified(true);

      try {
        trackSignUpVerificationCompleted("sms");
      } catch (e) {
        console.error(
          "[SIGNUP] trackSignUpVerificationCompleted SMS 이벤트 오류:",
          e,
        );
      }

      alert(
        language === "ko"
          ? "전화번호 인증이 완료되었습니다."
          : "Verificación de teléfono completada.",
      );

      // SMS 인증 완료 → 회원가입 진행
      await handleSignUp();
    } catch (error) {
      console.error("SMS 인증 실패:", error);
      setSmsError(
        error instanceof Error
          ? error.message
          : language === "ko"
            ? "인증코드가 올바르지 않습니다."
            : "El código de verificación es incorrecto.",
      );
    } finally {
      setIsSmsVerifying(false);
    }
  };

  // SMS 재발송
  const handleResendSms = () => {
    setSmsTimeLeft(300);
    setSmsCode("");
    setSmsCanResend(false);
    setSmsCodeSent(false);
    setSmsError(null);
    handleSendSmsCode();
  };

  const formatSmsTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    // sign_up_submit 이벤트는 handleFormSubmit에서만 호출 (중복 방지)

    try {
      if (!formData.birthDate) {
        throw new Error(t("auth.birthDateRequired"));
      }

      const age = calculateAge(formData.birthDate);
      if (age === null) {
        throw new Error(t("auth.birthDateInvalid"));
      }

      if (age < 13) {
        throw new Error(t("auth.ageRestriction"));
      }

      // 실제 회원가입 API 호출
      const selectedCountry =
        countries && Array.isArray(countries)
          ? countries.find((c) => c.code === formData.country)
          : null;
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          country: formData.country,
          isKorean: selectedCountry?.isKorean || false,
          birthDate: formData.birthDate,
          phone: formData.phone || undefined,
          emailVerified: authData.isEmailVerified,
          smsVerified: smsVerified,
          biometricEnabled: authData.biometricEnabled,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t("auth.signUpFailed"));
      }

      console.log("회원가입 성공:", result);

      const userId =
        result.data?.userId || result.user?.id || result.data?.user?.id;

      // userId가 없으면 에러
      if (!userId) {
        console.error("[SIGNUP] userId를 찾을 수 없음:", result);
        throw new Error("회원가입은 성공했지만 사용자 ID를 찾을 수 없습니다.");
      }

      // 가입 퍼널 이벤트: 사용자 생성 (userId가 있을 때만)
      try {
        signUpEvents.createUser(userId);
      } catch (e) {
        console.error("[SIGNUP] createUser 이벤트 오류:", e);
      }

      // 가입 퍼널 이벤트: 회원가입 완료
      try {
        signUpEvents.completeSignUp(userId);
        signUpEvents.signUpSuccess(userId);
      } catch (e) {
        console.error("[SIGNUP] completeSignUp 이벤트 오류:", e);
      }

      // 마케팅 퍼널 이벤트: 회원가입 완료
      try {
        marketingEvents.signUp(userId, "email");
      } catch (e) {
        console.error("[SIGNUP] marketingEvents.signUp 이벤트 오류:", e);
      }

      // Standardized events
      try {
        trackSignupSuccess(userId);
      } catch (e) {
        console.error("[SIGNUP] trackSignupSuccess 이벤트 오류:", e);
      }

      // 요청된 GA4 이벤트: 회원가입 성공
      try {
        trackSignUpSuccessEvent(userId);
      } catch (e) {
        console.error("[SIGNUP] trackSignUpSuccessEvent 이벤트 오류:", e);
      }

      const successMessage =
        t("auth.signUpSuccess") ||
        (language === "ko"
          ? "회원가입이 완료되었습니다."
          : "Registro completado.");
      alert(successMessage);

      // 회원가입 성공 후 로그인 페이지로 이동
      router.push("/sign-in");
    } catch (error) {
      console.error("회원가입 오류:", error);

      // 중복 이메일 에러 처리
      if (
        error instanceof Error &&
        error.message.includes("이미 가입된 이메일")
      ) {
        alert(t("auth.emailAlreadyExists"));
        setCurrentStep("form"); // 폼으로 돌아가기
        return;
      }

      alert(error instanceof Error ? error.message : t("auth.signUpError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 가입 퍼널 이벤트: 회원가입 버튼 클릭
    try {
      signUpEvents.registerClick();
    } catch (e) {
      console.error("[SIGNUP] registerClick 이벤트 오류:", e);
    }

    if (!isPasswordValid || formData.password !== formData.confirmPassword) {
      return;
    }

    if (!formData.birthDate) {
      setAgeError(t("auth.birthDateRequired"));
      return;
    }

    const age = calculateAge(formData.birthDate);
    if (age === null) {
      setAgeError(t("auth.birthDateInvalid"));
      return;
    }

    if (age < 13) {
      setAgeError(t("auth.ageRestriction"));
      return;
    }

    // 가입 퍼널 이벤트: 회원가입 제출
    try {
      signUpEvents.submitRegister();
      // 요청된 GA4 이벤트: 회원가입 제출 (폼 제출 시)
      trackSignUpSubmitEvent();
    } catch (e) {
      console.error(
        "[SIGNUP] submitRegister/trackSignUpSubmitEvent 이벤트 오류:",
        e,
      );
    }

    setIsLoading(true);

    try {
      // 중복 이메일 체크
      const emailResponse = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const emailResult = await emailResponse.json();

      if (!emailResponse.ok) {
        throw new Error(
          emailResult.error || "이메일 확인 중 오류가 발생했습니다.",
        );
      }

      if (emailResult.exists) {
        alert(t("auth.emailAlreadyExists"));
        return;
      }

      // 중복이 아닌 경우: 전화번호가 있으면 인증 방법 선택, 없으면 이메일 인증으로
      if (formData.phone) {
        setCurrentStep("verify-choice");
      } else {
        setCurrentStep("email");
      }
    } catch (error) {
      console.error("중복 체크 오류:", error);
      alert(error instanceof Error ? error.message : t("auth.checkError"));
    } finally {
      setIsLoading(false);
    }
  };

  // 단계별 렌더링
  const renderStep = () => {
    switch (currentStep) {
      case "verify-choice":
        return (
          <div className="space-y-4">
            <p className="text-center text-sm text-slate-600 dark:text-gray-400 mb-2">
              {language === "ko"
                ? "본인 인증 방법을 선택해주세요."
                : "Seleccione un método de verificación."}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep("email")}
              className="w-full py-6 border-2 border-slate-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="text-left">
                  <p className="font-medium text-slate-900 dark:text-gray-100">
                    {language === "ko"
                      ? "이메일 인증"
                      : "Verificación por correo"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {formData.email}
                  </p>
                </div>
              </div>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep("sms")}
              className="w-full py-6 border-2 border-slate-200 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div className="text-left">
                  <p className="font-medium text-slate-900 dark:text-gray-100">
                    {language === "ko" ? "SMS 인증" : "Verificación por SMS"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {(() => {
                      const sc = countries.find(
                        (c) => c.code === formData.country,
                      );
                      return sc
                        ? `${sc.phoneCode} ${formData.phone}`
                        : formData.phone;
                    })()}
                  </p>
                </div>
              </div>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoBack}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === "ko" ? "뒤로" : "Atrás"}
            </Button>
          </div>
        );
      case "email":
        return (
          <div className="space-y-4">
            <EmailVerification
              email={formData.email}
              onVerify={handleVerifyEmailCode}
              onResend={handleSendEmailCode}
              isLoading={isEmailVerifying}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleGoBack}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === "ko" ? "뒤로" : "Atrás"}
            </Button>
          </div>
        );
      case "sms":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Phone className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <h3 className="text-lg font-semibold">
                {language === "ko"
                  ? "전화번호 인증"
                  : "Verificación de teléfono"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {smsCodeSent ? (
                  <>
                    <strong>
                      {(() => {
                        const sc = countries.find(
                          (c) => c.code === formData.country,
                        );
                        return sc
                          ? `${sc.phoneCode} ${formData.phone}`
                          : formData.phone;
                      })()}
                    </strong>
                    {language === "ko"
                      ? "(으)로 인증코드가 발송되었습니다."
                      : " - Se envió el código de verificación."}
                  </>
                ) : (
                  <>
                    <strong>
                      {(() => {
                        const sc = countries.find(
                          (c) => c.code === formData.country,
                        );
                        return sc
                          ? `${sc.phoneCode} ${formData.phone}`
                          : formData.phone;
                      })()}
                    </strong>
                    {language === "ko"
                      ? "(으)로 인증코드를 발송합니다."
                      : " - Enviando código de verificación."}
                  </>
                )}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  {language === "ko" ? "인증코드" : "Código de verificación"}
                </CardTitle>
                <CardDescription className="text-center">
                  {language === "ko"
                    ? "SMS로 받은 6자리 코드를 입력하세요"
                    : "Ingrese el código de 6 dígitos recibido por SMS"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {smsCodeSent && (
                  <div>
                    <Label
                      htmlFor="sms-code"
                      className="text-base font-semibold text-gray-700 dark:text-gray-300"
                    >
                      {language === "ko"
                        ? "인증코드"
                        : "Código de verificación"}
                    </Label>
                    <Input
                      id="sms-code"
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={smsCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setSmsCode(value);
                      }}
                      className="text-center text-2xl font-bold tracking-widest border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 py-4 h-14"
                      autoComplete="one-time-code"
                    />
                    {smsCode.length === 6 && (
                      <div className="mt-2 text-center">
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {language === "ko"
                            ? "6자리 입력 완료"
                            : "Código completo"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* SMS 에러 */}
                {smsError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {smsError}
                  </div>
                )}

                {/* 타이머 */}
                {smsCodeSent && (
                  <div className="text-center">
                    <div
                      className={`flex items-center justify-center gap-2 text-base font-medium px-4 py-2 rounded-lg ${
                        smsTimeLeft > 60
                          ? "bg-green-50 text-green-700"
                          : smsTimeLeft > 30
                            ? "bg-yellow-50 text-yellow-700"
                            : smsTimeLeft > 0
                              ? "bg-red-50 text-red-700"
                              : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      <Clock className="w-5 h-5" />
                      <span>
                        {smsTimeLeft > 0
                          ? `${language === "ko" ? "남은 시간" : "Tiempo restante"} ${formatSmsTime(smsTimeLeft)}`
                          : language === "ko"
                            ? "코드가 만료되었습니다"
                            : "El código ha expirado"}
                      </span>
                    </div>
                  </div>
                )}

                {/* 버튼 */}
                {!smsCodeSent ? (
                  <Button
                    onClick={handleSendSmsCode}
                    disabled={isSmsVerifying}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    size="lg"
                  >
                    {isSmsVerifying ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {language === "ko" ? "발송 중..." : "Enviando..."}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Phone className="w-5 h-5" />
                        {language === "ko"
                          ? "SMS 인증코드 발송"
                          : "Enviar código por SMS"}
                      </div>
                    )}
                  </Button>
                ) : smsCode.length < 6 ? (
                  <Button
                    disabled={true}
                    className="w-full bg-gray-400 text-white font-semibold py-3 text-lg"
                    size="lg"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      {language === "ko"
                        ? "6자리 코드를 입력하세요"
                        : "Ingrese el código de 6 dígitos"}
                    </div>
                  </Button>
                ) : (
                  <Button
                    onClick={handleVerifySmsCode}
                    disabled={smsCode.length !== 6 || isSmsVerifying}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    size="lg"
                  >
                    {isSmsVerifying ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {language === "ko" ? "인증 중..." : "Verificando..."}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {language === "ko" ? "인증하기" : "Verificar"}
                      </div>
                    )}
                  </Button>
                )}

                {/* 재발송 */}
                {smsCodeSent && (
                  <div className="text-center border-t pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {language === "ko"
                        ? "코드를 받지 못하셨나요?"
                        : "¿No recibiste el código?"}
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleResendSms}
                      disabled={isSmsVerifying || !smsCanResend}
                      className={`border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 ${
                        !smsCanResend ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {smsCanResend
                        ? language === "ko"
                          ? "코드 재발송"
                          : "Reenviar código"
                        : `${language === "ko" ? "코드 재발송" : "Reenviar código"} (${formatSmsTime(smsTimeLeft)})`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SMS 안내 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">
                    {language === "ko"
                      ? "SMS 인증 안내"
                      : "Información sobre la verificación por SMS"}
                  </h4>
                  <p className="text-sm text-green-700">
                    •{" "}
                    {language === "ko"
                      ? "SMS가 도착하지 않으면 전화번호를 확인해주세요."
                      : "Si no recibe el SMS, verifique su número de teléfono."}
                    <br />•{" "}
                    {language === "ko"
                      ? "해외 번호의 경우 수신까지 1~2분 소요될 수 있습니다."
                      : "Para números internacionales, puede tardar 1-2 minutos."}
                    <br />•{" "}
                    {language === "ko"
                      ? "코드는 5분간 유효합니다."
                      : "El código es válido por 5 minutos."}
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoBack}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === "ko" ? "뒤로" : "Atrás"}
            </Button>
          </div>
        );
      default:
        return (
          <form onSubmit={handleFormSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-slate-700 dark:text-gray-300"
              >
                {t("auth.name")}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                <Input
                  id="name"
                  type="text"
                  placeholder={t("auth.namePlaceholder")}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="pl-10 border-slate-200 dark:border-gray-600 focus:border-slate-400 dark:focus:border-gray-400 focus:ring-slate-400 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100"
                  style={{ paddingLeft: "2.5rem" }}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-slate-700 dark:text-gray-300"
              >
                {t("auth.email")}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`border-slate-200 dark:border-gray-600 focus:border-slate-400 dark:focus:border-gray-400 focus:ring-slate-400 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 ${
                    emailError
                      ? "border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-500"
                      : ""
                  }`}
                  style={{ paddingLeft: "2.2rem", paddingRight: "0.75rem" }}
                  required
                  title="올바른 이메일 주소를 입력해주세요"
                />
              </div>
              {emailError ? (
                <p className="text-xs text-red-500 dark:text-red-400">
                  {emailError}
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  {t("auth.emailLoginIdInfo")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="birthDate"
                className="text-sm font-medium text-slate-700 dark:text-gray-300"
              >
                {t("auth.birthDate")}
              </Label>
              <div className="relative">
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) =>
                    handleInputChange("birthDate", e.target.value)
                  }
                  className="border-slate-200 dark:border-gray-600 focus:border-slate-400 dark:focus:border-gray-400 focus:ring-slate-400 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100"
                  required
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {t("auth.birthDateHelp")}
              </p>
              {ageError && <p className="text-xs text-red-500">{ageError}</p>}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-slate-700 dark:text-gray-300"
              >
                {t("auth.password")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t("auth.passwordPlaceholder")}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={`border-slate-200 dark:border-gray-600 focus:border-slate-400 dark:focus:border-gray-400 focus:ring-slate-400 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 ${
                    formData.password && !isPasswordValid
                      ? "border-red-300 dark:border-red-500 focus:border-red-400 dark:focus:border-red-400 focus:ring-red-400 dark:focus:ring-red-400"
                      : ""
                  }`}
                  style={{ paddingLeft: "2.5rem" }}
                  required
                />
              </div>

              {/* 비밀번호 강도 표시 */}
              {formData.password && (
                <div className="space-y-1 text-xs">
                  <div
                    className={`flex items-center gap-2 ${passwordChecks.length ? "text-green-600" : "text-red-500"}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${passwordChecks.length ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                    {t("auth.passwordMinLength")}
                  </div>
                  <div
                    className={`flex items-center gap-2 ${passwordChecks.hasNumber ? "text-green-600" : "text-red-500"}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${passwordChecks.hasNumber ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                    {t("auth.passwordHasNumber")}
                  </div>
                  <div
                    className={`flex items-center gap-2 ${passwordChecks.hasSpecial ? "text-green-600" : "text-red-500"}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${passwordChecks.hasSpecial ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                    {t("auth.passwordHasSpecial")}
                  </div>
                  <div
                    className={`flex items-center gap-2 ${passwordChecks.noRepeated ? "text-green-600" : "text-red-500"}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${passwordChecks.noRepeated ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                    {t("auth.passwordNoRepeated")}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-slate-700 dark:text-gray-300"
              >
                {t("auth.confirmPassword")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className={`border-slate-200 dark:border-gray-600 focus:border-slate-400 dark:focus:border-gray-400 focus:ring-slate-400 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 ${
                    formData.confirmPassword &&
                    formData.password !== formData.confirmPassword
                      ? "border-red-300 dark:border-red-500 focus:border-red-400 dark:focus:border-red-400 focus:ring-red-400 dark:focus:ring-red-400"
                      : ""
                  }`}
                  style={{ paddingLeft: "2.5rem" }}
                  required
                />
              </div>
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-500">
                    {t("auth.passwordMismatch")}
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="country"
                className="text-sm font-medium text-slate-700 dark:text-gray-300"
              >
                {t("auth.nationality")}
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                <Select
                  value={formData.country}
                  onValueChange={handleCountryChange}
                  required
                >
                  <SelectTrigger className="pl-12 border-slate-200 dark:border-gray-600 focus:border-slate-400 dark:focus:border-gray-400 focus:ring-slate-400 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100">
                    <SelectValue placeholder={t("auth.selectNationality")} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {countries &&
                    Array.isArray(countries) &&
                    countries.length > 0 ? (
                      countries.map((country) => (
                        <SelectItem
                          key={country.code}
                          value={country.code}
                          className="hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-900 dark:text-gray-100"
                        >
                          {t(`auth.countries.${country.code}`) || country.code}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No countries available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 전화번호 (선택) */}
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-sm font-medium text-slate-700 dark:text-gray-300"
              >
                {language === "ko" ? "전화번호 (선택)" : "Teléfono (opcional)"}
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                <div className="flex gap-2">
                  <div className="w-24 flex-shrink-0">
                    <Input
                      type="text"
                      readOnly
                      value={
                        formData.country
                          ? countries.find((c) => c.code === formData.country)
                              ?.phoneCode || ""
                          : ""
                      }
                      placeholder="+00"
                      className="text-center border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-600 text-slate-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={
                      formData.isKorean ? "010-1234-5678" : "123456789"
                    }
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="border-slate-200 dark:border-gray-600 focus:border-slate-400 dark:focus:border-gray-400 focus:ring-slate-400 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {language === "ko"
                  ? "SMS 인증에 사용됩니다. 입력하면 보안이 강화됩니다."
                  : "Se usará para verificación por SMS. Ingresar mejora la seguridad."}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 dark:bg-gray-700 hover:bg-slate-800 dark:hover:bg-gray-600 text-white py-3 text-lg font-medium transition-colors"
              disabled={
                isLoading ||
                !formData.name ||
                !formData.email ||
                !formData.password ||
                !formData.confirmPassword ||
                !formData.country ||
                !formData.birthDate ||
                !isPasswordValid ||
                formData.password !== formData.confirmPassword ||
                !!ageError ||
                !!emailError
              }
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t("auth.checking")}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{t("auth.nextStep")}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-3 sm:p-4 pt-32 sm:pt-44">
      <div className="flex justify-center">
        <Card className="w-full max-w-md bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
          {currentStep === "form" && (
            <>
              <CardHeader className="text-center space-y-3 sm:space-y-4 pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-gray-100">
                  {t("auth.signUp")}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-slate-600 dark:text-gray-400">
                  {t("auth.signUpDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* 구글 로그인 버튼 */}
                {currentStep === "form" && (
                  <div className="mb-6">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-2 border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-900 dark:text-gray-100 py-3 text-base font-medium transition-colors"
                      onClick={async () => {
                        try {
                          setIsLoading(true);
                          await signInWithGoogle();
                        } catch (error) {
                          console.error("Google 로그인 실패:", error);
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                    >
                      <div className="flex items-center justify-center gap-3">
                        {/* 구글 아이콘 SVG */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        <span>
                          {language === "ko"
                            ? "Google로 계속하기"
                            : "Continuar con Google"}
                        </span>
                      </div>
                    </Button>
                    {/* 구분선 */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-300 dark:border-gray-600"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-gray-800 px-2 text-slate-500 dark:text-gray-400">
                          {language === "ko" ? "또는" : "o"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {renderStep()}
                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-600 dark:text-gray-400">
                    {t("auth.alreadyHaveAccount")}{" "}
                    <a
                      href="/sign-in"
                      onClick={() => {
                        try {
                          trackCTAClick(
                            "signup_to_signin_link",
                            window.location.href,
                          );
                        } catch (e) {
                          console.error(
                            "[SIGNUP] trackCTAClick 이벤트 오류:",
                            e,
                          );
                        }
                      }}
                      className="text-slate-900 dark:text-gray-100 hover:text-slate-700 dark:hover:text-gray-300 font-medium"
                    >
                      {t("auth.signIn")}
                    </a>
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === "verify-choice" && (
            <>
              <CardHeader className="text-center space-y-3 sm:space-y-4 pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-gray-100">
                  {language === "ko"
                    ? "본인 인증"
                    : "Verificación de identidad"}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-slate-600 dark:text-gray-400">
                  {language === "ko"
                    ? "인증 방법을 선택해주세요."
                    : "Seleccione un método de verificación."}
                </CardDescription>
              </CardHeader>
              <CardContent>{renderStep()}</CardContent>
            </>
          )}

          {currentStep === "email" && (
            <>
              <CardHeader className="text-center space-y-3 sm:space-y-4 pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-gray-100">
                  {t("auth.emailVerification")}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-slate-600 dark:text-gray-400">
                  {language === "ko"
                    ? "이메일로 발송된 인증코드를 입력해주세요."
                    : "Ingrese el código de verificación enviado por correo electrónico."}
                </CardDescription>
              </CardHeader>
              <CardContent>{renderStep()}</CardContent>
            </>
          )}

          {currentStep === "sms" && (
            <>
              <CardHeader className="text-center space-y-3 sm:space-y-4 pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-gray-100">
                  {language === "ko"
                    ? "전화번호 인증"
                    : "Verificación de teléfono"}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-slate-600 dark:text-gray-400">
                  {language === "ko"
                    ? "SMS로 발송된 인증코드를 입력해주세요."
                    : "Ingrese el código de verificación enviado por SMS."}
                </CardDescription>
              </CardHeader>
              <CardContent>{renderStep()}</CardContent>
            </>
          )}

          {currentStep === "complete" && (
            <CardContent className="p-6">{renderStep()}</CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
