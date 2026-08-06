import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, type Guild } from 'discord.js';
import { ticketRepository } from '../database/repositories/ticket.repository.js';
import { CUSTOM_ID } from '../constants/index.js';
import { logger } from '../utils/logger.js';

/**
 * Envia a DM de avaliação (1 a 5 estrelas) ao cliente quando o ticket
 * é fechado "com avaliação". Falha silenciosamente (com log) se o
 * usuário tiver DMs fechadas — isso não deve travar o fechamento do ticket.
 */
export async function sendRatingDm(guild: Guild, ticketId: string, openerId: string): Promise<void> {
  const ticket = await ticketRepository.findById(ticketId);
  if (!ticket) return;

  try {
    const user = await guild.client.users.fetch(openerId);

    const embed = new EmbedBuilder()
      .setTitle(`Avalie o atendimento — Ticket #${ticket.number}`)
      .setDescription(`Como você avalia o atendimento recebido no servidor **${guild.name}**?`)
      .setColor('#5865F2');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      [1, 2, 3, 4, 5].map((stars) =>
        new ButtonBuilder()
          .setCustomId(`${CUSTOM_ID.BUTTON_RATE_PREFIX}${stars}:${ticketId}`)
          .setLabel('⭐'.repeat(stars))
          .setStyle(ButtonStyle.Secondary),
      ),
    );

    await user.send({ embeds: [embed], components: [row] });
  } catch (error) {
    logger.warn({ error, ticketId }, 'Não foi possível enviar a DM de avaliação (DMs fechadas?)');
  }
}
