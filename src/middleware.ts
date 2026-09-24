import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Route -> roles allowed to access it. Anything not listed here that still
// matches the `matcher` below just needs *any* signed-in user.
const ROLE_RULES: { prefix: string; roles: string[] }[] = [
  { prefix: "/organizer", roles: ["ORGANIZER", "ADMIN"] },
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/scanner", roles: ["EVENT_STAFF", "ORGANIZER", "ADMIN"] },
];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    const rule = ROLE_RULES.find((r) => path.startsWith(r.prefix));
    if (rule && (!token || !rule.roles.includes(token.role as string))) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", path);
      url.searchParams.set("error", "You don't have access to that area.");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      // We do our own role check above; this just requires *a* session for
      // every matched route (dashboard, tickets, organizer, admin, scanner).
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/tickets/:path*", "/organizer/:path*", "/admin/:path*", "/scanner/:path*"],
};
