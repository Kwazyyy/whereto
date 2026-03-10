import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      plan: string | null;
      subscriptionStatus: string | null;
      hasCompletedOnboarding: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    plan: string | null;
    subscriptionStatus: string | null;
    hasCompletedOnboarding: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: string;
    plan: string | null;
    subscriptionStatus: string | null;
    hasCompletedOnboarding: boolean;
  }
}
