/**
 * 환경변수 검증 및 가드 함수
 * 빌드 시 필수 환경변수가 누락된 경우 에러를 던집니다.
 */

interface RequiredEnvVars {
  // 공개 환경변수 (클라이언트에서 접근 가능)
  public: {
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    NEXT_PUBLIC_APP_URL: string
  }
  
  // 서버 전용 환경변수 (서버에서만 접근 가능)
  server: {
    SUPABASE_SERVICE_ROLE_KEY: string
    JWT_SECRET: string
    SESSION_SECRET: string
  }
  
  // 선택적 환경변수 (있으면 좋지만 없어도 됨)
  optional: {
    GOOGLE_CLIENT_ID?: string
    GOOGLE_CLIENT_SECRET?: string
    KAKAO_CLIENT_ID?: string
    KAKAO_CLIENT_SECRET?: string
    NAVER_CLIENT_ID?: string
    NAVER_CLIENT_SECRET?: string
    PAYPAL_CLIENT_ID?: string
    PAYPAL_CLIENT_SECRET?: string
    AGORA_APP_ID?: string
    NEWS_API_KEY?: string
    VAPID_PUBLIC_KEY?: string
    VAPID_PRIVATE_KEY?: string
    ADMIN_EMAIL?: string
  }
}

class EnvGuard {
  private errors: string[] = []
  private warnings: string[] = []

  /**
   * 공개 환경변수 검증
   */
  validatePublicEnv(): void {
    const requiredPublicVars: (keyof RequiredEnvVars['public'])[] = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_APP_URL'
    ]

    requiredPublicVars.forEach(varName => {
      const value = process.env[varName]
      if (!value || value.trim() === '') {
        this.errors.push(`❌ 필수 공개 환경변수가 누락되었습니다: ${varName}`)
      } else if (value.includes('your_') || value.includes('example')) {
        this.errors.push(`❌ 환경변수에 기본값이 설정되어 있습니다: ${varName}`)
      }
    })
  }

  /**
   * 서버 환경변수 검증
   */
  validateServerEnv(): void {
    const requiredServerVars: (keyof RequiredEnvVars['server'])[] = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET',
      'SESSION_SECRET'
    ]

    requiredServerVars.forEach(varName => {
      const value = process.env[varName]
      if (!value || value.trim() === '') {
        this.errors.push(`❌ 필수 서버 환경변수가 누락되었습니다: ${varName}`)
      } else if (value.includes('your_') || value.includes('example')) {
        this.errors.push(`❌ 환경변수에 기본값이 설정되어 있습니다: ${varName}`)
      }
    })
  }

  /**
   * 선택적 환경변수 검증 (경고만 표시)
   */
  validateOptionalEnv(): void {
    const optionalVars: (keyof RequiredEnvVars['optional'])[] = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'KAKAO_CLIENT_ID',
      'KAKAO_CLIENT_SECRET',
      'NAVER_CLIENT_ID',
      'NAVER_CLIENT_SECRET',
      'PAYPAL_CLIENT_ID',
      'PAYPAL_CLIENT_SECRET',
      'AGORA_APP_ID',
      'NEWS_API_KEY',
      'VAPID_PUBLIC_KEY',
      'VAPID_PRIVATE_KEY',
      'ADMIN_EMAIL'
    ]

    optionalVars.forEach(varName => {
      const value = process.env[varName]
      if (!value || value.trim() === '') {
        this.warnings.push(`⚠️ 선택적 환경변수가 설정되지 않았습니다: ${varName}`)
      } else if (value.includes('your_') || value.includes('example')) {
        this.warnings.push(`⚠️ 환경변수에 기본값이 설정되어 있습니다: ${varName}`)
      }
    })
  }

  /**
   * 환경변수 형식 검증
   */
  validateEnvFormat(): void {
    // Supabase URL 형식 검증
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl && !supabaseUrl.match(/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/)) {
      this.errors.push(`❌ Supabase URL 형식이 올바르지 않습니다: ${supabaseUrl}`)
    }

    // App URL 형식 검증
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (appUrl && !appUrl.match(/^https?:\/\/[a-zA-Z0-9.-]+/)) {
      this.errors.push(`❌ App URL 형식이 올바르지 않습니다: ${appUrl}`)
    }

    // JWT Secret 길이 검증
    const jwtSecret = process.env.JWT_SECRET
    if (jwtSecret && jwtSecret.length < 32) {
      this.errors.push(`❌ JWT_SECRET은 최소 32자 이상이어야 합니다`)
    }

    // Session Secret 길이 검증
    const sessionSecret = process.env.SESSION_SECRET
    if (sessionSecret && sessionSecret.length < 32) {
      this.errors.push(`❌ SESSION_SECRET은 최소 32자 이상이어야 합니다`)
    }
  }

  /**
   * 환경별 특수 검증
   */
  validateEnvironmentSpecific(): void {
    const nodeEnv = process.env.NODE_ENV
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    // 프로덕션 환경 검증
    if (nodeEnv === 'production') {
      if (!appUrl || !appUrl.startsWith('https://')) {
        this.errors.push(`❌ 프로덕션 환경에서는 HTTPS URL이 필요합니다: ${appUrl}`)
      }

      if (appUrl && appUrl.includes('localhost')) {
        this.errors.push(`❌ 프로덕션 환경에서는 localhost URL을 사용할 수 없습니다: ${appUrl}`)
      }

      // 프로덕션에서는 결제 관련 환경변수 필수
      if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        this.warnings.push(`⚠️ 프로덕션 환경에서는 결제 관련 환경변수가 권장됩니다`)
      }
    }

    // 개발 환경 검증
    if (nodeEnv === 'development') {
      if (appUrl && !appUrl.includes('localhost')) {
        this.warnings.push(`⚠️ 개발 환경에서는 localhost URL 사용을 권장합니다: ${appUrl}`)
      }
    }
  }

  /**
   * 모든 검증 실행
   */
  validateAll(): void {
    this.validatePublicEnv()
    this.validateServerEnv()
    this.validateOptionalEnv()
    this.validateEnvFormat()
    this.validateEnvironmentSpecific()
  }

  /**
   * 검증 결과 출력 및 에러 처리
   */
  report(): void {
    // 경고 출력
    if (this.warnings.length > 0) {
      console.log('\n🔍 환경변수 경고:')
      this.warnings.forEach(warning => console.log(warning))
    }

    // 에러 출력 및 종료
    if (this.errors.length > 0) {
      console.log('\n❌ 환경변수 에러:')
      this.errors.forEach(error => console.log(error))
      
      console.log('\n📋 해결 방법:')
      console.log('1. .env.local 파일을 생성하고 필요한 환경변수를 설정하세요')
      console.log('2. Vercel Dashboard에서 환경변수를 설정하세요')
      console.log('3. .env.example 파일을 참고하여 필요한 환경변수를 확인하세요')
      
      // 빌드 시에는 프로세스 종료
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        process.exit(1)
      }
    }

    // 성공 메시지
    if (this.errors.length === 0) {
      console.log('✅ 모든 필수 환경변수가 올바르게 설정되었습니다')
    }
  }
}

/**
 * 환경변수 검증 실행 함수
 * 빌드 시 자동으로 호출됩니다.
 */
export function validateEnvironment(): void {
  const guard = new EnvGuard()
  guard.validateAll()
  guard.report()
}

/**
 * 특정 환경변수 값 가져오기 (타입 안전)
 */
export function getEnvVar(key: keyof RequiredEnvVars['public'] | keyof RequiredEnvVars['server']): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`환경변수가 설정되지 않았습니다: ${key}`)
  }
  return value
}

/**
 * 선택적 환경변수 값 가져오기
 */
export function getOptionalEnvVar(key: keyof RequiredEnvVars['optional']): string | undefined {
  return process.env[key]
}

// 빌드 시 자동 검증 실행
if (typeof window === 'undefined') {
  validateEnvironment()
}
