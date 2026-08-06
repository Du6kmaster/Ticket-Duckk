import type { ButtonInteraction } from 'discord.js';

/**
 * Botão simples enviado na DM de "Chamar Membro", com link direto
 * para o canal do ticket. Como usa setURL, o Discord já lida com a
 * navegação — este handler serve apenas como fallback/log caso necessário.
 */
export async function handleGotoTicketButton(interaction: ButtonInteraction): Promise<void> {
  await interaction.reply({ content: 'Use o botão acima para acessar o ticket.', ephemeral: true });
}
