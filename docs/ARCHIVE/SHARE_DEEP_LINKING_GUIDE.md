# 공유 기능 Deep Linking 가이드

## 📋 개요

공유 기능이 앱 설치 여부에 따라 자동으로:
- **앱이 설치되어 있으면** → 앱으로 연결
- **앱이 설치되어 있지 않으면** → 모바일 반응형 웹사이트로 연결

이를 통해 사용자가 더 쉽게 콘텐츠에 접근할 수 있습니다.

## 🎯 구현된 기능

### 1. 공유 유틸리티 (`src/lib/share-utils.ts`)

모든 공유 기능을 관리하는 중앙 유틸리티입니다.

**주요 함수:**
- `shareContent()`: 범용 공유 함수
- `shareCommunityPost()`: 커뮤니티 게시물 공유
- `shareIdolMeme()`: 아이돌 메모 공유
- `shareStory()`: 스토리 공유
- `shareQuizResult()`: 퀴즈 결과 공유

### 2. 디바이스 감지

- `isMobileDevice()`: 모바일 디바이스 확인
- `isIOSDevice()`: iOS 디바이스 확인
- `isAndroidDevice()`: Android 디바이스 확인

### 3. 앱 설치 여부 확인

`checkAppInstalled()` 함수로 앱 설치 여부를 확인합니다.

## 🔧 공유 플로우

```
사용자가 공유 버튼 클릭
    ↓
네이티브 공유 API 사용 가능?
    ↓
YES → 네이티브 공유 시트 표시
    ↓
NO → 모바일 디바이스?
    ↓
YES → 앱 deep link 생성
    ↓
앱 설치 여부 확인
    ↓
설치됨 → 앱으로 연결 (amiko://...)
    ↓
설치 안됨 → 웹으로 연결 (https://...)
    ↓
클립보드에 복사 + 알림
```

## 📱 Deep Link 형식

### 커뮤니티 게시물
```
앱: amiko://community/post/{postId}
웹: https://www.helloamiko.com/community/post/{postId}
```

### 아이돌 메모
```
앱: amiko://community/idol-memes/{postId}
웹: https://www.helloamiko.com/community/idol-memes/{postId}
```

### 스토리
```
앱: amiko://community/stories/{storyId}
웹: https://www.helloamiko.com/community/stories/{storyId}
```

### 퀴즈 결과
```
앱: amiko://quiz/{quizId}/result
웹: https://www.helloamiko.com/quiz/{quizId}/result
```

## 🛠️ 적용된 페이지

### 1. 아이돌 메모 상세 (`src/app/community/idol-memes/[id]/page.tsx`)
- ✅ `handleShare()` 함수 업데이트
- ✅ `shareIdolMeme()` 사용

### 2. 커뮤니티 게시물 상세 (`src/components/main/app/community/PostDetail.tsx`)
- ✅ 공유 버튼 추가
- ✅ `handleShare()` 함수 추가
- ✅ `shareCommunityPost()` 사용

### 3. 뉴스 상세 (`src/components/main/app/community/NewsDetail.tsx`)
- ✅ `handleShare()` 함수 업데이트
- ✅ `shareContent()` 사용

## 📦 Capacitor 설정

`capacitor.config.ts`에 deep linking 설정이 추가되었습니다:

```typescript
app: {
  // Android Intent URI scheme
  customUrlScheme: 'amiko',
  // iOS Universal Links
  // universalLinks: ['https://www.helloamiko.com']
}
```

## 🔨 추가 설정 필요 사항

### Android

`android/app/src/main/AndroidManifest.xml`에 Intent Filter 추가:

```xml
<activity
    android:name=".MainActivity"
    android:launchMode="singleTask">
    
    <!-- Deep Linking -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="amiko" />
    </intent-filter>
    
    <!-- Universal Links -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" android:host="www.helloamiko.com" />
    </intent-filter>
</activity>
```

### iOS

`ios/App/App/Info.plist`에 URL Scheme 추가:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>amiko</string>
        </array>
    </dict>
</array>
```

`ios/App/App/Info.plist`에 Associated Domains 추가:

```xml
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:www.helloamiko.com</string>
</array>
```

서버에 `.well-known/apple-app-site-association` 파일 추가:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.amiko.app",
        "paths": ["*"]
      }
    ]
  }
}
```

## 🚀 사용 방법

### 새로운 공유 기능 추가

1. `src/lib/share-utils.ts`에 새로운 공유 함수 추가:

```typescript
export async function shareNewContent(
  contentId: string,
  title: string
): Promise<void> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const webUrl = `${baseUrl}/new-content/${contentId}`
  const deepLink = `amiko://new-content/${contentId}`
  
  await shareContent({
    title,
    text: title,
    url: webUrl,
    deepLink
  })
}
```

2. 컴포넌트에서 사용:

```typescript
import { shareNewContent } from '@/lib/share-utils'

const handleShare = async () => {
  await shareNewContent(contentId, title)
}
```

## 📊 장점

1. **사용자 접근성 향상**: 앱이 있으면 앱으로, 없으면 웹으로 자동 연결
2. **일관된 경험**: 모든 공유 기능이 동일한 로직 사용
3. **유지보수 용이**: 중앙 유틸리티로 관리
4. **네이티브 경험**: 네이티브 공유 API 우선 사용

## 🔍 테스트 방법

### 모바일 웹에서 테스트

1. 모바일 브라우저에서 페이지 열기
2. 공유 버튼 클릭
3. 네이티브 공유 시트 표시 확인

### 앱에서 테스트

1. 앱 빌드 및 설치
2. Deep link 형식으로 테스트:
   - Android: `adb shell am start -W -a android.intent.action.VIEW -d "amiko://community/post/123"`
   - iOS: Safari에서 `amiko://community/post/123` 링크 클릭

### 로그 확인

공유 시도 시 콘솔에 다음 로그가 출력됩니다:
- 디바이스 타입
- 앱 설치 여부
- 공유 방법

## ⚠️ 주의사항

1. **Universal Links 설정**: iOS Universal Links는 서버 설정이 필요합니다
2. **HTTPS 필수**: Universal Links는 HTTPS에서만 작동합니다
3. **App Site Association**: 서버에 해당 파일이 올바르게 설정되어 있어야 합니다
4. **테스트 시간**: 앱 설치 여부 확인에 최대 1초 소요됩니다

## 📝 참고 자료

- [Capacitor Deep Links 문서](https://capacitorjs.com/docs/guides/deep-links)
- [Android App Links](https://developer.android.com/training/app-links)
- [iOS Universal Links](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app)

