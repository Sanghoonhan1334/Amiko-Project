# 커뮤니티/탭/카테고리 관련 이벤트명 감사

## 현재 코드에서 사용 중인 이벤트명

### 탭 방문 이벤트 (appEngagementEvents)
1. `visit_home_tab` - 홈 탭 방문
2. `visit_meet_tab` - 만남 탭 방문  
3. `visit_community_tab` - 커뮤니티 탭 방문
4. `visit_event_tab` - 이벤트 탭 방문
5. `visit_charging_tab` - 충전 탭 방문
6. `visit_profile_tab` - 프로필 탭 방문

### 커뮤니티 이벤트 (communityEvents)
7. `community_tab_open` - 커뮤니티 탭 열기
8. `visit_category` - 카테고리 방문
9. `view_gallery` - 갤러리 조회
10. `view_post` - 게시물 조회

## 호출 위치

### 탭 방문 이벤트
- `src/app/main/page.tsx` (라인 289-304)
  - `appEngagementEvents.visitHomeTab()`
  - `appEngagementEvents.visitMeetTab()`
  - `appEngagementEvents.visitCommunityTab()`
  - `appEngagementEvents.visitEventTab()`
  - `appEngagementEvents.visitChargingTab()`
  - `appEngagementEvents.visitProfileTab()`

### 커뮤니티 이벤트
- `src/components/main/app/community/CommunityMain.tsx` (라인 63)
  - `communityEvents.visitCategory()`
  - `communityEvents.viewGallery()`
  - `communityEvents.viewPost()`

- `src/app/community/gallery/[slug]/page.tsx` (라인 72)
  - `communityEvents.visitCategory()`

## GA4 표준 이벤트명 규칙

GA4에서는 일반적으로:
- `view_` 접두사를 사용 (예: `view_item`, `view_item_list`)
- 동사_명사 형태 사용 (예: `select_item`, `add_to_cart`)

## 제안하는 표준화된 이벤트명

### 탭 방문 이벤트
- `visit_home_tab` → `view_home_tab` 또는 `home_tab_view`
- `visit_meet_tab` → `view_meet_tab` 또는 `meet_tab_view`
- `visit_community_tab` → `view_community_tab` 또는 `community_tab_view`
- `visit_event_tab` → `view_event_tab` 또는 `event_tab_view`
- `visit_charging_tab` → `view_charging_tab` 또는 `charging_tab_view`
- `visit_profile_tab` → `view_profile_tab` 또는 `profile_tab_view`

### 커뮤니티 이벤트
- `community_tab_open` → `view_community_tab` (중복 제거 가능)
- `visit_category` → `view_category` (표준화)
- `view_gallery` → 유지 (이미 표준)
- `view_post` → 유지 (이미 표준)

## 결정 필요 사항

퍼널 문서에서 사용하는 정확한 이벤트명을 확인해야 합니다.
일반적으로 GA4 표준에 맞춰 `view_` 접두사를 사용하는 것을 권장합니다.
