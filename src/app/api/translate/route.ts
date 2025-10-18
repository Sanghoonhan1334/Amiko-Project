import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json()
    
    console.log('번역 요청 데이터:', { text, targetLanguage })

    if (!text) {
      console.log('오류: 번역할 텍스트가 없음')
      return NextResponse.json(
        { error: '번역할 텍스트가 필요합니다.' },
        { status: 400 }
      )
    }

    // Google Translate API 사용
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: '번역 API 키가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'http://localhost:3000' // 리퍼러 추가
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguage, // 'ko' 또는 'es'
        format: 'text'
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Google Translate API 오류:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        requestData: { text, targetLanguage }
      })
      return NextResponse.json(
        { 
          error: '번역 요청에 실패했습니다.',
          details: errorData,
          status: response.status
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    const translatedText = data.data.translations[0].translatedText

    return NextResponse.json({ 
      translatedText,
      sourceLanguage: data.data.translations[0].detectedSourceLanguage || 'unknown'
    })

  } catch (error) {
    console.error('번역 오류:', error)
    return NextResponse.json(
      { error: '번역 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
