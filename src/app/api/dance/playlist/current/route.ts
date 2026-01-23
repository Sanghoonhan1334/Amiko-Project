import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  try {
    if (!supabaseServer) {
      console.error('[DANCE_PLAYLIST_CURRENT] Supabase 서버 클라이언트 없음')
      return NextResponse.json({
        id: null,
        week_number: null,
        week_label: null,
        songs: []
      })
    }
    
    const supabase = supabaseServer
    
    // 최신 플레이리스트 가져오기
    const { data: playlists, error: playlistError } = await supabase
      .from('dance_playlists')
      .select('*')
      .order('week_number', { ascending: false })
      .limit(1)

    console.log('[DANCE_PLAYLIST_CURRENT] 플레이리스트 조회:', { 
      count: playlists?.length || 0, 
      error: playlistError?.message,
      playlists 
    })

    if (playlistError) {
      console.error('[DANCE_PLAYLIST_CURRENT] 플레이리스트 조회 에러:', playlistError)
      return NextResponse.json({
        id: null,
        week_number: null,
        week_label: null,
        songs: []
      })
    }

    if (!playlists || playlists.length === 0) {
      console.log('[DANCE_PLAYLIST_CURRENT] 플레이리스트 없음')
      return NextResponse.json({
        id: null,
        week_number: null,
        week_label: null,
        songs: []
      })
    }

    const playlist = playlists[0]

    // 플레이리스트의 노래들 가져오기
    const { data: songs, error: songsError } = await supabase
      .from('dance_playlist_songs')
      .select('*')
      .eq('playlist_id', playlist.id)
      .order('display_order', { ascending: true })

    console.log('[DANCE_PLAYLIST_CURRENT] 노래 조회:', { 
      playlistId: playlist.id,
      songCount: songs?.length || 0,
      error: songsError?.message,
      songs 
    })

    if (songsError) {
      console.error('[DANCE_PLAYLIST_CURRENT] 노래 조회 실패:', songsError)
      return NextResponse.json({
        id: playlist.id,
        week_number: playlist.week_number,
        week_label: playlist.week_label,
        songs: []
      })
    }

    const result = {
      id: playlist.id,
      week_number: playlist.week_number,
      week_label: playlist.week_label,
      songs: songs || []
    }

    console.log('[DANCE_PLAYLIST_CURRENT] 최종 응답:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[DANCE_PLAYLIST_CURRENT] 플레이리스트 조회 예외:', error)
    return NextResponse.json(
      { error: '플레이리스트 조회 실패' },
      { status: 500 }
    )
  }
}

