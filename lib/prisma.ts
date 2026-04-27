import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient across hot reloads in dev to avoid exhausting
// connections; in production we just create one per server instance.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
