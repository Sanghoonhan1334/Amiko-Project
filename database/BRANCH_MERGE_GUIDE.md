# PayPal 스키마 파일 브랜치 공유 가이드

## 현재 상황

- ✅ `feature/payments-paypal-maria` 브랜치 존재
- ✅ 새로 생성된 스키마 파일들 (main 브랜치에 untracked 상태)
- ⚠️ 마리아 브랜치에는 아직 스키마 파일 없음

## 방법 1: main에 먼저 커밋 → 마리아가 merge (권장)

### 장점
- ✅ main 브랜치에 공식 스키마로 저장
- ✅ 다른 브랜치에서도 쉽게 사용 가능
- ✅ 버전 관리가 명확함

### 실행 방법

```bash
# 1. 현재 main 브랜치에서 스키마 파일 커밋
git add database/paypal-payment-schema.sql
git add database/paypal-test-data.sql
git add database/PAYPAL_SCHEMA_GUIDE.md
git add database/PAYPAL_SCHEMA_SUMMARY.md

git commit -m "feat: Add PayPal payment system database schema

- Add paypal-payment-schema.sql (payments, purchases tables)
- Add paypal-test-data.sql (test data)
- Add comprehensive documentation (GUIDE, SUMMARY)
- Support PayPal payment flow: create-order, approve-order, webhook"

# 2. main 브랜치에 푸시
git push origin main

# 3. 마리아가 자신의 브랜치에서 merge
# (마리아가 실행)
git checkout feature/payments-paypal-maria
git pull origin main
# 또는
git merge main
```

## 방법 2: 마리아 브랜치에 직접 커밋

### 장점
- ✅ 마리아가 바로 사용 가능
- ✅ 빠른 공유

### 단점
- ⚠️ 나중에 main에 merge 필요
- ⚠️ 다른 브랜치에서 사용하려면 다시 merge 필요

### 실행 방법

```bash
# 1. 마리아 브랜치로 체크아웃
git checkout feature/payments-paypal-maria

# 2. 스키마 파일 추가 및 커밋
git add database/paypal-payment-schema.sql
git add database/paypal-test-data.sql
git add database/PAYPAL_SCHEMA_GUIDE.md
git add database/PAYPAL_SCHEMA_SUMMARY.md

git commit -m "feat: Add PayPal payment system database schema

- Add paypal-payment-schema.sql (payments, purchases tables)
- Add paypal-test-data.sql (test data)
- Add comprehensive documentation (GUIDE, SUMMARY)
- Support PayPal payment flow: create-order, approve-order, webhook"

# 3. 마리아 브랜치에 푸시
git push origin feature/payments-paypal-maria

# 4. 나중에 main에 merge (마리아가 완료 후)
git checkout main
git merge feature/payments-paypal-maria
git push origin main
```

## 추천 방법

**방법 1 (main에 먼저 커밋)을 권장합니다.**

이유:
1. 스키마는 인프라 코드이므로 main에 있는 것이 자연스러움
2. 마리아가 작업 완료 후 PR할 때 충돌 가능성 감소
3. 다른 개발자도 쉽게 참조 가능

## 빠른 실행 스크립트

### 방법 1 실행 (main에 커밋)

```bash
cd "/Users/admin/Desktop/사업 관련 파일/Amiko-Project-main"

# 파일 추가
git add database/paypal-payment-schema.sql \
        database/paypal-test-data.sql \
        database/PAYPAL_SCHEMA_GUIDE.md \
        database/PAYPAL_SCHEMA_SUMMARY.md

# 커밋
git commit -m "feat: Add PayPal payment system database schema

- Add paypal-payment-schema.sql (payments, purchases tables)
- Add paypal-test-data.sql (test data)
- Add comprehensive documentation (GUIDE, SUMMARY)
- Support PayPal payment flow: create-order, approve-order, webhook"

# 푸시
git push origin main
```

### 방법 2 실행 (마리아 브랜치에 커밋)

```bash
cd "/Users/admin/Desktop/사업 관련 파일/Amiko-Project-main"

# 마리아 브랜치로 전환
git checkout feature/payments-paypal-maria

# 파일 추가
git add database/paypal-payment-schema.sql \
        database/paypal-test-data.sql \
        database/PAYPAL_SCHEMA_GUIDE.md \
        database/PAYPAL_SCHEMA_SUMMARY.md

# 커밋
git commit -m "feat: Add PayPal payment system database schema

- Add paypal-payment-schema.sql (payments, purchases tables)
- Add paypal-test-data.sql (test data)
- Add comprehensive documentation (GUIDE, SUMMARY)
- Support PayPal payment flow: create-order, approve-order, webhook"

# 푸시
git push origin feature/payments-paypal-maria

# main으로 돌아가기
git checkout main
```

## 마리아에게 알려줄 내용

마리아가 자신의 브랜치에서 스키마를 사용하려면:

```bash
# 방법 1을 선택한 경우
git checkout feature/payments-paypal-maria
git pull origin main  # 또는 git merge main

# 방법 2를 선택한 경우
# 이미 브랜치에 있으므로 바로 사용 가능
```

## 파일 목록

다음 4개 파일이 추가됩니다:

1. `database/paypal-payment-schema.sql` - 전체 스키마
2. `database/paypal-test-data.sql` - 테스트 데이터
3. `database/PAYPAL_SCHEMA_GUIDE.md` - 상세 가이드
4. `database/PAYPAL_SCHEMA_SUMMARY.md` - 요약 문서
