import NextAuth from "next-auth";
import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Apple({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      checks: [],
    }),
    Credentials({
      id: "mobile-token",
      name: "mobile-token",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const token = credentials?.token;
        if (typeof token !== "string") return null;

        const mobileToken = await prisma.mobileAuthToken.findUnique({
          where: { token },
          include: {
            user: { select: { id: true, email: true, name: true, image: true, role: true } },
          },
        });

        if (!mobileToken || mobileToken.expiresAt < new Date()) {
          if (mobileToken) await prisma.mobileAuthToken.delete({ where: { token } });
          return null;
        }

        await prisma.mobileAuthToken.delete({ where: { token } });
        return {
          id: mobileToken.user.id,
          email: mobileToken.user.email,
          name: mobileToken.user.name,
          image: mobileToken.user.image,
          role: mobileToken.user.role,
        };
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            hashedPassword: true,
            role: true,
          },
        });

        if (!user) {
          throw new Error("No account found with this email");
        }

        if (!user.hashedPassword) {
          throw new Error("Please sign in with Google");
        }

        const isValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/profile",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "user";
      }

      // Re-fetch from DB on first load, session update, or when onboarding not yet completed
      const needsFetch = !token.role || token.plan === undefined || trigger === "update" || token.hasCompletedOnboarding === false || token.hasCompletedOnboarding === undefined;
      if (token.id && needsFetch) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, plan: true, subscriptionStatus: true, hasCompletedOnboarding: true },
        });
        if (!token.role) token.role = dbUser?.role ?? "user";
        token.plan = dbUser?.plan ?? null;
        token.subscriptionStatus = dbUser?.subscriptionStatus ?? null;
        token.hasCompletedOnboarding = dbUser?.hasCompletedOnboarding ?? true;
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.plan = (token.plan as string) ?? null;
      session.user.subscriptionStatus = (token.subscriptionStatus as string) ?? null;
      session.user.hasCompletedOnboarding = (token.hasCompletedOnboarding as boolean) ?? false;
      return session;
    },
  },
});
