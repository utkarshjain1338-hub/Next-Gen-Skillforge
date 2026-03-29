// src/proxy.ts
import nextAuthMiddleware from "next-auth/middleware"

// Exporting it as the default proxy function for Next.js 16
export default nextAuthMiddleware

export const config = {
  // The proxy ignores the home page (/) and static/api files, but protects everything else
  matcher: ["/((?!$|login|api|_next/static|_next/image|favicon.ico).*)"],
}