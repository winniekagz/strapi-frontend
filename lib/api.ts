// lib/api.ts
import axios, { AxiosInstance } from "axios";
import slugify from "react-slugify";
import { UserBlogPostData, BlogPost, Comment, Vote } from "./types";

export const api: AxiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_STRAPI_URL}`,
});

// Normalize Strapi v4/v5 post response (flat or attributes wrapper)
const normalizePost = (post: any): BlogPost => {
  let normalized: any = post.attributes
    ? { id: post.id, documentId: post.documentId, ...post.attributes }
    : { ...post, documentId: post.documentId };

  if (Array.isArray(normalized.cover) && normalized.cover.length > 0) {
    normalized.cover = normalized.cover[0];
  }
  if (!normalized.slug && normalized.title) {
    normalized.slug = slugify(normalized.title);
  }
  const rawContent = normalized.content;
  if (rawContent != null && typeof rawContent === "object" && !Array.isArray(rawContent) && rawContent.type === "doc" && Array.isArray(rawContent.content)) {
    normalized.content = rawContent.content;
  }
  return normalized as BlogPost;
};

export const getAllPosts = async (
  page: number = 1,
  searchQuery: string = ""
) => {
  try {
    const searchFilter = searchQuery ? `&filters[title][$containsi]=${searchQuery}` : "";
    const response = await api.get(
      `api/blogs?populate=*&pagination[page]=${page}&pagination[pageSize]=${process.env.NEXT_PUBLIC_PAGE_LIMIT}${searchFilter}`
    );
    const normalizedPosts = (response.data.data || []).map(normalizePost);
    return {
      posts: normalizedPosts,
      pagination: response.data.meta?.pagination || { page: 1, pageCount: 1, pageSize: 10, total: 0 },
    };
  } catch (error) {
    throw new Error("Server error");
  }
};

// Get post by documentId, slug, or ID (documentId preferred for Strapi v5)
export const getPostBySlug = async (slugOrId: string) => {
  try {
    if (slugOrId !== "null" && /^[a-z0-9]+$/.test(slugOrId) && !/^\d+$/.test(slugOrId)) {
      const res = await api.get(`api/blogs?filters[documentId][$eq]=${slugOrId}&populate=*`);
      if (res.data?.data?.length > 0) return normalizePost(res.data.data[0]);
    }
    if (slugOrId !== "null" && !/^\d+$/.test(slugOrId)) {
      const res = await api.get(`api/blogs?filters[slug][$eq]=${slugOrId}&populate=*`);
      if (res.data?.data?.length > 0) return normalizePost(res.data.data[0]);
    }
    if (/^\d+$/.test(slugOrId)) {
      const res = await api.get(`api/blogs?filters[id][$eq]=${slugOrId}&populate=*`);
      if (res.data?.data?.length > 0) return normalizePost(res.data.data[0]);
    }
    throw new Error("Post not found.");
  } catch (error: any) {
    if (error.message === "Post not found.") throw error;
    throw new Error("Server error");
  }
};

// Get all categories (normalized for Strapi v4/v5: { id, documentId, name })
export const getAllCategories = async (): Promise<{ id: number; documentId: string; name: string }[]> => {
  try {
    const response = await api.get("api/categories");
    const raw = response.data?.data ?? response.data ?? [];
    const list = Array.isArray(raw) ? raw : [raw];
    return list.map((c: any) => {
      const attrs = c?.attributes ?? c;
      return {
        id: c?.id ?? attrs?.id,
        documentId: c?.documentId ?? attrs?.documentId ?? String(c?.id ?? attrs?.id),
        name: attrs?.name ?? c?.name ?? "",
      };
    });
  } catch {
    throw new Error("Server error");
  }
};

export const getCommentsByBlog = async (blogId: number, token?: string | null): Promise<Comment[]> => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get(
      `api/comments?filters[blog][id][$eq]=${blogId}&populate=author&sort=createdAt:desc`,
      { headers }
    );
    return response.data.data || [];
  } catch {
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

// Votes – normalize Strapi v4 (flat) vs v5 (attributes) so .value is always available
const normalizeVote = (raw: any): { id: number; value: 1 | -1 } => {
  const attrs = raw?.attributes ?? raw;
  const id = raw?.id ?? attrs?.id;
  const value = attrs?.value ?? raw?.value;
  return { id, value: value === -1 ? -1 : 1 };
};

// Votes (pass token when user is logged in so Strapi uses Authenticated role; otherwise Public)
export const getVotesByBlog = async (blogId: number, token?: string | null): Promise<{ id: number; value: 1 | -1 }[]> => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get(
      `api/votes?filters[blog][id][$eq]=${blogId}`,
      { headers }
    );
    const raw = response.data?.data ?? response.data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    return list.map(normalizeVote);
  } catch {
    return [];
  }
};

export const getUserVote = async (blogId: number, userId: number, token: string) => {
  try {
    const response = await api.get(
      `api/votes?filters[blog][id][$eq]=${blogId}&filters[users_permissions_user][id][$eq]=${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const raw = response.data?.data ?? response.data ?? [];
    const votes = Array.isArray(raw) ? raw : [];
    if (votes.length === 0) return null;
    return normalizeVote(votes[0]);
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
  const data = response.data?.data ?? response.data;
  return normalizeVote(data);
};

export const updateVote = async (voteId: number, value: 1 | -1, token: string) => {
  const response = await api.put(
    `api/votes/${voteId}`,
    { data: { value } },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = response.data?.data ?? response.data;
  return normalizeVote(data);
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
    throw err;
  }
};

// Convert plain/markdown string to Strapi Rich text (Blocks) so content is not stored as null
const stringToStrapiBlocks = (str: string): { type: string; children: { type: string; text: string }[] }[] => {
  if (str == null || typeof str !== "string") return [];
  return str
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((paragraph) => ({
      type: "paragraph",
      children: [{ type: "text", text: paragraph.replace(/\n/g, " ") }],
    }));
};

export const createPost = async (postData: UserBlogPostData, token?: string) => {
  try {
    // Strapi Blog: content = Blocks array; categories = relation by documentId (v5)
    const payload: Record<string, unknown> = {
      title: postData.title,
      description: postData.description,
      slug: postData.slug,
    };
    // Rich text (Blocks) – array of blocks so Strapi doesn't store null
    payload.content =
      typeof postData.content === "string"
        ? stringToStrapiBlocks(postData.content)
        : (postData as any).content;
    // Categories: Strapi v5 expects documentIds, e.g. { set: ["docId1", ...] } or array
    if (postData.categories?.length) {
      payload.categories = { set: postData.categories };
    }
    const reqData = { data: payload };
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await api.post("api/blogs", reqData, { headers });
    return response.data?.data ?? response.data;
  } catch (error: any) {
    const status = error.response?.status;
    const errorData = error.response?.data;
    if (status === 401) {
      throw new Error("Unauthorized - Please log in to create posts");
    }
    if (status === 403) {
      throw new Error("Forbidden - You don't have permission to create posts. Check your role in Strapi.");
    }
    if (status === 400) {
      throw new Error(`Bad Request: ${errorData?.error?.message || JSON.stringify(errorData)}`);
    }
    throw new Error(error.message || "Failed to create post");
  }
}
