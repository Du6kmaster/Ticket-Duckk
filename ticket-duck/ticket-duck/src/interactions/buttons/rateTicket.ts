import type { ButtonInteraction } from 'discord.js';
import { CUSTOM_ID } from '../../constants/index.js';
import { ticketService } from '../../services/ticket.service.js';
import { ticketRepository } from '../../database/repositories/ticket.repository.js';

/**
 * Disparado quando o cliente clica em uma das 5 opções de estrela na DM.
 * customId: `td:button:rate:<stars>:<ticketId>`
 */
export async function handleRateButton(interaction: ButtonInteraction): Promise<void> {
  const rest = interaction.customId.replace(CUSTOM_ID.BUTTON_RATE_PREFIX, '');
  const [starsStr, ticketId] = rest.split(':');
  const stars = Number(starsStr);

  if (!ticketId || Number.isNaN(stars) || stars < 1 || stars > 5) {
    await interaction.reply({ content: 'Avaliação inválida.', ephemeral: true });
    return;
  }

  const ticket = await ticketRepository.findById(ticketId);
  if (!ticket) {
    await interaction.reply({ content: 'Ticket não encontrado.', ephemeral: true });
    return;
  }

  const guild = await interaction.client.guilds.fetch(ticket.guildId).catch(() => null);
  if (!guild) {
    await interaction.reply({ content: 'Não foi possível localizar o servidor deste ticket.', ephemeral: true });
    return;
  }

  await interaction.reply({
    content:
      'Obrigado pela avaliação! Deseja deixar um comentário? Responda aqui na DM em até 60 segundos, ou ignore esta mensagem.',
  });

  try {
    const collected = await interaction.channel
      ?.awaitMessages({
        filter: (m) => m.author.id === interaction.user.id,
        max: 1,
        time: 60_000,
      })
      .catch(() => null);

    const comment = collected?.first()?.content;
    await ticketService.rate(guild, ticketId, stars, comment);
  } catch {
    await ticketService.rate(guild, ticketId, stars);
  }
}
