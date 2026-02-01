"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCommentsByBlog, postComment } from "@/lib/api";
import { Comment } from "@/lib/types";
import Link from "next/link";
import moment from "moment";
import { toast } from "react-hot-toast";

interface CommentsProps {
  blogId: number;
}

const Comments = ({ blogId }: CommentsProps) => {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await getCommentsByBlog(blogId);
        setComments(data);
      } catch {
        // silently fail
      }
    };
    fetchComments();
  }, [blogId]);

  const handleSubmit = async () => {
    if (!content.trim() || !token) return;
    setSubmitting(true);
    try {
      await postComment(blogId, content, token);
      setContent("");
      toast.success("Your comment is awaiting moderation");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-10 border-t border-gray-700 pt-6">
      <h3 className="text-xl font-bold text-white mb-4 font-jet-brains">Comments</h3>

      {comments.length === 0 && (
        <p className="text-gray-400 mb-4">No comments yet.</p>
      )}

      <div className="space-y-4 mb-6">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-800 rounded-md p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-purple-400 text-sm font-medium">
                {comment.user?.username || "Anonymous"}
              </span>
              <span className="text-gray-500 text-xs">
                {moment(comment.createdAt).fromNow()}
              </span>
            </div>
            <p className="text-gray-300 text-sm">{comment.content}</p>
          </div>
        ))}
      </div>

      {user ? (
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
    </div>
  );
};

export default Comments;
