/**
 * Test script to verify Strapi authentication token
 * 
 * Usage:
 *   node test-auth-token.js <your-jwt-token>
 * 
 * Or set STRAPI_URL and TOKEN environment variables:
 *   STRAPI_URL=http://localhost:1337 TOKEN=your-token node test-auth-token.js
 */

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const TOKEN = process.env.TOKEN || process.argv[2];

if (!TOKEN) {
  console.error('❌ Error: No token provided');
  console.log('Usage: node test-auth-token.js <token>');
  console.log('   Or: STRAPI_URL=http://localhost:1337 TOKEN=your-token node test-auth-token.js');
  process.exit(1);
}

async function testToken() {
  console.log('🔍 Testing Strapi authentication token...');
  console.log('🔍 Strapi URL:', STRAPI_URL);
  console.log('🔍 Token preview:', TOKEN.substring(0, 20) + '...');
  console.log('');

  try {
    // Test 1: Try /api/users/me
    console.log('📡 Test 1: GET /api/users/me');
    const meRes = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    console.log('   Status:', meRes.status, meRes.statusText);
    
    if (meRes.ok) {
      const user = await meRes.json();
      console.log('   ✅ SUCCESS - User authenticated');
      console.log('   User ID:', user.id);
      console.log('   Username:', user.username || user.email);
      console.log('   Role:', user.role?.type || 'N/A');
    } else {
      const error = await meRes.json().catch(() => ({}));
      console.log('   ❌ FAILED');
      console.log('   Error:', JSON.stringify(error, null, 2));
      
      if (meRes.status === 401) {
        console.log('   💡 Token is invalid or expired');
      } else if (meRes.status === 403) {
        console.log('   💡 Token is valid but user lacks permission');
        console.log('   💡 Fix: Go to Strapi Admin → Settings → Users & Permissions → Roles → Authenticated');
        console.log('   💡 Enable "findOne" or "me" permission for User');
      }
    }

    console.log('');

    // Test 2: Try /api/auth/local (verify token format)
    console.log('📡 Test 2: Verify token format');
    try {
      const parts = TOKEN.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('   ✅ Token format is valid (JWT)');
        console.log('   User ID in token:', payload.id);
        console.log('   Expires:', new Date(payload.exp * 1000).toISOString());
        console.log('   Expired?', Date.now() > payload.exp * 1000 ? 'YES ❌' : 'NO ✅');
      } else {
        console.log('   ❌ Invalid token format (not a JWT)');
      }
    } catch (e) {
      console.log('   ❌ Error parsing token:', e.message);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('💡 Make sure Strapi is running on', STRAPI_URL);
  }
}

testToken();
