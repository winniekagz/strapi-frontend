// Test script specifically for single blog endpoint
const axios = require('axios');

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const BASE_URL = `${STRAPI_URL}/api`;

console.log('\n🔍 Testing Single Blog Endpoint\n');
console.log(`Strapi URL: ${STRAPI_URL}`);
console.log(`Base URL: ${BASE_URL}\n`);

// Test documentId from user's data
const documentId = 'h7mftpcg23of8hlh293my6lq';
const blogId = 6;

async function testSingleBlog() {
  console.log('='.repeat(60));
  console.log('Test 1: Check if Strapi is running');
  console.log('='.repeat(60));
  try {
    const healthCheck = await axios.get(`${STRAPI_URL}/api`);
    console.log('✅ Strapi is running\n');
  } catch (error) {
    console.log('❌ Cannot connect to Strapi');
    console.log(`   Error: ${error.message}`);
    console.log(`   Make sure Strapi is running on ${STRAPI_URL}\n`);
    return;
  }

  console.log('='.repeat(60));
  console.log('Test 2: Get all blogs (to verify API works)');
  console.log('='.repeat(60));
  try {
    const response = await axios.get(`${BASE_URL}/blogs?populate=*&pagination[pageSize]=1`);
    console.log(`✅ Success - Found ${response.data?.meta?.pagination?.total || 0} blogs`);
    if (response.data?.data?.length > 0) {
      const blog = response.data.data[0];
      console.log(`   Sample blog ID: ${blog.id}`);
      console.log(`   Sample blog documentId: ${blog.documentId}`);
      console.log(`   Sample blog slug: ${blog.slug || blog.attributes?.slug || 'null'}`);
    }
    console.log('');
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    console.log('');
  }

  console.log('='.repeat(60));
  console.log(`Test 3: Get blog by documentId: ${documentId}`);
  console.log('='.repeat(60));
  try {
    const url = `${BASE_URL}/blogs?filters[documentId][$eq]=${documentId}&populate=*`;
    console.log(`   URL: ${url}`);
    const response = await axios.get(url);
    
    if (response.data?.data && response.data.data.length > 0) {
      console.log('✅ Success - Blog found by documentId');
      const blog = response.data.data[0];
      console.log(`   Title: ${blog.title || blog.attributes?.title || 'N/A'}`);
      console.log(`   ID: ${blog.id}`);
      console.log(`   DocumentId: ${blog.documentId}`);
    } else {
      console.log('❌ Blog not found (empty result)');
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    }
    console.log('');
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.log('   Network Error - No response received');
      console.log(`   Request URL: ${error.config?.url}`);
    }
    console.log('');
  }

  console.log('='.repeat(60));
  console.log(`Test 4: Get blog by ID: ${blogId}`);
  console.log('='.repeat(60));
  try {
    const url = `${BASE_URL}/blogs/${blogId}?populate=*`;
    console.log(`   URL: ${url}`);
    const response = await axios.get(url);
    console.log('✅ Success - Blog found by ID');
    const blog = response.data?.data || response.data;
    console.log(`   Title: ${blog?.title || blog?.attributes?.title || 'N/A'}`);
    console.log(`   ID: ${blog?.id}`);
    console.log('');
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('Test 5: Test with null slug (as your code does)');
  console.log('='.repeat(60));
  try {
    const url = `${BASE_URL}/blogs?filters[slug][$eq]=null&populate=*`;
    console.log(`   URL: ${url}`);
    const response = await axios.get(url);
    
    if (response.data?.data && response.data.data.length > 0) {
      console.log(`✅ Found ${response.data.data.length} blogs with null slug`);
    } else {
      console.log('⚠️  No blogs with null slug (this is expected)');
    }
    console.log('');
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  console.log('\n💡 If Test 3 failed, check:');
  console.log('   1. Strapi permissions for Blog content type');
  console.log('   2. Blog content type exists in Strapi');
  console.log('   3. documentId filter is supported in your Strapi version');
  console.log('   4. CORS settings in Strapi config');
  console.log('\n');
}

testSingleBlog().catch(console.error);
