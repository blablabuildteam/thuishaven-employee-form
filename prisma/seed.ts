import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  await prisma.payRate.upsert({
    where: { effectiveFrom: new Date("2000-01-01T00:00:00.000Z") },
    create: {
      effectiveFrom: new Date("2000-01-01T00:00:00.000Z"),
      under20Rate: 13.5,
      over20Rate: 15,
      updatedBy: "seed",
    },
    update: {},
  });
  console.log("Pay rates seeded (€13,50 / €15,00).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
