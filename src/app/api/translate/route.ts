import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  let requestBody
  
  try {
    requestBody = await request.json()
    const { text, targetLang, sourceLang } = requestBody

    console.log('[TRANSLATE API] 요청:', { text: text?.substring(0, 50), targetLang, sourceLang })

    if (!text || !targetLang) {
      return NextResponse.json(
        { 
          success: false,
          error: '텍스트와 대상 언어가 필요합니다.' 
        },
        { status: 400 }
      )
    }

    // 언어 코드 변환 (MyMemory API 형식)
    const langMap: Record<string, string> = {
      'ko': 'ko',
      'es': 'es'
    }
    
    // sourceLang이 없으면 targetLang에 따라 추정
    let source: string
    if (sourceLang) {
      source = langMap[sourceLang]
    } else {
      // 언어 감지: targetLang이 'ko'면 'es'로, 'es'면 'ko'로 추정
      source = targetLang === 'ko' ? 'es' : 'ko'
    }
    const target = langMap[targetLang]

    console.log('[TRANSLATE API] 번역 시작:', { source, target })

    // MyMemory API 호출 (무료, 안정적)
    const encodedText = encodeURIComponent(text)
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${source}|${target}`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    console.log('[TRANSLATE API] MyMemory 응답 상태:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[TRANSLATE API] MyMemory 오류:', errorText)
      throw new Error(`MyMemory API 오류: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('[TRANSLATE API] 번역 완료:', { translatedText: data.responseData?.translatedText?.substring(0, 50) })
    
    if (!data.responseData || !data.responseData.translatedText) {
      throw new Error('번역 결과를 받지 못했습니다.')
    }
    
    return NextResponse.json({
      success: true,
      translatedText: data.responseData.translatedText,
      originalText: text,
      sourceLang: source,
      targetLang: target
    })

  } catch (error) {
    console.error('[TRANSLATE API] 번역 실패:', error)
    
    const errorMessage = error instanceof Error ? error.message : '번역 중 오류가 발생했습니다.'
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        originalText: requestBody?.text || ''
      },
      { status: 500 }
    )
  }
}