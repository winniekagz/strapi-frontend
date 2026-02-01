# Next.js Server Components Guide
## Converting Client Components to Server Components for Blog Management

This guide illustrates how to use Next.js Server Components to fetch blogs, get single blog posts, and implement authentication for protected pages.

---

## Table of Contents
1. [Understanding Server Components](#understanding-server-components)
2. [Converting Blog List Page](#converting-blog-list-page)
3. [Converting Single Blog Page](#converting-single-blog-page)
4. [Authentication for Protected Pages](#authentication-for-protected-pages)
5. [Code Sections to Borrow](#code-sections-to-borrow)

---

## Understanding Server Components

### Key Differences: Client vs Server Components

| Feature | Client Component | Server Component |
|---------|------------------|------------------|
| **Directive** | `"use client"` | No directive (default) |
| **Rendering** | Browser | Server |
| **Data Fetching** | `useEffect` + `useState` | Direct `async/await` |
| **Interactivity** | Full React hooks | Limited (needs Client Components) |
| **SEO** | Lower (client-side) | Higher (server-rendered) |
| **Performance** | Slower (hydration) | Faster (no JS bundle) |

### Benefits of Server Components
- ✅ **Better SEO**: Content is rendered on the server
- ✅ **Faster Initial Load**: No JavaScript needed for data fetching
- ✅ **Reduced Bundle Size**: Less JavaScript sent to client
- ✅ **Direct Database Access**: Can access APIs directly without exposing endpoints
- ✅ **Better Security**: API keys and secrets stay on server

---

## Converting Blog List Page

### Current Implementation (Client Component)
**File**: `app/page.tsx`

```tsx
"use client";
import { useEffect, useState } from "react";
// ... client-side fetching with useEffect
```

### Server Component Implementation

**File**: `app/page.tsx` (Server Component)

```tsx
// app/page.tsx - SERVER COMPONENT
import { Suspense } from "react";
import Link from "next/link";
import { getAllPosts } from "../lib/api";
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

  const { posts, pagination } = await getAllPosts(page, searchQuery);

  return (
    <div className="max-w-screen-lg mx-auto p-4">
      <Suspense fallback={<Loading />}>
        <BlogList posts={posts} pagination={pagination} />
      </Suspense>
    </div>
  );
}

// Separate component for the blog list
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
        {posts.length > 0 ? (
          posts.map((post) => (
            <div
              key={post.id}
              className="cursor-pointer bg-gray-900 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <Link href={`/blogs/${post.slug}`} className="block">
                {post.cover?.url && (
                  <div className="relative h-36 w-full">
                    <img
                      src={`${process.env.NEXT_PUBLIC_STRAPI_URL}${post.cover.url}`}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-lg font-semibold font-jet-brains text-white line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-gray-400 mt-2 text-sm leading-6 line-clamp-3">
                    {post.description}
                  </p>
                  <p className="text-purple-400 text-sm mt-4 inline-block font-medium hover:underline">
                    Read More
                  </p>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <p className="text-gray-400">No posts available at the moment.</p>
        )}
      </div>

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.pageCount}
      />
    </>
  );
}
```

### Key Changes:
1. ❌ Removed `"use client"` directive
2. ❌ Removed `useState`, `useEffect`, `useSearchParams`
3. ✅ Made component `async`
4. ✅ Direct `await` for data fetching
5. ✅ `searchParams` passed as prop (Next.js 13+ App Router)
6. ✅ Used `Suspense` for loading states

### Updated Pagination Component (Client Component)
Since pagination needs interactivity, keep it as a Client Component:

**File**: `components/Pagination.tsx`

```tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("page", newPage.toString());
    router.push(`?${newParams.toString()}`);
  };

  return (
    <div className="flex justify-center gap-2 mt-8">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
      >
        Previous
      </button>
      <span className="px-4 py-2">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
```

---

## Converting Single Blog Page

### Current Implementation (Client Component)
**File**: `app/blogs/[slug]/page.tsx`

```tsx
"use client";
import { useEffect, useState } from "react";
// ... client-side fetching
```

### Server Component Implementation

**File**: `app/blogs/[slug]/page.tsx` (Server Component)

```tsx
// app/blogs/[slug]/page.tsx - SERVER COMPONENT
import { notFound } from "next/navigation";
import { getPostBySlug } from "../../../lib/api";
import { BlogPost } from "@/lib/types";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import moment from "moment";
import BackButton from "@/components/BackButton";
import CodeBlock from "@/components/CodeBlock";

// Server Component - async by default
export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  try {
    // Direct async data fetching on server
    const post = await getPostBySlug(slug);

    if (!post) {
      notFound(); // Next.js 404 page
    }

    return (
      <div className="max-w-screen-md mx-auto p-4">
        <h1 className="text-4xl leading-[60px] capitalize text-center font-bold text-purple-800 font-jet-brains">
          {post.title}
        </h1>
        <div className="w-full flex items-center justify-center font-light">
          Published: {moment(post.createdAt).fromNow()}
        </div>

        {/* Categories Section */}
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap space-x-2 my-4">
            {post.categories.map(({ name, documentId }) => (
              <span
                key={documentId}
                className="border border-purple-900 font-medium px-2 py-2 text-sm"
              >
                {name}
              </span>
            ))}
          </div>
        )}

        {post.cover && (
          <div className="relative h-72 w-full my-4">
            <img
              src={`${process.env.NEXT_PUBLIC_STRAPI_URL}${post.cover.url}`}
              alt={post.title}
              className="rounded-lg w-full h-full object-cover"
            />
          </div>
        )}

        <p className="text-gray-300 leading-[32px] tracking-wide italic mt-2 mb-6">
          {post.description}
        </p>

        <Markdown
          className={"leading-[40px] max-w-screen-lg prose prose-invert"}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code({ inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              const codeString = String(children).replace(/\n$/, "");

              return !inline && match ? (
                <CodeBlock code={codeString} language={match[1]} />
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {post.content}
        </Markdown>

        <BackButton />
      </div>
    );
  } catch (error) {
    console.error("Error fetching post:", error);
    notFound();
  }
}

// Generate static params for better performance (optional)
export async function generateStaticParams() {
  // This pre-renders pages at build time
  // You can fetch all slugs here if you want static generation
  return [];
}
```

### Client Components for Interactivity

**File**: `components/BackButton.tsx`

```tsx
"use client";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="text-purple-800 mt-4 inline-block hover:underline"
    >
      Back to Blogs
    </button>
  );
}
```

**File**: `components/CodeBlock.tsx`

```tsx
"use client";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { FaClipboard } from "react-icons/fa";
import { toast } from "react-hot-toast";

export default function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy code: ", err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleCopyCode}
        className="absolute top-2 right-2 bg-gray-700 text-white p-1 rounded-md hover:bg-gray-600 z-10"
        title="Copy to clipboard"
      >
        <FaClipboard color="#fff" />
      </button>
      <SyntaxHighlighter
        style={dracula}
        PreTag="div"
        language={language}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
```

### Key Changes:
1. ❌ Removed `"use client"` directive
2. ❌ Removed `useState`, `useEffect`
3. ✅ Made component `async`
4. ✅ Direct `await` for data fetching
5. ✅ Used `notFound()` for 404 handling
6. ✅ Extracted interactive parts to Client Components

---

## Authentication for Protected Pages

### Option 1: Server-Side Authentication with Middleware

**File**: `middleware.ts` (create in root)

```tsx
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the token from cookies
  const token = request.cookies.get("auth-token")?.value;

  // Protected routes
  const protectedRoutes = ["/dashboard", "/admin", "/create-post"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/create-post/:path*"],
};
```

### Option 2: Server Component Authentication Check

**File**: `lib/auth.ts`

```tsx
// lib/auth.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

export async function requireAuth() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
```

### Protected Page Example

**File**: `app/dashboard/page.tsx`

```tsx
// app/dashboard/page.tsx - PROTECTED SERVER COMPONENT
import { requireAuth } from "@/lib/auth";
import { getAllPosts } from "@/lib/api";
import { BlogPost } from "@/lib/types";

export default async function DashboardPage() {
  // This will redirect to /login if not authenticated
  const { user } = await requireAuth();

  // Fetch user's posts (example)
  const { posts } = await getAllPosts(1, "");

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

### Login Page Example (Client Component)

**File**: `app/login/page.tsx`

```tsx
// app/login/page.tsx - CLIENT COMPONENT (needs form interactivity)
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

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

      // Set cookie and redirect
      document.cookie = `auth-token=${data.token}; path=/; max-age=86400`;
      toast.success("Login successful!");
      router.push(redirect);
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
    </div>
  );
}
```

### API Route for Login

**File**: `app/api/auth/login/route.ts`

```tsx
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

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
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return NextResponse.json({
      user: data.user,
      token: data.jwt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## Code Sections to Borrow

### 1. Server Component Blog List Page
**Location**: Copy the entire `app/page.tsx` Server Component implementation above

**Key Features**:
- Async component with direct data fetching
- `searchParams` prop for query parameters
- `Suspense` for loading states
- No client-side JavaScript for data fetching

### 2. Server Component Single Blog Page
**Location**: Copy the entire `app/blogs/[slug]/page.tsx` Server Component implementation above

**Key Features**:
- Async component with `params` prop
- Direct `await` for data fetching
- `notFound()` for 404 handling
- Separated interactive components

### 3. Authentication Utilities
**Location**: Copy `lib/auth.ts` functions:
- `getServerSession()` - Check if user is authenticated
- `requireAuth()` - Require authentication or redirect

### 4. Protected Page Pattern
**Location**: Copy the `app/dashboard/page.tsx` pattern:
```tsx
export default async function ProtectedPage() {
  const { user } = await requireAuth();
  // ... rest of component
}
```

### 5. Middleware for Route Protection
**Location**: Copy `middleware.ts` for automatic route protection

### 6. Client Components for Interactivity
**Location**: Keep these as Client Components:
- `components/Pagination.tsx` - Page navigation
- `components/BackButton.tsx` - Router navigation
- `components/CodeBlock.tsx` - Copy to clipboard

---

## Migration Checklist

- [ ] Remove `"use client"` from page components
- [ ] Convert page components to `async` functions
- [ ] Replace `useEffect` + `useState` with direct `await`
- [ ] Update `searchParams` to use props instead of hooks
- [ ] Extract interactive parts to separate Client Components
- [ ] Add `Suspense` boundaries for loading states
- [ ] Implement authentication utilities (`lib/auth.ts`)
- [ ] Add middleware for route protection (optional)
- [ ] Create protected page examples
- [ ] Test all routes and authentication flows

---

## Best Practices

1. **Use Server Components by Default**: Only use Client Components when you need interactivity
2. **Separate Concerns**: Keep data fetching in Server Components, interactivity in Client Components
3. **Use Suspense**: Wrap async components in `Suspense` for better loading UX
4. **Error Handling**: Use `notFound()` and `error.tsx` for error states
5. **Security**: Keep authentication logic on the server
6. **Performance**: Use `generateStaticParams` for static pages when possible

---

## Additional Resources

- [Next.js Server Components Documentation](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Authentication Patterns](https://nextjs.org/docs/app/building-your-application/authentication)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
