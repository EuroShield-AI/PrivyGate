import { PrismaClient } from "@prisma/client";

// Ensure Prisma client is available
if (typeof PrismaClient === "undefined") {
  throw new Error(
    "@prisma/client did not initialize yet. Please run 'npm run db:generate' or 'npx prisma generate'"
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
