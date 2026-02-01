// middleware.ts - Route protection middleware
// Place this file in the root of your project (same level as app/)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware runs on every request before the page renders
 * Use this for automatic route protection
 */
export function middleware(request: NextRequest) {
  // Get the token from cookies
  const token = request.cookies.get("auth-token")?.value;

  // Define protected routes
  const protectedRoutes = ["/dashboard", "/admin", "/create-post"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow the request to continue
  return NextResponse.next();
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/create-post/:path*",
    // Add more protected routes here
  ],
};
