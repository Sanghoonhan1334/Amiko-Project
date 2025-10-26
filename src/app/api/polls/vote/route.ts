import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

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
    const { poll_id, option_id } = body

    // Check if user already voted on this poll
    const { data: existingVote, error: checkError } = await supabase
      .from('poll_votes')
      .select()
      .eq('poll_id', poll_id)
      .eq('user_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existingVote) {
      // Update existing vote
      const { error: updateError } = await supabase
        .from('poll_votes')
        .update({ option_id })
        .eq('id', existingVote.id)

      if (updateError) throw updateError
    } else {
      // Insert new vote
      const { error: insertError } = await supabase
        .from('poll_votes')
        .insert({
          poll_id,
          option_id,
          user_id: user.id
        })

      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error submitting vote:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
