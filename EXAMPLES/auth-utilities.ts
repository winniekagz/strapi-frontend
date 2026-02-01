// lib/auth.ts - Authentication utilities for Server Components
// Copy this file to your lib directory

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Get the current user session from cookies
 * Returns null if not authenticated
 */
export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  // Verify token with Strapi
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Cache control - don't cache auth requests
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    return { user, token };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this in protected Server Components
 */
export async function requireAuth() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Optional: Get user role/permissions
 */
export async function getUserRole() {
  const session = await getServerSession();
  return session?.user?.role?.type || null;
}

/**
 * Check if user has specific role
 */
export async function hasRole(requiredRole: string) {
  const role = await getUserRole();
  return role === requiredRole;
}
