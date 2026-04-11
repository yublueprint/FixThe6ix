import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import authConfig from "@/auth.config";
import type { UserRole } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  providers: [
    ...authConfig.providers.slice(0, 1), // Google
    authConfig.providers[1] && {
      ...authConfig.providers[1],
      async authorize(credentials: unknown) {
        const { z } = await import("zod");
        const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
        const parsed = schema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        return user;
      },
    },
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as { role: UserRole }).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.role = token.role as UserRole;
      return session;
    },
  },
});