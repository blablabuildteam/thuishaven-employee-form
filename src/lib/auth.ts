import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { findHRUser } from "./hr-users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = findHRUser(
          credentials.email as string,
          credentials.password as string,
        );
        if (!user) return null;

        return {
          id: user.email,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = (token.role as string) ?? "HR";
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
});
