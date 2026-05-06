import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: {
    strategy: "database"
  },
  callbacks: {
    signIn({ account, profile }) {
      if (account?.provider !== "google") {
        return true;
      }

      return Boolean(
        profile?.email &&
          "email_verified" in profile &&
          profile.email_verified === true
      );
    },
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }

      return session;
    }
  }
});
