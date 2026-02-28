import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db, users } from "@/lib/db";
import { compare } from "bcryptjs";
import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const userResults = await db.select({
          id: users.id,
          email: users.email,
          name: users.name,
          passwordHash: users.passwordHash,
          role: users.role,
        })
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        const user = userResults[0];

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await compare(credentials.password, user.passwordHash);

        if (!isValid) {
          logger.warn("Failed login attempt", { email: credentials.email });
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
