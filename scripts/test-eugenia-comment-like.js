const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase service role credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testEugeniaCommentLike() {
  try {
    console.log('🧪 Testing Eugenia comment like notification...')

    // Eugenia's user ID and comment
    const eugeniaId = 'ab896586-f490-4de3-aefb-fd922aa14dbf'
    const commentId = '978cb193-df6f-4f8a-af96-6edf35867dc4'
    const postId = 'some-post-id' // We'll need to find this

    // domgarmining user ID
    const domgarminingId = 'fe89b81d-76d8-4804-9f91-e35a012d0703'

    console.log('👤 Eugenia ID:', eugeniaId)
    console.log('💬 Comment ID:', commentId)
    console.log('👤 domgarmining ID:', domgarminingId)

    // First, find the post ID for this comment
    const { data: commentData, error: commentError } = await supabase
      .from('post_comments')
      .select('post_id')
      .eq('id', commentId)
      .single()

    if (commentError || !commentData) {
      console.error('❌ Could not find comment:', commentError)
      return
    }

    const actualPostId = commentData.post_id
    console.log('📝 Post ID:', actualPostId)

    // Check if domgarmining already liked this comment
    const { data: existingVote, error: voteError } = await supabase
      .from('comment_votes')
      .select('vote_type')
      .eq('comment_id', commentId)
      .eq('user_id', domgarminingId)
      .single()

    if (existingVote) {
      console.log('⚠️ domgarmining already voted on this comment:', existingVote.vote_type)
      // Remove existing vote first
      await supabase
        .from('comment_votes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', domgarminingId)
      console.log('✅ Removed existing vote')
    }

    // Now simulate liking the comment
    console.log('👍 Simulating domgarmining liking Eugenia comment...')

    const { data: voteData, error: voteInsertError } = await supabase
      .from('comment_votes')
      .insert({
        comment_id: commentId,
        user_id: domgarminingId,
        vote_type: 'like'
      })
      .select()
      .single()

    if (voteInsertError) {
      console.error('❌ Failed to create vote:', voteInsertError)
      return
    }

    console.log('✅ Vote created:', voteData.id)

    // Update comment like count
    const { data: comment, error: commentUpdateError } = await supabase
      .from('post_comments')
      .select('like_count')
      .eq('id', commentId)
      .single()

    if (commentUpdateError) {
      console.error('❌ Failed to get comment:', commentUpdateError)
      return
    }

    const newLikeCount = (comment.like_count || 0) + 1

    await supabase
      .from('post_comments')
      .update({ like_count: newLikeCount })
      .eq('id', commentId)

    console.log('📊 Updated comment like count to:', newLikeCount)

    // Now create the notification manually (simulating what the API would do)
    console.log('🔔 Creating notification for Eugenia...')

    // Get domgarmining's name
    const { data: likerProfile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('user_id', domgarminingId)
      .single()

    let likerName = '익명'
    if (likerProfile?.display_name && likerProfile.display_name.trim() !== '') {
      likerName = likerProfile.display_name.includes('#')
        ? likerProfile.display_name.split('#')[0]
        : likerProfile.display_name
    } else {
      const { data: likerUser } = await supabase
        .from('users')
        .select('full_name, korean_name, spanish_name')
        .eq('id', domgarminingId)
        .single()

      if (likerUser) {
        likerName = likerUser.korean_name || likerUser.spanish_name || likerUser.full_name || '익명'
      }
    }

    // Get Eugenia's language
    const { data: eugeniaUser } = await supabase
      .from('users')
      .select('language')
      .eq('id', eugeniaId)
      .single()

    const eugeniaLanguage = eugeniaUser?.language || 'es'

    // Create translated notification
    let notificationTitle, notificationMessage
    if (eugeniaLanguage === 'ko') {
      notificationTitle = '좋아요를 받았습니다'
      notificationMessage = `${likerName}님이 회원님의 댓글에 좋아요를 눌렀습니다.`
    } else {
      notificationTitle = 'Nuevo like'
      notificationMessage = `${likerName} dio like a tu comentario`
    }

    const notificationPayload = {
      user_id: eugeniaId,
      type: 'like',
      title: notificationTitle,
      message: notificationMessage,
      data: {
        post_id: actualPostId,
        comment_id: commentId,
        liker_id: domgarminingId
      }
    }

    console.log('📝 Creating notification:', notificationPayload)

    const { data: notificationData, error: notificationError } = await supabase
      .from('notifications')
      .insert(notificationPayload)
      .select()
      .single()

    if (notificationError) {
      console.error('❌ Failed to create notification:', notificationError)
      return
    }

    console.log('✅ Notification created:', notificationData.id)

    // Wait a moment
    console.log('⏳ Waiting for notification creation...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check unread count for Eugenia
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', eugeniaId)
      .eq('is_read', false)

    if (!countError) {
      console.log(`📊 Eugenia has ${unreadCount} unread notifications`)
    }

    // Check the latest notification
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', eugeniaId)
      .eq('type', 'like')
      .order('created_at', { ascending: false })
      .limit(1)

    if (!notifError && notifications && notifications.length > 0) {
      const latestNotif = notifications[0]
      console.log('✅ Latest like notification:', {
        id: latestNotif.id,
        title: latestNotif.title,
        message: latestNotif.message,
        created_at: latestNotif.created_at,
        is_read: latestNotif.is_read
      })
    }

    console.log('🎉 Eugenia comment like notification test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testEugeniaCommentLike()
