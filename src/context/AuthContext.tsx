"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { trackRevisit } from "@/lib/analytics";
import { Capacitor } from "@capacitor/core";

interface ExtendedUser extends User {
  is_admin?: boolean;
  is_korean?: boolean;
  full_name?: string;
}

interface AuthContextType {
  user: ExtendedUser | null;
  session: Session | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signInWithGoogle: () => Promise<{ error: unknown }>;
  signUp: (email: string, password: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

// Stable empty error result to avoid recreating objects
const NO_SUPABASE_ERROR = {
  error: new Error("Supabase 클라이언트가 초기화되지 않음"),
} as const;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabase, setSupabase] = useState<ReturnType<
    typeof createSupabaseBrowserClient
  > | null>(null);

  // 사용자 프로필 정보 (is_admin 포함) 가져오기
  const fetchUserProfile = async (
    baseUser: User,
  ): Promise<ExtendedUser | null> => {
    try {
      console.log("[AUTH] 사용자 프로필 정보 가져오기:", baseUser.email);
      const response = await fetch(`/api/profile?userId=${baseUser.id}`);
      const result = await response.json();

      if (response.ok && result.user) {
        console.log("[AUTH] 프로필 정보:", {
          is_admin: result.user.is_admin,
          is_korean: result.user.is_korean,
          full_name: result.user.full_name,
        });

        return {
          ...baseUser,
          is_admin: result.user.is_admin || false,
          is_korean: result.user.is_korean || false,
          full_name: result.user.full_name || baseUser.user_metadata?.name,
        };
      } else if (response.status === 404) {
        // public.users에 사용자가 없음 (삭제된 계정)
        console.warn(
          "[AUTH] 프로필이 없음 (404) - 삭제된 계정일 수 있음:",
          baseUser.email,
        );
        return null;
      }
    } catch (error) {
      console.error("[AUTH] 프로필 정보 가져오기 실패:", error);
    }

    // 실패 시 null 반환 (프로필이 없음을 의미)
    return null;
  };

  // 사용자 프로필 언어 가져오기
  const fetchUserLanguage = async (userId: string) => {
    try {
      const response = await fetch(`/api/profile?userId=${userId}`);
      const result = await response.json();

      if (response.ok && result.user?.language) {
        console.log("[AUTH] 사용자 프로필 언어:", result.user.language);
        // LanguageContext의 setUserLanguage 함수 호출 (동적 import)
        if (typeof window !== "undefined") {
          import("./LanguageContext").then(({ useLanguage }) => {
            // 이 방법은 컴포넌트 외부에서는 사용할 수 없으므로
            // localStorage를 통해 언어 설정을 전달
            localStorage.setItem("amiko-user-language", result.user.language);
          });
        }
      }
    } catch (error) {
      console.error("[AUTH] 사용자 언어 가져오기 실패:", error);
    }
  };

  // 클라이언트에서만 Supabase 클라이언트 생성
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    try {
      // 환경 변수가 설정된 경우에만 Supabase 클라이언트 생성
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        const client = createSupabaseBrowserClient();
        setSupabase(client as any);
        console.log("[AUTH] Supabase 클라이언트 생성 완료 (쿠키 지원)");
      } else {
        console.log(
          "[AUTH] Supabase 환경 변수가 설정되지 않았습니다. 인증 기능이 비활성화됩니다.",
        );
        setSupabase(null);
        setLoading(false);
      }
    } catch (err) {
      console.error("[AUTH] Supabase 클라이언트 생성 실패:", err);
      setError("Supabase 클라이언트를 초기화할 수 없습니다.");
      setSupabase(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // supabase 클라이언트가 없으면 로딩 완료
    if (!supabase) {
      setLoading(false);
      return;
    }

    // 초기 세션 가져오기 및 복구
    const initializeAuth = async () => {
      try {
        console.log("[AUTH] 인증 초기화 시작");

        // 먼저 로컬 스토리지에서 세션 복구 시도
        const savedSession = localStorage.getItem("amiko_session");
        if (savedSession) {
          try {
            const sessionData = JSON.parse(savedSession);
            const now = Math.floor(Date.now() / 1000);

            if (sessionData.expires_at > now) {
              console.log(
                "[AUTH] 로컬 세션으로 인증 상태 복구:",
                sessionData.user.email,
              );

              // 프로필 정보 포함하여 user 설정
              const extendedUser = await fetchUserProfile(sessionData.user);
              setUser(extendedUser);
              setSession({
                user: sessionData.user,
                expires_at: sessionData.expires_at,
              } as Session);

              // Revisit tracking for returning users
              trackRevisit();

              // 백그라운드에서 Supabase 세션 확인 및 갱신
              setTimeout(async () => {
                try {
                  const {
                    data: { session },
                    error,
                  } = await supabase.auth.getSession();

                  if (error) {
                    // Refresh token 에러는 조용히 처리
                    if (error.message?.includes("Refresh Token")) {
                      console.log(
                        "[AUTH] Refresh token 만료됨, 로컬 세션 유지",
                      );
                    } else {
                      console.log(
                        "[AUTH] Supabase 세션 확인 실패:",
                        error.message,
                      );
                    }
                    return;
                  }

                  if (session) {
                    console.log("[AUTH] Supabase 세션 확인됨, 상태 동기화");
                    setSession(session);

                    // 프로필 정보 포함하여 user 설정
                    const extendedUser = await fetchUserProfile(session.user);
                    setUser(extendedUser);

                    // 로컬 스토리지 업데이트
                    const extendedExpiry =
                      session.expires_at + 30 * 24 * 60 * 60;
                    localStorage.setItem(
                      "amiko_session",
                      JSON.stringify({
                        user: session.user,
                        expires_at: extendedExpiry,
                        original_expires_at: session.expires_at,
                      }),
                    );
                  } else {
                    console.log("[AUTH] Supabase 세션 없음, 로컬 세션 유지");
                  }
                } catch (error) {
                  console.log(
                    "[AUTH] Supabase 세션 확인 중 예외, 로컬 세션 유지",
                  );
                }
              }, 1000);

              console.log("[AUTH] 로컬 세션으로 인증 상태 복구 완료");
              setLoading(false);
              return;
            } else {
              console.log("[AUTH] 로컬 세션 만료됨, 제거");
              localStorage.removeItem("amiko_session");
            }
          } catch (error) {
            console.error("[AUTH] 로컬 세션 파싱 오류:", error);
            localStorage.removeItem("amiko_session");
          }
        }

        // 로컬 세션이 없으면 Supabase에서 세션 확인
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        console.log("[AUTH] Supabase 세션 확인:", session ? "있음" : "없음");

        if (session && !error) {
          console.log("[AUTH] Supabase 세션으로 인증 상태 설정");
          setSession(session);

          // 프로필 정보 포함하여 user 설정
          const extendedUser = await fetchUserProfile(session.user);

          if (!extendedUser) {
            // 프로필이 없으면 public.users에 사용자가 없음 (삭제된 계정)
            console.warn(
              "[AUTH] 프로필이 없음 - auth.users에만 존재하는 orphaned 계정 감지",
            );
            console.log("[AUTH] 세션 무효화 및 auth.users에서 삭제 시도");

            // 세션 무효화 및 auth.users에서 삭제를 위한 API 호출
            try {
              const cleanupResponse = await fetch(
                "/api/auth/cleanup-orphaned-session",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: session.user.id }),
                },
              );

              if (cleanupResponse.ok) {
                console.log("[AUTH] Orphaned 세션 정리 완료");
              } else {
                console.error("[AUTH] Orphaned 세션 정리 실패");
              }
            } catch (cleanupError) {
              console.error("[AUTH] Orphaned 세션 정리 중 오류:", cleanupError);
            }

            // 세션 무효화 및 로그아웃
            await supabase.auth.signOut();
            localStorage.removeItem("amiko_session");
            setSession(null);
            setUser(null);
            console.log("[AUTH] 세션 무효화 완료");
          } else {
            setUser(extendedUser);

            // 사용자 프로필 언어 가져오기
            await fetchUserLanguage(session.user.id);

            // 로컬 스토리지에 저장 (더 긴 만료시간으로)
            const extendedExpiry = session.expires_at + 30 * 24 * 60 * 60; // 30일 추가
            localStorage.setItem(
              "amiko_session",
              JSON.stringify({
                user: session.user,
                expires_at: extendedExpiry,
                original_expires_at: session.expires_at,
              }),
            );
            console.log("[AUTH] 세션을 로컬 스토리지에 저장 (30일 연장)");
          }
        } else {
          // Supabase 세션이 없으면 로컬 스토리지도 정리
          console.log("[AUTH] Supabase 세션 없음, 로컬 스토리지 정리");
          localStorage.removeItem("amiko_session");
        }

        setLoading(false);
      } catch (error) {
        console.error("[AUTH] 인증 초기화 실패:", error);
        setError("인증 초기화 중 오류가 발생했습니다.");
        setLoading(false);
      }
    };

    initializeAuth();

    // 인증 상태 변경 감지 - 무한 루프 방지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        // 중요한 이벤트만 로그
        if (
          event === "SIGNED_IN" ||
          event === "SIGNED_OUT" ||
          event === "TOKEN_REFRESHED"
        ) {
          console.log("[AUTH] 인증 상태 변경:", event);
        }

        // Refresh token 에러로 인한 SIGNED_OUT은 무시하고 로컬 세션 유지
        if (event === "SIGNED_OUT" && !session) {
          const savedSession = localStorage.getItem("amiko_session");
          if (savedSession) {
            try {
              const sessionData = JSON.parse(savedSession);
              const now = Math.floor(Date.now() / 1000);

              // 로컬 세션이 아직 유효하면 유지
              if (sessionData.expires_at > now) {
                console.log(
                  "[AUTH] Refresh token 만료로 인한 SIGNED_OUT, 로컬 세션 유지",
                );
                setLoading(false);
                return;
              }
            } catch (error) {
              // 파싱 에러는 무시하고 정상 처리
            }
          }
        }

        if (session) {
          // 세션 설정
          setSession(session);

          // 프로필 정보 포함하여 user 설정
          const extendedUser = await fetchUserProfile(session.user);
          setUser(extendedUser);

          // 로컬 스토리지 업데이트 (간소화)
          const extendedExpiry = session.expires_at + 30 * 24 * 60 * 60;
          localStorage.setItem(
            "amiko_session",
            JSON.stringify({
              user: session.user,
              expires_at: extendedExpiry,
              original_expires_at: session.expires_at,
            }),
          );

          // 토큰 저장 (OAuth 로그인 포함)
          localStorage.setItem("amiko_token", session.access_token);

          // Revisit tracking for returning users
          trackRevisit();
        } else {
          // 세션 정리
          setUser(null);
          setSession(null);
          localStorage.removeItem("amiko_session");
        }

        setLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      console.log("[AUTH] 로그인 시도:", {
        email,
        passwordLength: password.length,
      });

      if (!supabase) {
        console.error("[AUTH] Supabase 클라이언트가 초기화되지 않음");
        return NO_SUPABASE_ERROR;
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("[AUTH] 로그인 실패:", error);

          // 로컬 스토리지 초기화 (사용자가 삭제된 경우)
          if (error.message.includes("Invalid login credentials")) {
            try {
              localStorage.removeItem("sb-abrxigfmuebrnyzkfcyr-auth-token");
              localStorage.removeItem("amiko_session");
              console.log("[AUTH] 로컬 스토리지 초기화 완료");
            } catch (e) {
              console.warn("[AUTH] 로컬 스토리지 초기화 실패:", e);
            }
          }

          return { error };
        }

        if (data.session && data.user) {
          console.log("[AUTH] 로그인 성공:", data.user.email);

          // 세션 설정
          setSession(data.session);

          // 프로필 정보 포함하여 user 설정
          const extendedUser = await fetchUserProfile(data.user);
          setUser(extendedUser);

          // 로컬 스토리지에 세션 저장 (30일 연장)
          const extendedExpiry = data.session.expires_at + 30 * 24 * 60 * 60; // 30일 추가
          localStorage.setItem(
            "amiko_session",
            JSON.stringify({
              user: data.user,
              expires_at: extendedExpiry,
              original_expires_at: data.session.expires_at,
            }),
          );

          // 토큰도 별도로 저장 (verification 페이지에서 사용)
          localStorage.setItem("amiko_token", data.session.access_token);

          // Revisit tracking for returning users
          trackRevisit();

          console.log(
            "[AUTH] 세션과 토큰을 로컬 스토리지에 저장 완료 (30일 연장)",
          );
        }

        return { data, error: null };
      } catch (err) {
        console.error("[AUTH] 로그인 예외 발생:", err);
        return { error: err };
      }
    },
    [supabase],
  );

  const signInWithGoogle = useCallback(async () => {
    console.log("[AUTH] Google 로그인 시도");

    if (!supabase) {
      console.error("[AUTH] Supabase 클라이언트가 초기화되지 않음");
      return NO_SUPABASE_ERROR;
    }

    try {
      const isNative = Capacitor.isNativePlatform();
      console.log("[AUTH] 플랫폼 감지:", isNative ? "네이티브" : "웹");

      if (isNative) {
        console.log("[AUTH] 네이티브 플랫폼에서 Google 로그인 시도");

        try {
          // 네이티브 Google Auth 플러그인 사용
          const { GoogleAuth } =
            await import("@codetrix-studio/capacitor-google-auth");

          // 플러그인 초기화 확인
          console.log("[AUTH] Google Auth 플러그인 로드됨");

          const googleUser = await GoogleAuth.signIn();
          console.log("[AUTH] 네이티브 Google 로그인 성공:", {
            email: googleUser.email,
            name: googleUser.name,
            id: googleUser.id,
          });

          // Google 토큰을 Supabase 세션으로 교환
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: googleUser.authentication.idToken,
          });

          if (error) {
            console.error("[AUTH] Supabase 세션 교환 실패:", error);
            return { error };
          }

          console.log("[AUTH] 네이티브 Google 로그인 완료, 세션 생성됨");
          return { error: null };
        } catch (nativeError) {
          console.error(
            "[AUTH] 네이티브 Google 로그인 실패, 웹 OAuth로 폴백:",
            nativeError,
          );

          // 네이티브 실패 시 웹 OAuth로 폴백
          console.log("[AUTH] 웹 OAuth 폴백 시도");

          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: "amiko://auth/callback",
            },
          });

          if (error) {
            console.error("[AUTH] 웹 OAuth 폴백도 실패:", error);
            return { error };
          }

          console.log("[AUTH] 웹 OAuth 폴백 성공");
          return { error: null };
        }
      } else {
        // 웹에서는 기존 OAuth 플로우 사용
        console.log("[AUTH] 웹 플랫폼에서 Google OAuth 시도");

        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          console.error("[AUTH] 웹 Google 로그인 실패:", error);
          return { error };
        }

        console.log("[AUTH] 웹 Google OAuth 리다이렉트 시작");
        return { error: null };
      }
    } catch (error) {
      console.error("[AUTH] Google 로그인 예외:", error);
      return { error };
    }
  }, [supabase]);

  const signUp = useCallback(
    async (email: string, password: string) => {
      console.log("[AUTH] 회원가입 시도:", {
        email,
        passwordLength: password.length,
      });

      if (!supabase) {
        console.error("[AUTH] Supabase 클라이언트가 초기화되지 않음");
        return NO_SUPABASE_ERROR;
      }

      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          console.error("[AUTH] 회원가입 실패:", error);
          return { error };
        }

        console.log("[AUTH] 회원가입 성공");
        return { error: null };
      } catch (err) {
        console.error("[AUTH] 회원가입 예외 발생:", err);
        return { error: err };
      }
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    console.log("[AUTH] 로그아웃 시작");

    // 1. 서버 측 쿠키 삭제를 위해 로그아웃 API 호출
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      console.log("[AUTH] 서버 측 로그아웃 완료");
    } catch (error) {
      console.error("[AUTH] 서버 측 로그아웃 오류:", error);
    }

    // 2. 클라이언트 측 Supabase 로그아웃
    if (supabase) {
      try {
        await supabase.auth.signOut();
        console.log("[AUTH] 클라이언트 측 Supabase 로그아웃 완료");
      } catch (error) {
        console.error("[AUTH] 클라이언트 측 Supabase 로그아웃 오류:", error);
      }
    }

    // 3. 사용자 상태 초기화
    setUser(null);
    setSession(null);
    setLoading(false);

    // 4. 모든 스토리지 정리
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();

      // Supabase 관련 쿠키도 명시적으로 삭제 시도
      document.cookie.split(";").forEach((c) => {
        const cookieName = c.trim().split("=")[0];
        if (cookieName.includes("supabase") || cookieName.includes("sb-")) {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
        }
      });
    }

    console.log("[AUTH] 로그아웃 완료, 상태 초기화됨");

    // 5. 로그인 페이지로 리다이렉트 (새로고침 대신)
    if (typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }
  }, [supabase]);

  // 세션 복구 함수
  const refreshSession = useCallback(async () => {
    if (!supabase) {
      console.error("[AUTH] Supabase 클라이언트가 초기화되지 않음");
      return false;
    }

    try {
      console.log("[AUTH] 세션 갱신 시도...");
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();

      if (session && !error) {
        console.log("[AUTH] 세션 갱신 성공");
        setSession(session);

        // 프로필 정보 포함하여 user 설정
        const extendedUser = await fetchUserProfile(session.user);
        setUser(extendedUser);

        // 로컬 스토리지 업데이트 (30일 연장)
        const extendedExpiry = session.expires_at + 30 * 24 * 60 * 60;
        localStorage.setItem(
          "amiko_session",
          JSON.stringify({
            user: session.user,
            expires_at: extendedExpiry,
            original_expires_at: session.expires_at,
          }),
        );

        // 토큰도 업데이트
        localStorage.setItem("amiko_token", session.access_token);

        console.log("[AUTH] 세션 갱신 완료 - 로컬 스토리지 업데이트됨");
        return true;
      } else {
        console.log("[AUTH] 세션 갱신 실패:", error?.message);
        return false;
      }
    } catch (error) {
      console.error("[AUTH] 세션 갱신 오류:", error);
      return false;
    }
  }, [supabase]);

  // Derive token stably
  const token = session?.access_token || null;

  const value = useMemo(
    () => ({
      user,
      session,
      token,
      loading,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      refreshSession,
    }),
    [
      user,
      session,
      token,
      loading,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      refreshSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
