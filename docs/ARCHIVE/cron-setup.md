# 🕒 자동 리마인더 스케줄러 설정

## 개요
이 시스템은 상담 예정 24시간 전에 고객과 상담사에게 자동으로 리마인더를 발송합니다.

## 구현된 기능

### 📧 리마인더 알림
- **고객에게**: 푸시 알림 + 이메일
- **상담사에게**: 푸시 알림 + 이메일 (선택사항)
- **발송 시점**: 상담 24시간 전
- **중복 방지**: `reminder_sent` 플래그로 관리

### 🔄 API 엔드포인트
- `GET /api/cron/reminder` - 실제 리마인더 발송
- `GET /api/cron/test-reminder` - 테스트용

## 설정 방법

### 1. 데이터베이스 컬럼 추가
Supabase SQL Editor에서 다음 명령어 실행:

```sql
-- bookings 테이블에 리마인더 관련 컬럼 추가
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_bookings_reminder 
ON bookings(start_at, reminder_sent, status);
```

### 2. 환경변수 설정
`.env.local`에 다음 변수가 설정되어 있는지 확인:

```env
APP_URL=http://localhost:3000  # 프로덕션에서는 실제 도메인
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### 3. 수동 테스트
```bash
# 테스트 실행
npm run test:reminder

# 실제 리마인더 실행
npm run cron:reminder
```

### 4. 자동화 설정

#### Linux/Mac (crontab)
```bash
# crontab 편집
crontab -e

# 매일 오전 9시에 실행 (24시간 전 알림)
0 9 * * * curl -X GET http://localhost:3000/api/cron/reminder
```

#### Windows (작업 스케줄러)
1. 작업 스케줄러 열기
2. 기본 작업 만들기
3. 트리거: 매일 오전 9시
4. 동작: 프로그램 시작 - `curl`
5. 인수: `-X GET http://localhost:3000/api/cron/reminder`

#### Vercel/배포 환경
- **Vercel Cron**: `vercel.json`에 cron 설정
- **GitHub Actions**: `.github/workflows/cron.yml` 생성
- **외부 서비스**: Cron-job.org, EasyCron 등 사용

### 5. Vercel 배포용 설정

`vercel.json` 파일 생성:

```json
{
  "crons": [
    {
      "path": "/api/cron/reminder",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## 모니터링

### 로그 확인
- 콘솔에서 `[CRON REMINDER]` 태그로 로그 확인
- 성공/실패 건수 모니터링

### 응답 예시
```json
{
  "success": true,
  "message": "리마인더 발송이 완료되었습니다.",
  "results": {
    "total": 5,
    "success": 5,
    "failure": 0
  }
}
```

## 주의사항
1. **시간대**: 서버 시간대와 예약 시간대 일치 확인
2. **중복 발송 방지**: `reminder_sent` 플래그 활용
3. **에러 핸들링**: 개별 예약별로 독립적 처리
4. **성능**: 대량 예약 시 배치 처리 고려

## 확장 가능성
- 1시간 전 추가 리마인더
- SMS 알림 연동
- 카카오톡 알림톡 연동
- 리마인더 설정 개인화
