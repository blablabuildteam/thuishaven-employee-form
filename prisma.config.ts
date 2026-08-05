import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prefer Next.js local secrets; fall back to .env for anything missing.
config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  },
});
