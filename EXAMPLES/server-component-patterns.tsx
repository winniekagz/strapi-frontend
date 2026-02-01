// Server Component Patterns with Authentication
// Complete examples showing how to use Server Components with authenticated requests

// ============================================
// Pattern 1: Public Content (No Auth Required)
// ============================================

// File: app/page.tsx
import { getAllPosts } from "@/lib/api";
import { BlogPost } from "@/lib/types";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  // Public API call - no authentication needed
  const page = parseInt(searchParams.page || "1");
  const searchQuery = searchParams.search || "";
  
  const { posts, pagination } = await getAllPosts(page, searchQuery);

  return (
    <div>
      <h1>Public Blog Posts</h1>
      {posts.map((post: BlogPost) => (
        <div key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.description}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Pattern 2: Protected Content (Auth Required)
// ============================================

// File: app/dashboard/page.tsx
import { requireAuth } from "@/lib/auth";
import { getProtectedPosts } from "@/lib/api";
import { BlogPost } from "@/lib/types";

export default async function DashboardPage() {
  // This redirects to /login if not authenticated
  const { user } = await requireAuth();

  // Authenticated API call - includes JWT in headers
  const { posts } = await getProtectedPosts(1, "");

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      <h2>Protected Blog Posts</h2>
      {posts.map((post: BlogPost) => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.description}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Pattern 3: Mixed Public/Protected Content
// ============================================

// File: app/blogs/page.tsx
import { getServerSession } from "@/lib/auth";
import { getAllPosts, getProtectedPosts } from "@/lib/api";
import { BlogPost } from "@/lib/types";

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  // Check if user is authenticated (doesn't redirect)
  const session = await getServerSession();
  const page = parseInt(searchParams.page || "1");

  // Fetch different content based on auth status
  const { posts, pagination } = session
    ? await getProtectedPosts(page, "") // Authenticated: get all posts
    : await getAllPosts(page, "");      // Public: get only public posts

  return (
    <div>
      {session && (
        <div className="bg-green-500 p-2">
          Logged in as {session.user.username}
        </div>
      )}
      <h1>Blog Posts</h1>
      {posts.map((post: BlogPost) => (
        <div key={post.id}>
          <h2>{post.title}</h2>
          {post.isProtected && (
            <span className="badge">Protected</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// Pattern 4: Role-Based Access Control
// ============================================

// File: app/admin/page.tsx
import { requireAuth, hasRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  // Require authentication
  const { user } = await requireAuth();

  // Check if user has admin role
  const isAdmin = await hasRole("admin");

  if (!isAdmin) {
    redirect("/dashboard"); // Redirect non-admins
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      <p>Welcome, {user.username} (Admin)</p>
      {/* Admin-only content */}
    </div>
  );
}

// ============================================
// Pattern 5: Conditional Rendering Based on Auth
// ============================================

// File: app/layout.tsx or app/navbar.tsx
import { getServerSession } from "@/lib/auth";
import Link from "next/link";

export default async function Navbar() {
  const session = await getServerSession();

  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/blogs">Blogs</Link>
      
      {session ? (
        <>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/create">Create Post</Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit">Logout</button>
          </form>
        </>
      ) : (
        <>
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </>
      )}
    </nav>
  );
}

// ============================================
// Pattern 6: Single Blog Post with Auth Check
// ============================================

// File: app/blogs/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getPostBySlug, getServerSession } from "@/lib/api";
import { BlogPost } from "@/lib/types";

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const session = await getServerSession();

  try {
    // Try to fetch post (public or protected)
    const post = await getPostBySlug(slug);

    // Check if post is protected and user is not authenticated
    if (post.isProtected && !session) {
      // Redirect to login with return URL
      redirect(`/login?redirect=/blogs/${slug}`);
    }

    return (
      <div>
        <h1>{post.title}</h1>
        {post.isProtected && (
          <span className="badge">Protected Content</span>
        )}
        <div>{post.content}</div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}

// ============================================
// Pattern 7: Create Post (Authenticated)
// ============================================

// File: app/create/page.tsx
import { requireAuth } from "@/lib/auth";
import CreatePostForm from "@/components/CreatePostForm";

export default async function CreatePostPage() {
  // Require authentication
  const { user } = await requireAuth();

  return (
    <div>
      <h1>Create New Post</h1>
      <p>Logged in as: {user.username}</p>
      <CreatePostForm userId={user.id} />
    </div>
  );
}

// ============================================
// Pattern 8: User Profile (Own Data)
// ============================================

// File: app/profile/page.tsx
import { requireAuth } from "@/lib/auth";
import { getAuthenticatedApi } from "@/lib/api";

export default async function ProfilePage() {
  const { user, token } = await requireAuth();

  // Fetch user's own posts
  const authApi = await getAuthenticatedApi();
  const response = await authApi.get(
    `api/blogs?filters[author][id][$eq]=${user.id}&populate=*`
  );

  const userPosts = response.data.data;

  return (
    <div>
      <h1>Profile</h1>
      <div>
        <p>Username: {user.username}</p>
        <p>Email: {user.email}</p>
        <p>Role: {user.role?.type}</p>
      </div>
      
      <h2>Your Posts ({userPosts.length})</h2>
      {userPosts.map((post: any) => (
        <div key={post.id}>
          <h3>{post.attributes.title}</h3>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Pattern 9: Error Handling in Server Components
// ============================================

// File: app/blogs/[slug]/page.tsx (with error handling)
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/api";

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const post = await getPostBySlug(params.slug);
    
    if (!post) {
      notFound(); // Shows 404 page
    }

    return (
      <div>
        <h1>{post.title}</h1>
        <div>{post.content}</div>
      </div>
    );
  } catch (error: any) {
    // Handle different error types
    if (error.message === "Post not found") {
      notFound();
    }
    
    // Log error and show generic error
    console.error("Error fetching post:", error);
    throw error; // Will be caught by error.tsx
  }
}

// ============================================
// Pattern 10: Parallel Data Fetching
// ============================================

// File: app/dashboard/page.tsx (optimized)
import { requireAuth } from "@/lib/auth";
import { getProtectedPosts, getAllCategories } from "@/lib/api";

export default async function DashboardPage() {
  const { user } = await requireAuth();

  // Fetch data in parallel for better performance
  const [postsData, categories] = await Promise.all([
    getProtectedPosts(1, ""),
    getAllCategories(),
  ]);

  return (
    <div>
      <h1>Dashboard</h1>
      <div>
        <h2>Posts ({postsData.posts.length})</h2>
        {/* Render posts */}
      </div>
      <div>
        <h2>Categories ({categories.length})</h2>
        {/* Render categories */}
      </div>
    </div>
  );
}

// ============================================
// Pattern 11: Server Actions for Mutations
// ============================================

// File: app/actions/blog-actions.ts
"use server";

import { requireAuth } from "@/lib/auth";
import { getAuthenticatedApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function createBlogPost(formData: FormData) {
  // Require authentication
  const { user } = await requireAuth();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  // Create post via authenticated API
  const authApi = await getAuthenticatedApi();
  await authApi.post("api/blogs", {
    data: {
      title,
      content,
      author: user.id,
    },
  });

  // Revalidate the blogs page
  revalidatePath("/blogs");
  
  return { success: true };
}

// File: app/create/page.tsx (using Server Action)
import { createBlogPost } from "@/app/actions/blog-actions";
import CreatePostForm from "@/components/CreatePostForm";

export default async function CreatePage() {
  return (
    <div>
      <h1>Create Post</h1>
      <CreatePostForm action={createBlogPost} />
    </div>
  );
}

// ============================================
// Pattern 12: Streaming with Suspense
// ============================================

// File: app/page.tsx (with Suspense)
import { Suspense } from "react";
import { getAllPosts } from "@/lib/api";
import Loading from "@/components/Loading";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || "1");

  return (
    <div>
      <h1>Blog Posts</h1>
      <Suspense fallback={<Loading />}>
        <BlogList page={page} />
      </Suspense>
    </div>
  );
}

async function BlogList({ page }: { page: number }) {
  const { posts } = await getAllPosts(page, "");
  
  return (
    <div>
      {posts.map((post) => (
        <div key={post.id}>
          <h2>{post.title}</h2>
        </div>
      ))}
    </div>
  );
}

---

## Key Takeaways

1. **Public Content**: No authentication needed, direct API calls
2. **Protected Content**: Use `requireAuth()` before fetching
3. **Mixed Content**: Check `getServerSession()` and conditionally fetch
4. **Role-Based**: Use `hasRole()` to check permissions
5. **Error Handling**: Use `notFound()` and error boundaries
6. **Performance**: Use `Promise.all()` for parallel fetching
7. **Mutations**: Use Server Actions for authenticated mutations
8. **Streaming**: Use Suspense for better UX

These patterns cover all common scenarios for authenticated Server Components.
