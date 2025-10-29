import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    
    let query = supabase
      .from('polls')
      .select(`
        *,
        poll_options (
          *,
          poll_votes (user_id)
        )
      `)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: polls, error } = await query

    if (error) throw error

    // Transform the data to include vote counts and percentages
    const pollsWithStats = polls?.map((poll: any) => {
      const totalVotes = poll.poll_options?.reduce((acc: number, option: any) => {
        return acc + (option.poll_votes?.length || 0)
      }, 0) || 0

      const options = poll.poll_options?.map((option: any) => {
        const voteCount = option.poll_votes?.length || 0
        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
        
        return {
          ...option,
          vote_count: voteCount,
          percentage,
          poll_votes: undefined // Remove votes array from response
        }
      }) || []

      return {
        ...poll,
        poll_options: options,
        options,
        total_votes: totalVotes,
        poll_options: undefined // Remove duplicate field
      }
    })

    return NextResponse.json({ polls: pollsWithStats })
  } catch (error: any) {
    console.error('Error fetching polls:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[POLLS_POST] Poll creation request started')
    
    const supabase = createServerSupabaseClient()
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[POLLS_POST] No authorization header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.log('[POLLS_POST] Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[POLLS_POST] User authenticated:', user.id)

    const body = await request.json()
    console.log('[POLLS_POST] Request body:', { 
      title: body.title?.substring(0, 50), 
      poll_type: body.poll_type,
      options_count: body.options?.length,
      options: body.options
    })
    
    const { title, description, poll_type, is_public, is_anonymous, options, expires_at } = body

    // Validate required fields
    if (!title?.trim()) {
      console.log('[POLLS_POST] Validation failed: Title is empty')
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      console.log('[POLLS_POST] Validation failed: Not enough options')
      return NextResponse.json({ error: 'At least 2 options are required' }, { status: 400 })
    }

    // Convert empty string to null for expires_at
    const expiresAtValue = expires_at && expires_at.trim() ? expires_at : null

    console.log('[POLLS_POST] Inserting poll with data:', {
      title,
      poll_type,
      is_public,
      is_anonymous,
      created_by: user.id,
      expires_at: expiresAtValue
    })

    // Create the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title,
        description,
        poll_type,
        is_public,
        is_anonymous,
        created_by: user.id,
        expires_at: expiresAtValue,
        status: 'active'
      })
      .select()
      .single()

    if (pollError) {
      console.error('[POLLS_POST] Poll creation error:', pollError)
      console.error('[POLLS_POST] Error details:', {
        message: pollError.message,
        details: pollError.details,
        hint: pollError.hint,
        code: pollError.code
      })
      return NextResponse.json({ 
        error: pollError.message || 'Failed to create poll',
        details: pollError.details,
        hint: pollError.hint
      }, { status: 500 })
    }

    console.log('[POLLS_POST] Poll created:', poll.id)

    // Create poll options
    const pollOptions = options
      .filter((opt: string) => opt && opt.trim().length > 0)
      .map((option_text: string, index: number) => {
        // URL인지 확인 (http로 시작하는 경우)
        const isImageUrl = option_text.startsWith('http://') || option_text.startsWith('https://')
        return {
          poll_id: poll.id,
          option_text: isImageUrl ? null : option_text,
          image_url: isImageUrl ? option_text : null,
          sort_order: index
        }
      })

    console.log('[POLLS_POST] Poll options to insert:', pollOptions)

    if (pollOptions.length < 2) {
      console.error('[POLLS_POST] Not enough valid options')
      return NextResponse.json({ error: 'At least 2 valid options are required' }, { status: 400 })
    }

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(pollOptions)

    if (optionsError) {
      console.error('[POLLS_POST] Options creation error:', optionsError)
      console.error('[POLLS_POST] Options error details:', {
        message: optionsError.message,
        details: optionsError.details,
        hint: optionsError.hint,
        code: optionsError.code
      })
      return NextResponse.json({ 
        error: optionsError.message || 'Failed to create poll options',
        details: optionsError.details,
        hint: optionsError.hint
      }, { status: 500 })
    }

    console.log('[POLLS_POST] Poll and options created successfully')

    return NextResponse.json({ poll }, { status: 201 })
  } catch (error: any) {
    console.error('[POLLS_POST] Unexpected error:', error)
    console.error('[POLLS_POST] Error stack:', error.stack)
    return NextResponse.json({ 
      error: error.message || 'Failed to create poll',
      details: error.toString()
    }, { status: 500 })
  }
}
