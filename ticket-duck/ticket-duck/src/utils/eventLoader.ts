import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import type { TicketDuckClient } from '../types/client.js';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface EventModule {
  name: string;
  once?: boolean;
  execute: (...args: unknown[]) => unknown;
}

/** Lê todos os arquivos de src/events/ e registra cada um no client automaticamente */
export async function loadEvents(client: TicketDuckClient): Promise<void> {
  const eventsDir = path.join(__dirname, '..', 'events');
  const files = readdirSync(eventsDir).filter((f) => f.endsWith('.js') || f.endsWith('.ts'));

  for (const file of files) {
    const mod = (await import(pathToFileURL(path.join(eventsDir, file)).href)) as EventModule;
    if (!mod.name || !mod.execute) {
      logger.warn({ file }, 'Arquivo de evento inválido — faltando "name" ou "execute"');
      continue;
    }

    if (mod.once) {
      client.once(mod.name, (...args) => mod.execute(...args, client));
    } else {
      client.on(mod.name, (...args) => mod.execute(...args, client));
    }
  }

  logger.info(`${files.length} evento(s) carregado(s).`);
}
