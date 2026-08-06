import { ActivityType, Events } from 'discord.js';
import type { TicketDuckClient } from '../types/client.js';
import { logger } from '../utils/logger.js';

export const name = Events.ClientReady;
export const once = true;

export function execute(client: TicketDuckClient): void {
  logger.info(`Ticket Duck online como ${client.user?.tag} — em ${client.guilds.cache.size} servidor(es).`);

  client.user?.setPresence({
    activities: [{ name: '/painel • Ticket Duck', type: ActivityType.Watching }],
    status: 'online',
  });
}
