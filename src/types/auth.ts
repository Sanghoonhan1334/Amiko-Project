// 인증 관련 타입 정의
export interface User {
  id: string;
  email: string;
  name: string;
  nickname: string;
  phone?: string;
  country?: string;
  isKorean?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  token: string;
  refreshToken?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  nickname: string;
  phone: string;
  country: string;
  isKorean: boolean;
}

export interface SignInData {
  identifier: string; // email or phone
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface VerificationData {
  email: string;
  phoneNumber: string;
  verificationCode: string;
  isEmailVerified: boolean;
  isSMSVerified: boolean;
  biometricEnabled: boolean;
}

export interface PasswordResetData {
  email: string;
  newPassword: string;
  resetToken: string;
}

export interface BiometricAuth {
  credentialId: string;
  publicKey: string;
  userId: string;
  createdAt: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
export type VerificationType = 'email' | 'sms' | 'biometric';
