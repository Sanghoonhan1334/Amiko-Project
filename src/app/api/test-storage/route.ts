import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  try {
    console.log('[TEST_STORAGE] 테스트 시작')
    
    if (!supabaseServer) {
      console.error('[TEST_STORAGE] Supabase 서버 클라이언트가 초기화되지 않음')
      return NextResponse.json({ error: 'Supabase 서버 클라이언트가 초기화되지 않았습니다' }, { status: 500 })
    }
    
    // 버킷 목록 확인
    const { data: buckets, error: bucketsError } = await supabaseServer.storage.listBuckets()
    
    if (bucketsError) {
      console.error('[TEST_STORAGE] 버킷 목록 조회 실패:', bucketsError)
      return NextResponse.json({ error: bucketsError.message }, { status: 500 })
    }
    
    console.log('[TEST_STORAGE] 버킷 목록:', buckets)
    
    // profile-images 버킷 확인
    const profileImagesBucket = buckets.find(bucket => bucket.id === 'profile-images')
    
    if (!profileImagesBucket) {
      console.error('[TEST_STORAGE] profile-images 버킷이 존재하지 않음')
      return NextResponse.json({ error: 'profile-images 버킷이 존재하지 않습니다' }, { status: 404 })
    }
    
    console.log('[TEST_STORAGE] profile-images 버킷 확인됨:', profileImagesBucket)
    
    return NextResponse.json({ 
      message: 'Storage 연결 성공',
      buckets: buckets,
      profileImagesBucket: profileImagesBucket
    })
    
  } catch (error) {
    console.error('[TEST_STORAGE] 예상치 못한 오류:', error)
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 })
  }
}
