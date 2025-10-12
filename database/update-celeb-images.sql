-- ============================================
-- 연예인 이미지 URL 업데이트 스크립트
-- public/celebs/ 폴더의 이미지 파일들을 celeb_profiles 테이블에 연결
-- ============================================

-- BTS 멤버들
UPDATE celeb_profiles SET image_url = '/celebs/rm.jpg' WHERE stage_name = 'RM' AND group_name = 'BTS';
UPDATE celeb_profiles SET image_url = '/celebs/jin.webp' WHERE stage_name = 'Jin' AND group_name = 'BTS';
UPDATE celeb_profiles SET image_url = '/celebs/suga.jpg' WHERE stage_name = 'Suga' AND group_name = 'BTS';
UPDATE celeb_profiles SET image_url = '/celebs/jhope.png' WHERE stage_name = 'j-hope' AND group_name = 'BTS';
UPDATE celeb_profiles SET image_url = '/celebs/jimin.png' WHERE stage_name = 'Jimin' AND group_name = 'BTS';
UPDATE celeb_profiles SET image_url = '/celebs/v.png' WHERE stage_name = 'V' AND group_name = 'BTS';
UPDATE celeb_profiles SET image_url = '/celebs/jungkook.png' WHERE stage_name = 'Jungkook' AND group_name = 'BTS';

-- BLACKPINK 멤버들
UPDATE celeb_profiles SET image_url = '/celebs/jennie.png' WHERE stage_name = 'Jennie' AND group_name = 'BLACKPINK';
UPDATE celeb_profiles SET image_url = '/celebs/lisa.png' WHERE stage_name = 'Lisa' AND group_name = 'BLACKPINK';
UPDATE celeb_profiles SET image_url = '/celebs/jisoo.png' WHERE stage_name = 'Jisoo' AND group_name = 'BLACKPINK';
UPDATE celeb_profiles SET image_url = '/celebs/rose.png' WHERE stage_name = 'Rose' AND group_name = 'BLACKPINK';

-- BIGBANG 멤버들
UPDATE celeb_profiles SET image_url = '/celebs/gdragon.png' WHERE stage_name = 'G-Dragon' AND group_name = 'BIGBANG';
UPDATE celeb_profiles SET image_url = '/celebs/top.png' WHERE stage_name = 'TOP' AND group_name = 'BIGBANG';

-- EXO 멤버들
UPDATE celeb_profiles SET image_url = '/celebs/kai.png' WHERE stage_name = 'Kai' AND group_name = 'EXO';
UPDATE celeb_profiles SET image_url = '/celebs/baekhyun.png' WHERE stage_name = 'Baekhyun' AND group_name = 'EXO';
UPDATE celeb_profiles SET image_url = '/celebs/dohyun.jpeg' WHERE stage_name = 'D.O.' AND group_name = 'EXO';

-- Red Velvet 멤버들
UPDATE celeb_profiles SET image_url = '/celebs/irene.webp' WHERE stage_name = 'Irene' AND group_name = 'Red Velvet';
UPDATE celeb_profiles SET image_url = '/celebs/seulgi.png' WHERE stage_name = 'Seulgi' AND group_name = 'Red Velvet';
UPDATE celeb_profiles SET image_url = '/celebs/wendy.png' WHERE stage_name = 'Wendy' AND group_name = 'Red Velvet';

-- SNSD 멤버들
UPDATE celeb_profiles SET image_url = '/celebs/taeyeon.png' WHERE stage_name = 'Taeyeon' AND group_name = 'SNSD';
UPDATE celeb_profiles SET image_url = '/celebs/yoona.png' WHERE stage_name = 'Yoona' AND group_name = 'SNSD';
UPDATE celeb_profiles SET image_url = '/celebs/sunny.png' WHERE stage_name = 'Sunny' AND group_name = 'SNSD';

-- MAMAMOO 멤버들
UPDATE celeb_profiles SET image_url = '/celebs/solar.png' WHERE stage_name = 'Solar' AND group_name = 'MAMAMOO';
UPDATE celeb_profiles SET image_url = '/celebs/hwasa.png' WHERE stage_name = 'Hwasa' AND group_name = 'MAMAMOO';

-- 솔로 아티스트들
UPDATE celeb_profiles SET image_url = '/celebs/iu.png' WHERE stage_name = 'IU' AND group_name IS NULL;
UPDATE celeb_profiles SET image_url = '/celebs/cl.png' WHERE stage_name = 'CL' AND group_name IS NULL;
UPDATE celeb_profiles SET image_url = '/celebs/jaypark.png' WHERE stage_name = 'Jay Park' AND group_name IS NULL;
UPDATE celeb_profiles SET image_url = '/celebs/hyuna.png' WHERE stage_name = 'Hyuna' AND group_name IS NULL;
UPDATE celeb_profiles SET image_url = '/celebs/zico.png' WHERE stage_name = 'Zico' AND group_name IS NULL;
UPDATE celeb_profiles SET image_url = '/celebs/sunmi.png' WHERE stage_name = 'Sunmi' AND group_name IS NULL;
UPDATE celeb_profiles SET image_url = '/celebs/heechul.png' WHERE stage_name = 'Heechul' AND group_name = 'Super Junior';

-- NCT 멤버들
UPDATE celeb_profiles SET image_url = '/celebs/mark.png' WHERE stage_name = 'Mark' AND group_name = 'NCT';

-- 업데이트 결과 확인
SELECT stage_name, group_name, mbti_code, image_url 
FROM celeb_profiles 
WHERE image_url IS NOT NULL 
ORDER BY stage_name;
