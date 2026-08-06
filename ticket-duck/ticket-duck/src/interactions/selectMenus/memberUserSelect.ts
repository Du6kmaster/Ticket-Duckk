import type { TextChannel, UserSelectMenuInteraction } from 'discord.js';
import { ticketService } from '../../services/ticket.service.js';

export async function handleAddMemberUserSelect(interaction: UserSelectMenuInteraction): Promise<void> {
  if (!interaction.guild) return;
  const ticketId = interaction.customId.split(':').at(-1);
  const userId = interaction.values[0];
  if (!ticketId || !userId) return;

  await interaction.deferUpdate();
  await ticketService.addMember(
    interaction.guild,
    ticketId,
    interaction.channel as TextChannel,
    userId,
    interaction.user.id,
  );
  await interaction.editReply({ content: `<@${userId}> foi adicionado ao ticket.`, components: [] });
}

export async function handleRemoveMemberUserSelect(interaction: UserSelectMenuInteraction): Promise<void> {
  if (!interaction.guild) return;
  const ticketId = interaction.customId.split(':').at(-1);
  const userId = interaction.values[0];
  if (!ticketId || !userId) return;

  await interaction.deferUpdate();
  await ticketService.removeMember(
    interaction.guild,
    ticketId,
    interaction.channel as TextChannel,
    userId,
    interaction.user.id,
  );
  await interaction.editReply({ content: `<@${userId}> foi removido do ticket.`, components: [] });
}
