// lib/api.ts
import axios, { AxiosInstance } from "axios";
import { UserBlogPostData, BlogPost, Comment, Vote } from "./types";

export const api: AxiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_STRAPI_URL}`,
});

// Helper function to normalize Strapi v4 response structure
const normalizePost = (post: any): BlogPost => {
  // If post has attributes wrapper (Strapi v4 structure), flatten it
  if (post.attributes) {
    return {
      id: post.id,
      ...post.attributes,
    } as BlogPost;
  }
  // If already flattened, return as is
  return post as BlogPost;
};

export const getAllPosts = async (
  page: number = 1,
  searchQuery: string = ""
) => {
  try {
    // If search query exists, filter posts based on title
    const searchFilter = searchQuery
      ? `&filters[title][$containsi]=${searchQuery}`
      : ""; // Search filter with the title
    // Fetch posts with pagination and populate the required fields
    const response = await api.get(
      `api/blogs?populate=*&pagination[page]=${page}&pagination[pageSize]=${process.env.NEXT_PUBLIC_PAGE_LIMIT}${searchFilter}`
    );
    
    // Normalize posts to ensure consistent structure
    const normalizedPosts = (response.data.data || []).map(normalizePost);
    
    return {
      posts: normalizedPosts,
      pagination: response.data.meta?.pagination || { page: 1, pageCount: 1, pageSize: 10, total: 0 }, // Return data and include pagination data
    };
  } catch (error) {
    console.error("Error fetching blogs:", error);
    throw new Error("Server error"); // Error handling
  }
};

// Get post by slug
export const getPostBySlug = async (slug: string) => {
  try {
    const response = await api.get(
      `api/blogs?filters[slug][$eq]=${slug}&populate=*`
    ); 
    if (response.data.data && response.data.data.length > 0) {
      // Normalize the post to ensure consistent structure
      return normalizePost(response.data.data[0]);
    }
    throw new Error("Post not found.");
  } catch (error: any) {
    console.error("Error fetching post:", error);
    // If it's a "Post not found" error, re-throw it
    if (error.message === "Post not found.") {
      throw error;
    }
    throw new Error("Server error");
  }
};

// Get all posts categories
export const getAllCategories = async () => {
  try {
    const response = await api.get("api/categories"); // Route to fetch Categories data
    return response.data.data; // Return all categories
  } catch (error) {
    console.error("Error fetching post:", error);
    throw new Error("Server error");
  }
};

// Comments
export const getCommentsByBlog = async (blogId: number): Promise<Comment[]> => {
  try {
    const response = await api.get(
      `api/comments?filters[blog][id][$eq]=${blogId}&filters[isApproved][$eq]=true&populate=user&sort=createdAt:desc`
    );
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
};

export const postComment = async (blogId: number, content: string, token: string) => {
  const response = await api.post(
    "api/comments",
    { data: { content, blog: blogId } },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.data;
};

// Votes
export const getVotesByBlog = async (blogId: number): Promise<Vote[]> => {
  try {
    const response = await api.get(
      `api/votes?filters[blog][id][$eq]=${blogId}`
    );
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching votes:", error);
    return [];
  }
};

export const getUserVote = async (blogId: number, userId: number, token: string) => {
  try {
    const response = await api.get(
      `api/votes?filters[blog][id][$eq]=${blogId}&filters[user][id][$eq]=${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const votes = response.data.data;
    return votes && votes.length > 0 ? { id: votes[0].id, value: votes[0].value } : null;
  } catch {
    return null;
  }
};

export const castVote = async (blogId: number, value: 1 | -1, token: string) => {
  const response = await api.post(
    "api/votes",
    { data: { blog: blogId, value } },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.data;
};

export const updateVote = async (voteId: number, value: 1 | -1, token: string) => {
  const response = await api.put(
    `api/votes/${voteId}`,
    { data: { value } },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.data;
};

export const deleteVote = async (voteId: number, token: string) => {
  await api.delete(`api/votes/${voteId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Upload image with correct structure for referencing in the blog
export const uploadImage = async (image: File, refId: number, token?: string) => {
  try {
    const formData = new FormData();
    formData.append("files", image);
    formData.append("ref", "api::blog.blog"); 
    formData.append("refId", refId.toString());
    formData.append("field", "cover"); 

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await api.post("api/upload", formData, { headers });
    const uploadedImage = response.data[0];
    return uploadedImage; 
  } catch (err) {
    console.error("Error uploading image:", err);
    throw err;
  }
};

// Create a blog post and handle all fields
export const createPost = async (postData: UserBlogPostData, token?: string) => {
  try {
    const reqData = { data: { ...postData } };
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await api.post("api/blogs", reqData, { headers });
    return response.data.data;
  } catch (error) {
    console.error("Error creating post:", error);
    throw new Error("Failed to create post");
  }
};
