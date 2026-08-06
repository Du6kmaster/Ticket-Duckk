/**
 * Script standalone para registrar os slash commands na API do Discord.
 * Executar com: `npm run deploy-commands`
 *
 * Se DEV_GUILD_ID estiver definido, registra apenas nessa guild (instantâneo —
 * ideal para desenvolvimento). Caso contrário, registra globalmente
 * (pode levar até 1 hora para propagar).
 */
import { REST, Routes } from 'discord.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { loadCommands } from './utils/commandLoader.js';

async function main(): Promise<void> {
  const commands = await loadCommands();
  const body = [...commands.values()].map((c) => c.data.toJSON());

  const rest = new REST().setToken(env.DISCORD_TOKEN);

  if (env.DEV_GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DEV_GUILD_ID), { body });
    logger.info(`${body.length} comando(s) registrados na guild de desenvolvimento.`);
  } else {
    await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body });
    logger.info(`${body.length} comando(s) registrados globalmente.`);
  }
}

main().catch((error) => {
  logger.fatal({ error }, 'Falha ao registrar comandos');
  process.exit(1);
});
