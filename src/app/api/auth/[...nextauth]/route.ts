console.log("GOOGLE ID IS:", process.env.GOOGLE_ID ? "Found it!" : "MISSING!");
console.log("GOOGLE SECRET IS:", process.env.GOOGLE_SECRET ? "Found it!" : "MISSING!");
import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      allowDangerousEmailAccountLinking: true
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: '/login', // <--- THIS IS THE MAGIC LINE
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }: any) {
      if (account) {
        token.provider = account.provider
      }
      // If they logged in with GitHub, grab their exact username (login)
      if (account?.provider === "github" && profile) {
        token.githubHandle = profile.login
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.provider = token.provider
        session.user.githubHandle = token.githubHandle
      }
      return session
    }
  }
})



export { handler as GET, handler as POST }