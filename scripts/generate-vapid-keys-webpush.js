const crypto = require('crypto');

function generateVapidKeys() {
  console.log('🔑 web-push 라이브러리용 VAPID 키 생성 중...\n');

  // EC 키 쌍 생성
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  // PEM에서 raw public key 추출
  const publicKeyBuffer = crypto.createPublicKey(publicKey).export({ type: 'spki', format: 'der' });

  // 첫 번째 26바이트는 ASN.1 헤더이므로 제거
  const rawPublicKey = publicKeyBuffer.slice(26);

  // Base64URL로 인코딩 (Web Push API용) - 패딩 제거
  const publicKeyBase64Url = rawPublicKey.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // 비공개키도 Base64URL로 인코딩 (패딩 제거)
  const privateKeyBuffer = crypto.createPrivateKey(privateKey).export({ type: 'pkcs8', format: 'der' });
  const privateKeyBase64Url = privateKeyBuffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKeyBase64Url}`);
  console.log(`VAPID_PRIVATE_KEY=${privateKeyBase64Url}`);
  console.log('\n⚠️ 중요: 위 키를 .env.local 파일에 복사하여 붙여넣으세요.');
  console.log('서버를 재시작해야 변경사항이 적용됩니다.');
  console.log('\n📝 특징:');
  console.log('• 공개키: Web Push API용 raw Base64URL 형식');
  console.log('• 비공개키: web-push 라이브러리용 Base64URL 형식 (패딩 없음)');
}

generateVapidKeys();
