// app/blogs/[slug]/page.tsx - SERVER COMPONENT EXAMPLE
// This is the converted version of your single blog page using Server Components

import { notFound } from "next/navigation";
import { getPostBySlug } from "../../../lib/api";
import { BlogPost } from "@/lib/types";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import moment from "moment";
import BackButton from "@/components/BackButton";
import CodeBlock from "@/components/CodeBlock";

// Server Component - async by default
// This component runs on the server and fetches data directly
export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  try {
    // Direct async data fetching on server - no useEffect, no useState
    const post = await getPostBySlug(slug);

    if (!post) {
      notFound(); // Next.js will show your 404 page
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

        {/* Markdown rendering - works in Server Components */}
        <Markdown
          className={"leading-[40px] max-w-screen-lg prose prose-invert"}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code({ inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              const codeString = String(children).replace(/\n$/, "");

              // Use Client Component for interactive code blocks
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

        {/* Client Component for back button interactivity */}
        <BackButton />
      </div>
    );
  } catch (error) {
    console.error("Error fetching post:", error);
    notFound();
  }
}

// Optional: Generate static params for better performance
// This pre-renders pages at build time
export async function generateStaticParams() {
  // You can fetch all slugs here if you want static generation
  // const { posts } = await getAllPosts(1, "");
  // return posts.map((post) => ({ slug: post.slug }));
  return [];
}
