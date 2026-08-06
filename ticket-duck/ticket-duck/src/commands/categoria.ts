import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import type { TicketPriority } from '@prisma/client';
import type { Command } from '../types/client.js';
import { categoryRepository } from '../database/repositories/category.repository.js';
import { panelRepository } from '../database/repositories/panel.repository.js';

const PRIORITY_CHOICES: Array<{ name: string; value: TicketPriority }> = [
  { name: 'Baixa', value: 'LOW' },
  { name: 'Média', value: 'MEDIUM' },
  { name: 'Alta', value: 'HIGH' },
  { name: 'Urgente', value: 'URGENT' },
];

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('categoria')
    .setDescription('Gerencia as categorias de atendimento de um painel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('criar')
        .setDescription('Cria uma nova categoria vinculada a um painel')
        .addStringOption((o) => o.setName('painel_id').setDescription('ID do painel').setRequired(true))
        .addStringOption((o) => o.setName('nome').setDescription('Nome da categoria').setRequired(true))
        .addStringOption((o) => o.setName('descricao').setDescription('Descrição curta').setRequired(false))
        .addStringOption((o) => o.setName('emoji').setDescription('Emoji da categoria').setRequired(false))
        .addRoleOption((o) => o.setName('cargo_responsavel').setDescription('Cargo responsável pelo atendimento').setRequired(false))
        .addChannelOption((o) =>
          o
            .setName('categoria_discord')
            .setDescription('Categoria do Discord onde os canais serão criados')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(false),
        )
        .addStringOption((o) => o.setName('mensagem_inicial').setDescription('Mensagem enviada ao abrir o ticket (use {user})').setRequired(false))
        .addStringOption((o) => o.setName('cor').setDescription('Cor em hex').setRequired(false))
        .addStringOption((o) =>
          o.setName('prioridade').setDescription('Prioridade padrão dos tickets desta categoria').setChoices(...PRIORITY_CHOICES).setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('listar')
        .setDescription('Lista as categorias de um painel')
        .addStringOption((o) => o.setName('painel_id').setDescription('ID do painel').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('remover')
        .setDescription('Remove uma categoria')
        .addStringOption((o) => o.setName('id').setDescription('ID da categoria').setRequired(true)),
    ) as SlashCommandBuilder,

  async execute(interaction) {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'criar') {
      await interaction.deferReply({ ephemeral: true });
      const panelId = interaction.options.getString('painel_id', true);
      const panel = await panelRepository.findById(panelId);
      if (!panel) {
        await interaction.editReply({ content: 'Painel não encontrado. Confira o ID com `/painel listar`.' });
        return;
      }

      const category = await categoryRepository.create({
        guildId: interaction.guild.id,
        panelId,
        name: interaction.options.getString('nome', true),
        description: interaction.options.getString('descricao') ?? undefined,
        emoji: interaction.options.getString('emoji') ?? undefined,
        responsibleRoleId: interaction.options.getRole('cargo_responsavel')?.id,
        discordCategoryId: interaction.options.getChannel('categoria_discord')?.id,
        initialMessage: interaction.options.getString('mensagem_inicial') ?? undefined,
        color: interaction.options.getString('cor') ?? undefined,
        priority: (interaction.options.getString('prioridade') as TicketPriority) ?? undefined,
      });

      await interaction.editReply({
        content: `Categoria **${category.name}** criada! ID: \`${category.id}\`\nVincule um formulário com \`/formulario criar categoria_id:${category.id}\` (opcional) e republique o painel com \`/painel publicar id:${panelId}\`.`,
      });
      return;
    }

    if (sub === 'listar') {
      await interaction.deferReply({ ephemeral: true });
      const panelId = interaction.options.getString('painel_id', true);
      const categories = await categoryRepository.listByPanel(panelId);
      if (categories.length === 0) {
        await interaction.editReply({ content: 'Nenhuma categoria cadastrada para este painel.' });
        return;
      }
      const list = categories.map((c) => `• \`${c.id}\` — ${c.emoji ?? ''} **${c.name}**`).join('\n');
      await interaction.editReply({ content: list });
      return;
    }

    if (sub === 'remover') {
      await interaction.deferReply({ ephemeral: true });
      await categoryRepository.delete(interaction.options.getString('id', true));
      await interaction.editReply({ content: 'Categoria removida. Lembre-se de republicar o painel.' });
    }
  },
};
