// Test script to check all Strapi API endpoints
// Run with: node test-endpoints.js

const axios = require('axios');

// Get Strapi URL from environment or use default
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const BASE_URL = `${STRAPI_URL}/api`;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 'NETWORK_ERROR',
      error: error.response?.data || error.message,
      message: error.message,
    };
  }
}

async function testAllEndpoints() {
  log('\n🔍 Testing Strapi API Endpoints\n', 'cyan');
  log(`Base URL: ${BASE_URL}\n`, 'blue');

  const results = [];

  // Test 1: Check if Strapi is running
  log('1. Testing Strapi Server Connection...', 'yellow');
  const serverTest = await testEndpoint('GET', '/');
  if (serverTest.success) {
    log('   ✅ Strapi server is running', 'green');
  } else {
    log(`   ❌ Cannot connect to Strapi: ${serverTest.message}`, 'red');
    log(`   💡 Make sure Strapi is running on ${STRAPI_URL}`, 'yellow');
    return;
  }
  results.push({ name: 'Server Connection', ...serverTest });

  // Test 2: Get all blogs
  log('\n2. Testing GET /api/blogs (List all blogs)...', 'yellow');
  const blogsTest = await testEndpoint('GET', '/blogs?populate=*&pagination[pageSize]=1');
  if (blogsTest.success) {
    log(`   ✅ Success - Found ${blogsTest.data?.meta?.pagination?.total || 0} blogs`, 'green');
    if (blogsTest.data?.data?.length > 0) {
      const firstBlog = blogsTest.data.data[0];
      log(`   📝 Sample blog ID: ${firstBlog.id}, Title: ${firstBlog.title || firstBlog.attributes?.title || 'N/A'}`, 'blue');
    }
  } else {
    log(`   ❌ Failed - Status: ${blogsTest.status}`, 'red');
    if (blogsTest.error) {
      log(`   Error: ${JSON.stringify(blogsTest.error, null, 2)}`, 'red');
    }
  }
  results.push({ name: 'GET /api/blogs', ...blogsTest });

  // Test 3: Get blog by slug (if we have a blog)
  if (blogsTest.success && blogsTest.data?.data?.length > 0) {
    const blog = blogsTest.data.data[0];
    const slug = blog.slug || blog.attributes?.slug || blog.documentId;
    
    if (slug) {
      log(`\n3. Testing GET /api/blogs?filters[slug][$eq]=${slug}...`, 'yellow');
      const blogBySlugTest = await testEndpoint('GET', `/blogs?filters[slug][$eq]=${slug}&populate=*`);
      if (blogBySlugTest.success) {
        log('   ✅ Success - Blog found by slug', 'green');
      } else {
        log(`   ❌ Failed - Status: ${blogBySlugTest.status}`, 'red');
      }
      results.push({ name: 'GET /api/blogs by slug', ...blogBySlugTest });

      // Test 4: Get blog by documentId
      if (blog.documentId) {
        log(`\n4. Testing GET /api/blogs?filters[documentId][$eq]=${blog.documentId}...`, 'yellow');
        const blogByDocIdTest = await testEndpoint('GET', `/blogs?filters[documentId][$eq]=${blog.documentId}&populate=*`);
        if (blogByDocIdTest.success) {
          log('   ✅ Success - Blog found by documentId', 'green');
        } else {
          log(`   ❌ Failed - Status: ${blogByDocIdTest.status}`, 'red');
        }
        results.push({ name: 'GET /api/blogs by documentId', ...blogByDocIdTest });
      }
    }
  }

  // Test 5: Get categories
  log('\n5. Testing GET /api/categories...', 'yellow');
  const categoriesTest = await testEndpoint('GET', '/categories');
  if (categoriesTest.success) {
    log(`   ✅ Success - Found ${categoriesTest.data?.data?.length || 0} categories`, 'green');
  } else {
    log(`   ❌ Failed - Status: ${categoriesTest.status}`, 'red');
  }
  results.push({ name: 'GET /api/categories', ...categoriesTest });

  // Test 6: Get comments (if blog exists)
  if (blogsTest.success && blogsTest.data?.data?.length > 0) {
    const blogId = blogsTest.data.data[0].id;
    log(`\n6. Testing GET /api/comments?filters[blog][id][$eq]=${blogId}...`, 'yellow');
    const commentsTest = await testEndpoint('GET', `/comments?filters[blog][id][$eq]=${blogId}&filters[isApproved][$eq]=true`);
    if (commentsTest.success) {
      log(`   ✅ Success - Found ${commentsTest.data?.data?.length || 0} comments`, 'green');
    } else {
      log(`   ❌ Failed - Status: ${commentsTest.status}`, 'red');
      if (commentsTest.status === 404) {
        log('   💡 Comments content type might not exist in Strapi', 'yellow');
      }
    }
    results.push({ name: 'GET /api/comments', ...commentsTest });
  }

  // Test 7: Get votes (if blog exists)
  if (blogsTest.success && blogsTest.data?.data?.length > 0) {
    const blogId = blogsTest.data.data[0].id;
    log(`\n7. Testing GET /api/votes?filters[blog][id][$eq]=${blogId}...`, 'yellow');
    const votesTest = await testEndpoint('GET', `/votes?filters[blog][id][$eq]=${blogId}`);
    if (votesTest.success) {
      log(`   ✅ Success - Found ${votesTest.data?.data?.length || 0} votes`, 'green');
    } else {
      log(`   ❌ Failed - Status: ${votesTest.status}`, 'red');
      if (votesTest.status === 404) {
        log('   💡 Votes content type might not exist in Strapi (see STRAPI_VOTES_SETUP_GUIDE.md)', 'yellow');
      }
    }
    results.push({ name: 'GET /api/votes', ...votesTest });
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 Test Summary', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  log(`\n✅ Successful: ${successful}/${results.length}`, 'green');
  log(`❌ Failed: ${failed}/${results.length}`, failed > 0 ? 'red' : 'green');
  
  log('\nDetailed Results:', 'yellow');
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    const status = result.success ? result.status : result.status;
    log(`${index + 1}. ${icon} ${result.name} - Status: ${status}`, result.success ? 'green' : 'red');
  });

  // Recommendations
  log('\n💡 Recommendations:', 'yellow');
  if (failed > 0) {
    log('   - Check Strapi admin panel for content type permissions', 'yellow');
    log('   - Ensure all content types are created (Blog, Category, Comment, Vote)', 'yellow');
    log('   - Verify CORS settings in Strapi config', 'yellow');
    log('   - Check Strapi server logs for errors', 'yellow');
  } else {
    log('   - All endpoints are working correctly!', 'green');
  }

  log('\n');
}

// Run tests
testAllEndpoints().catch(console.error);
