// lib/types.ts
// export Interface for Image Data
export interface ImageData {
  url: string;
}

// export Interface for Author Data
export interface Author {
  id: number; // Assuming each author has a unique ID
  name: string;
  email: string;
  avatar: ImageData; // Assuming the author has
}

// export Interface for Category Data
export interface Category {
  documentId: string; // Assuming each category has a unique ID
  name: string;
  description: string; // Optional description
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  description: string;
  content: string; // rich markdown text
  createdAt: string; // ISO date string
  cover: ImageData; // Assuming this is the structure of your featured image
  author: Author; // The author of the blog post
  categories: Category[]; // An array of categories associated with the post
}

export interface UserBlogPostData {
  title: string;
  slug: string;
  description: string;
  content: string; //  rich markdown text
}

// Example response structure when fetching posts
export interface BlogPostResponse {
  data: BlogPost[];
}

// Example response structure when fetching a single post
export interface SingleBlogPostResponse {
  data: BlogPost; // The single blog post object
}

export interface Comment {
  id: number;
  content: string;
  blog: BlogPost;
  user: User;
  isApproved: boolean;
  createdAt: string;
}

export interface Vote {
  id: number;
  blog: BlogPost;
  user: User;
  value: 1 | -1;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: { name: string; type: string };
}

export interface AuthResponse {
  jwt: string;
  user: User;
}