// UI 관련 상수들
export const UI_CONSTANTS = {
  // 애니메이션 지속 시간 (ms)
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  
  // 토스트 메시지 지속 시간 (ms)
  TOAST_DURATION: {
    SHORT: 2000,
    NORMAL: 4000,
    LONG: 6000,
  },
  
  // 모달/다이얼로그 크기
  MODAL_SIZE: {
    SMALL: 'sm',
    MEDIUM: 'md',
    LARGE: 'lg',
    XLARGE: 'xl',
  },
  
  // 페이지네이션
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    LARGE_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 50,
  },
  
  // 파일 업로드 제한
  FILE_UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  
  // 이미지 크기 제한
  IMAGE_SIZES: {
    PROFILE: {
      WIDTH: 200,
      HEIGHT: 200,
    },
    POST: {
      WIDTH: 800,
      HEIGHT: 600,
    },
    THUMBNAIL: {
      WIDTH: 150,
      HEIGHT: 150,
    },
  },
  
  // 반응형 브레이크포인트 (Tailwind CSS 기준)
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },
  
  // 색상 팔레트 (다크모드 대응)
  COLORS: {
    PRIMARY: {
      LIGHT: '#6366f1', // indigo-500
      DARK: '#818cf8',  // indigo-400
    },
    SUCCESS: {
      LIGHT: '#10b981', // emerald-500
      DARK: '#34d399',  // emerald-400
    },
    WARNING: {
      LIGHT: '#f59e0b', // amber-500
      DARK: '#fbbf24',  // amber-400
    },
    ERROR: {
      LIGHT: '#ef4444', // red-500
      DARK: '#f87171',  // red-400
    },
  },
  
  // 아이콘 크기
  ICON_SIZES: {
    XS: 'w-3 h-3',
    SM: 'w-4 h-4',
    MD: 'w-5 h-5',
    LG: 'w-6 h-6',
    XL: 'w-8 h-8',
  },
  
  // 버튼 크기
  BUTTON_SIZES: {
    SM: 'px-3 py-1.5 text-sm',
    MD: 'px-4 py-2 text-base',
    LG: 'px-6 py-3 text-lg',
  },
  
  // 입력 필드 크기
  INPUT_SIZES: {
    SM: 'px-3 py-1.5 text-sm',
    MD: 'px-4 py-2 text-base',
    LG: 'px-6 py-3 text-lg',
  },
} as const;

// 폼 관련 상수들
export const FORM_CONSTANTS = {
  // 최대 입력 길이
  MAX_LENGTH: {
    NAME: 50,
    NICKNAME: 20,
    EMAIL: 100,
    PHONE: 20,
    TITLE: 100,
    CONTENT: 5000,
    COMMENT: 1000,
  },
  
  // 최소 입력 길이
  MIN_LENGTH: {
    PASSWORD: 8,
    NICKNAME: 3,
    TITLE: 1,
    CONTENT: 1,
  },
  
  // 플레이스홀더 텍스트
  PLACEHOLDERS: {
    NAME: '이름을 입력해주세요',
    NICKNAME: '닉네임을 입력해주세요',
    EMAIL: 'example@email.com',
    PHONE: '010-1234-5678',
    PASSWORD: '비밀번호를 입력해주세요',
    TITLE: '제목을 입력해주세요',
    CONTENT: '내용을 입력해주세요',
    COMMENT: '댓글을 입력해주세요',
  },
} as const;

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'amiko_token',
  REFRESH_TOKEN: 'amiko_refresh_token',
  USER_PREFERENCES: 'amiko_user_preferences',
  THEME: 'amiko_theme',
  LANGUAGE: 'amiko_language',
  DRAFT_POST: 'amiko_draft_post',
  LAST_VISITED: 'amiko_last_visited',
} as const;

// 세션 스토리지 키
export const SESSION_KEYS = {
  FORM_DATA: 'amiko_form_data',
  TEMP_DATA: 'amiko_temp_data',
  NAVIGATION_STATE: 'amiko_navigation_state',
} as const;
