import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

// 1. Tell TypeScript that our Session User will now have a 'provider' string
declare module "next-auth" {
  interface Session {
    user: {
      provider?: string
      githubHandle?: string
    } & DefaultSession["user"]
  }
}

// 2. Tell TypeScript that our Token will now have a 'provider' string
declare module "next-auth/jwt" {
  interface JWT {
    provider?: string
  }
}