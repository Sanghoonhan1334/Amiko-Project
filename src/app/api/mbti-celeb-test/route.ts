import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '@/lib/supabaseServer'

// MBTI + 셀럽 매칭 테스트 API

export async function POST(request: NextRequest) {
  try {
    const { answers } = await request.json()
    
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { success: false, error: '답변이 필요합니다.' },
        { status: 400 }
      )
    }

    // MBTI 계산 로직
    const mbti = calculateMBTI(answers)
    
    // 실제 데이터베이스에서 셀럽 매칭 정보 가져오기
    console.log('데이터베이스에서 셀럽 매칭 정보 조회 중...')
    const celebMatches = await getCelebMatches(mbti)
    
    const result = {
      ...celebMatches,
      mbti
    }
    
    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('MBTI 셀럽 테스트 오류:', error)
    return NextResponse.json(
      { success: false, error: '테스트 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// MBTI 계산 함수
function calculateMBTI(answers: number[]): string {
  console.log('MBTI 계산 시작, 답변:', answers)
  
  // MBTI 차원별 점수
  const dimensions = {
    E: 0, I: 0,  // 외향/내향
    S: 0, N: 0,  // 감각/직관
    T: 0, F: 0,  // 사고/감정
    J: 0, P: 0   // 판단/인식
  }

  // 질문별 차원 매핑 (24개 질문)
  const questionDimensions = [
    'EI', 'SN', 'TF', 'JP', // 1-4
    'EI', 'SN', 'TF', 'JP', // 5-8
    'EI', 'SN', 'TF', 'JP', // 9-12
    'EI', 'SN', 'TF', 'JP', // 13-16
    'EI', 'SN', 'TF', 'JP', // 17-20
    'EI', 'SN', 'TF', 'JP'  // 21-24
  ]
  
  // 답변에 따른 점수 계산
  answers.forEach((answer, index) => {
    const dimension = questionDimensions[index]
    console.log(`질문 ${index + 1}: 답변 ${answer}, 차원 ${dimension}`)
    
    if (dimension === 'EI') {
      answer === 0 ? dimensions.E++ : dimensions.I++
    } else if (dimension === 'SN') {
      answer === 0 ? dimensions.S++ : dimensions.N++
    } else if (dimension === 'TF') {
      answer === 0 ? dimensions.T++ : dimensions.F++
    } else if (dimension === 'JP') {
      answer === 0 ? dimensions.J++ : dimensions.P++
    }
  })

  console.log('차원별 점수:', dimensions)

  // MBTI 코드 생성
  const mbti = 
    (dimensions.E >= dimensions.I ? 'E' : 'I') +
    (dimensions.S >= dimensions.N ? 'S' : 'N') +
    (dimensions.T >= dimensions.F ? 'T' : 'F') +
    (dimensions.J >= dimensions.P ? 'J' : 'P')

  console.log('계산된 MBTI:', mbti)
  return mbti
}

// 셀럽 매칭 정보 가져오기
async function getCelebMatches(mbti: string) {
  try {
    console.log('셀럽 매칭 시작, MBTI:', mbti)
    
    if (!supabaseClient) {
      console.log('Supabase 클라이언트 없음')
      throw new Error('데이터베이스 연결이 설정되지 않았습니다.')
    }
    
    const supabase = supabaseClient
    
    // 1. 내 MBTI와 같은 셀럽들 (남/여 각 1명)
    console.log('내 타입 셀럽 조회 중...')
    const { data: myTypeCelebs, error: myTypeError } = await supabase
      .from('celeb_profiles')
      .select('*')
      .eq('mbti_code', mbti)
      .not('gender', 'is', null)

    if (myTypeError) {
      console.error('내 타입 셀럽 조회 오류:', myTypeError)
    } else {
      console.log('내 타입 셀럽 조회 성공:', myTypeCelebs)
    }

    // 2. 궁합 정보 가져오기
    console.log('궁합 정보 조회 중...')
    const { data: compatibility, error: compatError } = await supabase
      .from('mbti_compatibility')
      .select('best_match_codes, note_ko, note_es')
      .eq('mbti_code', mbti)
      .single()

    if (compatError) {
      console.error('궁합 정보 조회 오류:', compatError)
    } else {
      console.log('궁합 정보 조회 성공:', compatibility)
    }

    // 3. 궁합 유형 중 하나 랜덤 선택
    const bestMatchCodes = compatibility?.best_match_codes || []
    const bestMatchMbti = bestMatchCodes.length > 0 
      ? bestMatchCodes[Math.floor(Math.random() * bestMatchCodes.length)]
      : null

    // 4. 궁합 유형의 셀럽들 가져오기
    let bestMatchCelebs = []
    if (bestMatchMbti) {
      const { data: bestCelebs, error: bestError } = await supabase
        .from('celeb_profiles')
        .select('*')
        .eq('mbti_code', bestMatchMbti)
        .not('gender', 'is', null)

      if (bestError) {
        console.error('궁합 셀럽 조회 오류:', bestError)
      } else {
        bestMatchCelebs = bestCelebs || []
      }
    }

    // 5. 남/여 각각 1명씩 선택
    const myTypeMale = myTypeCelebs?.find(c => c.gender === 'male') || null
    const myTypeFemale = myTypeCelebs?.find(c => c.gender === 'female') || null
    const bestMatchMale = bestMatchCelebs.find(c => c.gender === 'male') || null
    const bestMatchFemale = bestMatchCelebs.find(c => c.gender === 'female') || null

    return {
      myType: {
        male: myTypeMale,
        female: myTypeFemale
      },
      bestMatch: {
        male: bestMatchMale,
        female: bestMatchFemale
      },
      bestMatchMbti,
      compatibility: compatibility || null
    }

  } catch (error) {
    console.error('셀럽 매칭 조회 오류:', error)
    throw error
  }
}
