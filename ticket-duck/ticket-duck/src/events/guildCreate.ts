import { Events, type Guild } from 'discord.js';
import { guildConfigRepository } from '../database/repositories/guildConfig.repository.js';
import { logger } from '../utils/logger.js';

export const name = Events.GuildCreate;
export const once = false;

export async function execute(guild: Guild): Promise<void> {
  await guildConfigRepository.getOrCreate(guild.id);
  logger.info({ guildId: guild.id, guildName: guild.name }, 'Configuração inicial criada para novo servidor');
}
