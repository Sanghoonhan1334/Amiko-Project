require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testVoteAPI() {
  try {
    console.log('🧪 Testing vote API endpoint...');

    // First get a JWT token
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'domgarmining@gmail.com',
        password: process.env.TEST_PASSWORD || 'testpass123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;

    if (!token) {
      console.log('❌ No token received');
      return;
    }

    console.log('✅ Got auth token');

    // Now call the vote API with a real comment
    const voteResponse = await fetch('http://localhost:3000/api/posts/test-post-id/comments/ecf170d6-ee74-4c23-9711-29ee7c08e1a1/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ vote_type: 'like' })
    });

    const result = await voteResponse.json();
    console.log('📝 Vote API response:', result);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testVoteAPI();
