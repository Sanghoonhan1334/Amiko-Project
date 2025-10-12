// 비밀번호 검증 규칙
export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
  NO_REPEATED_CHARS: true,
} as const;

// 닉네임 검증 규칙
export const NICKNAME_RULES = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
  ALLOWED_PATTERN: /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/,
} as const;

// 전화번호 검증 규칙
export const PHONE_RULES = {
  KR_PATTERN: /^010-\d{4}-\d{4}$/,
  INTERNATIONAL_PATTERN: /^\d{7,15}$/,
} as const;

// 이메일 검증 규칙
export const EMAIL_RULES = {
  PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// 검증 함수들
export const validatePassword = (password: string) => {
  const checks = {
    length: password.length >= PASSWORD_RULES.MIN_LENGTH,
    hasNumber: PASSWORD_RULES.REQUIRE_NUMBER ? /\d/.test(password) : true,
    hasSpecial: PASSWORD_RULES.REQUIRE_SPECIAL ? /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) : true,
    noRepeated: PASSWORD_RULES.NO_REPEATED_CHARS ? !/(.)\1{2,}/.test(password) : true,
  };
  return {
    ...checks,
    isValid: Object.values(checks).every(check => check),
  };
};

export const validateNickname = (nickname: string) => {
  const checks = {
    length: nickname.length >= NICKNAME_RULES.MIN_LENGTH && nickname.length <= NICKNAME_RULES.MAX_LENGTH,
    isAlphabetic: NICKNAME_RULES.ALLOWED_PATTERN.test(nickname),
    isAvailable: true, // 서버에서 확인 필요
  };
  return {
    ...checks,
    isValid: Object.values(checks).every(check => check),
  };
};

export const validatePhone = (phone: string, countryCode: string) => {
  if (countryCode === 'KR') {
    return PHONE_RULES.KR_PATTERN.test(phone);
  }
  return PHONE_RULES.INTERNATIONAL_PATTERN.test(phone);
};

export const validateEmail = (email: string) => {
  return EMAIL_RULES.PATTERN.test(email);
};
