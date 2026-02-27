"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Fingerprint } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import VerificationExplanation from "./VerificationExplanation";
import BiometricAuth from "./BiometricAuth";

interface AuthenticationOptionsProps {
  onEmailAuth: (email: string) => void;
  onSMSAuth: (phoneNumber: string) => void;
  onBiometricSetup: () => void;
  onSkipBiometric: () => void;
  userEmail?: string; // 사용자가 입력한 이메일
  userPhone?: string; // 사용자가 입력한 전화번호
}

export default function AuthenticationOptions({
  onEmailAuth,
  onSMSAuth,
  onBiometricSetup,
  onSkipBiometric,
  userEmail = "",
  userPhone = "",
}: AuthenticationOptionsProps) {
  const { t } = useLanguage();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showSMSForm, setShowSMSForm] = useState(false);
  const [email, setEmail] = useState(userEmail); // 사용자가 입력한 이메일로 초기화
  const [phoneNumber, setPhoneNumber] = useState(userPhone); // 사용자가 입력한 전화번호로 초기화

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onEmailAuth(email.trim());
    }
  };

  const handleSMSSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.trim()) {
      onSMSAuth(phoneNumber.trim());
    }
  };

  if (showEmailForm) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Mail className="w-16 h-16 mx-auto text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold">
            {t("auth.emailVerification")}
          </h3>
          <p className="text-gray-600">이메일 주소를 입력해주세요</p>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일 주소
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEmailForm(false)}
              className="flex-1"
            >
              {t("auth.back")}
            </Button>
            <Button type="submit" className="flex-1">
              인증코드 발송
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (showSMSForm) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Phone className="w-16 h-16 mx-auto text-green-600 mb-4" />
          <h3 className="text-lg font-semibold">{t("auth.smsVerification")}</h3>
          <p className="text-gray-600">전화번호를 입력해주세요</p>
        </div>

        <form onSubmit={handleSMSSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전화번호
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="010-1234-5678"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSMSForm(false)}
              className="flex-1"
            >
              {t("auth.back")}
            </Button>
            <Button type="submit" className="flex-1">
              인증코드 발송
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 검증 절차 설명 */}
      <VerificationExplanation />

      {/* 인증 방법 선택 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">
          {t("auth.authMethodSelection")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer border-blue-200 hover:border-blue-300"
            onClick={() => setShowEmailForm(true)}
          >
            <CardContent className="p-6 text-center">
              <Mail className="w-12 h-12 mx-auto text-blue-600 mb-3" />
              <h4 className="font-semibold text-blue-800">
                {t("auth.emailVerification")}
              </h4>
              <p className="text-sm text-gray-600">
                {t("auth.emailCodeDescription")}
              </p>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-md transition-shadow cursor-pointer border-green-200 hover:border-green-300"
            onClick={() => setShowSMSForm(true)}
          >
            <CardContent className="p-6 text-center">
              <Phone className="w-12 h-12 mx-auto text-green-600 mb-3" />
              <h4 className="font-semibold text-green-800">
                {t("auth.smsVerification")}
              </h4>
              <p className="text-sm text-gray-600">
                {t("auth.smsCodeDescription")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 빠른 로그인 제안 */}
      <BiometricAuth
        onEnable={onBiometricSetup}
        onSkip={onSkipBiometric}
        mode="suggestion"
      />
    </div>
  );
}
