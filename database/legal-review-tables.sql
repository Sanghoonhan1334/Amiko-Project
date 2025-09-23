-- =====================================================
-- 법무 검토 관련 테이블
-- Description: 법무 검토, 정책 승인, 준수 관리
-- Date: 2025-01-17
-- =====================================================

-- 1. 법무 정책 검토 테이블
CREATE TABLE IF NOT EXISTS public.legal_policy_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    policy_name TEXT NOT NULL,
    policy_type TEXT NOT NULL CHECK (policy_type IN (
        'privacy', 'terms', 'cookies', 'retention', 'consent', 
        'deletion', 'gdpr', 'security', 'third_party'
    )),
    version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'under_review', 'approved', 'rejected', 'published'
    )),
    review_progress INTEGER DEFAULT 0 CHECK (review_progress >= 0 AND review_progress <= 100),
    legal_compliance JSONB DEFAULT '{"domestic": false, "international": false, "industry": false}',
    risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    compliance_score INTEGER DEFAULT 0 CHECK (compliance_score >= 0 AND compliance_score <= 100),
    review_started_at TIMESTAMP WITH TIME ZONE,
    review_completed_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    next_review_date TIMESTAMP WITH TIME ZONE,
    review_duration_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 법무 검토자 테이블
CREATE TABLE IF NOT EXISTS public.legal_reviewers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id UUID NOT NULL REFERENCES public.legal_policy_reviews(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewer_name TEXT NOT NULL,
    reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('legal', 'security', 'compliance', 'management')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 법무 검토 의견 테이블
CREATE TABLE IF NOT EXISTS public.legal_review_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id UUID NOT NULL REFERENCES public.legal_policy_reviews(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewer_name TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('suggestion', 'requirement', 'question', 'approval')),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 법무 검토 로그 테이블
CREATE TABLE IF NOT EXISTS public.legal_review_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id UUID REFERENCES public.legal_policy_reviews(id) ON DELETE SET NULL,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'review_started', 'review_approved', 'review_rejected', 
        'review_completed', 'policy_published', 'policy_updated'
    )),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 법적 준수 체크리스트 테이블
CREATE TABLE IF NOT EXISTS public.legal_compliance_checklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id UUID NOT NULL REFERENCES public.legal_policy_reviews(id) ON DELETE CASCADE,
    checklist_item TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'domestic_law', 'international_law', 'industry_standard', 'user_rights'
    )),
    requirement TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'compliant', 'non_compliant', 'not_applicable')),
    checked_by UUID REFERENCES auth.users(id),
    checked_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 법적 위험 평가 테이블
CREATE TABLE IF NOT EXISTS public.legal_risk_assessment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id UUID NOT NULL REFERENCES public.legal_policy_reviews(id) ON DELETE CASCADE,
    risk_type TEXT NOT NULL CHECK (risk_type IN (
        'compliance', 'privacy', 'security', 'contractual', 'regulatory'
    )),
    risk_description TEXT NOT NULL,
    likelihood TEXT NOT NULL CHECK (likelihood IN ('low', 'medium', 'high', 'critical')),
    impact TEXT NOT NULL CHECK (impact IN ('low', 'medium', 'high', 'critical')),
    risk_score INTEGER NOT NULL CHECK (risk_score >= 1 AND risk_score <= 16),
    mitigation_measures TEXT[],
    assessed_by UUID REFERENCES auth.users(id),
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_assessment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 법적 문서 버전 관리 테이블
CREATE TABLE IF NOT EXISTS public.legal_document_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id UUID NOT NULL REFERENCES public.legal_policy_reviews(id) ON DELETE CASCADE,
    version_number TEXT NOT NULL,
    document_content TEXT NOT NULL,
    change_summary TEXT,
    change_type TEXT NOT NULL CHECK (change_type IN ('major', 'minor', 'patch')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    effective_date TIMESTAMP WITH TIME ZONE,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 법적 교육 및 인증 테이블
CREATE TABLE IF NOT EXISTS public.legal_training_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    training_type TEXT NOT NULL CHECK (training_type IN (
        'privacy_law', 'data_protection', 'gdpr', 'security', 'compliance'
    )),
    training_title TEXT NOT NULL,
    training_provider TEXT,
    completion_date TIMESTAMP WITH TIME ZONE,
    certification_number TEXT,
    expiry_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 인덱스 생성
-- =====================================================

-- 법무 정책 검토 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_legal_policy_reviews_user_id ON public.legal_policy_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_policy_reviews_policy_type ON public.legal_policy_reviews(policy_type);
CREATE INDEX IF NOT EXISTS idx_legal_policy_reviews_status ON public.legal_policy_reviews(status);
CREATE INDEX IF NOT EXISTS idx_legal_policy_reviews_risk_level ON public.legal_policy_reviews(risk_level);
CREATE INDEX IF NOT EXISTS idx_legal_policy_reviews_last_updated ON public.legal_policy_reviews(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_legal_policy_reviews_next_review ON public.legal_policy_reviews(next_review_date);

-- 법무 검토자 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_legal_reviewers_policy_id ON public.legal_reviewers(policy_id);
CREATE INDEX IF NOT EXISTS idx_legal_reviewers_reviewer_id ON public.legal_reviewers(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_legal_reviewers_status ON public.legal_reviewers(status);
CREATE INDEX IF NOT EXISTS idx_legal_reviewers_reviewer_role ON public.legal_reviewers(reviewer_role);

-- 법무 검토 의견 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_legal_review_comments_policy_id ON public.legal_review_comments(policy_id);
CREATE INDEX IF NOT EXISTS idx_legal_review_comments_reviewer_id ON public.legal_review_comments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_legal_review_comments_type ON public.legal_review_comments(type);
CREATE INDEX IF NOT EXISTS idx_legal_review_comments_resolved ON public.legal_review_comments(resolved);
CREATE INDEX IF NOT EXISTS idx_legal_review_comments_created_at ON public.legal_review_comments(created_at DESC);

-- 법무 검토 로그 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_legal_review_logs_policy_id ON public.legal_review_logs(policy_id);
CREATE INDEX IF NOT EXISTS idx_legal_review_logs_reviewer_id ON public.legal_review_logs(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_legal_review_logs_action_type ON public.legal_review_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_legal_review_logs_created_at ON public.legal_review_logs(created_at DESC);

-- 법적 준수 체크리스트 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_legal_compliance_checklist_policy_id ON public.legal_compliance_checklist(policy_id);
CREATE INDEX IF NOT EXISTS idx_legal_compliance_checklist_category ON public.legal_compliance_checklist(category);
CREATE INDEX IF NOT EXISTS idx_legal_compliance_checklist_status ON public.legal_compliance_checklist(status);

-- 법적 위험 평가 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_legal_risk_assessment_policy_id ON public.legal_risk_assessment(policy_id);
CREATE INDEX IF NOT EXISTS idx_legal_risk_assessment_risk_type ON public.legal_risk_assessment(risk_type);
CREATE INDEX IF NOT EXISTS idx_legal_risk_assessment_risk_score ON public.legal_risk_assessment(risk_score);
CREATE INDEX IF NOT EXISTS idx_legal_risk_assessment_next_assessment ON public.legal_risk_assessment(next_assessment_date);

-- 법적 문서 버전 관리 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_legal_document_versions_policy_id ON public.legal_document_versions(policy_id);
CREATE INDEX IF NOT EXISTS idx_legal_document_versions_version_number ON public.legal_document_versions(version_number);
CREATE INDEX IF NOT EXISTS idx_legal_document_versions_is_current ON public.legal_document_versions(is_current);
CREATE INDEX IF NOT EXISTS idx_legal_document_versions_effective_date ON public.legal_document_versions(effective_date);

-- 법적 교육 및 인증 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_legal_training_records_user_id ON public.legal_training_records(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_training_records_training_type ON public.legal_training_records(training_type);
CREATE INDEX IF NOT EXISTS idx_legal_training_records_status ON public.legal_training_records(status);
CREATE INDEX IF NOT EXISTS idx_legal_training_records_expiry_date ON public.legal_training_records(expiry_date);

-- =====================================================
-- RLS (Row Level Security) 정책
-- =====================================================

-- 법무 정책 검토 테이블 RLS
ALTER TABLE public.legal_policy_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own policy reviews" ON public.legal_policy_reviews
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own policy reviews" ON public.legal_policy_reviews
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Legal team can view all policy reviews" ON public.legal_policy_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 법무 검토자 테이블 RLS
ALTER TABLE public.legal_reviewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviewers can view their own reviews" ON public.legal_reviewers
    FOR SELECT USING (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update their own reviews" ON public.legal_reviewers
    FOR UPDATE USING (auth.uid() = reviewer_id);

CREATE POLICY "Legal team can manage all reviewers" ON public.legal_reviewers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 법무 검토 의견 테이블 RLS
ALTER TABLE public.legal_review_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviewers can view their own comments" ON public.legal_review_comments
    FOR SELECT USING (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can create their own comments" ON public.legal_review_comments
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Legal team can view all comments" ON public.legal_review_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 법무 검토 로그 테이블 RLS
ALTER TABLE public.legal_review_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Legal team can view all review logs" ON public.legal_review_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 법적 준수 체크리스트 테이블 RLS
ALTER TABLE public.legal_compliance_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Legal team can manage compliance checklist" ON public.legal_compliance_checklist
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 법적 위험 평가 테이블 RLS
ALTER TABLE public.legal_risk_assessment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Legal team can manage risk assessments" ON public.legal_risk_assessment
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 법적 문서 버전 관리 테이블 RLS
ALTER TABLE public.legal_document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Legal team can manage document versions" ON public.legal_document_versions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- 법적 교육 및 인증 테이블 RLS
ALTER TABLE public.legal_training_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own training records" ON public.legal_training_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Legal team can manage all training records" ON public.legal_training_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.id = auth.uid() 
            AND public.users.is_admin = true
        )
    );

-- =====================================================
-- 함수 및 트리거
-- =====================================================

-- 법무 정책 검토 상태 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_legal_policy_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_legal_policy_review_updated_at
    BEFORE UPDATE ON public.legal_policy_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_legal_policy_review_updated_at();

-- 법무 검토자 상태 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_legal_reviewer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_legal_reviewer_updated_at
    BEFORE UPDATE ON public.legal_reviewers
    FOR EACH ROW
    EXECUTE FUNCTION update_legal_reviewer_updated_at();

-- 법무 검토 완료 시 자동 로그 기록
CREATE OR REPLACE FUNCTION log_legal_review_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status AND NEW.status IN ('approved', 'rejected') THEN
        INSERT INTO public.legal_review_logs (
            policy_id, action_type, details, created_at
        ) VALUES (
            NEW.id, 
            CASE 
                WHEN NEW.status = 'approved' THEN 'review_approved'
                WHEN NEW.status = 'rejected' THEN 'review_rejected'
                ELSE 'review_completed'
            END,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'review_duration_days', NEW.review_duration_days
            ),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_legal_review_completion
    AFTER UPDATE ON public.legal_policy_reviews
    FOR EACH ROW
    EXECUTE FUNCTION log_legal_review_completion();

-- 법무 검토 통계 함수
CREATE OR REPLACE FUNCTION get_legal_review_statistics()
RETURNS TABLE (
    total_policies BIGINT,
    under_review BIGINT,
    approved BIGINT,
    rejected BIGINT,
    published BIGINT,
    average_review_time NUMERIC,
    average_compliance_score NUMERIC,
    critical_risks BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_policies,
        COUNT(*) FILTER (WHERE status = 'under_review') as under_review,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'published') as published,
        AVG(review_duration_days) as average_review_time,
        AVG(compliance_score) as average_compliance_score,
        COUNT(*) FILTER (WHERE risk_level = 'critical') as critical_risks
    FROM public.legal_policy_reviews;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 법무 검토 진행률 자동 계산 함수
CREATE OR REPLACE FUNCTION calculate_review_progress(p_policy_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_reviewers INTEGER;
    completed_reviews INTEGER;
    progress_percentage INTEGER;
BEGIN
    -- 총 검토자 수
    SELECT COUNT(*) INTO total_reviewers
    FROM public.legal_reviewers
    WHERE policy_id = p_policy_id;
    
    -- 완료된 검토 수
    SELECT COUNT(*) INTO completed_reviews
    FROM public.legal_reviewers
    WHERE policy_id = p_policy_id
    AND status IN ('approved', 'rejected');
    
    -- 진행률 계산
    IF total_reviewers > 0 THEN
        progress_percentage := (completed_reviews * 100) / total_reviewers;
    ELSE
        progress_percentage := 0;
    END IF;
    
    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 법무 검토 자동 진행률 업데이트 함수
CREATE OR REPLACE FUNCTION update_review_progress()
RETURNS TRIGGER AS $$
DECLARE
    new_progress INTEGER;
BEGIN
    -- 진행률 계산
    new_progress := calculate_review_progress(NEW.policy_id);
    
    -- 정책 검토 진행률 업데이트
    UPDATE public.legal_policy_reviews
    SET review_progress = new_progress
    WHERE id = NEW.policy_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_review_progress
    AFTER INSERT OR UPDATE ON public.legal_reviewers
    FOR EACH ROW
    EXECUTE FUNCTION update_review_progress();

-- 법적 준수 점수 자동 계산 함수
CREATE OR REPLACE FUNCTION calculate_compliance_score(p_policy_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_items INTEGER;
    compliant_items INTEGER;
    compliance_score INTEGER;
BEGIN
    -- 총 체크리스트 항목 수
    SELECT COUNT(*) INTO total_items
    FROM public.legal_compliance_checklist
    WHERE policy_id = p_policy_id;
    
    -- 준수 항목 수
    SELECT COUNT(*) INTO compliant_items
    FROM public.legal_compliance_checklist
    WHERE policy_id = p_policy_id
    AND status = 'compliant';
    
    -- 준수 점수 계산
    IF total_items > 0 THEN
        compliance_score := (compliant_items * 100) / total_items;
    ELSE
        compliance_score := 0;
    END IF;
    
    RETURN compliance_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 초기 데이터 및 샘플
-- =====================================================

-- 기본 법무 정책 검토 데이터 (샘플)
INSERT INTO public.legal_policy_reviews (
    user_id, policy_name, policy_type, version, status, 
    legal_compliance, risk_level, compliance_score, next_review_date
)
SELECT 
    id,
    '개인정보보호정책',
    'privacy',
    '1.0',
    'under_review',
    '{"domestic": true, "international": true, "industry": true}',
    'medium',
    85,
    NOW() + INTERVAL '3 months'
FROM public.users
WHERE id NOT IN (
    SELECT user_id FROM public.legal_policy_reviews 
    WHERE policy_name = '개인정보보호정책'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 사용 예시 및 추가 설명
-- =====================================================

/*
사용 방법:

1. 정책 검토 시작:
   INSERT INTO public.legal_policy_reviews (user_id, policy_name, policy_type, version)
   VALUES ('user-uuid', '서비스 이용약관', 'terms', '1.0');

2. 검토자 할당:
   INSERT INTO public.legal_reviewers (policy_id, reviewer_id, reviewer_name, reviewer_role)
   VALUES ('policy-uuid', 'reviewer-uuid', '김법무', 'legal');

3. 검토 통계 조회:
   SELECT * FROM get_legal_review_statistics();

4. 검토 진행률 계산:
   SELECT calculate_review_progress('policy-uuid');

5. 준수 점수 계산:
   SELECT calculate_compliance_score('policy-uuid');

6. 검토 의견 추가:
   INSERT INTO public.legal_review_comments (policy_id, reviewer_id, reviewer_name, content, type)
   VALUES ('policy-uuid', 'reviewer-uuid', '김법무', '개선 필요', 'requirement');

보안 고려사항:
- 모든 테이블에 RLS 정책 적용
- 사용자는 본인 정책만 조회/관리 가능
- 법무팀은 모든 정책 조회/관리 가능
- 모든 검토 과정 로그 기록
- 자동 진행률 및 점수 계산

법적 고려사항:
- 정책 검토 과정 투명성 보장
- 검토자 권한 및 역할 명확화
- 검토 의견 및 결정 과정 기록
- 정기적인 재검토 일정 관리
- 법적 준수 상태 지속적 모니터링
*/
