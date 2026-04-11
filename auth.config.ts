import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import type { NextAuthConfig } from "next-auth";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        return null; // actual DB check only in lib/auth.ts
      },
    }),
  ],
} satisfies NextAuthConfig;