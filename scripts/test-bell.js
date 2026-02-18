require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testNotificationBell() {
  const eugeniaId = 'ab896586-f490-4de3-aefb-fd922aa14dbf';

  console.log('🔔 Testing notification bell for Eugenia...');

  // Test the full notifications API (what the bell uses)
  const { data: notifications, error: notifError } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', eugeniaId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (notifError) {
    console.error('❌ Error fetching notifications:', notifError);
  } else {
    console.log('📋 Total notifications:', notifications?.length || 0);

    // Filter like the bell component does
    const allowedTypes = ['like', 'story_like', 'comment', 'story_comment', 'new_post', 'new_news'];
    const filteredNotifications = (notifications || []).filter(n => allowedTypes.includes(n.type));

    console.log('🎯 Filtered notifications (bell shows):', filteredNotifications.length);

    const unreadFiltered = filteredNotifications.filter(n => !n.is_read);
    console.log('🔴 Unread filtered notifications:', unreadFiltered.length);

    console.log('📝 Recent filtered notifications:');
    filteredNotifications.slice(0, 3).forEach((notif, index) => {
      console.log(`  ${index + 1}. [${notif.type}] ${notif.title} - Read: ${notif.is_read}`);
    });
  }
}

testNotificationBell();
