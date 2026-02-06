import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const strapiUrl = `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/me?populate=role`;
    const res = await fetch(strapiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      if (res.status === 403) {
        return NextResponse.json(
          { 
            error: "Permission denied", 
            details: "Strapi permissions not configured. See FIX_STRAPI_PERMISSIONS.md" 
          }, 
          { status: 403 }
        );
      }
      
      // If 401, token is invalid or expired
      return NextResponse.json(
        { 
          error: "Invalid or expired token",
          details: errorData 
        }, 
        { status: 401 }
      );
    }

    let user = await res.json();
    // Strapi may return flat object or nested (data.attributes). Normalize so role is always { name, type }.
    if (user?.data?.attributes) {
      user = { id: user.data.id, ...user.data.attributes };
    }
    // Normalize role: Strapi v5 can return role as { data: { attributes: { name, type } } } or flat { name, type }
    const rawRole = user?.role;
    let name: string | undefined;
    let type: string | undefined;
    if (rawRole && typeof rawRole === 'object') {
      const attrs = rawRole.data?.attributes ?? rawRole;
      name = attrs.name ?? rawRole.name;
      type = attrs.type ?? rawRole.type;
    }
    user.role = { name: name ?? 'Authenticated', type: type ?? 'authenticated' };
    return NextResponse.json({ user, token });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
