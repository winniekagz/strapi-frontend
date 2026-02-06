// app/write/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import slugify from "react-slugify";
import MarkdownEditor from "@uiw/react-markdown-editor";
import Image from "next/image";
import { createPost, uploadImage, getAllCategories } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

type CategoryOption = { id: number; documentId: string; name: string };

const WritePost = () => {
  const [markdownContent, setMarkdownContent] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, token, loading } = useAuth();

  useEffect(() => {
    getAllCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  // Role is read from user.role (name or type). Check both and use case-insensitive match
  const roleName = String(user?.role?.name ?? "").toLowerCase();
  const roleType = String(user?.role?.type ?? "").toLowerCase();
  const isEditor =
    roleName === "editor" ||
    roleName === "admin" ||
    roleType === "editor" ||
    roleType === "admin" ||
    roleType === "wditor"; // Strapi sometimes has typo "wditor" for editor

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedImage = e.target.files[0];
      setCoverImage(selectedImage);
      setImagePreview(URL.createObjectURL(selectedImage));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const postSlug = slugify(title);
      const postData = {
        title,
        description,
        slug: postSlug,
        content: markdownContent,
        ...(selectedCategoryIds.length > 0 && { categories: selectedCategoryIds }),
      };

      const postResponse = await createPost(postData, token || undefined) as { id?: number; documentId?: string };
      const postId = postResponse?.id;
      const postDocumentId = postResponse?.documentId;

      if (coverImage && postId != null) {
        await uploadImage(coverImage, postId, token || undefined);
      }

      const routeParam = postDocumentId || postSlug || postId;
      router.push(`/blogs/${routeParam}`);
      toast.success("Post created successfully");
    } catch {
      setError("Failed to create post. Please try again.");
      toast.error("Failed to create post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return null;

  if (!user) return null;

  if (!isEditor) {
    return (
      <div className="max-w-screen-md mx-auto p-4 mt-20 text-center">
        <h1 className="text-2xl font-bold text-red-400 mb-4 font-jet-brains">
          Access Denied
        </h1>
        <p className="text-gray-400">
          You need an Editor role to create posts.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-md mx-auto p-4">
      <button
        onClick={() => router.back()}
        className="text-purple-400 hover:text-purple-500 mb-6 flex items-center space-x-2"
      >
        <FaArrowLeft /> <span>Back</span>
      </button>

      <h1 className="text-xl font-bold mb-4 text-gray-100 font-jet-brains">
        Create New Post
      </h1>
      {error && (
        <div className="mb-4 p-3 bg-red-600 text-white rounded-md">{error}</div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter a Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 font-jet-brains text-3xl font-semibold bg-[#161b22] text-gray-100 border-b border-gray-600 focus:border-purple-500 focus:outline-none placeholder-gray-400"
        />
      </div>
      <div className="mb-4">
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 font-jet-brains bg-[#161b22] font-semibold text-gray-100 border-b border-gray-600 focus:border-purple-500 focus:outline-none placeholder-gray-400"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-300 text-sm font-medium mb-2">Category</label>
        <select
          multiple
          value={selectedCategoryIds}
          onChange={(e) => {
            const opts = Array.from(e.target.selectedOptions, (o) => o.value);
            setSelectedCategoryIds(opts);
          }}
          className="w-full p-2 font-jet-brains bg-[#161b22] text-gray-100 border border-gray-600 focus:border-purple-500 focus:outline-none"
        >
          {categories.map((cat) => (
            <option key={cat.documentId} value={cat.documentId}>
              {cat.name}
            </option>
          ))}
        </select>
        <p className="text-gray-500 text-xs mt-1">Hold Ctrl/Cmd to select multiple</p>
      </div>
      <div className="mb-6">
        <label className="block text-gray-300 text-sm font-medium mb-2">Cover image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full bg-[#161b22] text-gray-100"
        />
        {imagePreview && (
          <div className="mt-4">
            <Image
              src={imagePreview}
              alt="Selected Cover"
              width="100"
              height="100"
              className="w-full h-auto rounded-md"
            />
          </div>
        )}
      </div>

      <div className="mb-6">
        <MarkdownEditor
          value={markdownContent}
          height="200px"
          onChange={(value) => setMarkdownContent(value)}
          className="bg-[#161b22] text-gray-100"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || (!title && !description)}
        className="bg-purple-600 text-gray-100 py-2 px-4 rounded-md hover:bg-purple-500"
      >
        {isLoading ? "Loading" : "Post"}
      </button>
    </div>
  );
};

export default WritePost;
