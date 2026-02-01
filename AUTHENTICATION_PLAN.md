# Authentication Implementation Plan
## Complete Guide with Code Samples

This document provides a comprehensive plan and code samples for implementing authentication in your Next.js + Strapi blog application.

---

## Table of Contents

1. [Why Authentication Is Required](#why-authentication-is-required)
2. [Authentication Flow](#authentication-flow)
3. [Backend Setup (Strapi)](#backend-setup-strapi)
4. [Frontend Implementation](#frontend-implementation)
5. [Authenticated API Requests](#authenticated-api-requests)
6. [Next.js Server Components Integration](#nextjs-server-components-integration)
7. [Image Rendering](#image-rendering)
8. [Request/Response Examples](#requestresponse-examples)
9. [Best Practices](#best-practices)

---

## Why Authentication Is Required

### Problem Statement

**Not all APIs and media files are public.**

Without authentication:
- ❌ Users can only access public content
- ❌ Protected blog posts are inaccessible
- ❌ User-specific data cannot be retrieved
- ❌ Admin functions are exposed
- ❌ Media files may be restricted

### Authentication Benefits

Authentication allows the system to:

1. **Identify the user making the API request**
   ```typescript
   // Without auth: Anonymous request
   GET /api/blogs → Returns only public blogs
   
   // With auth: Authenticated request
   GET /api/blogs (with JWT) → Returns all blogs including protected ones
   ```

2. **Restrict access to protected endpoints**
   ```typescript
   // Protected endpoint example
   POST /api/blogs/create → Requires authentication
   DELETE /api/blogs/:id → Requires admin role
   ```

3. **Control access to authenticated content and files**
   ```typescript
   // Public blog
   GET /api/blogs/public-post → No auth needed
   
   // Protected blog
   GET /api/blogs/premium-post → Requires auth token
   ```

4. **Enforce role-based permissions consistently**
   ```typescript
   // User role: Can read, cannot delete
   GET /api/blogs → ✅ Allowed
   DELETE /api/blogs/:id → ❌ Forbidden
   
   // Admin role: Full access
   GET /api/blogs → ✅ Allowed
   DELETE /api/blogs/:id → ✅ Allowed
   ```

### Access Levels

```
┌─────────────────────────────────────────┐
│         PUBLIC ACCESS (No Auth)          │
│  - Public blog posts                    │
│  - Public media files                   │
│  - Public categories                    │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      AUTHENTICATED ACCESS (JWT)          │
│  - Protected blog posts                 │
│  - User profile data                    │
│  - User's own content                   │
│  - Premium media files                  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│        ADMIN ACCESS (Admin Role)         │
│  - All content                          │
│  - Create/Edit/Delete operations        │
│  - User management                      │
│  - System settings                     │
└─────────────────────────────────────────┘
```

---

## Authentication Flow

### Complete Flow Diagram

```
┌─────────────┐
│   User      │
│  Visits     │
│  /login     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  Login Form (Client Component)  │
│  - Email input                  │
│  - Password input               │
│  - Submit button                │
└──────┬──────────────────────────┘
       │
       │ POST /api/auth/login
       │ { email, password }
       ▼
┌─────────────────────────────────┐
│  Next.js API Route              │
│  (app/api/auth/login/route.ts)  │
└──────┬──────────────────────────┘
       │
       │ POST /api/auth/local
       │ { identifier, password }
       ▼
┌─────────────────────────────────┐
│  Strapi Backend                 │
│  - Validates credentials        │
│  - Generates JWT               │
│  - Returns user + JWT          │
└──────┬──────────────────────────┘
       │
       │ Response: { user, jwt }
       ▼
┌─────────────────────────────────┐
│  Next.js API Route              │
│  - Sets HTTP-only cookie        │
│  - Returns user data            │
└──────┬──────────────────────────┘
       │
       │ Cookie: auth-token
       ▼
┌─────────────────────────────────┐
│  Browser                        │
│  - Cookie stored                │
│  - Redirect to /dashboard       │
└─────────────────────────────────┘
```

### Step-by-Step Flow

1. **User Registration/Login**
   - User fills form on Next.js frontend
   - Credentials sent to Next.js API route

2. **Next.js API Route**
   - Receives credentials
   - Forwards to Strapi authentication endpoint

3. **Strapi Validation**
   - Validates credentials
   - Issues JWT token
   - Returns user object + JWT

4. **Token Storage**
   - JWT stored in HTTP-only cookie (secure)
   - Cookie sent with subsequent requests

5. **Authenticated Requests**
   - JWT included in Authorization header
   - Strapi validates token
   - Returns protected content

---

## Backend Setup (Strapi)

### Initial Setup

```bash
# Create Strapi backend
npx create-strapi-app@latest backend --quickstart

# Backend will run on:
# http://localhost:1337/admin
```

### Strapi Configuration

#### 1. Enable Authentication Endpoints

Strapi provides these endpoints automatically:

```typescript
// Registration
POST /api/auth/local/register
Body: {
  username: string,
  email: string,
  password: string
}

// Login
POST /api/auth/local
Body: {
  identifier: string,  // email or username
  password: string
}

// Get Current User
GET /api/users/me
Headers: {
  Authorization: "Bearer <JWT>"
}
```

#### 2. Configure Permissions

**In Strapi Admin Panel:**

1. Go to **Settings** → **Users & Permissions Plugin** → **Roles**
2. Configure **Public** role:
   - Blog: `find`, `findOne` (public posts only)
   - Media: `find`, `findOne` (public files only)

3. Configure **Authenticated** role:
   - Blog: `find`, `findOne` (all posts)
   - Blog: `create`, `update` (own posts)
   - Media: `find`, `findOne` (all files)

4. Configure **Admin** role:
   - Full access to all content types

#### 3. Content Type Permissions

**For Blog Content Type:**

```javascript
// Public permissions
{
  "blog": {
    "find": true,        // List blogs
    "findOne": true      // View single blog
  }
}

// Authenticated permissions
{
  "blog": {
    "find": true,
    "findOne": true,
    "create": true,      // Create own blogs
    "update": true,      // Update own blogs
    "delete": false     // Cannot delete
  }
}

// Admin permissions
{
  "blog": {
    "find": true,
    "findOne": true,
    "create": true,
    "update": true,
    "delete": true      // Can delete any blog
  }
}
```

#### 4. Email Confirmation (Optional)

**Install Email Plugin:**

```bash
npm install @strapi/provider-email-sendgrid
```

**Configure in `config/plugins.js`:**

```javascript
module.exports = {
  email: {
    provider: 'sendgrid',
    providerOptions: {
      apiKey: process.env.SENDGRID_API_KEY,
    },
    settings: {
      defaultFrom: 'noreply@yourdomain.com',
      defaultReplyTo: 'noreply@yourdomain.com',
    },
  },
};
```

**Enable in Admin Panel:**
- Settings → Users & Permissions Plugin → Advanced Settings
- Enable "Enable email confirmation"

---

## Frontend Implementation

### Environment Variables

**Create `.env.local`:**

```env
# Strapi Backend URL
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337

# Page limit for pagination
NEXT_PUBLIC_PAGE_LIMIT=10

# Optional: Email service (if using email confirmation)
SENDGRID_API_KEY=your_sendgrid_key
```

### 1. Registration Form (Client Component)

**File: `app/register/page.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      toast.success("Registration successful! Please log in.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-gray-900 rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            required
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
            minLength={6}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="text-purple-400 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
```

### 2. Login Form (Client Component)

**File: `app/login/page.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      toast.success("Login successful!");
      router.push(redirect);
      router.refresh(); // Refresh to update server components
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-gray-900 rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-400">
        Don't have an account?{" "}
        <Link href="/register" className="text-purple-400 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
```

### 3. Registration API Route

**File: `app/api/auth/register/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Register with Strapi
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/local/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Registration failed" },
        { status: response.status }
      );
    }

    // Return user data (JWT will be set on login)
    return NextResponse.json({
      user: data.user,
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 4. Login API Route

**File: `app/api/auth/login/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Authenticate with Strapi
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/local`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Authentication failed" },
        { status: 401 }
      );
    }

    // Set HTTP-only cookie for security
    const cookieStore = await cookies();
    cookieStore.set("auth-token", data.jwt, {
      httpOnly: true, // Prevents JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax", // CSRF protection
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/", // Available site-wide
    });

    return NextResponse.json({
      user: data.user,
      token: data.jwt,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 5. Logout API Route

**File: `app/api/auth/logout/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");

  return NextResponse.json({ message: "Logged out successfully" });
}
```

---

## Authenticated API Requests

### Request Pattern

All protected requests to Strapi must include the JWT in the request headers:

```typescript
Authorization: Bearer <JWT>
```

### Updated API Functions

**File: `lib/api.ts` (Updated with Authentication)**

```typescript
import axios, { AxiosInstance } from "axios";
import { cookies } from "next/headers";
import { UserBlogPostData, BlogPost } from "./types";

// Base API instance
export const api: AxiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_STRAPI_URL}`,
});

// Get authentication token from cookies (Server Component)
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("auth-token")?.value || null;
}

// Create authenticated API instance
export async function getAuthenticatedApi() {
  const token = await getAuthToken();
  
  return axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_STRAPI_URL}`,
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  });
}

// Public: Get all posts (no auth required)
export const getAllPosts = async (
  page: number = 1,
  searchQuery: string = ""
) => {
  try {
    const searchFilter = searchQuery
      ? `&filters[title][$containsi]=${searchQuery}`
      : "";
    
    const response = await api.get(
      `api/blogs?populate=*&pagination[page]=${page}&pagination[pageSize]=${process.env.NEXT_PUBLIC_PAGE_LIMIT}${searchFilter}`
    );
    
    return {
      posts: response.data.data,
      pagination: response.data.meta.pagination,
    };
  } catch (error) {
    console.error("Error fetching blogs:", error);
    throw new Error("Server error");
  }
};

// Public: Get post by slug (no auth required for public posts)
export const getPostBySlug = async (slug: string) => {
  try {
    const response = await api.get(
      `api/blogs?filters[slug][$eq]=${slug}&populate=*`
    );
    
    if (response.data.data.length > 0) {
      return response.data.data[0];
    }
    throw new Error("Post not found.");
  } catch (error) {
    console.error("Error fetching post:", error);
    throw new Error("Server error");
  }
};

// Authenticated: Get protected posts
export const getProtectedPosts = async (
  page: number = 1,
  searchQuery: string = ""
) => {
  try {
    const authApi = await getAuthenticatedApi();
    const searchFilter = searchQuery
      ? `&filters[title][$containsi]=${searchQuery}`
      : "";
    
    const response = await authApi.get(
      `api/blogs?populate=*&pagination[page]=${page}&pagination[pageSize]=${process.env.NEXT_PUBLIC_PAGE_LIMIT}${searchFilter}`
    );
    
    return {
      posts: response.data.data,
      pagination: response.data.meta.pagination,
    };
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error("Unauthorized - Please log in");
    }
    console.error("Error fetching protected blogs:", error);
    throw new Error("Server error");
  }
};

// Authenticated: Create post
export const createPost = async (postData: UserBlogPostData) => {
  try {
    const authApi = await getAuthenticatedApi();
    const reqData = { data: { ...postData } };
    
    const response = await authApi.post("api/blogs", reqData);
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error("Unauthorized - Please log in");
    }
    console.error("Error creating post:", error);
    throw new Error("Failed to create post");
  }
};

// Authenticated: Update post
export const updatePost = async (id: number, postData: Partial<UserBlogPostData>) => {
  try {
    const authApi = await getAuthenticatedApi();
    const reqData = { data: { ...postData } };
    
    const response = await authApi.put(`api/blogs/${id}`, reqData);
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error("Unauthorized - Please log in");
    }
    console.error("Error updating post:", error);
    throw new Error("Failed to update post");
  }
};

// Authenticated: Delete post (admin only)
export const deletePost = async (id: number) => {
  try {
    const authApi = await getAuthenticatedApi();
    await authApi.delete(`api/blogs/${id}`);
    return true;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error("Unauthorized - Please log in");
    }
    if (error.response?.status === 403) {
      throw new Error("Forbidden - Admin access required");
    }
    console.error("Error deleting post:", error);
    throw new Error("Failed to delete post");
  }
};
```

---

## Next.js Server Components Integration

### Authentication Utilities

**File: `lib/auth.ts`**

```typescript
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Get the current user session from cookies
 * Returns null if not authenticated
 */
export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  // Verify token with Strapi
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store", // Don't cache auth requests
      }
    );

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    return { user, token };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this in protected Server Components
 */
export async function requireAuth() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Get user role
 */
export async function getUserRole() {
  const session = await getServerSession();
  return session?.user?.role?.type || null;
}

/**
 * Check if user has specific role
 */
export async function hasRole(requiredRole: string) {
  const role = await getUserRole();
  return role === requiredRole;
}
```

### Protected Server Component Example

**File: `app/dashboard/page.tsx`**

```typescript
import { requireAuth } from "@/lib/auth";
import { getProtectedPosts } from "@/lib/api";
import { BlogPost } from "@/lib/types";

export default async function DashboardPage() {
  // This will redirect to /login if not authenticated
  const { user } = await requireAuth();

  // Fetch protected content
  const { posts } = await getProtectedPosts(1, "");

  return (
    <div className="max-w-screen-lg mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">
        Welcome, {user.username || user.email}!
      </h1>
      <p className="text-gray-400 mb-6">Your Dashboard</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map((post: BlogPost) => (
          <div key={post.id} className="bg-gray-900 p-4 rounded-lg">
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <p className="text-gray-400 text-sm mt-2">{post.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Mixed Public/Protected Content

**File: `app/page.tsx` (Updated)**

```typescript
import { Suspense } from "react";
import Link from "next/link";
import { getAllPosts, getServerSession } from "@/lib/api";
import { BlogPost } from "@/lib/types";
import Pagination from "@/components/Pagination";
import Loading from "@/components/Loading";

export default async function Home({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const page = parseInt(searchParams.page || "1");
  const searchQuery = searchParams.search || "";

  // Check if user is authenticated
  const session = await getServerSession();

  // Fetch posts (public + protected if authenticated)
  const { posts, pagination } = session
    ? await getProtectedPosts(page, searchQuery)
    : await getAllPosts(page, searchQuery);

  return (
    <div className="max-w-screen-lg mx-auto p-4">
      {session && (
        <div className="mb-4 p-3 bg-purple-900 rounded">
          <p className="text-sm">
            Logged in as {session.user.username || session.user.email}
          </p>
        </div>
      )}

      <Suspense fallback={<Loading />}>
        <BlogList posts={posts} pagination={pagination} />
      </Suspense>
    </div>
  );
}

function BlogList({
  posts,
  pagination,
}: {
  posts: BlogPost[];
  pagination: { pageCount: number; page: number };
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-gray-900 rounded-lg overflow-hidden">
            <Link href={`/blogs/${post.slug}`} className="block">
              {/* Post content */}
            </Link>
          </div>
        ))}
      </div>
      <Pagination currentPage={pagination.page} totalPages={pagination.pageCount} />
    </>
  );
}
```

---

## Image Rendering

### Using Next.js Image Component

**File: `components/BlogImage.tsx`**

```typescript
import Image from "next/image";
import { ImageData } from "@/lib/types";

interface BlogImageProps {
  image: ImageData;
  alt: string;
  className?: string;
  priority?: boolean;
}

export default function BlogImage({
  image,
  alt,
  className = "",
  priority = false,
}: BlogImageProps) {
  const imageUrl = `${process.env.NEXT_PUBLIC_STRAPI_URL}${image.url}`;

  return (
    <div className={`relative ${className}`}>
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className="object-cover"
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}
```

### Protected Image Rendering

**File: `components/ProtectedImage.tsx`**

```typescript
import Image from "next/image";
import { ImageData } from "@/lib/types";
import { getAuthToken } from "@/lib/api";

interface ProtectedImageProps {
  image: ImageData;
  alt: string;
  className?: string;
}

export default async function ProtectedImage({
  image,
  alt,
  className = "",
}: ProtectedImageProps) {
  const token = await getAuthToken();
  const imageUrl = `${process.env.NEXT_PUBLIC_STRAPI_URL}${image.url}`;

  // For protected images, you may need to proxy through your API
  // or use signed URLs from Strapi
  
  return (
    <div className={`relative ${className}`}>
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        // Add token to headers if needed (may require API route proxy)
      />
    </div>
  );
}
```

### Image Optimization Best Practices

```typescript
// ✅ Good: Using Next.js Image component
<Image
  src={imageUrl}
  alt="Descriptive alt text"
  width={800}
  height={600}
  priority={isAboveFold}
  sizes="(max-width: 768px) 100vw, 800px"
/>

// ❌ Bad: Using regular img tag
<img src={imageUrl} alt="image" />
```

---

## Request/Response Examples

### 1. Registration Request/Response

**Request:**
```http
POST /api/auth/register HTTP/1.1
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (Success):**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "confirmed": true,
    "blocked": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Registration successful"
}
```

**Response (Error):**
```json
{
  "error": {
    "message": "Email already taken",
    "status": 400
  }
}
```

### 2. Login Request/Response

**Request:**
```http
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (Success):**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": {
      "id": 1,
      "name": "Authenticated",
      "type": "authenticated"
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Error):**
```json
{
  "error": "Invalid identifier or password"
}
```

### 3. Authenticated Blog Fetch

**Request:**
```http
GET /api/blogs?populate=* HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success):**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Public Blog Post",
      "slug": "public-blog-post",
      "description": "This is a public post",
      "content": "# Content here",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "cover": {
        "url": "/uploads/cover_image.jpg"
      },
      "author": {
        "id": 1,
        "username": "johndoe"
      }
    },
    {
      "id": 2,
      "title": "Protected Blog Post",
      "slug": "protected-blog-post",
      "description": "This requires authentication",
      "content": "# Protected content",
      "createdAt": "2024-01-15T10:30:00.000Z"
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

**Response (Unauthorized):**
```json
{
  "error": {
    "status": 401,
    "message": "Unauthorized"
  }
}
```

### 4. Create Blog Post (Authenticated)

**Request:**
```http
POST /api/blogs HTTP/1.1
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

**Response (Success):**
```json
{
  "data": {
    "id": 3,
    "title": "My New Blog Post",
    "slug": "my-new-blog-post",
    "description": "This is a new post",
    "content": "# My content",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Best Practices

### Security Best Practices

1. **Use HTTP-only Cookies**
   ```typescript
   // ✅ Good: HTTP-only cookie
   cookieStore.set("auth-token", token, {
     httpOnly: true, // Prevents XSS attacks
     secure: true,   // HTTPS only
     sameSite: "lax" // CSRF protection
   });

   // ❌ Bad: localStorage
   localStorage.setItem("token", token); // Vulnerable to XSS
   ```

2. **Validate on Server**
   ```typescript
   // ✅ Good: Server-side validation
   export async function requireAuth() {
     const session = await getServerSession();
     if (!session) redirect("/login");
     return session;
   }

   // ❌ Bad: Client-side only
   if (!localStorage.getItem("token")) {
     // Can be bypassed
   }
   ```

3. **Handle Errors Gracefully**
   ```typescript
   try {
     const response = await authApi.get("api/blogs");
     return response.data;
   } catch (error: any) {
     if (error.response?.status === 401) {
       redirect("/login");
     }
     throw error;
   }
   ```

### Performance Best Practices

1. **Cache Public Content**
   ```typescript
   // Cache public blogs for 1 hour
   const response = await fetch(url, {
     next: { revalidate: 3600 }
   });
   ```

2. **Don't Cache Auth Requests**
   ```typescript
   // Never cache authentication
   const response = await fetch(url, {
     cache: "no-store"
   });
   ```

3. **Optimize Images**
   ```typescript
   // Use Next.js Image component
   <Image
     src={url}
     alt={alt}
     width={800}
     height={600}
     priority={isAboveFold}
   />
   ```

### Operational Best Practices

1. **Back Up Media and Database Regularly**
   ```bash
   # Strapi backup script
   npm run strapi backup
   ```

2. **Limit Public Permissions**
   - Only allow `find` and `findOne` for public role
   - Never allow `create`, `update`, or `delete` for public

3. **Monitor API Performance**
   ```typescript
   // Add logging
   console.time("fetch-blogs");
   const posts = await getAllPosts();
   console.timeEnd("fetch-blogs");
   ```

4. **Handle Errors Properly**
   ```typescript
   try {
     // API call
   } catch (error) {
     console.error("API Error:", error);
     // Log to error tracking service
     // Return user-friendly error
   }
   ```

---

## Implementation Checklist

- [ ] Set up Strapi backend
- [ ] Configure user permissions in Strapi
- [ ] Create registration API route
- [ ] Create login API route
- [ ] Create logout API route
- [ ] Update API functions with authentication
- [ ] Create authentication utilities
- [ ] Create registration page
- [ ] Create login page
- [ ] Create protected dashboard page
- [ ] Update blog list to show protected content
- [ ] Implement image optimization
- [ ] Add error handling
- [ ] Test authentication flow
- [ ] Test protected routes
- [ ] Set up monitoring
- [ ] Configure backups

---

This plan provides a complete implementation guide with all necessary code samples for authentication in your Next.js + Strapi application.
