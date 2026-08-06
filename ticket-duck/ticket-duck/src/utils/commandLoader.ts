import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { Collection } from 'discord.js';
import type { Command, TicketDuckClient } from '../types/client.js';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Lê todos os comandos de src/commands/ e retorna a Collection pronta para o client */
export async function loadCommands(): Promise<Collection<string, Command>> {
  const collection = new Collection<string, Command>();
  const commandsDir = path.join(__dirname, '..', 'commands');
  const files = readdirSync(commandsDir).filter((f) => f.endsWith('.js') || f.endsWith('.ts'));

  for (const file of files) {
    const mod = (await import(pathToFileURL(path.join(commandsDir, file)).href)) as { command: Command };
    if (!mod.command?.data || !mod.command?.execute) {
      logger.warn({ file }, 'Arquivo de comando inválido — export "command" ausente ou incompleto');
      continue;
    }
    collection.set(mod.command.data.name, mod.command);
  }

  logger.info(`${collection.size} comando(s) carregado(s).`);
  return collection;
}

export function attachCommands(client: TicketDuckClient, commands: Collection<string, Command>): void {
  client.commands = commands;
}
