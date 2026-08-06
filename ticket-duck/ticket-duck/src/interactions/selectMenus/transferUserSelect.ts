import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, type UserSelectMenuInteraction } from 'discord.js';
import { CUSTOM_ID } from '../../constants/index.js';

/**
 * Após escolher o novo atendente, pede o motivo da transferência via modal.
 * customId: `td:userselect:transfer:<ticketId>`
 */
export async function handleTransferUserSelect(interaction: UserSelectMenuInteraction): Promise<void> {
  const ticketId = interaction.customId.split(':').at(-1);
  const newStaffId = interaction.values[0];
  if (!ticketId || !newStaffId) return;

  const modal = new ModalBuilder()
    .setCustomId(`${CUSTOM_ID.MODAL_TRANSFER_REASON}:${ticketId}:${newStaffId}`)
    .setTitle('Motivo da transferência')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('reason')
          .setLabel('Motivo')
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(500)
          .setRequired(true),
      ),
    );

  await interaction.showModal(modal);
}
