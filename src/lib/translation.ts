import crypto from 'crypto'

// 번역 서비스 래퍼
export class TranslationService {
  private static instance: TranslationService
  private cache: Map<string, string> = new Map()

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService()
    }
    return TranslationService.instance
  }

  // 해시 생성 (캐시 키용)
  private generateHash(text: string, targetLang: string): string {
    return crypto.createHash('sha256').update(`${text}:${targetLang}`).digest('hex')
  }

  // 번역 실행
  async translate(text: string, targetLang: 'ko' | 'es', sourceLang?: 'ko' | 'es'): Promise<string> {
    if (!text.trim()) return text

    const hash = this.generateHash(text, targetLang)
    
    // 캐시 확인
    if (this.cache.has(hash)) {
      return this.cache.get(hash)!
    }

    // OpenAI API 키 확인
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.warn('[TRANSLATION] OpenAI API 키가 설정되지 않았습니다. 원문을 반환합니다.')
      return text
    }

    try {
      const translated = await this.callOpenAI(text, targetLang, sourceLang)
      this.cache.set(hash, translated)
      return translated
    } catch (error) {
      console.error('[TRANSLATION] 번역 실패:', error)
      return text // 실패 시 원문 반환
    }
  }

  // OpenAI API 호출
  private async callOpenAI(text: string, targetLang: 'ko' | 'es', sourceLang?: 'ko' | 'es'): Promise<string> {
    const systemPrompt = this.getSystemPrompt(targetLang, sourceLang)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
  }

  // 시스템 프롬프트 생성
  private getSystemPrompt(targetLang: 'ko' | 'es', sourceLang?: 'ko' | 'es'): string {
    const langMap = {
      ko: '한국어',
      es: '스페인어'
    }

    const targetLangName = langMap[targetLang]
    const sourceLangName = sourceLang ? langMap[sourceLang] : '자동 감지'

    return `당신은 전문 번역가입니다. 다음 텍스트를 ${sourceLangName}에서 ${targetLangName}로 번역해주세요.

번역 규칙:
1. 자연스럽고 자연스러운 표현 사용
2. 문화적 맥락 고려
3. 원문의 톤과 스타일 유지
4. 이모지나 특수문자는 그대로 유지
5. 번역된 텍스트만 반환 (설명 없이)

번역할 텍스트:`
  }

  // 캐시 클리어
  clearCache(): void {
    this.cache.clear()
  }

  // 캐시 크기 확인
  getCacheSize(): number {
    return this.cache.size
  }
}

// 편의 함수들
export const translateText = async (text: string, targetLang: 'ko' | 'es', sourceLang?: 'ko' | 'es'): Promise<string> => {
  return TranslationService.getInstance().translate(text, targetLang, sourceLang)
}

export const clearTranslationCache = (): void => {
  TranslationService.getInstance().clearCache()
}

export const getTranslationCacheSize = (): number => {
  return TranslationService.getInstance().getCacheSize()
}
