import crypto from 'crypto'

// 암호화 설정
const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const TAG_LENGTH = 16 // 128 bits
const SALT_LENGTH = 64 // 512 bits

// 환경변수에서 마스터 키 가져오기
const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'default-master-key-change-in-production'

/**
 * PBKDF2를 사용하여 키 파생
 * @param password 마스터 패스워드
 * @param salt 솔트
 * @param iterations 반복 횟수
 * @param keyLength 키 길이
 * @returns 파생된 키
 */
function deriveKey(password: string, salt: Buffer, iterations: number = 100000, keyLength: number = KEY_LENGTH): Buffer {
  return crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256')
}

/**
 * 랜덤 솔트 생성
 * @returns 랜덤 솔트
 */
function generateSalt(): Buffer {
  return crypto.randomBytes(SALT_LENGTH)
}

/**
 * 랜덤 IV 생성
 * @returns 랜덤 IV
 */
function generateIV(): Buffer {
  return crypto.randomBytes(IV_LENGTH)
}

/**
 * 데이터 암호화
 * @param data 암호화할 데이터
 * @param key 암호화 키 (선택사항, 없으면 마스터 키 사용)
 * @returns 암호화된 데이터와 메타데이터
 */
export function encryptData(data: string, key?: string): string {
  try {
    const salt = generateSalt()
    const iv = generateIV()
    const encryptionKey = key ? deriveKey(key, salt) : deriveKey(MASTER_KEY, salt)
    
    const cipher = crypto.createCipher(ALGORITHM, encryptionKey)
    cipher.setAAD(Buffer.from('amiko-encryption', 'utf8'))
    
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    // 솔트 + IV + 태그 + 암호화된 데이터를 결합
    const result = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ])
    
    return result.toString('base64')
  } catch (error) {
    console.error('암호화 실패:', error)
    throw new Error('데이터 암호화에 실패했습니다.')
  }
}

/**
 * 데이터 복호화
 * @param encryptedData 암호화된 데이터
 * @param key 복호화 키 (선택사항, 없으면 마스터 키 사용)
 * @returns 복호화된 데이터
 */
export function decryptData(encryptedData: string, key?: string): string {
  try {
    const buffer = Buffer.from(encryptedData, 'base64')
    
    // 솔트, IV, 태그, 암호화된 데이터 분리
    const salt = buffer.subarray(0, SALT_LENGTH)
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    
    const decryptionKey = key ? deriveKey(key, salt) : deriveKey(MASTER_KEY, salt)
    
    const decipher = crypto.createDecipher(ALGORITHM, decryptionKey)
    decipher.setAAD(Buffer.from('amiko-encryption', 'utf8'))
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('복호화 실패:', error)
    throw new Error('데이터 복호화에 실패했습니다.')
  }
}

/**
 * 해시 생성 (SHA-256)
 * @param data 해시할 데이터
 * @param salt 솔트 (선택사항)
 * @returns 해시값
 */
export function createHash(data: string, salt?: string): string {
  const hash = crypto.createHash('sha256')
  if (salt) {
    hash.update(data + salt)
  } else {
    hash.update(data)
  }
  return hash.digest('hex')
}

/**
 * HMAC 생성
 * @param data HMAC할 데이터
 * @param secretKey 비밀 키
 * @returns HMAC 값
 */
export function createHMAC(data: string, secretKey: string): string {
  return crypto.createHmac('sha256', secretKey).update(data).digest('hex')
}

/**
 * 랜덤 토큰 생성
 * @param length 토큰 길이 (바이트)
 * @returns 랜덤 토큰
 */
export function generateRandomToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * JWT 토큰 생성
 * @param payload 페이로드
 * @param secretKey 비밀 키
 * @param expiresIn 만료 시간 (초)
 * @returns JWT 토큰
 */
export function createJWT(payload: any, secretKey: string, expiresIn: number = 3600): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }
  
  const now = Math.floor(Date.now() / 1000)
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  }
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url')
  
  const signature = createHMAC(`${encodedHeader}.${encodedPayload}`, secretKey)
  
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

/**
 * JWT 토큰 검증
 * @param token JWT 토큰
 * @param secretKey 비밀 키
 * @returns 검증된 페이로드
 */
export function verifyJWT(token: string, secretKey: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('잘못된 JWT 형식입니다.')
    }
    
    const [encodedHeader, encodedPayload, signature] = parts
    
    // 서명 검증
    const expectedSignature = createHMAC(`${encodedHeader}.${encodedPayload}`, secretKey)
    if (signature !== expectedSignature) {
      throw new Error('JWT 서명이 유효하지 않습니다.')
    }
    
    // 페이로드 디코딩
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
    
    // 만료 시간 검증
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      throw new Error('JWT 토큰이 만료되었습니다.')
    }
    
    return payload
  } catch (error) {
    console.error('JWT 검증 실패:', error)
    throw new Error('JWT 토큰 검증에 실패했습니다.')
  }
}

/**
 * 비밀번호 해시 생성 (bcrypt 스타일)
 * @param password 비밀번호
 * @param saltRounds 솔트 라운드 수
 * @returns 해시된 비밀번호
 */
export function hashPassword(password: string, saltRounds: number = 12): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, saltRounds, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

/**
 * 비밀번호 검증
 * @param password 원본 비밀번호
 * @param hashedPassword 해시된 비밀번호
 * @returns 검증 결과
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    const [salt, hash] = hashedPassword.split(':')
    const testHash = crypto.pbkdf2Sync(password, salt, 12, 64, 'sha512').toString('hex')
    return hash === testHash
  } catch (error) {
    console.error('비밀번호 검증 실패:', error)
    return false
  }
}

/**
 * 민감한 데이터 마스킹
 * @param data 마스킹할 데이터
 * @param type 데이터 타입
 * @returns 마스킹된 데이터
 */
export function maskSensitiveData(data: string, type: 'email' | 'phone' | 'ssn' | 'creditcard'): string {
  switch (type) {
    case 'email':
      const [local, domain] = data.split('@')
      return `${local.substring(0, 2)}***@${domain}`
    
    case 'phone':
      return data.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    
    case 'ssn':
      return data.replace(/(\d{3})\d{2}(\d{3})/, '$1**$2')
    
    case 'creditcard':
      return data.replace(/(\d{4})\d{8}(\d{4})/, '$1********$2')
    
    default:
      return data
  }
}

/**
 * 데이터 무결성 검증
 * @param data 검증할 데이터
 * @param checksum 체크섬
 * @returns 무결성 검증 결과
 */
export function verifyDataIntegrity(data: string, checksum: string): boolean {
  const calculatedChecksum = createHash(data)
  return calculatedChecksum === checksum
}

/**
 * 데이터 무결성 체크섬 생성
 * @param data 체크섬을 생성할 데이터
 * @returns 체크섬
 */
export function generateDataChecksum(data: string): string {
  return createHash(data)
}

/**
 * 암호화 키 생성
 * @param length 키 길이 (바이트)
 * @returns 암호화 키
 */
export function generateEncryptionKey(length: number = KEY_LENGTH): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * 키 회전 (Key Rotation)
 * @param oldKey 기존 키
 * @param newKey 새 키
 * @param encryptedData 암호화된 데이터
 * @returns 새 키로 재암호화된 데이터
 */
export function rotateEncryptionKey(oldKey: string, newKey: string, encryptedData: string): string {
  try {
    // 기존 키로 복호화
    const decryptedData = decryptData(encryptedData, oldKey)
    
    // 새 키로 재암호화
    const reEncryptedData = encryptData(decryptedData, newKey)
    
    return reEncryptedData
  } catch (error) {
    console.error('키 회전 실패:', error)
    throw new Error('암호화 키 회전에 실패했습니다.')
  }
}

/**
 * 보안 설정 검증
 * @returns 보안 설정 상태
 */
export function validateSecuritySettings(): {
  isValid: boolean
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []
  
  // 마스터 키 검증
  if (MASTER_KEY === 'default-master-key-change-in-production') {
    issues.push('기본 마스터 키가 사용되고 있습니다.')
    recommendations.push('프로덕션 환경에서 강력한 마스터 키를 설정하세요.')
  }
  
  // 환경변수 검증
  if (!process.env.ENCRYPTION_MASTER_KEY) {
    issues.push('ENCRYPTION_MASTER_KEY 환경변수가 설정되지 않았습니다.')
    recommendations.push('ENCRYPTION_MASTER_KEY 환경변수를 설정하세요.')
  }
  
  // 암호화 알고리즘 검증
  if (!crypto.getCiphers().includes(ALGORITHM)) {
    issues.push('지원되지 않는 암호화 알고리즘입니다.')
    recommendations.push('지원되는 암호화 알고리즘을 사용하세요.')
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  }
}

// 보안 설정 검증 실행
const securityValidation = validateSecuritySettings()
if (!securityValidation.isValid) {
  console.warn('보안 설정 검증 실패:', securityValidation.issues)
  console.warn('권장사항:', securityValidation.recommendations)
}
