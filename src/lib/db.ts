import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

let prisma: PrismaClient;

const getPrismaInstance = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

if (process.env.NODE_ENV === 'production') {
  prisma = getPrismaInstance();
} else {
  // Prevent multiple instances of Prisma Client in development due to hot reloading
  if (!(global as any).prismaGlobal) {
    (global as any).prismaGlobal = getPrismaInstance();
  }
  prisma = (global as any).prismaGlobal;
}

export { prisma };
export default prisma;
