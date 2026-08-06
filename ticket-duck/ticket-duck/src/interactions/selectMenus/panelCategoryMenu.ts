import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type StringSelectMenuInteraction,
} from 'discord.js';
import { categoryRepository } from '../../database/repositories/category.repository.js';
import { blacklistRepository } from '../../database/repositories/support.repository.js';
import { ticketService } from '../../services/ticket.service.js';
import { CUSTOM_ID, DISCORD_LIMITS } from '../../constants/index.js';

/**
 * Disparado quando o cliente escolhe uma categoria no painel.
 * Se a categoria tiver formulário, abre um Modal (limitado a 5 campos —
 * limite estrutural do Discord). Sem formulário, cria o ticket imediatamente.
 */
export async function handlePanelCategoryMenu(interaction: StringSelectMenuInteraction): Promise<void> {
  const categoryId = interaction.values[0];
  if (categoryId === 'none') {
    await interaction.reply({ content: 'Esta categoria ainda não está configurada.', ephemeral: true });
    return;
  }

  if (!interaction.guildId) return;

  const isBlacklisted = await blacklistRepository.isBlacklisted(interaction.guildId, interaction.user.id);
  if (isBlacklisted) {
    await interaction.reply({ content: 'Você não tem permissão para abrir tickets neste servidor.', ephemeral: true });
    return;
  }

  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    await interaction.reply({ content: 'Categoria não encontrada.', ephemeral: true });
    return;
  }

  if (!category.form || category.form.questions.length === 0) {
    await createTicketDirect(interaction, categoryId, []);
    return;
  }

  const questions = category.form.questions.slice(0, DISCORD_LIMITS.MODAL_MAX_FIELDS);

  const modal = new ModalBuilder()
    .setCustomId(`${CUSTOM_ID.MODAL_FORM}:${categoryId}`)
    .setTitle(category.name.slice(0, 45));

  for (const question of questions) {
    const input = new TextInputBuilder()
      .setCustomId(question.id)
      .setLabel(question.label.slice(0, 45))
      .setStyle(question.style === 'LONG' ? TextInputStyle.Paragraph : TextInputStyle.Short)
      .setRequired(question.required);

    if (question.placeholder) input.setPlaceholder(question.placeholder.slice(0, 100));
    if (question.minLength) input.setMinLength(question.minLength);
    if (question.maxLength) input.setMaxLength(question.maxLength);

    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
  }

  await interaction.showModal(modal);
}

async function createTicketDirect(
  interaction: StringSelectMenuInteraction,
  categoryId: string,
  answers: Array<{ questionId: string; answer: string }>,
): Promise<void> {
  if (!interaction.guild) return;
  await interaction.deferReply({ ephemeral: true });

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
