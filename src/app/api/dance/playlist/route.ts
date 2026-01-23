import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// 헬퍼 함수: 인증 토큰에서 사용자 가져오기
async function getUserFromRequest(request: NextRequest) {
  // Authorization 헤더에서 토큰 추출 시도
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.replace('Bearer ', '').trim()
      const decodedToken = decodeURIComponent(token)
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)
        const { data: { user }, error } = await supabase.auth.getUser(decodedToken)
        if (user && !error) {
          return user
        }
      }
    } catch (error) {
      console.error('[DANCE_PLAYLIST] 헤더 토큰 검증 실패:', error)
    }
  }
  
  // 헤더 토큰이 없거나 실패하면 쿠키에서 시도
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user || null
}

// 플레이리스트 생성/수정
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    const { data: userData } = await supabaseServer
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const { data: adminData } = await supabaseServer
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    const isAdmin = userData?.is_admin || !!adminData

    if (!isAdmin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { week_number, week_label, songs } = body

    if (!week_number || !week_label) {
      return NextResponse.json(
        { error: '주차 번호와 라벨이 필요합니다.' },
        { status: 400 }
      )
    }

    // 플레이리스트 생성 또는 업데이트
    let playlistId: string

    const { data: existingPlaylist } = await supabaseServer
      .from('dance_playlists')
      .select('id')
      .eq('week_number', week_number)
      .single()

    if (existingPlaylist) {
      // 업데이트
      const { data: updatedPlaylist, error: updateError } = await supabaseServer
        .from('dance_playlists')
        .update({
          week_label,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPlaylist.id)
        .select()
        .single()

      if (updateError) {
        console.error('[DANCE_PLAYLIST] 플레이리스트 업데이트 실패:', updateError)
        return NextResponse.json(
          { error: '플레이리스트 업데이트 실패' },
          { status: 500 }
        )
      }

      playlistId = updatedPlaylist.id

      // 기존 노래 삭제
      await supabaseServer
        .from('dance_playlist_songs')
        .delete()
        .eq('playlist_id', playlistId)
    } else {
      // 생성
      const { data: newPlaylist, error: createError } = await supabaseServer
        .from('dance_playlists')
        .insert({
          week_number,
          week_label,
          created_by: user.id
        })
        .select()
        .single()

      if (createError) {
        console.error('[DANCE_PLAYLIST] 플레이리스트 생성 실패:', createError)
        return NextResponse.json(
          { error: '플레이리스트 생성 실패' },
          { status: 500 }
        )
      }

      playlistId = newPlaylist.id
    }

    // 노래 추가
    if (songs && Array.isArray(songs) && songs.length > 0) {
      const songsToInsert = songs.map((song: any, index: number) => ({
        playlist_id: playlistId,
        song_title: song.song_title,
        artist_name: song.artist_name,
        youtube_video_id: song.youtube_video_id || null,
        display_order: index
      }))

      const { error: songsError } = await supabaseServer
        .from('dance_playlist_songs')
        .insert(songsToInsert)

      if (songsError) {
        console.error('[DANCE_PLAYLIST] 노래 추가 실패:', songsError)
        return NextResponse.json(
          { error: '노래 추가 실패', details: songsError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      playlist_id: playlistId
    })
  } catch (error) {
    console.error('[DANCE_PLAYLIST] 플레이리스트 저장 실패:', error)
    return NextResponse.json(
      { error: '플레이리스트 저장 실패' },
      { status: 500 }
    )
  }
}

// 플레이리스트 삭제
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    const { data: userData } = await supabaseServer
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const { data: adminData } = await supabaseServer
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    const isAdmin = userData?.is_admin || !!adminData

    if (!isAdmin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const playlistId = searchParams.get('id')

    if (!playlistId) {
      return NextResponse.json(
        { error: '플레이리스트 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 플레이리스트 삭제 (CASCADE로 노래도 함께 삭제됨)
    const { error } = await supabaseServer
      .from('dance_playlists')
      .delete()
      .eq('id', playlistId)

    if (error) {
      console.error('[DANCE_PLAYLIST] 플레이리스트 삭제 실패:', error)
      return NextResponse.json(
        { error: '플레이리스트 삭제 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DANCE_PLAYLIST] 플레이리스트 삭제 실패:', error)
    return NextResponse.json(
      { error: '플레이리스트 삭제 실패' },
      { status: 500 }
    )
  }
}

