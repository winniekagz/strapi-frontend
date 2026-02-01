// src/app/page.tsx
/* eslint-disable @next/next/no-img-element */
"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getAllPosts } from "../lib/api";
import { BlogPost } from "@/lib/types";
import Loader from "@/components/Loading";
import Pagination from "@/components/Pagination";
import VoteButtons from "@/components/VoteButtons";

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const searchParams = useSearchParams();
  const router = useRouter();

  const searchQuery = searchParams.get("search") ?? "";
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? parseInt(pageParam) : 1;

  useEffect(() => {
    const fetchPosts = async (page: number) => {
      try {
        const { posts, pagination } = await getAllPosts(page, searchQuery);
        setPosts(posts);
        setTotalPages(pagination.pageCount);
      } catch (error) {
        setError("Error fetching posts.");
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts(currentPage);
  }, [currentPage, searchQuery]);

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("page", newPage.toString());
    router.push(`?${newParams.toString()}`);
    setLoading(true);
  };

  return (
    <div className="max-w-screen-lg mx-auto p-4">
      {loading && (
        <div className="w-full flex items-center justify-center">
          <Loader />
        </div>
      )}
      {error && <p>{error}</p>}

      {!loading && !error && (
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
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-purple-400 text-sm inline-block font-medium hover:underline">
                          Read More
                        </p>
                        <VoteButtons blogId={post.id} />
                      </div>
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No posts available at the moment.</p>
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
