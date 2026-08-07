import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * pg currently treats prefer/require/verify-ca as verify-full, but will switch
 * to weaker libpq semantics in pg v9. Neon also recommends verify-full.
 * Rewrite so Vercel/Neon URLs with sslmode=require stop emitting the warning.
 */
function normalizeConnectionString(connectionString: string) {
  const url = new URL(connectionString);
  const sslmode = url.searchParams.get("sslmode");
  if (
    sslmode === "prefer" ||
    sslmode === "require" ||
    sslmode === "verify-ca"
  ) {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaPg({
    connectionString: normalizeConnectionString(connectionString),
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
