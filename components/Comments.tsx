"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCommentsByBlog, postComment } from "@/lib/api";
import { Comment } from "@/lib/types";
import Link from "next/link";
import moment from "moment";
import { toast } from "react-hot-toast";

interface CommentsProps {
  blogId: number;
}

// Normalize comment from Strapi (handles flat, attributes, and author vs user)
function normalizeComment(c: any): Comment {
  if (!c) return c;
  const attrs = c.attributes ?? c;
  const authorData = attrs.author?.data?.attributes ?? attrs.author ?? attrs.user?.data?.attributes ?? attrs.user;
  const user = authorData && typeof authorData === "object"
    ? {
        id: authorData.id ?? (attrs.author?.data?.id ?? attrs.user?.data?.id),
        username: authorData.username ?? authorData.name ?? "User",
        email: authorData.email ?? "",
        role: authorData.role ?? { name: "User", type: "authenticated" },
      }
    : { id: 0, username: "User", email: "", role: { name: "User", type: "authenticated" } };
  return {
    id: c.id ?? attrs.id,
    content: attrs.content ?? c.content,
    blog: attrs.blog ?? c.blog,
    user,
    isApproved: attrs.isApproved ?? c.isApproved ?? true,
    createdAt: attrs.createdAt ?? c.createdAt,
  };
}

const Comments = ({ blogId }: CommentsProps) => {
  const { user, token, loading } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setFetchError(null);
      const data = await getCommentsByBlog(blogId, token ?? undefined);
      const list = Array.isArray(data) ? data : (data as any)?.data ?? [];
      setComments(list.map(normalizeComment));
    } catch (e) {
      setFetchError("Could not load comments.");
      setComments([]);
    }
  }, [blogId, token]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!content.trim() || !token) return;
    setSubmitting(true);
    try {
      await postComment(blogId, content, token);
      setContent("");
      toast.success("Your comment is awaiting moderation");
      await fetchComments();
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-10 border-t border-gray-700 pt-6" aria-label="Comments">
      <h3 className="text-xl font-bold text-white mb-4 font-jet-brains">Comments</h3>

      {fetchError && (
        <p className="text-amber-500 text-sm mb-4">{fetchError}</p>
      )}

      {comments.length === 0 && !fetchError && (
        <p className="text-gray-400 mb-4">No comments yet. Be the first to comment.</p>
      )}

      <div className="space-y-4 mb-6">
        {comments.map((comment) => (
          <article key={comment.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-purple-400 text-sm font-medium">
                {comment.user?.username || comment.user?.email || "Anonymous"}
              </span>
              <time className="text-gray-500 text-xs" dateTime={comment.createdAt}>
                {moment(comment.createdAt).fromNow()}
              </time>
            </div>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{comment.content}</p>
          </article>
        ))}
      </div>

      {!loading && user && token ? (
        <div className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className="w-full p-3 bg-gray-800 text-white rounded-md border border-gray-700 focus:border-purple-500 focus:outline-none resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-500 disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      ) : (
        <p className="text-gray-400">
          <Link href="/login" className="text-purple-400 hover:underline">
            Login to comment
          </Link>
        </p>
      )}
    </section>
  );
};

export default Comments;
