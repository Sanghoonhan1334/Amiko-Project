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
    const supabase = createServerSupabaseClient()
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, poll_type, is_public, is_anonymous, options, expires_at } = body

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
        expires_at,
        status: 'active'
      })
      .select()
      .single()

    if (pollError) throw pollError

    // Create poll options
    const pollOptions = options
      .filter((opt: string) => opt.trim())
      .map((option_text: string, index: number) => ({
        poll_id: poll.id,
        option_text,
        sort_order: index
      }))

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(pollOptions)

    if (optionsError) throw optionsError

    return NextResponse.json({ poll }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating poll:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
