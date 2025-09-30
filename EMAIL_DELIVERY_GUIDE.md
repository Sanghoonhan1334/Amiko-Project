# 📧 이메일 도착률 개선 가이드

## 🚨 네이버 메일 도착 문제 해결

### 1. **SPF 레코드 설정**
도메인 DNS에 SPF 레코드 추가:
```
TXT 레코드: v=spf1 include:spf.hiworks.com ~all
```

### 2. **DKIM 설정**
하이웍스에서 DKIM 키를 받아 DNS에 추가:
```
TXT 레코드: v=DKIM1; k=rsa; p=DKIM_PUBLIC_KEY
```

### 3. **DMARC 정책 설정**
```
TXT 레코드: v=DMARC1; p=quarantine; rua=mailto:dmarc@helloamiko.com
```

## 📊 **메일 도착률 개선 방법**

### 1. **발신자 정보 개선**
```javascript
// 현재
SMTP_FROM="Amiko <info@helloamiko.com>"

// 개선안
SMTP_FROM="Amiko 인증센터 <noreply@helloamiko.com>"
```

### 2. **메일 내용 개선**
- 스팸 키워드 제거
- HTML 구조 개선
- 텍스트 버전 추가

### 3. **발송 빈도 제한**
- 같은 이메일로 1시간에 1회만 발송
- 일일 발송량 제한

## 🔍 **문제 진단 도구**

### 1. **메일 도착 확인**
```bash
# 네이버 메일 테스트
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@naver.com"}'
```

### 2. **스팸 점수 확인**
- [Mail-Tester.com](https://www.mail-tester.com/)
- [MXToolbox](https://mxtoolbox.com/spamcheck.aspx)

### 3. **DNS 설정 확인**
```bash
# SPF 레코드 확인
dig TXT helloamiko.com

# MX 레코드 확인
dig MX helloamiko.com
```

## 🚀 **즉시 적용 가능한 해결책**

### 1. **Gmail SMTP 사용 (임시)**
```bash
# .env.local에 추가
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password
```

### 2. **SendGrid 사용 (권장)**
```bash
# SendGrid API 키 사용
SENDGRID_API_KEY=your-sendgrid-api-key
```

### 3. **AWS SES 사용 (프로덕션)**
```bash
# AWS SES 설정
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

## 📈 **도착률 모니터링**

### 1. **발송 로그 추가**
```javascript
// 발송 성공/실패 로그
console.log(`[EMAIL_SEND] ${email}: ${success ? '성공' : '실패'}`)
```

### 2. **도착률 통계**
- Gmail: 95%+
- 네이버: 70%+ (개선 필요)
- 다음: 80%+

## ⚠️ **주의사항**

1. **스팸 폴더 확인**: 네이버 사용자에게 스팸 폴더 확인 안내
2. **발송자 신뢰도**: 도메인 평판 관리
3. **사용자 교육**: 스팸 필터 설정 안내

---

**우선순위:**
1. SPF/DKIM 설정 (가장 중요)
2. Gmail SMTP 임시 사용
3. SendGrid/AWS SES 전환
