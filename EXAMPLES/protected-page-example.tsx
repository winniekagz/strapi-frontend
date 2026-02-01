// app/dashboard/page.tsx - PROTECTED SERVER COMPONENT EXAMPLE
// This shows how to create a protected page using Server Components

import { requireAuth } from "@/lib/auth";
import { getAllPosts } from "@/lib/api";
import { BlogPost } from "@/lib/types";

// This is a protected Server Component
// It will automatically redirect to /login if user is not authenticated
export default async function DashboardPage() {
  // This will redirect to /login if not authenticated
  const { user } = await requireAuth();

  // Now you can safely fetch user-specific data
  // The user is guaranteed to be authenticated at this point
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

// Example with role-based access
// app/admin/page.tsx
/*
import { requireAuth, hasRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const { user } = await requireAuth();
  
  // Check if user has admin role
  const isAdmin = await hasRole("admin");
  
  if (!isAdmin) {
    redirect("/dashboard"); // Redirect non-admins
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      <p>Welcome, {user.email}</p>
    </div>
  );
}
*/
