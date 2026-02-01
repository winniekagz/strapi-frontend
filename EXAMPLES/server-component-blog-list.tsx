// app/page.tsx - SERVER COMPONENT EXAMPLE
// This is the converted version of your blog list page using Server Components

import { Suspense } from "react";
import Link from "next/link";
import { getAllPosts } from "../lib/api";
import { BlogPost } from "@/lib/types";
import Pagination from "@/components/Pagination";
import Loading from "@/components/Loading";

// Server Component - no "use client" directive
// This component runs on the server and fetches data directly
export default async function Home({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  // Direct async data fetching - runs on server before page renders
  const page = parseInt(searchParams.page || "1");
  const searchQuery = searchParams.search || "";

  // Fetch data directly - no useEffect, no useState, no loading state needed
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

      {/* Pagination is a Client Component for interactivity */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.pageCount}
      />
    </>
  );
}
