import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { loadCommands, attachCommands } from './utils/commandLoader.js';
import { loadEvents } from './utils/eventLoader.js';
import { prisma } from './database/client.js';
import type { TicketDuckClient } from './types/client.js';

async function bootstrap(): Promise<void> {
  logger.info('Iniciando Ticket Duck...');

  await prisma.$connect();
  logger.info('Conectado ao PostgreSQL.');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message],
  }) as TicketDuckClient;

  const commands = await loadCommands();
  attachCommands(client, commands);

  await loadEvents(client);

  await client.login(env.DISCORD_TOKEN);
}

process.on('unhandledRejection', (error) => {
  logger.error({ error }, 'Unhandled promise rejection');
});

process.on('SIGINT', async () => {
  logger.info('Encerrando Ticket Duck...');
  await prisma.$disconnect();
  process.exit(0);
});

bootstrap().catch((error) => {
  logger.fatal({ error }, 'Falha ao iniciar o Ticket Duck');
  process.exit(1);
});
