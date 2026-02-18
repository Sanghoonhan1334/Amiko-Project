const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testLikeAPI() {
  console.log('🧪 Testing like API with proper authentication...');

  try {
    // Get Eugenia's user ID
    const { data: eugeniaUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'eugenia.arevalo@gmail.com')
      .single();

    if (userError || !eugeniaUser) {
      console.log('❌ Eugenia user not found:', userError?.message);
      return;
    }

    console.log('✅ Found Eugenia user:', eugeniaUser.id);

    // Try to sign in as Eugenia
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'eugenia.arevalo@gmail.com',
      password: 'test123456' // Test password
    });

    if (authError) {
      console.log('❌ Auth error:', authError.message);
      return;
    }

    console.log('✅ Auth successful, have token:', !!authData.session?.access_token);

    if (authData.session?.access_token) {
      // Test the API call
      const postId = 'e3f8c77f-0a25-40e3-9cce-1c5b3f7cf853';
      const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      console.log(`🌐 Calling: ${apiUrl}/api/posts/${postId}/reactions`);

      const response = await fetch(`${apiUrl}/api/posts/${postId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.session.access_token}`
        },
        body: JSON.stringify({ reaction_type: 'like' })
      });

      console.log('📡 API Response status:', response.status);

      const result = await response.text();
      console.log('📄 API Response:', result);

      if (response.ok) {
        console.log('✅ Like API call successful!');
      } else {
        console.log('❌ Like API call failed');
      }
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testLikeAPI();
