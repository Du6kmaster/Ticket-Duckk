import type { ModalSubmitInteraction, TextChannel } from 'discord.js';
import { ticketService } from '../../services/ticket.service.js';

export async function handleRenameModal(interaction: ModalSubmitInteraction): Promise<void> {
  if (!interaction.guild) return;
  const ticketId = interaction.customId.split(':').at(-1);
  if (!ticketId) return;

  const newName = interaction.fields.getTextInputValue('new-name');
  await interaction.deferReply();

  await ticketService.rename(interaction.guild, ticketId, interaction.channel as TextChannel, newName, interaction.user.id);
  await interaction.editReply({ content: `Ticket renomeado para \`${newName}\`.` });
}
