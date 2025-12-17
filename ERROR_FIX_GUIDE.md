# 🔧 에러 수정 가이드

## 발견된 에러

### 1. ❌ push_subscriptions 테이블 없음
```
Could not find the table 'public.push_subscriptions' in the schema cache
```

### 2. ❌ gallery_posts와 users 간 외래키 관계 에러
```
Could not find a relationship between 'gallery_posts' and 'users' in the schema cache
```

---

## 해결 방법

### Step 1: Supabase SQL Editor에서 실행

1. Supabase 대시보드 접속
2. SQL Editor 열기
3. 다음 SQL 스크립트 실행:

```sql
-- 파일: database/fix-push-subscriptions-and-gallery-posts.sql
```

또는 직접 실행:

```sql
-- 1. push_subscriptions 테이블 생성
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions" ON public.push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- 2. gallery_posts 외래키 수정
-- 기존 외래키 확인 후 필요시 수정
ALTER TABLE public.gallery_posts
DROP CONSTRAINT IF EXISTS gallery_posts_user_id_fkey;

ALTER TABLE public.gallery_posts
ADD CONSTRAINT gallery_posts_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

### Step 2: 코드 수정 완료

다음 파일들이 수정되었습니다:
- ✅ `src/app/api/posts/popular/route.ts` - 외래키 힌트 제거
- ✅ `src/app/api/galleries/[slug]/posts/filtered/route.ts` - 외래키 힌트 제거

### Step 3: 확인

1. Supabase에서 테이블 생성 확인:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'push_subscriptions';
   ```

2. 외래키 확인:
   ```sql
   SELECT conname, confrelid::regclass
   FROM pg_constraint
   WHERE conrelid = 'public.gallery_posts'::regclass
   AND conname LIKE '%user_id%';
   ```

---

## 추가 최적화 (선택사항)

### Supabase 클라이언트 생성 최적화

현재 로그에서 Supabase 클라이언트가 너무 많이 생성되고 있습니다. 
이는 성능에 영향을 줄 수 있으므로 클라이언트 재사용을 고려하세요.

---

## 실행 순서

1. ✅ SQL 스크립트 실행 (Supabase SQL Editor)
2. ✅ 코드 수정 완료 (이미 완료됨)
3. ⏳ 서버 재시작
4. ⏳ 테스트

---

**생성일**: 2025-01-XX
