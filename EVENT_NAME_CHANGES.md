# GA4 이벤트명 변경 사항

## 변경된 이벤트명 목록

### 탭 방문 이벤트 (GA4 표준화)
1. `visit_home_tab` → `view_home_tab`
2. `visit_meet_tab` → `view_meet_tab`
3. `visit_community_tab` → `view_community_tab`
4. `visit_event_tab` → `view_event_tab`
5. `visit_charging_tab` → `view_charging_tab`
6. `visit_profile_tab` → `view_profile_tab`

### 커뮤니티 이벤트
7. `visit_category` → `view_category`
8. `community_tab_open` → `view_community_tab` (중복 제거, communityTabOpen 함수는 유지하되 내부적으로 view_community_tab 사용)

## 변경 이유

GA4 표준 이벤트명 규칙에 맞추기 위해:
- `view_` 접두사 사용 (GA4 표준)
- 일관성 있는 명명 규칙 적용
- 중복 이벤트 제거

## 영향받는 파일

### 수정된 파일
1. `src/lib/analytics.ts`
   - `appEngagementEvents` 내 모든 탭 방문 이벤트명 변경
   - `communityEvents.visitCategory()` 이벤트명 변경
   - `communityEvents.communityTabOpen()` 이벤트명 변경 (내부적으로 view_community_tab 사용)

### 영향받지 않는 파일 (함수명은 그대로)
- `src/app/main/page.tsx` - 함수 호출은 그대로 (`appEngagementEvents.visitHomeTab()` 등)
- `src/components/main/app/community/CommunityMain.tsx` - 함수 호출은 그대로 (`communityEvents.visitCategory()` 등)
- `src/app/community/gallery/[slug]/page.tsx` - 함수 호출은 그대로

## GA4 퍼널 업데이트 필요

퍼널 설정에서 다음 이벤트명을 업데이트해야 합니다:
- `visit_home_tab` → `view_home_tab`
- `visit_meet_tab` → `view_meet_tab`
- `visit_community_tab` → `view_community_tab`
- `visit_event_tab` → `view_event_tab`
- `visit_charging_tab` → `view_charging_tab`
- `visit_profile_tab` → `view_profile_tab`
- `visit_category` → `view_category`
- `community_tab_open` → `view_community_tab` (또는 제거)

## 테스트 방법

1. 브라우저 콘솔에서 `[GA4] Event tracked:` 로그 확인
2. GA4 DebugView에서 새 이벤트명 확인
3. 각 탭 클릭 시 `view_*_tab` 이벤트 확인
4. 카테고리 선택 시 `view_category` 이벤트 확인
