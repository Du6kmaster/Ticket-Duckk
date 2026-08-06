import pino from 'pino';
import { env, isProduction } from '../config/env.js';

/**
 * Logger central do projeto. Nunca usar console.log diretamente no código —
 * sempre importar este logger para manter formatação e níveis consistentes.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
});
