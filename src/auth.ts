import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword, isAccountLocked, LOCKOUT_THRESHOLD, LOCKOUT_DURATION_MINUTES } from "@/lib/auth-utils";

const AUTH_SECRET_FALLBACK = "kR3vX9mP2wQ7nL5jF8hT4bY6cA1dE0gS3iU7oW2xZ";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || AUTH_SECRET_FALLBACK,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!username || !password) {
          return null;
        }

        try {
          // Look up user by username
          const user = await prisma.user.findFirst({
            where: { username },
          });

          if (!user) {
            return null;
          }

          // Check if account is locked
          if (isAccountLocked(user.lockedUntil)) {
            return null;
          }

          // Verify password
          const passwordValid = await verifyPassword(password, user.passwordHash);

          if (!passwordValid) {
            // Increment failed login attempts
            const newFailedAttempts = user.failedLoginAttempts + 1;
            let lockedUntil = user.lockedUntil;

            if (newFailedAttempts >= LOCKOUT_THRESHOLD) {
              lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
            }

            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: newFailedAttempts,
                lockedUntil,
              },
            });

            return null;
          }

          // Reset failed login attempts on successful login
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: null,
            },
          });

          return {
            id: user.id,
            name: user.name || user.username,
            email: user.email,
            subscriptionTier: user.subscriptionTier,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.subscriptionTier = (user as { subscriptionTier?: string }).subscriptionTier;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { subscriptionTier?: string }).subscriptionTier = token.subscriptionTier as string | undefined;
      }
      return session;
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
});
