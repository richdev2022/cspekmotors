import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma client with serverless-friendly connection handling.
 *
 * On Vercel/serverless, each function invocation may use a fresh PrismaClient
 * instance. To avoid exhausting the connection pool on Neon/Postgres, we
 * reuse a single client per Node.js process via `globalThis`.
 *
 * We also keep `log: ['error']` (instead of `['query']`) in production to
 * avoid log noise that can slow down hot paths.
 */
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  });
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// On Vercel serverless, ensure we don't hold the connection open between invocations
if (process.env.VERCEL === '1') {
  // Register a hook to disconnect before the function freezes
  // This is a soft hint — Vercel may or may not call it
  process.on('beforeExit', () => {
    db.$disconnect().catch(() => {});
  });
}
