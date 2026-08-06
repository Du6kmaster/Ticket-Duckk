import type { ModalSubmitInteraction } from 'discord.js';
import { ticketService } from '../../services/ticket.service.js';

/** customId: `td:modal:transfer-reason:<ticketId>:<newStaffId>` */
export async function handleTransferReasonModal(interaction: ModalSubmitInteraction): Promise<void> {
  if (!interaction.guild) return;
  const parts = interaction.customId.split(':');
  const newStaffId = parts.at(-1);
  const ticketId = parts.at(-2);
  if (!ticketId || !newStaffId) return;

  const reason = interaction.fields.getTextInputValue('reason');
  await interaction.deferReply();

  await ticketService.transfer(interaction.guild, ticketId, interaction.user.id, newStaffId, reason);
  await interaction.editReply({ content: `Ticket transferido para <@${newStaffId}>.` });
}
