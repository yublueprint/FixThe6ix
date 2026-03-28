import path from "node:path";
import { defineConfig } from "prisma/config";
import { loadEnvConfig } from "@next/env";

const { combinedEnv } = loadEnvConfig(process.cwd());

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx ./prisma/seed.ts",
  },
  datasource: {
    url: combinedEnv.DATABASE_URL,
  },
});