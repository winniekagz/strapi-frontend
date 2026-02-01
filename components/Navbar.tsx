// src/components/Navbar.tsx
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { FaPen, FaSearch, FaTimes } from "react-icons/fa";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const { user, logout, loading } = useAuth();

  const isEditor =
    user?.role?.type === "editor" || user?.role?.type === "admin";

  const handleSearchSubmit = () => {
    const params = new URLSearchParams(searchParams);
    if (searchQuery) params.set("search", searchQuery);
    else params.delete("search");
    replace(`/?${params.toString()}`);
    setSearchOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    replace("/");
  };

  return (
    <div className="max-w-screen-lg mx-auto sticky top-0 bg-inherit py-3 sm:py-6 z-50  ">
      <nav className="flex justify-between items-center mb-2 p-4 ">
        <div className="flex items-center gap-4">
          <Link href="/">
            <h1 className="font-bold text-xl text-purple-600 font-jet-brains">
              DEV.BLOG
            </h1>
          </Link>
          <button
            onClick={() => setSearchOpen((prev) => !prev)}
            className="text-xl text-white hover:text-purple-400 transition-colors"
          >
            {searchOpen ? <FaTimes /> : <FaSearch />}
          </button>

          {searchOpen && (
            <div className="ml-4 flex items-center gap-2">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                defaultValue={searchParams.get("search")?.toString()}
                className="bg-gray-800 appearance-none placeholder:text-sm placeholder:font-normal text-sm text-white placeholder-gray-400 border-b-2 border-purple-500 focus:border-purple-300 outline-none px-2 py-1 rounded-md"
              />
              <button
                onClick={handleSearchSubmit}
                className="bg-purple-600 text-sm hover:bg-purple-500 text-white px-2 py-1 rounded-md transition-colors"
              >
                Search
              </button>
            </div>
          )}
        </div>

        <ul className="flex items-center gap-6 font-medium transition-colors font-jet-brains">
          <li
            className={
              pathname === "/"
                ? "text-purple-400"
                : "text-white hover:text-purple-400"
            }
          >
            <Link href="/">Blogs</Link>
          </li>

          {isEditor && (
            <li
              className={
                pathname === "/write"
                  ? "text-purple-400"
                  : "text-white hover:text-purple-400"
              }
            >
              <Link href="/write">
                <FaPen className="hover:text-purple-400" />
              </Link>
            </li>
          )}

          {!loading && (
            <>
              {user ? (
                <>
                  <li className="text-gray-300 text-sm">{user.username}</li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="text-white hover:text-purple-400 text-sm"
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <li
                  className={
                    pathname === "/login"
                      ? "text-purple-400"
                      : "text-white hover:text-purple-400"
                  }
                >
                  <Link href="/login">Login</Link>
                </li>
              )}
            </>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default Navbar;
