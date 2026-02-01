// app/blogs/[slug]/page.tsx
"use client";
import { useEffect, useState, use } from "react";
import { getPostBySlug } from "../../../lib/api";
import { useRouter } from "next/navigation";
import { BlogPost } from "@/lib/types";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { FaClipboard } from "react-icons/fa";
import Loader from "@/components/Loading";
import moment from "moment";
import { toast } from "react-hot-toast";
import Comments from "@/components/Comments";
import VoteButtons from "@/components/VoteButtons";

const handleCopyCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy code: ", err);
  }
};

const BlogPostPage = ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = use(params);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPost = async () => {
      if (slug) {
        try {
          const fetchedPost = await getPostBySlug(slug);
          setPost(fetchedPost);
          setError(null);
        } catch (err: any) {
          if (err.message === "Post not found.") {
            setError("Post not found.");
          } else {
            setError("Error fetching post. Please try again later.");
          }
          console.error("Error fetching post:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setError("Invalid blog post URL.");
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading)
    return (
      <div className="max-w-screen-md mx-auto flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );

  if (error) {
    return (
      <div className="max-w-screen-md mx-auto p-4">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="text-purple-400 hover:underline"
          >
            &larr; Back to Blogs
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-screen-md mx-auto p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-300 mb-2">Post Not Found</h2>
          <p className="text-gray-400 mb-4">The blog post you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.back()}
            className="text-purple-400 hover:underline"
          >
            &larr; Back to Blogs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-md mx-auto p-4">
      <h1 className="text-4xl leading-[60px] capitalize text-center font-bold text-purple-800 font-jet-brains">
        {post.title}
      </h1>
      <div className="w-full flex items-center justify-center gap-4 font-light">
        <span>Published: {moment(post.createdAt).fromNow()}</span>
        <VoteButtons blogId={post.id} />
      </div>

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
      <div className="leading-[40px] max-w-screen-lg prose prose-invert">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            return !inline && match ? (
              <div className="relative">
                <button
                  onClick={() => handleCopyCode(codeString)}
                  className="absolute top-2 right-2 bg-gray-700 text-white p-1 rounded-md hover:bg-gray-600"
                  title="Copy to clipboard"
                >
                  <FaClipboard color="#fff" />
                </button>
                <SyntaxHighlighter
                  style={dracula}
                  PreTag="div"
                  language={match[1]}
                  {...props}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
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
      </div>
      <button
        onClick={() => router.back()}
        className="text-purple-800 mt-4 inline-block hover:underline"
      >
        Back to Blogs
      </button>

      <Comments blogId={post.id} />
    </div>
  );
};

export default BlogPostPage;
