import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/client.js';
import { formRepository, type QuestionInput } from '../database/repositories/form.repository.js';
import { categoryRepository } from '../database/repositories/category.repository.js';

/**
 * Formato compacto para cada pergunta, já que o Discord não permite
 * um número arbitrário de options por comando:
 * "Rótulo da pergunta | obrigatorio:s/n | placeholder (opcional)"
 */
function parseQuestionShorthand(raw: string, order: number): QuestionInput {
  const [label, requiredFlag, placeholder] = raw.split('|').map((p) => p?.trim());
  return {
    label: label || `Pergunta ${order + 1}`,
    style: 'SHORT',
    required: requiredFlag ? requiredFlag.toLowerCase().startsWith('s') : true,
    placeholder: placeholder || undefined,
    order,
  };
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('formulario')
    .setDescription('Cria um formulário e vincula a uma categoria (máx. 5 perguntas — limite do Discord).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('criar')
        .setDescription('Cria um formulário')
        .addStringOption((o) => o.setName('categoria_id').setDescription('ID da categoria').setRequired(true))
        .addStringOption((o) => o.setName('nome').setDescription('Nome do formulário').setRequired(true))
        .addStringOption((o) =>
          o.setName('pergunta1').setDescription('Rótulo | obrigatorio:s/n | placeholder').setRequired(true),
        )
        .addStringOption((o) => o.setName('pergunta2').setDescription('Rótulo | obrigatorio:s/n | placeholder').setRequired(false))
        .addStringOption((o) => o.setName('pergunta3').setDescription('Rótulo | obrigatorio:s/n | placeholder').setRequired(false))
        .addStringOption((o) => o.setName('pergunta4').setDescription('Rótulo | obrigatorio:s/n | placeholder').setRequired(false))
        .addStringOption((o) => o.setName('pergunta5').setDescription('Rótulo | obrigatorio:s/n | placeholder').setRequired(false)),
    ) as SlashCommandBuilder,

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const categoryId = interaction.options.getString('categoria_id', true);

    const category = await categoryRepository.findById(categoryId);
    if (!category) {
      await interaction.editReply({ content: 'Categoria não encontrada.' });
      return;
    }

    const rawQuestions = [1, 2, 3, 4, 5]
      .map((n) => interaction.options.getString(`pergunta${n}`))
      .filter((v): v is string => Boolean(v));

    const questions = rawQuestions.map((raw, i) => parseQuestionShorthand(raw, i));
    const form = await formRepository.createWithQuestions(interaction.options.getString('nome', true), questions);

    await categoryRepository.attachForm(categoryId, form.id);

    await interaction.editReply({
      content: `Formulário **${form.name}** criado e vinculado à categoria **${category.name}** com ${questions.length} pergunta(s).`,
    });
  },
};
