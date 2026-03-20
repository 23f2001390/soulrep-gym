import { PrismaClient } from '@prisma/client'

// Ensure the PrismaClient is a singleton in the Next.js dev server.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma: PrismaClient = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
