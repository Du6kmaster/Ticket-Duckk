import { PrismaClient } from '@prisma/client';
import { isProduction } from '../config/env.js';

/**
 * Singleton do PrismaClient.
 * Evita múltiplas conexões abertas em dev (hot reload) e mantém uma única
 * instância viva durante todo o ciclo de vida do processo.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: isProduction ? ['error', 'warn'] : ['warn', 'error'],
  });

if (!isProduction) {
  global.__prisma = prisma;
}
