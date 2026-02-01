// app/api/auth/login/route.ts - API Route for authentication
// This handles login requests and sets secure HTTP-only cookies

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Authenticate with Strapi
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/local`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Authentication failed" },
        { status: 401 }
      );
    }

    // Set HTTP-only cookie for security
    // HTTP-only cookies cannot be accessed by JavaScript, preventing XSS attacks
    const cookieStore = await cookies();
    cookieStore.set("auth-token", data.jwt, {
      httpOnly: true, // Prevents JavaScript access
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax", // CSRF protection
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/", // Available site-wide
    });

    return NextResponse.json({
      user: data.user,
      token: data.jwt,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Optional: Logout route
// app/api/auth/logout/route.ts
/*
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
  
  return NextResponse.json({ message: "Logged out successfully" });
}
*/
