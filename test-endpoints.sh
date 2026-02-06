#!/bin/bash

# Test script to check all Strapi API endpoints
# Usage: bash test-endpoints.sh

STRAPI_URL="${NEXT_PUBLIC_STRAPI_URL:-http://localhost:1337}"
BASE_URL="${STRAPI_URL}/api"

echo ""
echo "🔍 Testing Strapi API Endpoints"
echo "Base URL: $BASE_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local name=$3
    local data=$4
    
    echo -e "${YELLOW}Testing: $name${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}   ✅ Success - Status: $http_code${NC}"
        # Try to extract count if it's JSON
        if command -v jq &> /dev/null; then
            count=$(echo "$body" | jq '.data | length' 2>/dev/null || echo "N/A")
            if [ "$count" != "null" ] && [ "$count" != "N/A" ]; then
                echo -e "${BLUE}   📊 Found $count items${NC}"
            fi
        fi
        return 0
    elif [ "$http_code" = "000" ]; then
        echo -e "${RED}   ❌ Network Error - Cannot connect to Strapi${NC}"
        echo -e "${YELLOW}   💡 Make sure Strapi is running on $STRAPI_URL${NC}"
        return 1
    else
        echo -e "${RED}   ❌ Failed - Status: $http_code${NC}"
        if [ -n "$body" ]; then
            echo -e "${RED}   Error: $(echo "$body" | head -c 200)${NC}"
        fi
        return 1
    fi
}

# Test 1: Server connection
echo "1. Testing Strapi Server Connection..."
if curl -s -o /dev/null -w "%{http_code}" "$STRAPI_URL" | grep -q "200\|404"; then
    echo -e "${GREEN}   ✅ Strapi server is running${NC}"
else
    echo -e "${RED}   ❌ Cannot connect to Strapi at $STRAPI_URL${NC}"
    echo -e "${YELLOW}   💡 Make sure Strapi is running${NC}"
    exit 1
fi

# Test 2: Get all blogs
test_endpoint "GET" "/blogs?populate=*&pagination[pageSize]=1" "GET /api/blogs (List blogs)"

# Test 3: Get blog by slug (if we can get a blog first)
echo ""
echo "3. Testing GET /api/blogs by slug/documentId..."
blog_response=$(curl -s "$BASE_URL/blogs?populate=*&pagination[pageSize]=1")
if command -v jq &> /dev/null; then
    slug=$(echo "$blog_response" | jq -r '.data[0].slug // .data[0].documentId // empty' 2>/dev/null)
    if [ -n "$slug" ] && [ "$slug" != "null" ]; then
        test_endpoint "GET" "/blogs?filters[slug][\$eq]=$slug&populate=*" "GET /api/blogs by slug"
        
        # Also test by documentId
        doc_id=$(echo "$blog_response" | jq -r '.data[0].documentId // empty' 2>/dev/null)
        if [ -n "$doc_id" ] && [ "$doc_id" != "null" ]; then
            test_endpoint "GET" "/blogs?filters[documentId][\$eq]=$doc_id&populate=*" "GET /api/blogs by documentId"
        fi
    else
        echo -e "${YELLOW}   ⚠️  No slug/documentId found in blog data${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️  Install 'jq' for better testing (optional)${NC}"
fi

# Test 4: Get categories
echo ""
test_endpoint "GET" "/categories" "GET /api/categories"

# Test 5: Get comments (if blog exists)
echo ""
if command -v jq &> /dev/null && [ -n "$blog_response" ]; then
    blog_id=$(echo "$blog_response" | jq -r '.data[0].id // empty' 2>/dev/null)
    if [ -n "$blog_id" ] && [ "$blog_id" != "null" ]; then
        test_endpoint "GET" "/comments?filters[blog][id][\$eq]=$blog_id&filters[isApproved][\$eq]=true" "GET /api/comments"
    fi
fi

# Test 6: Get votes (if blog exists)
echo ""
if command -v jq &> /dev/null && [ -n "$blog_response" ]; then
    blog_id=$(echo "$blog_response" | jq -r '.data[0].id // empty' 2>/dev/null)
    if [ -n "$blog_id" ] && [ "$blog_id" != "null" ]; then
        test_endpoint "GET" "/votes?filters[blog][id][\$eq]=$blog_id" "GET /api/votes"
    fi
fi

echo ""
echo "============================================================"
echo -e "${CYAN}📊 Test Summary${NC}"
echo "============================================================"
echo ""
echo -e "${GREEN}✅ All endpoint tests completed!${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "   - Check browser console for detailed error messages"
echo "   - Verify NEXT_PUBLIC_STRAPI_URL in .env.local"
echo "   - Ensure Strapi content types have correct permissions"
echo "   - Check Strapi server logs for errors"
echo ""
