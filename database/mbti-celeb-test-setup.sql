-- MBTI + 셀럽 매칭 테스트를 위한 데이터베이스 스키마 확장

-- 1) 셀럽 성별/이미지 필드 추가
ALTER TABLE celeb_profiles
  ADD COLUMN gender TEXT CHECK (gender IN ('male','female')) NULL,
  ADD COLUMN image_url TEXT NULL;

-- 2) MBTI 궁합 테이블: 각 MBTI가 "특히 잘 맞는" 상대 유형 1~3개
CREATE TABLE IF NOT EXISTS mbti_compatibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mbti_code TEXT NOT NULL,             -- 기준 MBTI
  best_match_codes TEXT[] NOT NULL,    -- 예: '{INFJ, ENFJ}'
  note_ko TEXT,
  note_es TEXT
);

-- 3) MBTI 궁합(상성) 맵 시드 데이터
INSERT INTO mbti_compatibility (mbti_code, best_match_codes, note_ko, note_es) VALUES
('INFJ', '{ENFP, ENTP}', '깊은 공감형과 아이디어형의 보완', 'Empatía profunda + ideas creativas'),
('ENFP', '{INFJ, INTJ}', '활동가형에 안정적/전략형이 균형 제공', 'Activista + estratega'),
('ISTP', '{ENFJ, ESFJ}', '실용형과 돌봄/조율형의 상보', 'Práctico + cuidador/a'),
('INTP', '{ENTJ, ENFJ}', '사색형에 리더/조율형 시너지', 'Pensador/a + líder/mediador/a'),
('ISFP', '{ENFJ, ESFJ}', '감성형과 사회적 조율형의 보완', 'Artístico + social'),
('INFP', '{ENFJ, ENTJ}', '가치형과 방향 제시형의 상보', 'Valores + dirección'),
('ESTP', '{INFJ, ISFJ}', '액션형과 안정/케어형의 균형', 'Acción + estabilidad'),
('ESTJ', '{ISFP, INFP}', '조직형과 감성형의 보완', 'Organización + sensibilidad'),
('ENTP', '{INFJ, ISFJ}', '아이디어형과 안정/케어형의 밸런스', 'Ideas + cuidado'),
('ENTJ', '{INFP, ISFP}', '리더형과 감성형의 보완', 'Liderazgo + sensibilidad'),
('ISFJ', '{ENTP, ESTP}', '돌봄형과 외향/아이디어형 조합', 'Cuidador/a + extroversión'),
('ESFJ', '{ISFP, INFP}', '사회형과 감성형의 조화', 'Social + sensibilidad'),
('INTJ', '{ENFP, ENTP}', '전략형과 활동가/아이디어형의 시너지', 'Estratega + activista/ideas'),
('ISTJ', '{ESFP, ENFP}', '책임형과 에너지형의 균형', 'Responsable + energía'),
('ESFP', '{ISTJ, INTJ}', '자유형과 구조/전략형의 보완', 'Libre + estructura/estrategia'),
('ENFJ', '{INFP, ISFP}', '조율형과 감성형의 시너지', 'Mediador/a + sensibilidad');

-- 4) 셀럽 데이터 (MBTI별 남/여 1명씩, 총 32명)
-- INFJ (남/여)
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, gender, image_url, source_note)
VALUES
('IU', NULL, 'INFJ', 'female', NULL, '비공식/변동 가능'),
('j-hope', 'BTS', 'INFJ', 'male', NULL, '비공식/변동 가능');

-- ENFP (남/여)
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, gender, image_url, source_note)
VALUES
('RM', 'BTS', 'ENFP', 'male', NULL, '비공식/변동 가능'),
('Lisa', 'BLACKPINK', 'ENFP', 'female', NULL, '비공식/변동 가능');

-- ISTP (남/여)
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, gender, image_url, source_note)
VALUES
('Suga', 'BTS', 'ISTP', 'male', NULL, '비공식/변동 가능'),
('Jennie', 'BLACKPINK', 'ISTP', 'female', NULL, '비공식/변동 가능');

-- INTP (남/여)
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, gender, image_url, source_note)
VALUES
('V', 'BTS', 'INTP', 'male', NULL, '비공식/변동 가능'),
('Solar', 'MAMAMOO', 'INTP', 'female', NULL, '비공식/변동 가능');

-- ISFP (남/여)
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, gender, image_url, source_note)
VALUES
('Jungkook', 'BTS', 'ISFP', 'male', NULL, '비공식/변동 가능'),
('Rose', 'BLACKPINK', 'ISFP', 'female', NULL, '비공식/변동 가능');

-- INFP (남/여)
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, gender, image_url, source_note)
VALUES
('Jimin', 'BTS', 'INFP', 'male', NULL, '비공식/변동 가능'),
('Jisoo', 'BLACKPINK', 'INFP', 'female', NULL, '비공식/변동 가능');

-- ESTP (남/여)
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, gender, image_url, source_note)
VALUES
('Jin', 'BTS', 'ESTP', 'male', NULL, '비공식/변동 가능'),
('CL', NULL, 'ESTP', 'female', NULL, '비공식/변동 가능');

-- ESTJ (남/여)
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, gender, image_url, source_note)
VALUES
('G-Dragon', 'BIGBANG', 'ESTJ', 'male', NULL, '비공식/변동 가능'),
('Taeyeon', 'SNSD', 'ESTJ', 'female', NULL, '비공식/변동 가능');

-- ENTP (남/여)
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, gender, image_url, source_note)
VALUES
('TOP', 'BIGBANG', 'ENTP', 'male', NULL, '비공식/변동 가능'),
('Hwasa', 'MAMAMOO', 'ENTP', 'female', NULL, '비공식/변동 가능');

-- ENTJ (남/여)
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, gender, image_url, source_note)
VALUES
('Jay Park', NULL, 'ENTJ', 'male', NULL, '비공식/변동 가능'),
('Hyuna', NULL, 'ENTJ', 'female', NULL, '비공식/변동 가능');

-- ISFJ (남/여)
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, gender, image_url, source_note)
VALUES
('Kai', 'EXO', 'ISFJ', 'male', NULL, '비공식/변동 가능'),
('Seulgi', 'Red Velvet', 'ISFJ', 'female', NULL, '비공식/변동 가능');

-- ESFJ (남/여)
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, gender, image_url, source_note)
VALUES
('Baekhyun', 'EXO', 'ESFJ', 'male', NULL, '비공식/변동 가능'),
('Irene', 'Red Velvet', 'ESFJ', 'female', NULL, '비공식/변동 가능');

-- INTJ (남/여)
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, gender, image_url, source_note)
VALUES
('Zico', NULL, 'INTJ', 'male', NULL, '비공식/변동 가능'),
('Sunmi', NULL, 'INTJ', 'female', NULL, '비공식/변동 가능');

-- ISTJ (남/여)
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, gender, image_url, source_note)
VALUES
('D.O.', 'EXO', 'ISTJ', 'male', NULL, '비공식/변동 가능'),
('Yoona', 'SNSD', 'ISTJ', 'female', NULL, '비공식/변동 가능');

-- ESFP (남/여)
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, gender, image_url, source_note)
VALUES
('Heechul', 'Super Junior', 'ESFP', 'male', NULL, '비공식/변동 가능'),
('Sunny', 'SNSD', 'ESFP', 'female', NULL, '비공식/변동 가능');

-- ENFJ (남/여)
INSERT INTO celeb_profiles (stage_name, group_name, mbti_code, gender, image_url, source_note)
VALUES
('Mark', 'NCT', 'ENFJ', 'male', NULL, '비공식/변동 가능'),
('Wendy', 'Red Velvet', 'ENFJ', 'female', NULL, '비공식/변동 가능');
