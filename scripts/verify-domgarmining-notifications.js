require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyDomgarminingNotifications() {
  const domgarminingId = 'fe89b81d-76d8-4804-9f91-e35a012d0703';

  console.log('🔍 Verifying domgarmining notifications for web bell display...');

  // Get unread count (what the bell shows)
  const { count: unreadCount, error: countError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', domgarminingId)
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
    .eq('user_id', domgarminingId)
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

    // Check specifically for the like notification from Eugenia
    const eugeniaLikeNotif = notifications?.find(n =>
      n.type === 'like' &&
      !n.is_read &&
      n.message.includes('마리아 에우헤니아')
    );
    if (eugeniaLikeNotif) {
      console.log('✅ Found Eugenia like notification:', eugeniaLikeNotif.title);
    } else {
      console.log('⚠️ No unread Eugenia like notification found');
    }
  }
}

verifyDomgarminingNotifications();
