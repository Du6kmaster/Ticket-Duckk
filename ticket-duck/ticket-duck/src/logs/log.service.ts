import type { Guild, TextChannel } from 'discord.js';
import type { TicketLogType } from '@prisma/client';
import { guildConfigRepository } from '../database/repositories/guildConfig.repository.js';
import { ticketRepository } from '../database/repositories/ticket.repository.js';
import { buildLogEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';

const LOG_TITLES: Record<TicketLogType, string> = {
  CREATED: '🎫 Ticket criado',
  CLAIMED: '🙋 Ticket assumido',
  MEMBER_CALLED: '📣 Cliente chamado',
  TRANSFERRED: '🔁 Ticket transferido',
  RENAMED: '✏️ Ticket renomeado',
  MEMBER_ADDED: '➕ Membro adicionado',
  MEMBER_REMOVED: '➖ Membro removido',
  LOCKED: '🔒 Ticket trancado',
  UNLOCKED: '🔓 Ticket destrancado',
  RATED: '⭐ Avaliação recebida',
  TRANSCRIPT_GENERATED: '📄 Transcript gerado',
  CLOSED: '📕 Ticket fechado',
};

/**
 * Único ponto responsável por: (1) persistir o log no banco e (2) publicar
 * o embed correspondente no canal de logs da guild, se configurado.
 */
export class LogService {
  async record(
    guild: Guild,
    ticketId: string,
    ticketNumber: number,
    type: TicketLogType,
    description: string,
    actorId?: string,
    targetId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await ticketRepository.addLog(ticketId, type, actorId, targetId, metadata);

    const config = await guildConfigRepository.getOrCreate(guild.id);
    if (!config.logsChannelId) return;

    try {
      const channel = await guild.channels.fetch(config.logsChannelId);
      if (!channel?.isTextBased()) return;

      const embed = buildLogEmbed(`${LOG_TITLES[type]} — Ticket #${ticketNumber}`, description);
      await (channel as TextChannel).send({ embeds: [embed] });
    } catch (error) {
      logger.warn({ error, guildId: guild.id }, 'Falha ao enviar log para o canal configurado');
    }
  }
}

export const logService = new LogService();
