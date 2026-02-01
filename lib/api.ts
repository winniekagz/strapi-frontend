// lib/api.ts
import axios, { AxiosInstance } from "axios";
import { UserBlogPostData, BlogPost } from "./types";

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

// Upload image with correct structure for referencing in the blog
export const uploadImage = async (image: File, refId: number) => {
  try {
    const formData = new FormData();
    formData.append("files", image);
    formData.append("ref", "api::blog.blog"); 
    formData.append("refId", refId.toString());
    formData.append("field", "cover"); 

    const response = await api.post("api/upload", formData); 
    const uploadedImage = response.data[0];
    return uploadedImage; 
  } catch (err) {
    console.error("Error uploading image:", err);
    throw err;
  }
};

// Create a blog post and handle all fields
export const createPost = async (postData: UserBlogPostData) => {
  try {
    const reqData = { data: { ...postData } }; // Strapi required format to post data
    const response = await api.post("api/blogs", reqData);
    return response.data.data;
  } catch (error) {
    console.error("Error creating post:", error);
    throw new Error("Failed to create post");
  }
};
