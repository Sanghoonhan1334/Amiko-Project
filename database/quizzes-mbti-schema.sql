-- ============================================
-- MBTI 기반 K-POP 스타 매칭 퀴즈 시스템
-- ============================================

-- 기존 데이터 정리
DELETE FROM user_quiz_responses;
DELETE FROM quiz_results;
DELETE FROM quiz_options;
DELETE FROM quiz_questions;
DELETE FROM quizzes;

-- 테이블이 없으면 스키마 생성 부분을 먼저 실행하세요
-- (1단계 SQL의 CREATE TABLE 부분)

-- celeb_profiles 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS celeb_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_name TEXT NOT NULL,
  group_name TEXT,
  mbti_code VARCHAR(4) NOT NULL,
  profile_image_url TEXT,
  source_url TEXT,
  source_note TEXT,
  source_date DATE,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_celeb_profiles_mbti ON celeb_profiles(mbti_code);

-- quiz_options에 MBTI 축 컬럼 추가
ALTER TABLE quiz_options
  ADD COLUMN IF NOT EXISTS mbti_axis VARCHAR(2),
  ADD COLUMN IF NOT EXISTS axis_weight INTEGER DEFAULT 0;

-- quiz_results에 MBTI 코드 컬럼 추가
ALTER TABLE quiz_results
  ADD COLUMN IF NOT EXISTS mbti_code VARCHAR(4);

-- ============================================
-- 연예인 데이터 추가
-- ============================================

-- IU
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, source_url, source_note, source_date, is_verified)
VALUES
('IU', NULL, 'INFJ', 
 'https://www.soompi.com/article/1495067wpp/watch-iu-reveals-her-updated-mbti-type-thoughts-on-mint-chocolate-and-more',
 'ELLE Korea Q&A(2021)에서 INFP → INFJ로 변경되었다고 언급', '2021-10-24', true);

-- BTS 멤버들
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, source_url, source_note, is_verified)
VALUES
('RM', 'BTS', 'ENFP', 
 'https://www.truity.com/blog/what-personality-types-are-members-bts',
 '여러 매체와 콘텐츠에서 ENFP로 알려짐 (비공식 정리)', false),
('Jin', 'BTS', 'INTP',
 'https://www.truity.com/blog/what-personality-types-are-members-bts',
 '여러 매체와 콘텐츠에서 INTP로 알려짐 (비공식 정리)', false),
('Suga', 'BTS', 'ISTP',
 'https://www.truity.com/blog/what-personality-types-are-members-bts',
 '여러 매체와 콘텐츠에서 ISTP로 알려짐 (비공식 정리)', false),
('j-hope', 'BTS', 'INFJ',
 'https://www.truity.com/blog/what-personality-types-are-members-bts',
 '여러 매체와 콘텐츠에서 INFJ로 알려짐 (비공식 정리)', false),
('Jimin', 'BTS', 'ESTP',
 'https://www.truity.com/blog/what-personality-types-are-members-bts',
 '여러 매체와 콘텐츠에서 ESTP로 알려짐 (비공식 정리)', false),
('V', 'BTS', 'INFP',
 'https://www.truity.com/blog/what-personality-types-are-members-bts',
 '여러 매체와 콘텐츠에서 INFP로 알려짐 (비공식 정리)', false),
('Jungkook', 'BTS', 'INTP',
 'https://www.truity.com/blog/what-personality-types-are-members-bts',
 '여러 매체와 콘텐츠에서 INTP로 알려짐 (비공식 정리)', false);

-- BLACKPINK 멤버들
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, source_url, source_note, is_verified)
VALUES
('Jisoo', 'BLACKPINK', 'INFJ',
 'https://www.cosmo.ph/entertainment/blackpink-mbti-a2661-20220528',
 '코스모폴리탄 PH(2022) 정리 기사 기준 (시점별 상이 가능)', false),
('Jennie', 'BLACKPINK', 'ISTP',
 'https://www.cosmo.ph/entertainment/blackpink-mbti-a2661-20220528',
 '코스모폴리탄 PH(2022) 정리 기사 기준 (시점별 상이 가능)', false),
('Rosé', 'BLACKPINK', 'ISFP',
 'https://www.cosmo.ph/entertainment/blackpink-mbti-a2661-20220528',
 '코스모폴리탄 PH(2022) 정리 기사 기준 (시점별 상이 가능)', false),
('Lisa', 'BLACKPINK', 'ENFP',
 'https://www.cosmo.ph/entertainment/blackpink-mbti-a2661-20220528',
 '코스모폴리탄 PH(2022) 정리 기사 기준 (시점별 상이 가능)', false);

-- NewJeans 멤버들
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, source_url, source_note, is_verified)
VALUES
('Danielle', 'NewJeans', 'ENFP',
 'https://tadaland.net/blogs/blog/newjeans-reveals-mbti',
 '팬 커뮤니티 정리 (공식 고정 아님, 변동 가능)', false),
('Minji', 'NewJeans', 'ESTJ',
 'https://tadaland.net/blogs/blog/newjeans-reveals-mbti',
 '팬 커뮤니티 정리 (공식 고정 아님, 변동 가능)', false),
('Hanni', 'NewJeans', 'ENFJ',
 'https://tadaland.net/blogs/blog/newjeans-reveals-mbti',
 '팬 커뮤니티 정리 (공식 고정 아님, 변동 가능)', false),
('Haerin', 'NewJeans', 'ISTP',
 'https://tadaland.net/blogs/blog/newjeans-reveals-mbti',
 '팬 커뮤니티 정리 (공식 고정 아님, 변동 가능)', false),
('Hyein', 'NewJeans', 'INFP',
 'https://tadaland.net/blogs/blog/newjeans-reveals-mbti',
 '팬 커뮤니티 정리 (공식 고정 아님, 변동 가능)', false);

-- 완료!
-- 이제 3단계 (퀴즈 생성)와 4단계 (결과 생성) SQL을 실행하세요

