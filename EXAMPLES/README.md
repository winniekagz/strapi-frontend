# Examples Directory

This directory contains ready-to-use code examples for implementing Next.js Server Components and authentication.

## 📁 Files Overview

### Server Component Examples

1. **`server-component-blog-list.tsx`**
   - Converted blog list page using Server Components
   - Shows how to fetch and display multiple blogs
   - Includes pagination integration

2. **`server-component-single-blog.tsx`**
   - Converted single blog page using Server Components
   - Shows how to fetch and display a single blog post
   - Includes markdown rendering and code blocks

### Authentication Examples

3. **`auth-utilities.ts`**
   - Server-side authentication utilities
   - `getServerSession()` - Check authentication
   - `requireAuth()` - Require authentication
   - Role-based access helpers

4. **`protected-page-example.tsx`**
   - Example of a protected page
   - Shows how to use `requireAuth()`
   - Includes role-based access example

5. **`middleware-example.ts`**
   - Next.js middleware for route protection
   - Automatically redirects unauthenticated users
   - Configurable protected routes

6. **`api-route-login.ts`**
   - API route handler for login
   - Authenticates with Strapi
   - Sets secure HTTP-only cookies

### Client Component Examples

7. **`client-components.tsx`**
   - Contains multiple Client Component examples:
     - `BackButton` - Navigation button
     - `CodeBlock` - Interactive code block with copy
     - `Pagination` - Page navigation
     - `LoginPage` - Login form

## 🚀 How to Use

1. **Read the main guide**: `../NEXTJS_SERVER_COMPONENTS_GUIDE.md`
2. **Check the quick reference**: `../CODE_SECTIONS_TO_BORROW.md`
3. **Copy relevant examples** to your project
4. **Adapt for your needs** (styling, data structure, etc.)

## 📝 Notes

- All examples use TypeScript
- Examples follow Next.js 13+ App Router conventions
- Client Components are marked with `"use client"`
- Server Components have no directive (default)
- Authentication examples use Strapi, but patterns apply to any backend

## 🔗 Related Files

- `../NEXTJS_SERVER_COMPONENTS_GUIDE.md` - Comprehensive guide
- `../VISUAL_ILLUSTRATION.md` - Visual diagrams and flowcharts
- `../CODE_SECTIONS_TO_BORROW.md` - Quick reference for what to copy
