#!/bin/bash

# Amiko 프로젝트 보안 감사 스크립트
# 실행: bash scripts/security-audit.sh

set -e

echo "🔒 Amiko 프로젝트 보안 감사 시작..."
echo ""

# 1. 테스트 API 라우트 확인
echo "📋 1. 테스트 API 라우트 확인"
TEST_ROUTES=$(find src/app/api -type f -name "*.ts" | grep -i test | wc -l)
echo "   발견된 테스트 라우트: $TEST_ROUTES개"
if [ "$TEST_ROUTES" -gt 0 ]; then
  echo "   ⚠️  다음 테스트 라우트가 발견되었습니다:"
  find src/app/api -type f -name "*.ts" | grep -i test | sed 's/^/      - /'
else
  echo "   ✅ 테스트 라우트 없음"
fi
echo ""

# 2. 환경변수 노출 확인
echo "📋 2. 환경변수 노출 확인"
if grep -r "process.env.SUPABASE_SERVICE_ROLE_KEY" src --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep -v ".next" > /dev/null; then
  echo "   ⚠️  Service Role Key가 클라이언트 코드에서 사용되고 있습니다!"
  grep -r "process.env.SUPABASE_SERVICE_ROLE_KEY" src --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep -v ".next" | sed 's/^/      - /'
else
  echo "   ✅ Service Role Key는 서버 사이드에서만 사용됨"
fi
echo ""

# 3. .env 파일 Git 추적 확인
echo "📋 3. .env 파일 Git 추적 확인"
if git ls-files | grep -E "\.env$|\.env\.local$" > /dev/null; then
  echo "   ⚠️  .env 파일이 Git에 추적되고 있습니다!"
  git ls-files | grep -E "\.env$|\.env\.local$" | sed 's/^/      - /'
else
  echo "   ✅ .env 파일은 Git에 추적되지 않음"
fi
echo ""

# 4. 의존성 취약점 스캔
echo "📋 4. 의존성 취약점 스캔"
if command -v npm &> /dev/null; then
  echo "   npm audit 실행 중..."
  npm audit --audit-level=moderate || true
else
  echo "   ⚠️  npm이 설치되지 않았습니다"
fi
echo ""

# 5. Service Role Key 사용 위치 확인
echo "📋 5. Service Role Key 사용 위치 확인"
SERVICE_KEY_USAGE=$(grep -r "SUPABASE_SERVICE_ROLE_KEY" src --include="*.ts" --include="*.tsx" | wc -l)
echo "   Service Role Key 사용 위치: $SERVICE_KEY_USAGE개"
if [ "$SERVICE_KEY_USAGE" -gt 0 ]; then
  echo "   사용 위치:"
  grep -r "SUPABASE_SERVICE_ROLE_KEY" src --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort -u | sed 's/^/      - /'
fi
echo ""

# 6. 인증 없이 Service Role Key 사용 확인
echo "📋 6. 인증 없이 Service Role Key 사용 확인"
echo "   ⚠️  다음 파일들을 수동으로 확인하세요:"
grep -l "SUPABASE_SERVICE_ROLE_KEY" src/app/api/**/*.ts 2>/dev/null | while read file; do
  if ! grep -q "requireAuth\|requireAdmin\|getUser\|auth.getUser" "$file"; then
    echo "      - $file (인증 없이 Service Role Key 사용 가능)"
  fi
done
echo ""

echo "✅ 보안 감사 완료"
echo ""
echo "📝 다음 단계:"
echo "   1. SECURITY_CHECKLIST.md 파일을 검토하세요"
echo "   2. 발견된 문제를 해결하세요"
echo "   3. 테스트 API 라우트를 제거하세요"
