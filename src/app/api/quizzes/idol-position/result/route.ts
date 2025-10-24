import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resultType = searchParams.get('type')

    console.log('[IDOL_RESULT] API 호출 시작, 결과 타입:', resultType)

    if (!resultType) {
      return NextResponse.json(
        { error: 'Result type is required' },
        { status: 400 }
      )
    }

    if (!supabaseClient) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    const supabase = supabaseClient
    const quizId = 'dea20361-fd46-409d-880f-f91869c1d184' // Idol Position Quiz ID

    // 결과 정보 조회
    const { data: result, error: resultError } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('result_type', resultType)
      .single()

    if (resultError || !result) {
      console.log('[IDOL_RESULT] 결과를 찾을 수 없음:', resultType)
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      )
    }

    console.log('[IDOL_RESULT] 결과 조회 성공:', result.title)

    // compatible 정보 조회 (slug 기반)
    let compatibleData = null
    if (result.recommendation) {
      const { data: compatibleResult } = await supabase
        .from('quiz_results')
        .select('result_type, title, image_url')
        .eq('quiz_id', quizId)
        .eq('result_type', result.recommendation)
        .single()
      
      if (compatibleResult) {
        // result_type을 slug로 변환 (예: "vocalista-principal" -> "vocalista")
        const slugMapping: { [key: string]: string } = {
          'vocalista-principal': 'vocalista',
          'bailarina-principal': 'bailarina',
          'rapera-principal': 'rapera',
          'cantautora-principal': 'cantautora'
        }
        const finalSlug = slugMapping[compatibleResult.result_type] || compatibleResult.result_type
        
        compatibleData = {
          slug: finalSlug,
          titulo: compatibleResult.title,
          imagen: compatibleResult.image_url || `/quizzes/idol-roles/${finalSlug}.png`
        }
      }
    }

    // incompatible 정보 조회 (현재는 하드코딩된 매핑 사용)
    let incompatibleData = null
    const incompatibleMapping: { [key: string]: string } = {
      'lider': 'rapera',
      'vocalista': 'productora', 
      'bailarina': 'cantautora',
      'rapera': 'lider',
      'centro': 'la-menor',
      'cantautora': 'bailarina',
      'la-menor': 'centro',
      'productora': 'vocalista'
    }
    
    const incompatibleSlug = incompatibleMapping[result.result_type]
    if (incompatibleSlug) {
      const { data: incompatibleResult } = await supabase
        .from('quiz_results')
        .select('result_type, title, image_url')
        .eq('quiz_id', quizId)
        .eq('result_type', incompatibleSlug)
        .single()
      
      if (incompatibleResult) {
        // result_type을 slug로 변환
        const slugMapping: { [key: string]: string } = {
          'vocalista-principal': 'vocalista',
          'bailarina-principal': 'bailarina',
          'rapera-principal': 'rapera',
          'cantautora-principal': 'cantautora'
        }
        const finalSlug = slugMapping[incompatibleResult.result_type] || incompatibleResult.result_type
        
        incompatibleData = {
          slug: finalSlug,
          titulo: incompatibleResult.title,
          imagen: incompatibleResult.image_url || `/quizzes/idol-roles/${finalSlug}.png`
        }
      }
    }

    // 결과 데이터를 새로운 형식으로 변환
    const slugMapping: { [key: string]: string } = {
      'vocalista-principal': 'vocalista',
      'bailarina-principal': 'bailarina',
      'rapera-principal': 'rapera',
      'cantautora-principal': 'cantautora'
    }
    const finalSlug = slugMapping[result.result_type] || result.result_type
    
    const formattedResult = {
      slug: finalSlug,
      titulo: result.title,
      descripcion: result.description,
      cuidado: result.characteristic || '',
      imagen: result.image_url || `/quizzes/idol-roles/${finalSlug}.png`,
      compatible: compatibleData,
      incompatible: incompatibleData
    }

    return NextResponse.json({
      success: true,
      result: formattedResult
    })

  } catch (error: any) {
    console.error('[IDOL_RESULT] 예상치 못한 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

