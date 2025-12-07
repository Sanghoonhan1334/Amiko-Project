# Twilio 계정 확인 가이드

## 현재 사용 중인 계정 확인

### 1. API로 확인
```bash
curl http://localhost:3000/api/test-twilio
```

응답에서 `accountSid`와 `phoneNumbers` 배열을 확인하세요.

### 2. Twilio 콘솔에서 확인

#### "Amiko-Chile-SMS" 계정 정보 확인
1. Twilio Console 로그인: https://console.twilio.com/
2. 계정 드롭다운에서 "Amiko-Chile-SMS" 선택
3. Account Dashboard에서:
   - **Account SID** 확인 (예: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - **Auth Token** 확인 (View 버튼 클릭)

#### "My first Twilio account" 계정 정보 확인
1. 계정 드롭다운에서 "My first Twilio account" 선택
2. Account Dashboard에서 Account SID 확인
3. Phone Numbers → Manage에서 등록된 번호 목록 확인

## 환경변수 설정

`.env.local` 파일에 "Amiko-Chile-SMS" 계정 정보를 설정하세요:

```bash
# Amiko-Chile-SMS 계정 정보
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# 계정에 등록된 번호 (자동 조회되므로 선택사항)
TWILIO_PHONE_NUMBER=+1234567890
```

## 로그에 나타난 번호들

다음 번호들로 가입 시도가 있었는지 확인:
- 멕시코: +52 5529497115
- 베네수엘라: +58 4144715108  
- 페루: +51 969664932

SQL 쿼리로 확인:
```sql
-- database/check-recent-signups-by-phone.sql 파일 실행
```

