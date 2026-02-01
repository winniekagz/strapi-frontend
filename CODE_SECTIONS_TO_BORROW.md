# Code Sections to Borrow - Quick Reference

This document lists the exact code sections you need to copy from the examples to implement Server Components and authentication in your Next.js app.

---

## 📋 Table of Contents

1. [Blog List Page (Server Component)](#1-blog-list-page-server-component)
2. [Single Blog Page (Server Component)](#2-single-blog-page-server-component)
3. [Authentication Utilities](#3-authentication-utilities)
4. [Protected Page Example](#4-protected-page-example)
5. [Middleware for Route Protection](#5-middleware-for-route-protection)
6. [Client Components for Interactivity](#6-client-components-for-interactivity)
7. [Login API Route](#7-login-api-route)
8. [Login Page (Client Component)](#8-login-page-client-component)

---

## 1. Blog List Page (Server Component)

**File to create/update**: `app/page.tsx`

**Source**: `EXAMPLES/server-component-blog-list.tsx`

**Key Changes**:
- ❌ Remove `"use client"` directive
- ❌ Remove `useState`, `useEffect`, `useSearchParams`
- ✅ Make component `async`
- ✅ Use `searchParams` as prop
- ✅ Direct `await` for data fetching

**Copy this entire file** from the examples folder.

---

## 2. Single Blog Page (Server Component)

**File to create/update**: `app/blogs/[slug]/page.tsx`

**Source**: `EXAMPLES/server-component-single-blog.tsx`

**Key Changes**:
- ❌ Remove `"use client"` directive
- ❌ Remove `useState`, `useEffect`
- ✅ Make component `async`
- ✅ Use `params` as prop
- ✅ Direct `await` for data fetching
- ✅ Use `notFound()` for 404 handling

**Copy this entire file** from the examples folder.

---

## 3. Authentication Utilities

**File to create**: `lib/auth.ts`

**Source**: `EXAMPLES/auth-utilities.ts`

**Functions to copy**:
```typescript
// Copy these functions:
- getServerSession()  // Check if user is authenticated
- requireAuth()       // Require auth or redirect
- getUserRole()       // Get user role (optional)
- hasRole()          // Check specific role (optional)
```

**Usage in protected pages**:
```typescript
import { requireAuth } from "@/lib/auth";

export default async function ProtectedPage() {
  const { user } = await requireAuth();
  // User is guaranteed to be authenticated here
}
```

---

## 4. Protected Page Example

**File to create**: `app/dashboard/page.tsx` (or any protected route)

**Source**: `EXAMPLES/protected-page-example.tsx`

**Pattern to follow**:
```typescript
import { requireAuth } from "@/lib/auth";

export default async function DashboardPage() {
  const { user } = await requireAuth();
  // Your protected content here
}
```

**Copy the entire example** and adapt for your needs.

---

## 5. Middleware for Route Protection

**File to create**: `middleware.ts` (in project root)

**Source**: `EXAMPLES/middleware-example.ts`

**What it does**:
- Automatically protects routes before they render
- Redirects unauthenticated users to `/login`
- Preserves redirect URL for after login

**Configuration**:
```typescript
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    // Add your protected routes here
  ],
};
```

**Copy the entire file** and update the `matcher` config.

---

## 6. Client Components for Interactivity

**Files to create/update**:

### A. Back Button Component
**File**: `components/BackButton.tsx`
**Source**: `EXAMPLES/client-components.tsx` (first section)

### B. Code Block Component
**File**: `components/CodeBlock.tsx`
**Source**: `EXAMPLES/client-components.tsx` (second section)

### C. Pagination Component
**File**: `components/Pagination.tsx`
**Source**: `EXAMPLES/client-components.tsx` (third section)

**Note**: These stay as Client Components because they need interactivity (onClick, useRouter, etc.)

---

## 7. Login API Route

**File to create**: `app/api/auth/login/route.ts`

**Source**: `EXAMPLES/api-route-login.ts`

**What it does**:
- Handles login POST requests
- Authenticates with Strapi
- Sets secure HTTP-only cookie
- Returns user data

**Copy the entire file** - it's ready to use.

**Optional**: Also copy the logout route example from the comments.

---

## 8. Login Page (Client Component)

**File to create**: `app/login/page.tsx`

**Source**: `EXAMPLES/client-components.tsx` (last section)

**What it does**:
- Login form with email/password
- Calls `/api/auth/login`
- Sets cookie and redirects
- Handles redirect parameter

**Copy the entire login page example**.

---

## 🔄 Migration Steps

### Step 1: Convert Blog Pages
1. Copy `EXAMPLES/server-component-blog-list.tsx` → `app/page.tsx`
2. Copy `EXAMPLES/server-component-single-blog.tsx` → `app/blogs/[slug]/page.tsx`

### Step 2: Add Client Components
1. Copy BackButton from `EXAMPLES/client-components.tsx` → `components/BackButton.tsx`
2. Copy CodeBlock from `EXAMPLES/client-components.tsx` → `components/CodeBlock.tsx`
3. Update `components/Pagination.tsx` with example code

### Step 3: Add Authentication
1. Copy `EXAMPLES/auth-utilities.ts` → `lib/auth.ts`
2. Copy `EXAMPLES/middleware-example.ts` → `middleware.ts`
3. Copy `EXAMPLES/api-route-login.ts` → `app/api/auth/login/route.ts`
4. Copy login page from `EXAMPLES/client-components.tsx` → `app/login/page.tsx`

### Step 4: Create Protected Page
1. Copy `EXAMPLES/protected-page-example.tsx` → `app/dashboard/page.tsx`
2. Adapt for your needs

### Step 5: Test
1. Test blog list page
2. Test single blog page
3. Test login flow
4. Test protected page access

---

## 📝 Environment Variables Needed

Make sure you have these in your `.env.local`:

```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_PAGE_LIMIT=10
```

---

## 🎯 Quick Copy Checklist

- [ ] `app/page.tsx` - Server Component blog list
- [ ] `app/blogs/[slug]/page.tsx` - Server Component single blog
- [ ] `lib/auth.ts` - Authentication utilities
- [ ] `middleware.ts` - Route protection
- [ ] `app/api/auth/login/route.ts` - Login API
- [ ] `app/login/page.tsx` - Login page
- [ ] `app/dashboard/page.tsx` - Protected page example
- [ ] `components/BackButton.tsx` - Client component
- [ ] `components/CodeBlock.tsx` - Client component
- [ ] `components/Pagination.tsx` - Updated client component

---

## 💡 Pro Tips

1. **Start with one page**: Convert `app/page.tsx` first, test it, then move to others
2. **Keep Client Components separate**: Don't mix server and client code
3. **Test authentication flow**: Make sure login → protected page works
4. **Use TypeScript**: All examples are typed for better DX
5. **Check console**: Server Components log to server console, not browser

---

## 🐛 Common Issues

### Issue: "useSearchParams() should be wrapped in a suspense boundary"
**Solution**: Use `searchParams` prop instead of `useSearchParams()` hook in Server Components

### Issue: "useRouter() can only be used in Client Components"
**Solution**: Extract router usage to a separate Client Component

### Issue: "Cookies can only be modified in a Server Action or Route Handler"
**Solution**: Use API routes or Server Actions for setting cookies

### Issue: "notFound() is not defined"
**Solution**: Import from `next/navigation`: `import { notFound } from "next/navigation"`

---

## 📚 Additional Resources

- Main Guide: `NEXTJS_SERVER_COMPONENTS_GUIDE.md`
- Visual Guide: `VISUAL_ILLUSTRATION.md`
- All Examples: `EXAMPLES/` folder

---

**Ready to implement?** Start with Step 1 and work through each step systematically!
