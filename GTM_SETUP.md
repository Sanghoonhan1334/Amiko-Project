# Google Tag Manager 설정 가이드

## 현재 단계: 컨테이너 생성

### 1. 컨테이너 이름 입력
```
Amiko Main Website
```

### 2. 타겟 플랫폼 선택
☑️ **웹** (파란색 지구 아이콘)

### 3. 만들기 버튼 클릭

---

## 다음 단계 (컨테이너 생성 후)

### GTM 컨테이너 ID 받기
- 컨테이너 생성 후 상단에 표시되는 ID
- 형식: `GTM-XXXXXXX`

### 환경 변수에 추가
`.env.local` 파일에:
```
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

---

## 참고: GTM vs GA4 차이

**Google Tag Manager (GTM)**:
- 태그 관리 도구
- 여러 태그를 한 번에 관리
- 컨테이너 ID 형식: `GTM-XXXXXXX`

**Google Analytics 4 (GA4)**:
- 웹 분석 도구
- 데이터 분석 및 보고서
- 측정 ID 형식: `G-XXXXXXXXXX`

### 추천: 둘 다 사용
1. GTM으로 GA4 태그 설정 (관리 편함)
2. GTM ID만 프로젝트에 추가
3. GTM 대시보드에서 GA4 추가

---

만들기 버튼 클릭 후 알려주세요! 다음 단계 안내드리겠습니다. 🚀

