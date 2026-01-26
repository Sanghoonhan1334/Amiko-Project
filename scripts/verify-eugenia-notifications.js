require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyEugeniaNotifications() {
  const eugeniaId = 'ab896586-f490-4de3-aefb-fd922aa14dbf';

  console.log('🔍 Verifying Eugenia notifications for bell display...');

  // Get unread count (what the bell shows)
  const { count: unreadCount, error: countError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', eugeniaId)
    .eq('is_read', false);

  if (countError) {
    console.error('❌ Error getting unread count:', countError);
  } else {
    console.log('🔔 Bell should show number:', unreadCount);
  }

  // Get recent notifications (what appears in the dropdown)
  const { data: notifications, error: notifError } = await supabase
    .from('notifications')
    .select('id, type, title, message, created_at, is_read')
    .eq('user_id', eugeniaId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (notifError) {
    console.error('❌ Error getting notifications:', notifError);
  } else {
    console.log('📋 Recent notifications:');
    notifications?.forEach((notif, index) => {
      console.log(`  ${index + 1}. [${notif.type}] ${notif.title}: ${notif.message.substring(0, 50)}...`);
      console.log(`     Created: ${notif.created_at}, Read: ${notif.is_read}`);
    });

    // Check specifically for the like notification
    const likeNotif = notifications?.find(n => n.type === 'like' && !n.is_read);
    if (likeNotif) {
      console.log('✅ Found unread like notification:', likeNotif.title);
    } else {
      console.log('⚠️ No unread like notification found');
    }
  }
}

verifyEugeniaNotifications();
