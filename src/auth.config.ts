import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/types";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const isDashboard =
        path.startsWith("/contacts") ||
        path.startsWith("/pipeline") ||
        path.startsWith("/calendar") ||
        path.startsWith("/workflows") ||
        path.startsWith("/funnels") ||
        path.startsWith("/sites") ||
        path.startsWith("/courses") ||
        path.startsWith("/ads") ||
        path.startsWith("/reviews") ||
        path.startsWith("/billing") ||
        path.startsWith("/usage") ||
        path.startsWith("/ai") ||
        path.startsWith("/settings") ||
        path.startsWith("/tasks") ||
        path.startsWith("/agencies") ||
        path === "/";
      const isAppHome = path === "/" || path === "/overview";
      const protectedPath = isDashboard || isAppHome || path.startsWith("/overview");
      if (protectedPath && !auth?.user) {
        if (path === "/") return true;
        return false;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        const u = user as {
          id?: string;
          role?: Role;
          agencyId?: string;
          subAccountId?: string;
        };
        token.sub = u.id || token.sub;
        token.role = u.role;
        token.agencyId = u.agencyId;
        token.subAccountId = u.subAccountId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.role = (token.role as Role) || "subaccount_staff";
        session.user.agencyId = token.agencyId as string | undefined;
        session.user.subAccountId = token.subAccountId as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
