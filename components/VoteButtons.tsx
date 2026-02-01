"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getVotesByBlog, getUserVote, castVote, updateVote, deleteVote } from "@/lib/api";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { toast } from "react-hot-toast";

interface VoteButtonsProps {
  blogId: number;
}

const VoteButtons = ({ blogId }: VoteButtonsProps) => {
  const { user, token } = useAuth();
  const [score, setScore] = useState(0);
  const [userVote, setUserVote] = useState<{ id: number; value: 1 | -1 } | null>(null);

  const fetchVotes = useCallback(async () => {
    try {
      const votes = await getVotesByBlog(blogId);
      const total = votes.reduce((sum: number, v: any) => sum + v.value, 0);
      setScore(total);
    } catch {
      // ignore
    }
  }, [blogId]);

  const fetchUserVote = useCallback(async () => {
    if (!user || !token) return;
    try {
      const vote = await getUserVote(blogId, user.id, token);
      setUserVote(vote);
    } catch {
      // ignore
    }
  }, [blogId, user, token]);

  useEffect(() => {
    fetchVotes();
    fetchUserVote();
  }, [fetchVotes, fetchUserVote]);

  const handleVote = async (value: 1 | -1) => {
    if (!user || !token) {
      toast.error("Login to vote");
      return;
    }

    try {
      if (userVote && userVote.value === value) {
        // Remove vote
        await deleteVote(userVote.id, token);
        setUserVote(null);
        setScore((prev) => prev - value);
      } else if (userVote) {
        // Change vote
        await updateVote(userVote.id, value, token);
        setScore((prev) => prev - userVote.value + value);
        setUserVote({ ...userVote, value });
      } else {
        // New vote
        const newVote = await castVote(blogId, value, token);
        setUserVote({ id: newVote.id, value });
        setScore((prev) => prev + value);
      }
    } catch {
      toast.error("Failed to vote");
    }
  };

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
      <button
        onClick={(e) => { e.preventDefault(); handleVote(1); }}
        className={`p-1 rounded hover:text-purple-400 transition-colors ${
          userVote?.value === 1 ? "text-purple-400" : "text-gray-400"
        }`}
      >
        <FaArrowUp size={14} />
      </button>
      <span className="text-sm font-medium text-white min-w-[20px] text-center">{score}</span>
      <button
        onClick={(e) => { e.preventDefault(); handleVote(-1); }}
        className={`p-1 rounded hover:text-red-400 transition-colors ${
          userVote?.value === -1 ? "text-red-400" : "text-gray-400"
        }`}
      >
        <FaArrowDown size={14} />
      </button>
    </div>
  );
};

export default VoteButtons;
