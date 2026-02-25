"use client";

import { useState, useEffect } from "react";
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
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { countries, getCountryByCode } from "@/constants/countries";
import { ArrowRight, Globe, Shield } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
export default function CompleteProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [formData, setFormData] = useState({
    birthDate: "",
    country: "",
    termsAgreed: false,
  });
  const [ageError, setAgeError] = useState<string | null>(null);

  // 세션 확인 (Google OAuth 직후 프로필이 없을 수 있으므로 세션만 확인)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (session && !error) {
          setHasSession(true);
        } else {
          // 세션이 없으면 로그인 페이지로 리다이렉트
          router.push("/sign-in");
        }
      } catch (error) {
        console.error("세션 확인 오류:", error);
        router.push("/sign-in");
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [router]);

  // 나이 계산 함수
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

  // 생년월일 변경 핸들러
  const handleBirthDateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, birthDate: value }));
    setAgeError(null);

    if (value) {
      const age = calculateAge(value);
      if (age === null) {
        setAgeError(
          language === "ko"
            ? "유효한 생년월일을 입력해주세요."
            : "Por favor ingrese una fecha de nacimiento válida.",
        );
      } else if (age < 13) {
        setAgeError(
          language === "ko"
            ? "만 13세 미만의 사용자는 보호자 동의 없이 가입할 수 없습니다."
            : "Los usuarios menores de 13 años no pueden registrarse sin el consentimiento de los padres.",
        );
      }
    }
  };

  // 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 유효성 검증
      if (!formData.birthDate) {
        throw new Error(
          language === "ko"
            ? "생년월일을 입력해주세요."
            : "Por favor ingrese su fecha de nacimiento.",
        );
      }

      if (!formData.country) {
        throw new Error(
          language === "ko"
            ? "국가를 선택해주세요."
            : "Por favor seleccione su país.",
        );
      }

      if (!formData.termsAgreed) {
        throw new Error(
          language === "ko"
            ? "약관에 동의해주세요."
            : "Por favor acepte los términos y condiciones.",
        );
      }

      const age = calculateAge(formData.birthDate);
      if (age === null) {
        throw new Error(
          language === "ko"
            ? "유효한 생년월일을 입력해주세요."
            : "Por favor ingrese una fecha de nacimiento válida.",
        );
      }

      if (age < 13) {
        throw new Error(
          language === "ko"
            ? "만 13세 미만의 사용자는 보호자 동의 없이 가입할 수 없습니다."
            : "Los usuarios menores de 13 años no pueden registrarse sin el consentimiento de los padres.",
        );
      }

      const selectedCountry = getCountryByCode(formData.country);
      if (!selectedCountry) {
        throw new Error(
          language === "ko"
            ? "유효한 국가를 선택해주세요."
            : "Por favor seleccione un país válido.",
        );
      }

      // 프로필 완성 API 호출
      const response = await fetch("/api/auth/complete-google-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate: formData.birthDate,
          country: formData.country,
          isKorean: selectedCountry.isKorean,
          termsAgreed: formData.termsAgreed,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            (language === "ko"
              ? "프로필 완성에 실패했습니다."
              : "Error al completar el perfil"),
        );
      }

      console.log("프로필 완성 성공:", result);

      // 프로필 완성 후 메인 페이지로 리다이렉트
      // 인증센터는 사용자가 직접 "인증하기" 버튼을 눌렀을 때만 이동
      router.push("/main");
    } catch (error) {
      console.error("프로필 완성 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : language === "ko"
            ? "프로필 완성 중 오류가 발생했습니다."
            : "Error al completar el perfil",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 세션 확인 중이거나 세션이 없으면 로딩 표시
  if (isCheckingSession || !hasSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          {language === "ko" ? "로딩 중..." : "Cargando..."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {language === "ko" ? "추가 정보 입력" : "Información Adicional"}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {language === "ko"
              ? "서비스 이용을 위해 추가 정보를 입력해주세요."
              : "Por favor ingrese información adicional para usar el servicio."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 생년월일 */}
            <div>
              <Label
                htmlFor="birthDate"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block"
              >
                {language === "ko" ? "생년월일 *" : "Fecha de Nacimiento *"}
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleBirthDateChange(e.target.value)}
                className={ageError ? "border-red-500" : ""}
                max={
                  new Date(
                    new Date().setFullYear(new Date().getFullYear() - 13),
                  )
                    .toISOString()
                    .split("T")[0]
                }
              />
              {ageError && (
                <p className="text-sm text-red-500 mt-1">{ageError}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {language === "ko"
                  ? "만 13세 이상만 가입 가능합니다."
                  : "Solo usuarios mayores de 13 años pueden registrarse."}
              </p>
            </div>

            {/* 국가 선택 */}
            <div>
              <Label
                htmlFor="country"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block"
              >
                {language === "ko" ? "국가 *" : "País *"}
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                <Select
                  value={formData.country}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, country: value }))
                  }
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue
                      placeholder={
                        language === "ko"
                          ? "국가를 선택해주세요"
                          : "Seleccione su país"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {language === "ko"
                          ? country.code === "KR"
                            ? "한국"
                            : country.code === "MX"
                              ? "멕시코"
                              : country.code
                          : country.code === "KR"
                            ? "Corea"
                            : country.code === "MX"
                              ? "México"
                              : country.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 약관 동의 */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="termsAgreed"
                  checked={formData.termsAgreed}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      termsAgreed: e.target.checked,
                    }))
                  }
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label
                  htmlFor="termsAgreed"
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {language === "ko" ? (
                    <>
                      <a
                        href="/terms"
                        className="text-blue-600 hover:underline"
                      >
                        이용약관
                      </a>
                      {" 및 "}
                      <a
                        href="/privacy"
                        className="text-blue-600 hover:underline"
                      >
                        개인정보 처리방침
                      </a>
                      {"에 동의합니다."}
                    </>
                  ) : (
                    <>
                      Acepto los{" "}
                      <a
                        href="/terms"
                        className="text-blue-600 hover:underline"
                      >
                        Términos de Uso
                      </a>
                      {" y la "}
                      <a
                        href="/privacy"
                        className="text-blue-600 hover:underline"
                      >
                        Política de Privacidad
                      </a>
                      .
                    </>
                  )}
                </Label>
              </div>
            </div>

            {/* 제출 버튼 */}
            <Button
              type="submit"
              disabled={
                isLoading ||
                !formData.birthDate ||
                !formData.country ||
                !formData.termsAgreed ||
                !!ageError
              }
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {language === "ko" ? "처리 중..." : "Procesando..."}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {language === "ko" ? "완료" : "Completar"}
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
