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

    // Fetch user with role populated
    const userRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${data.jwt}` },
    });
    const user = await userRes.json();

    const response = NextResponse.json({ user, token: data.jwt });
    response.cookies.set("auth-token", data.jwt, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
