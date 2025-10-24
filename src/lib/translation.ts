import crypto from 'crypto'

// 번역 서비스 타입
type TranslationProvider = 'openai' | 'google' | 'mock' | 'libretranslate'

// 번역 서비스 래퍼
export class TranslationService {
  private static instance: TranslationService
  private cache: Map<string, string> = new Map()
  private provider: TranslationProvider = 'openai'

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService()
    }
    return TranslationService.instance
  }

  // 번역 제공자 설정
  setProvider(provider: TranslationProvider): void {
    this.provider = provider
  }

  // 현재 제공자 확인
  getProvider(): TranslationProvider {
    return this.provider
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

    try {
      let translated: string

      switch (this.provider) {
        case 'openai':
          translated = await this.callOpenAI(text, targetLang, sourceLang)
          break
        case 'google':
          translated = await this.callGoogleTranslate(text, targetLang, sourceLang)
          break
        case 'libretranslate':
          translated = await this.callLibreTranslate(text, targetLang, sourceLang)
          break
        case 'mock':
          translated = await this.callMockTranslation(text, targetLang, sourceLang)
          break
        default:
          throw new Error(`지원하지 않는 번역 제공자: ${this.provider}`)
      }

      this.cache.set(hash, translated)
      return translated
    } catch (error) {
      console.error('[TRANSLATION] 번역 실패:', error)
      return text // 실패 시 원문 반환
    }
  }

  // OpenAI API 호출
  private async callOpenAI(text: string, targetLang: 'ko' | 'es', sourceLang?: 'ko' | 'es'): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다.')
    }

    const systemPrompt = this.getSystemPrompt(targetLang, sourceLang)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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

  // Google Translate API 호출
  private async callGoogleTranslate(text: string, targetLang: 'ko' | 'es', sourceLang?: 'ko' | 'es'): Promise<string> {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY
    if (!apiKey) {
      throw new Error('Google Translate API 키가 설정되지 않았습니다.')
    }

    const source = sourceLang || 'auto'
    const target = targetLang

    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: source,
        target: target,
        format: 'text'
      }),
    })

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data.translations[0].translatedText
  }

  // LibreTranslate API 호출 (무료) - API 라우트를 통해 호출
  private async callLibreTranslate(text: string, targetLang: 'ko' | 'es', sourceLang?: 'ko' | 'es'): Promise<string> {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          targetLang: targetLang,
          sourceLang: sourceLang
        }),
      })

      if (!response.ok) {
        throw new Error(`번역 API 오류: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || '번역 실패')
      }

      return data.translatedText
    } catch (error) {
      console.error('[TRANSLATION] LibreTranslate API 호출 실패:', error)
      throw error
    }
  }

  // Mock 번역 (개발/테스트용)
  private async callMockTranslation(text: string, targetLang: 'ko' | 'es', sourceLang?: 'ko' | 'es'): Promise<string> {
    // 간단한 목업 번역 데이터베이스
    const mockTranslations: Record<string, Record<string, string>> = {
      // 한국어 → 스페인어
      'ko-es': {
        '안녕하세요': 'Hola',
        '감사합니다': 'Gracias',
        '한국 화장품 브랜드 추천해주세요!': '¡Por favor recomiéndame marcas de cosméticos coreanos!',
        '한국에 처음 와서 화장품을 사려고 하는데, 어떤 브랜드가 좋을까요?': 'Es la primera vez que vengo a Corea y quiero comprar cosméticos, ¿qué marcas serían buenas?',
        '서울에서 데이트하기 좋은 곳': 'Buenos lugares para citas en Seúl',
        '한국 전통 음식 맛집 추천': 'Recomendación de restaurantes de comida tradicional coreana',
        '한국 패션 트렌드 2024': 'Tendencias de moda coreana 2024',
        'K-pop 스타들과 함께하는 스페인어 학습 팁': 'Consejos para aprender español con estrellas de K-pop',
        '마드리드에서 만난 한국인 친구들': 'Amigos coreanos que conocí en Madrid',
        '한국-스페인 문화교류 페스티벌 개최': 'Festival de intercambio cultural Corea-España',
        '스페인어 발음 연습하는 재미있는 방법': 'Métodos divertidos para practicar la pronunciación del español',
        '바르셀로나에서의 첫 스페인어 대화': 'Mi primera conversación en español en Barcelona'
      },
      // 스페인어 → 한국어
      'es-ko': {
        'Hola': '안녕하세요',
        'Gracias': '감사합니다',
        '¡Por favor recomiéndame marcas de cosméticos coreanos!': '한국 화장품 브랜드 추천해주세요!',
        'Es la primera vez que vengo a Corea y quiero comprar cosméticos, ¿qué marcas serían buenas?': '한국에 처음 와서 화장품을 사려고 하는데, 어떤 브랜드가 좋을까요?',
        'Buenos lugares para citas en Seúl': '서울에서 데이트하기 좋은 곳',
        'Recomendación de restaurantes de comida tradicional coreana': '한국 전통 음식 맛집 추천',
        'Tendencias de moda coreana 2024': '한국 패션 트렌드 2024',
        'Consejos para aprender español con estrellas de K-pop': 'K-pop 스타들과 함께하는 스페인어 학습 팁',
        'Amigos coreanos que conocí en Madrid': '마드리드에서 만난 한국인 친구들',
        'Festival de intercambio cultural Corea-España': '한국-스페인 문화교류 페스티벌 개최',
        'Métodos divertidos para practicar la pronunciación del español': '스페인어 발음 연습하는 재미있는 방법',
        'Mi primera conversación en español en Barcelona': '바르셀로나에서의 첫 스페인어 대화'
      }
    }

    const translationKey = `${sourceLang || 'ko'}-${targetLang}`
    const translations = mockTranslations[translationKey]
    
    if (translations && translations[text]) {
      return translations[text]
    }

    // 정확한 번역이 없으면 간단한 변환
    if (targetLang === 'es') {
      return `[ES] ${text}`
    } else {
      return `[KO] ${text}`
    }
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

export const setTranslationProvider = (provider: TranslationProvider): void => {
  TranslationService.getInstance().setProvider(provider)
}

export const getTranslationProvider = (): TranslationProvider => {
  return TranslationService.getInstance().getProvider()
}

// 번역 제공자별 설정 함수
export const initializeTranslationService = (): void => {
  const service = TranslationService.getInstance()
  
  // 환경변수에 따라 자동으로 제공자 선택
  if (process.env.OPENAI_API_KEY) {
    service.setProvider('openai')
    console.log('[TRANSLATION] OpenAI 번역 서비스 활성화')
  } else if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    service.setProvider('google')
    console.log('[TRANSLATION] Google Translate 번역 서비스 활성화')
  } else {
    service.setProvider('mock')
    console.log('[TRANSLATION] Mock 번역 서비스 활성화 (개발 모드)')
  }
}
