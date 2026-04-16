import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("operator_session");

  // Protect all routes under /dashboard
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!sessionCookie) {
      // Redirect to login if cookie is missing
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Redirect from login root to dashboard if already authenticated
  if (request.nextUrl.pathname === "/") {
      if (sessionCookie) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
      }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
