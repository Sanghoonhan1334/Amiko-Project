import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// 데이터 이식권 요청 처리
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { userId, dataType } = body

    if (!userId || !dataType) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 사용자 인증 확인
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 본인 확인
    if (user.id !== userId) {
      return NextResponse.json(
        { error: '본인의 데이터만 내보낼 수 있습니다.' },
        { status: 403 }
      )
    }

    // 유효한 데이터 유형 확인
    const validDataTypes = ['complete', 'profile', 'activity', 'consent']
    if (!validDataTypes.includes(dataType)) {
      return NextResponse.json(
        { error: '유효하지 않은 데이터 유형입니다.' },
        { status: 400 }
      )
    }

    // 중복 요청 확인 (진행 중인 요청이 있는지)
    const { data: existingRequest } = await supabaseServer
      .from('gdpr_data_exports')
      .select('id, status')
      .eq('user_id', userId)
      .eq('data_type', dataType)
      .in('status', ['pending', 'processing'])
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: '이미 진행 중인 동일한 데이터 내보내기 요청이 있습니다.' },
        { status: 400 }
      )
    }

    // 데이터 내보내기 요청 생성
    const exportRequest = {
      user_id: userId,
      data_type: dataType,
      status: 'pending',
      ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  '127.0.0.1',
      user_agent: request.headers.get('user-agent') || '',
      requested_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7일 후 만료
    }

    const { data: newRequest, error: insertError } = await supabaseServer
      .from('gdpr_data_exports')
      .insert(exportRequest)
      .select()
      .single()

    if (insertError) {
      console.error('[GDPR_DATA_EXPORT_POST] 데이터베이스 오류:', insertError)
      return NextResponse.json(
        { error: '데이터 내보내기 요청 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 데이터 내보내기 로그 기록
    await supabaseServer
      .from('gdpr_processing_logs')
      .insert({
        user_id: userId,
        export_id: newRequest.id,
        action_type: 'export_requested',
        details: {
          data_type: dataType
        },
        ip_address: exportRequest.ip_address,
        user_agent: exportRequest.user_agent,
        created_at: new Date().toISOString()
      })

    // 백그라운드에서 데이터 처리 시작
    processDataExport(newRequest.id, userId, dataType)

    return NextResponse.json({
      success: true,
      message: '데이터 내보내기 요청이 접수되었습니다.',
      exportId: newRequest.id,
      status: 'pending',
      estimatedProcessingTime: '24시간 이내',
      dataType: dataType
    })

  } catch (error) {
    console.error('[GDPR_DATA_EXPORT_POST] 오류:', error)
    return NextResponse.json(
      { error: '데이터 내보내기 요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 데이터 내보내기 이력 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const exportId = searchParams.get('exportId')

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용자 인증 확인
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 본인 확인
    if (user.id !== userId) {
      return NextResponse.json(
        { error: '본인의 데이터 내보내기만 조회할 수 있습니다.' },
        { status: 403 }
      )
    }

    if (exportId) {
      // 특정 내보내기 조회
      const { data: exportData } = await supabaseServer
        .from('gdpr_data_exports')
        .select('*')
        .eq('id', exportId)
        .eq('user_id', userId)
        .single()

      if (!exportData) {
        return NextResponse.json(
          { error: '데이터 내보내기를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        export: exportData
      })
    } else {
      // 사용자의 모든 내보내기 조회
      const { data: exports } = await supabaseServer
        .from('gdpr_data_exports')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false })

      return NextResponse.json({
        success: true,
        exportHistory: exports || []
      })
    }

  } catch (error) {
    console.error('[GDPR_DATA_EXPORT_GET] 오류:', error)
    return NextResponse.json(
      { error: '데이터 내보내기 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 데이터 내보내기 취소
export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { userId, exportId } = body

    if (!userId || !exportId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 사용자 인증 확인
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 본인 확인
    if (user.id !== userId) {
      return NextResponse.json(
        { error: '본인의 데이터 내보내기만 취소할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 요청 상태 확인
    const { data: exportData } = await supabaseServer
      .from('gdpr_data_exports')
      .select('status')
      .eq('id', exportId)
      .eq('user_id', userId)
      .single()

    if (!exportData) {
      return NextResponse.json(
        { error: '데이터 내보내기를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (exportData.status !== 'pending') {
      return NextResponse.json(
        { error: '대기 중인 요청만 취소할 수 있습니다.' },
        { status: 400 }
      )
    }

    // 요청 취소
    const { error: updateError } = await supabaseServer
      .from('gdpr_data_exports')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', exportId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('[GDPR_DATA_EXPORT_DELETE] 데이터베이스 오류:', updateError)
      return NextResponse.json(
        { error: '요청 취소에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 취소 로그 기록
    await supabaseServer
      .from('gdpr_processing_logs')
      .insert({
        user_id: userId,
        export_id: exportId,
        action_type: 'export_cancelled',
        details: {
          cancelled_by: 'user'
        },
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
        user_agent: request.headers.get('user-agent') || '',
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: '데이터 내보내기 요청이 취소되었습니다.'
    })

  } catch (error) {
    console.error('[GDPR_DATA_EXPORT_DELETE] 오류:', error)
    return NextResponse.json(
      { error: '요청 취소 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 데이터 내보내기 처리 함수 (백그라운드)
async function processDataExport(exportId: string, userId: string, dataType: string) {
  try {
    // 처리 중 상태로 변경
    await supabaseServer
      .from('gdpr_data_exports')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', exportId)

    // 데이터 수집
    const exportData = await collectUserData(userId, dataType)

    // JSON 파일 생성
    const jsonData = JSON.stringify(exportData, null, 2)
    const fileName = `amiko_${dataType}_${userId}_${Date.now()}.json`

    // 실제 구현 시 파일 저장소에 저장 (AWS S3, Google Cloud Storage 등)
    const downloadUrl = await saveExportFile(fileName, jsonData)

    // 완료 상태로 변경
    await supabaseServer
      .from('gdpr_data_exports')
      .update({
        status: 'completed',
        download_url: downloadUrl,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', exportId)

    // 완료 로그 기록
    await supabaseServer
      .from('gdpr_processing_logs')
      .insert({
        user_id: userId,
        export_id: exportId,
        action_type: 'export_completed',
        details: {
          data_type: dataType,
          file_name: fileName,
          download_url: downloadUrl
        },
        created_at: new Date().toISOString()
      })

    // 사용자에게 완료 알림 (실제 구현 시 이메일 발송)
    await notifyUserExportComplete(userId, dataType, downloadUrl)

  } catch (error) {
    console.error('데이터 내보내기 처리 실패:', error)
    
    // 실패 시 상태를 실패로 변경
    await supabaseServer
      .from('gdpr_data_exports')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', exportId)

    // 실패 로그 기록
    await supabaseServer
      .from('gdpr_processing_logs')
      .insert({
        user_id: userId,
        export_id: exportId,
        action_type: 'export_failed',
        details: {
          data_type: dataType,
          error: error.message
        },
        created_at: new Date().toISOString()
      })
  }
}

// 사용자 데이터 수집 함수
async function collectUserData(userId: string, dataType: string) {
  const exportData: any = {
    export_info: {
      user_id: userId,
      data_type: dataType,
      export_date: new Date().toISOString(),
      format_version: '1.0'
    }
  }

  try {
    if (dataType === 'complete' || dataType === 'profile') {
      // 프로필 정보
      const { data: profile } = await supabaseServer
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
      
      exportData.profile = profile || []
    }

    if (dataType === 'complete' || dataType === 'activity') {
      // 커뮤니티 활동
      const { data: posts } = await supabaseServer
        .from('community_posts')
        .select('*')
        .eq('user_id', userId)
      
      const { data: comments } = await supabaseServer
        .from('community_comments')
        .select('*')
        .eq('user_id', userId)

      exportData.community_activity = {
        posts: posts || [],
        comments: comments || []
      }

      // 화상채팅 기록
      const { data: videoCalls } = await supabaseServer
        .from('video_call_logs')
        .select('*')
        .eq('user_id', userId)

      exportData.video_calls = videoCalls || []

      // 포인트 기록
      const { data: points } = await supabaseServer
        .from('point_transactions')
        .select('*')
        .eq('user_id', userId)

      exportData.point_transactions = points || []
    }

    if (dataType === 'complete' || dataType === 'consent') {
      // 동의 기록
      const { data: consents } = await supabaseServer
        .from('user_consents')
        .select('*')
        .eq('user_id', userId)

      const { data: consentLogs } = await supabaseServer
        .from('consent_change_logs')
        .select('*')
        .eq('user_id', userId)

      exportData.consent_data = {
        consents: consents || [],
        consent_logs: consentLogs || []
      }
    }

    return exportData

  } catch (error) {
    console.error('사용자 데이터 수집 실패:', error)
    throw error
  }
}

// 파일 저장 함수 (실제 구현 필요)
async function saveExportFile(fileName: string, jsonData: string): Promise<string> {
  // 실제 구현 시 파일 저장소에 저장
  // 예: AWS S3, Google Cloud Storage, Azure Blob Storage 등
  
  // 현재는 임시 URL 반환
  const tempUrl = `https://amiko-exports.s3.amazonaws.com/${fileName}`
  
  // 실제 파일 저장 로직 구현
  // await s3Client.putObject({
  //   Bucket: 'amiko-exports',
  //   Key: fileName,
  //   Body: jsonData,
  //   ContentType: 'application/json'
  // }).promise()
  
  return tempUrl
}

// 사용자 알림 함수
async function notifyUserExportComplete(userId: string, dataType: string, downloadUrl: string) {
  try {
    // 사용자 이메일 조회
    const { data: userData } = await supabaseServer
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (userData?.email) {
      // 실제 구현 시 이메일 발송 로직 추가
      console.log(`사용자 알림: ${userData.email} - 데이터 내보내기 완료`)
      
      // 알림 테이블에 기록
      await supabaseServer
        .from('user_notifications')
        .insert({
          user_id: userId,
          type: 'data_export_complete',
          title: '데이터 내보내기 완료',
          message: `요청하신 ${dataType} 데이터 내보내기가 완료되었습니다. 다운로드 링크: ${downloadUrl}`,
          created_at: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('사용자 알림 실패:', error)
  }
}
