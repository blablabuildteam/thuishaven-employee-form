import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isLogin = req.nextUrl.pathname === "/login";

  if (isDashboard && !req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLogin && req.auth) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/login"],
};
