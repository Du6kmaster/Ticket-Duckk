import type { ModalSubmitInteraction } from 'discord.js';
import { ticketService } from '../../services/ticket.service.js';

/**
 * Disparado após o cliente preencher e enviar o formulário do modal.
 * O customId carrega o categoryId: `td:modal:form:<categoryId>`.
 */
export async function handleFormModal(interaction: ModalSubmitInteraction): Promise<void> {
  if (!interaction.guild) return;

  const categoryId = interaction.customId.split(':').at(-1);
  if (!categoryId) return;

  await interaction.deferReply({ ephemeral: true });

  const answers = interaction.fields.fields.map((field) => ({
    questionId: field.customId,
    answer: field.value,
  }));

  try {
    const { channel } = await ticketService.createTicket(interaction.guild, {
      guildId: interaction.guild.id,
      categoryId,
      openerId: interaction.user.id,
      answers,
    });
    await interaction.editReply({ content: `Ticket criado: <#${channel.id}>` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar o ticket.';
    await interaction.editReply({ content: message });
  }
}
