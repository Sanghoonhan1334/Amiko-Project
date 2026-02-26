// 모듈 로딩 시점 로그 (가장 먼저 실행)
if (process.env.NODE_ENV === "development" && typeof console !== "undefined") {
  console.log("[VERIFY_START] 🔥 모듈 로드 완료 - TOP LEVEL");
}

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// OTP 전송 시작 API - 단계적 테스트 버전
export async function POST(request: NextRequest) {
  // 즉시 로그 출력 (함수 진입 확인용)
  if (typeof console !== "undefined") {
    console.log("[VERIFY_START] ========================================");
    console.log("[VERIFY_START] STEP 1: 함수 진입 성공!");
    console.log("[VERIFY_START] Request URL:", request.url);
    console.log("[VERIFY_START] Request Method:", request.method);
    console.log("[VERIFY_START] ========================================");
  }

  try {
    // STEP 2: 요청 본문 파싱 (안전하게)
    if (typeof console !== "undefined") {
      console.log("[VERIFY_START] STEP 2: 요청 본문 파싱 시작");
    }

    let body: any;
    try {
      const text = await request.text();
      if (typeof console !== "undefined") {
        console.log(
          "[VERIFY_START] STEP 2: 요청 본문 텍스트 받음:",
          text?.substring(0, 100),
        );
      }

      if (!text || text.trim() === "") {
        if (typeof console !== "undefined") {
          console.error("[VERIFY_START] STEP 2 에러: 요청 본문이 비어있음");
        }
        return NextResponse.json(
          {
            ok: false,
            error: "EMPTY_REQUEST_BODY",
            message: "요청 본문이 비어있습니다.",
          },
          { status: 400 },
        );
      }

      body = JSON.parse(text);
      if (typeof console !== "undefined") {
        console.log("[VERIFY_START] STEP 2 완료:", {
          channel: body?.channel,
          target: body?.target?.substring(0, 5) + "...",
        });
      }
    } catch (jsonError) {
      if (typeof console !== "undefined") {
        console.error("[VERIFY_START] STEP 2 에러: JSON 파싱 실패!", jsonError);
      }
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_JSON",
          message: "요청 본문 형식이 올바르지 않습니다.",
          detail:
            jsonError instanceof Error ? jsonError.message : String(jsonError),
        },
        { status: 400 },
      );
    }

    let { channel, target, nationality, purpose } = body;

    // STEP 3: 입력 유효성 검사
    if (!channel || !target) {
      if (typeof console !== "undefined") {
        console.error("[VERIFY_START] STEP 3 에러: 필수 필드 누락!", {
          channel,
          target,
        });
      }
      return NextResponse.json(
        {
          ok: false,
          error: "MISSING_REQUIRED_FIELDS",
          message: "채널과 대상이 필요합니다.",
        },
        { status: 400 },
      );
    }

    // 채널 정규화 (wa -> whatsapp)
    if (channel === "wa") {
      channel = "whatsapp";
      if (typeof console !== "undefined") {
        console.log("[VERIFY_START] STEP 3: 채널 정규화 (wa -> whatsapp)");
      }
    }

    // 지원하는 채널 확인 (SMS, WhatsApp, Email 모두 지원)
    if (channel !== "whatsapp" && channel !== "sms" && channel !== "email") {
      if (typeof console !== "undefined") {
        console.error("[VERIFY_START] STEP 3 에러: 지원하지 않는 채널!", {
          channel,
        });
      }
      return NextResponse.json(
        {
          ok: false,
          error: "UNSUPPORTED_CHANNEL",
          message: "SMS, WhatsApp 또는 Email만 지원됩니다.",
        },
        { status: 400 },
      );
    }

    if (typeof console !== "undefined") {
      console.log("[VERIFY_START] STEP 3 완료: 입력 유효성 검사 통과", {
        channel,
        target: target?.substring(0, 10) + "...",
      });
    }

    // STEP 4: 대상 정규화 (전화번호 또는 이메일)
    if (typeof console !== "undefined") {
      console.log("[VERIFY_START] STEP 4: 대상 정규화 시작");
    }
    let normalizedTarget = target;

    // 이메일 채널인 경우 이메일 형식 검증만 수행
    if (channel === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(target)) {
        if (typeof console !== "undefined") {
          console.error(
            "[VERIFY_START] STEP 4 에러: 유효하지 않은 이메일 형식",
          );
        }
        return NextResponse.json(
          {
            ok: false,
            error: "INVALID_EMAIL_FORMAT",
            message: "유효하지 않은 이메일 형식입니다.",
          },
          { status: 400 },
        );
      }
      normalizedTarget = target.toLowerCase().trim(); // 이메일은 소문자로 정규화
      if (typeof console !== "undefined") {
        console.log("[VERIFY_START] STEP 4 완료: 이메일 정규화", {
          original: target,
          normalized: normalizedTarget,
        });
      }
    } else {
      // 전화번호 정규화 (SMS/WhatsApp)
      try {
        const { toE164 } = await import("@/lib/phoneUtils");
        normalizedTarget = toE164(target, nationality);
        if (!normalizedTarget.startsWith("+")) {
          return NextResponse.json(
            {
              ok: false,
              error: "INVALID_PHONE_NUMBER_FORMAT",
              message: "유효하지 않은 전화번호 형식입니다.",
            },
            { status: 400 },
          );
        }
        if (typeof console !== "undefined") {
          console.log("[VERIFY_START] STEP 4 완료: 전화번호 정규화", {
            original: target,
            normalized: normalizedTarget,
          });
        }
      } catch (phoneError) {
        if (typeof console !== "undefined") {
          console.error("[VERIFY_START] STEP 4 에러:", phoneError);
        }
        return NextResponse.json(
          {
            ok: false,
            error: "PHONE_NUMBER_NORMALIZATION_FAILED",
            message: "전화번호 정규화에 실패했습니다.",
          },
          { status: 400 },
        );
      }
    }

    // STEP 5: 인증코드 생성
    if (typeof console !== "undefined") {
      console.log("[VERIFY_START] STEP 5: 인증코드 생성");
    }
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    if (typeof console !== "undefined") {
      console.log("[VERIFY_START] STEP 5 완료:", { code: verificationCode });
    }

    // STEP 6: 인증코드 발송 (SMS, WhatsApp 또는 Email)
    if (typeof console !== "undefined") {
      console.log(`[VERIFY_START] STEP 6: ${channel.toUpperCase()} 발송 시작`);
      console.log("[VERIFY_START] 동적 import 시작...");
    }

    let sendSuccess = false;
    try {
      // 언어 설정 (이메일은 nationality 또는 기본값 사용, 전화번호는 국가코드 기준)
      let language: "ko" | "es" = "es"; // 기본값: 스페인어
      if (channel === "email") {
        language = nationality === "KR" ? "ko" : "es";
      } else {
        language = normalizedTarget.startsWith("+82") ? "ko" : "es";
      }

      if (channel === "sms") {
        // SMS 발송
        const { sendVerificationSMS } = await import("@/lib/smsService");
        if (typeof console !== "undefined") {
          console.log("[VERIFY_START] sendVerificationSMS import 성공");
          console.log("[VERIFY_START] SMS 발송 호출:", {
            to: normalizedTarget,
            code: verificationCode,
            language,
            nationality,
          });
        }

        sendSuccess = await sendVerificationSMS(
          normalizedTarget,
          verificationCode,
          language,
          nationality,
        );
        if (typeof console !== "undefined") {
          console.log("[VERIFY_START] SMS 발송 결과:", sendSuccess);
        }
      } else if (channel === "whatsapp") {
        // WhatsApp 발송
        const { sendVerificationWhatsApp } = await import("@/lib/smsService");
        if (typeof console !== "undefined") {
          console.log("[VERIFY_START] sendVerificationWhatsApp import 성공");
          console.log("[VERIFY_START] WhatsApp 발송 호출:", {
            to: normalizedTarget,
            code: verificationCode,
            language,
          });
        }

        sendSuccess = await sendVerificationWhatsApp(
          normalizedTarget,
          verificationCode,
          language,
        );
        if (typeof console !== "undefined") {
          console.log("[VERIFY_START] WhatsApp 발송 결과:", sendSuccess);
        }
      } else if (channel === "email") {
        // Email 발송
        const { sendVerificationEmail } = await import("@/lib/emailService");
        if (typeof console !== "undefined") {
          console.log("[VERIFY_START] sendVerificationEmail import 성공");
          console.log("[VERIFY_START] Email 발송 호출:", {
            to: normalizedTarget,
            code: verificationCode,
            language,
            purpose: purpose || "signup",
          });
        }

        const emailPurpose: "signup" | "passwordReset" =
          purpose === "passwordReset" ? "passwordReset" : "signup";
        sendSuccess = await sendVerificationEmail(
          normalizedTarget,
          verificationCode,
          language,
          emailPurpose,
        );
        if (typeof console !== "undefined") {
          console.log("[VERIFY_START] Email 발송 결과:", sendSuccess);
        }
      }
    } catch (sendError) {
      if (typeof console !== "undefined") {
        console.error(
          `[VERIFY_START] STEP 6 에러: ${channel.toUpperCase()} 발송 중 예외 발생!`,
          sendError,
        );
      }
      return NextResponse.json(
        {
          ok: false,
          error: `${channel.toUpperCase()}_SEND_EXCEPTION`,
          message: `${channel === "sms" ? "SMS" : channel === "whatsapp" ? "WhatsApp" : "Email"} 발송 중 오류가 발생했습니다.`,
          detail:
            sendError instanceof Error ? sendError.message : String(sendError),
          stack: sendError instanceof Error ? sendError.stack : "N/A",
        },
        { status: 500 },
      );
    }

    if (!sendSuccess) {
      if (typeof console !== "undefined") {
        console.error(
          `[VERIFY_START] STEP 6 에러: ${channel.toUpperCase()} 발송 실패!`,
        );
      }
      return NextResponse.json(
        {
          ok: false,
          error: `${channel.toUpperCase()}_SEND_FAILED`,
          message: `${channel === "sms" ? "SMS" : channel === "whatsapp" ? "WhatsApp" : "Email"} 발송에 실패했습니다. 서비스 설정을 확인하세요.`,
        },
        { status: 500 },
      );
    }

    if (typeof console !== "undefined") {
      console.log(
        `[VERIFY_START] STEP 6 완료: ${channel.toUpperCase()} 발송 성공`,
      );
    }

    // STEP 7: 인증코드를 DB에 저장
    if (typeof console !== "undefined") {
      console.log("[VERIFY_START] STEP 7: 인증코드 DB 저장 시작");
    }

    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = createClient();

      // DB type 변환: 'whatsapp' → 'sms' (verification_codes 테이블의 type 컬럼은 'sms' 사용)
      // 이메일의 경우 'email'로 저장
      const dbType = channel === "whatsapp" ? "sms" : channel;

      // 기존 미인증 코드들 비활성화
      if (typeof console !== "undefined") {
        console.log("[VERIFY_START] 기존 미인증 코드 비활성화");
      }

      // 이메일인 경우 email 필드 사용, 전화번호인 경우 phone_number 필드 사용
      if (channel === "email") {
        await supabase
          .from("verification_codes")
          .update({ verified: true })
          .eq("email", normalizedTarget)
          .eq("type", dbType)
          .eq("verified", false);
      } else {
        await supabase
          .from("verification_codes")
          .update({ verified: true })
          .eq("phone_number", normalizedTarget)
          .eq("type", dbType)
          .eq("verified", false);
      }

      // 새 인증코드 저장 (10분간 유효)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const insertData: any = {
        code: verificationCode,
        type: dbType,
        verified: false,
        expires_at: expiresAt,
        ip_address: request.headers.get("x-forwarded-for") || "127.0.0.1",
        user_agent: request.headers.get("user-agent") || "Unknown",
      };

      // 이메일인 경우 email 필드 사용, 전화번호인 경우 phone_number 필드 사용
      if (channel === "email") {
        insertData.email = normalizedTarget;
      } else {
        insertData.phone_number = normalizedTarget;
      }

      if (typeof console !== "undefined") {
        console.log("[VERIFY_START] 인증코드 DB 저장 시도:", {
          target:
            channel === "email"
              ? normalizedTarget.substring(0, 5) + "..."
              : normalizedTarget.substring(0, 5) + "...",
          type: dbType,
          code: verificationCode.substring(0, 2) + "****",
        });
      }

      const { error: insertError } = await supabase
        .from("verification_codes")
        .insert([insertData]);

      if (insertError) {
        if (typeof console !== "undefined") {
          console.error(
            "[VERIFY_START] STEP 7 에러: 인증코드 DB 저장 실패!",
            insertError,
          );
        }
        // DB 저장 실패해도 발송은 성공했으므로 경고만 하고 계속 진행
        console.warn(
          "[VERIFY_START] 인증코드 발송은 성공했지만 DB 저장 실패:",
          insertError,
        );
      } else {
        if (typeof console !== "undefined") {
          console.log("[VERIFY_START] STEP 7 완료: 인증코드 DB 저장 성공");
        }
      }
    } catch (dbError) {
      if (typeof console !== "undefined") {
        console.error(
          "[VERIFY_START] STEP 7 에러: DB 저장 중 예외 발생!",
          dbError,
        );
      }
      // DB 저장 실패해도 발송은 성공했으므로 경고만 하고 계속 진행
      console.warn(
        "[VERIFY_START] 인증코드 발송은 성공했지만 DB 저장 중 오류:",
        dbError,
      );
    }

    // STEP 8: 성공 응답
    if (typeof console !== "undefined") {
      console.log("[VERIFY_START] STEP 8: 성공 응답 반환");
    }
    return NextResponse.json(
      {
        ok: true,
        message: "인증코드가 성공적으로 발송되었습니다.",
        code: verificationCode, // 테스트용 (나중에 제거)
      },
      { status: 200 },
    );
  } catch (error) {
    if (typeof console !== "undefined") {
      console.error("========================================");
      console.error("[VERIFY_START] ❌ 최상위 catch 블록: 예외 발생!");
      console.error("========================================");
      console.error("[VERIFY_START] 에러 타입:", error?.constructor?.name);
      console.error(
        "[VERIFY_START] 에러 메시지:",
        error instanceof Error ? error.message : String(error),
      );
      console.error(
        "[VERIFY_START] 에러 스택:",
        error instanceof Error ? error.stack : "N/A",
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "서버 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "N/A",
      },
      { status: 500 },
    );
  }
}
