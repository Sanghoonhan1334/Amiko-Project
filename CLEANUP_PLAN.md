# 프로젝트 정리 계획

## 1. 백업 파일 (즉시 삭제 가능)
- `src/components/main/app/me/MyTab.tsx.backup`
- `src/components/main/app/me/MyTab.tsx.broken`
- `src/components/main/app/community/FreeBoardList.tsx.backup`
- `src/app/verification-center/page.tsx.backup`
- `src/lib/translations.ts.backup`
- `src/lib/translations.ts.broken`

## 2. 테스트/데모 파일 (개발용, 삭제 가능)
### 테스트 페이지
- `src/app/test-translation/page.tsx` - 번역 테스트 페이지
- `src/app/test-sms/page.tsx` - SMS 테스트 페이지
- `src/app/chat-test/page.tsx` - 채팅 테스트 페이지
- `src/app/profile-upload-test/page.tsx` - 프로필 업로드 테스트 페이지

### 테스트 컴포넌트
- `src/components/common/SimpleTranslationTest.tsx` - 간단한 번역 테스트
- `src/components/common/TranslationDebug.tsx` - 번역 디버깅
- `src/components/common/InterestTranslationDemo.tsx` - 관심사 번역 데모
- `src/components/test/SMSTest.tsx` - SMS 테스트 컴포넌트

## 3. 사용되지 않는 컴포넌트 (확인 필요)
### 사용되지 않는 것으로 보이는 컴포넌트
- `src/components/users/UserProfileView.tsx` - UserProfileModal로 대체됨
- `src/components/main/app/community/CommunityTabNew.tsx` - CommunityTab 사용 중인지 확인 필요

## 4. API 테스트 파일들 (개발용, 삭제 가능)
다음 API 라우트들은 테스트용으로 보입니다:
- `src/app/api/test-*` 패턴의 모든 파일들
- `src/app/api/debug/*`
- `src/app/api/test-comment-count/`
- `src/app/api/test-posts/`
- `src/app/api/test-sync/`
- `src/app/api/simple-email-test/`
- `src/app/api/test-email/`
- `src/app/api/test-email-direct/`
- `src/app/api/test-env/`
- `src/app/api/test-hiworks-*`
- `src/app/api/test-smtp/`
- `src/app/api/test-storage/`
- `src/app/api/test-supabase/`
- `src/app/api/test-twilio/`
- `src/app/api/test-users/`
- `src/app/api/test-verification/`

## 5. 확인이 필요한 파일들
다음 파일들은 실제 사용 여부를 확인해야 합니다:
- `src/components/main/app/community/CommunityMain.tsx` - CommunityTab에서 사용 중
- `src/components/main/app/community/CommunityCard.tsx` - CommunityTab에서 사용 중
- `src/components/main/app/community/PostFilters.tsx` - 사용 여부 확인 필요
- `src/components/main/app/community/GalleryList.tsx` - 사용 여부 확인 필요
- `src/components/main/app/community/GalleryNavigation.tsx` - 사용 여부 확인 필요
- `src/components/main/app/community/GalleryPostList.tsx` - 사용 여부 확인 필요

## 정리 순서
1. 백업 파일 삭제 (안전)
2. 테스트/데모 파일 삭제 (개발용)
3. 사용되지 않는 컴포넌트 삭제 (확인 후)
4. API 테스트 파일 삭제 (확인 후)

