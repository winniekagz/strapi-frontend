# Request/Response Examples
## Complete API Interaction Patterns

This document shows real request/response examples for all authentication and API operations.

---

## 1. Registration Flow

### Frontend Request
```typescript
// Client Component: app/register/page.tsx
const response = await fetch("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "johndoe",
    email: "john@example.com",
    password: "securepassword123"
  })
});
```

### Next.js API Route Request to Strapi
```http
POST http://localhost:1337/api/auth/local/register HTTP/1.1
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Strapi Response (Success)
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjEwOTk5OTk5LCJleHAiOjE2MTEwODYzOTl9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "confirmed": true,
    "blocked": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "role": {
      "id": 1,
      "name": "Authenticated",
      "type": "authenticated",
      "description": "Default role given to authenticated user."
    }
  }
}
```

### Strapi Response (Error - Email Taken)
```json
{
  "error": {
    "status": 400,
    "message": "Email is already taken."
  }
}
```

### Next.js API Route Response to Frontend
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  },
  "message": "Registration successful"
}
```

---

## 2. Login Flow

### Frontend Request
```typescript
// Client Component: app/login/page.tsx
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "john@example.com",
    password: "securepassword123"
  })
});
```

### Next.js API Route Request to Strapi
```http
POST http://localhost:1337/api/auth/local HTTP/1.1
Content-Type: application/json

{
  "identifier": "john@example.com",
  "password": "securepassword123"
}
```

### Strapi Response (Success)
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjEwOTk5OTk5LCJleHAiOjE2MTEwODYzOTl9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "confirmed": true,
    "blocked": false,
    "role": {
      "id": 1,
      "name": "Authenticated",
      "type": "authenticated"
    }
  }
}
```

### Strapi Response (Error - Invalid Credentials)
```json
{
  "error": {
    "status": 400,
    "message": "Invalid identifier or password"
  }
}
```

### Next.js API Route Response to Frontend
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": {
      "type": "authenticated"
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note**: Cookie is set automatically via `cookies().set()`

---

## 3. Get Current User (Verify Token)

### Server Component Request
```typescript
// Server Component: lib/auth.ts
const response = await fetch(
  `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/me`,
  {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  }
);
```

### HTTP Request
```http
GET http://localhost:1337/api/users/me HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Strapi Response (Success)
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "provider": "local",
  "confirmed": true,
  "blocked": false,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "role": {
    "id": 1,
    "name": "Authenticated",
    "type": "authenticated",
    "description": "Default role given to authenticated user.",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Strapi Response (Error - Invalid Token)
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": {
    "status": 401,
    "message": "Invalid token"
  }
}
```

---

## 4. Fetch Public Blogs

### Server Component Request
```typescript
// Server Component: app/page.tsx
const response = await api.get(
  `api/blogs?populate=*&pagination[page]=1&pagination[pageSize]=10`
);
```

### HTTP Request
```http
GET http://localhost:1337/api/blogs?populate=*&pagination[page]=1&pagination[pageSize]=10 HTTP/1.1
```

### Strapi Response
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "title": "Public Blog Post",
        "slug": "public-blog-post",
        "description": "This is a public post",
        "content": "# Content here\n\nThis is public content.",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "publishedAt": "2024-01-15T10:30:00.000Z",
        "cover": {
          "data": {
            "id": 1,
            "attributes": {
              "name": "cover.jpg",
              "url": "/uploads/cover_image.jpg",
              "width": 1200,
              "height": 800
            }
          }
        },
        "author": {
          "data": {
            "id": 1,
            "attributes": {
              "username": "johndoe",
              "email": "john@example.com"
            }
          }
        },
        "categories": {
          "data": [
            {
              "id": 1,
              "attributes": {
                "name": "Technology",
                "description": "Tech related posts"
              }
            }
          ]
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "pageCount": 5,
      "total": 50
    }
  }
}
```

---

## 5. Fetch Protected Blogs (Authenticated)

### Server Component Request
```typescript
// Server Component: app/dashboard/page.tsx
const authApi = await getAuthenticatedApi();
const response = await authApi.get(
  `api/blogs?populate=*&pagination[page]=1&pagination[pageSize]=10`
);
```

### HTTP Request
```http
GET http://localhost:1337/api/blogs?populate=*&pagination[page]=1&pagination[pageSize]=10 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Strapi Response (Success - Includes Protected Posts)
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "title": "Public Blog Post",
        "slug": "public-blog-post",
        "isProtected": false
      }
    },
    {
      "id": 2,
      "attributes": {
        "title": "Protected Blog Post",
        "slug": "protected-blog-post",
        "isProtected": true,
        "content": "# Protected content\n\nThis requires authentication."
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "pageCount": 5,
      "total": 50
    }
  }
}
```

### Strapi Response (Error - Unauthorized)
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": {
    "status": 401,
    "message": "Unauthorized"
  }
}
```

---

## 6. Create Blog Post (Authenticated)

### Server Component Request
```typescript
// Server Component: app/create/page.tsx
const authApi = await getAuthenticatedApi();
const response = await authApi.post("api/blogs", {
  data: {
    title: "My New Blog Post",
    slug: "my-new-blog-post",
    description: "This is a new post",
    content: "# My content"
  }
});
```

### HTTP Request
```http
POST http://localhost:1337/api/blogs HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "data": {
    "title": "My New Blog Post",
    "slug": "my-new-blog-post",
    "description": "This is a new post",
    "content": "# My content"
  }
}
```

### Strapi Response (Success)
```json
{
  "data": {
    "id": 3,
    "attributes": {
      "title": "My New Blog Post",
      "slug": "my-new-blog-post",
      "description": "This is a new post",
      "content": "# My content",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "publishedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "meta": {}
}
```

### Strapi Response (Error - Unauthorized)
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": {
    "status": 403,
    "message": "Forbidden"
  }
}
```

---

## 7. Update Blog Post (Authenticated)

### HTTP Request
```http
PUT http://localhost:1337/api/blogs/3 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "data": {
    "title": "Updated Blog Post Title",
    "description": "Updated description"
  }
}
```

### Strapi Response (Success)
```json
{
  "data": {
    "id": 3,
    "attributes": {
      "title": "Updated Blog Post Title",
      "slug": "my-new-blog-post",
      "description": "Updated description",
      "content": "# My content",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

---

## 8. Delete Blog Post (Admin Only)

### HTTP Request
```http
DELETE http://localhost:1337/api/blogs/3 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Strapi Response (Success)
```json
{
  "data": {
    "id": 3,
    "attributes": {
      "title": "My New Blog Post",
      "slug": "my-new-blog-post"
    }
  }
}
```

### Strapi Response (Error - Not Admin)
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": {
    "status": 403,
    "message": "Forbidden"
  }
}
```

---

## 9. Search Blogs with Filter

### HTTP Request
```http
GET http://localhost:1337/api/blogs?filters[title][$containsi]=next&populate=* HTTP/1.1
```

### Strapi Response
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "title": "Next.js Server Components",
        "slug": "nextjs-server-components"
      }
    },
    {
      "id": 2,
      "attributes": {
        "title": "Next.js Authentication",
        "slug": "nextjs-authentication"
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 2
    }
  }
}
```

---

## 10. Error Response Patterns

### 400 Bad Request
```json
{
  "error": {
    "status": 400,
    "message": "Bad Request",
    "details": {
      "errors": [
        {
          "path": ["title"],
          "message": "title is required"
        }
      ]
    }
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "status": 401,
    "message": "Unauthorized"
  }
}
```

### 403 Forbidden
```json
{
  "error": {
    "status": 403,
    "message": "Forbidden"
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "status": 404,
    "message": "Not Found"
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "status": 500,
    "message": "Internal Server Error"
  }
}
```

---

## Code Examples for Handling Responses

### Success Handling
```typescript
try {
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (response.ok) {
    return data;
  } else {
    throw new Error(data.error?.message || "Request failed");
  }
} catch (error) {
  console.error("API Error:", error);
  throw error;
}
```

### Error Handling with Status Codes
```typescript
try {
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    switch (response.status) {
      case 401:
        redirect("/login");
        break;
      case 403:
        throw new Error("Access forbidden");
      case 404:
        notFound();
        break;
      default:
        throw new Error(data.error?.message || "Request failed");
    }
  }
  
  return data;
} catch (error) {
  console.error("API Error:", error);
  throw error;
}
```

---

These examples show the complete request/response flow for all authentication and API operations in your application.
