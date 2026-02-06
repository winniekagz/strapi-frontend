import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const strapiRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await strapiRes.json();
    if (!strapiRes.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Login failed" },
        { status: strapiRes.status }
      );
    }

    let user = data.user;
    try {
      const userRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/me?populate=role`, {
        headers: { Authorization: `Bearer ${data.jwt}` },
      });
      if (userRes.ok) {
        const meUser = await userRes.json();
        user = meUser;
      } else {
        if (!user.role) {
          user.role = data.user?.role || { type: 'authenticated', name: 'Authenticated' };
        }
      }
    } catch {
      if (!user.role) {
        user.role = data.user?.role || { type: 'authenticated', name: 'Authenticated' };
      }
    }

    const response = NextResponse.json({ user, token: data.jwt });
    response.cookies.set("auth-token", data.jwt, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
