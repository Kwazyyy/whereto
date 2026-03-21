import NextAuth, { CredentialsSignin } from "next-auth";
import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateAppleSecret } from "@/lib/apple";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Apple({
      clientId: process.env.APPLE_ID!,
      clientSecret: generateAppleSecret(),
      authorization: {
        params: {
          scope: "name email",
          response_mode: "form_post",
          response_type: "code",
        },
      },
      profile(profile) {
        console.log("[Apple Provider] raw profile:", profile);
        return {
          id: profile.sub,
          name: profile.user?.name ? `${profile.user.name.firstName} ${profile.user.name.lastName}` : profile.email?.split("@")[0] || "Apple User",
          email: profile.email,
          image: null,
          role: "user",
        };
      },
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

        if (!user || !user.hashedPassword) {
          throw new CredentialsSignin("CredentialsSignin");
        }

        const isValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isValid) {
          throw new CredentialsSignin("CredentialsSignin");
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
    async signIn({ user, account, profile }) {
      try {
        console.log("[NextAuth signIn] provider:", account?.provider, "| userId:", user?.id, "| email:", user?.email);
        if (account?.provider === "apple") {
          console.log("[NextAuth signIn] apple profile:", JSON.stringify(profile));
          console.log("[NextAuth signIn] apple account:", JSON.stringify({
            type: account.type,
            providerAccountId: account.providerAccountId,
            id_token: account.id_token ? "present" : "missing",
            access_token: account.access_token ? "present" : "missing",
          }));
          if (!user?.email) {
            console.error("[NextAuth signIn] Apple sign-in missing email — rejecting");
            return false;
          }
        }
        return true;
      } catch (error) {
        console.error("[NextAuth signIn] error:", error);
        return false;
      }
    },
    async jwt({ token, user, trigger }) {
      console.log("[NextAuth jwt] triggered. User ID:", user?.id, "Token:", token?.id);
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
