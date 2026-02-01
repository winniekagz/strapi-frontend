import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await res.json();
    return NextResponse.json({ user, token });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
