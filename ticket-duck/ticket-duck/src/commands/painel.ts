import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/client.js';
import { panelService } from '../services/panel.service.js';
import { panelRepository } from '../database/repositories/panel.repository.js';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('painel')
    .setDescription('Gerencia os painéis de abertura de ticket.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('criar')
        .setDescription('Cria um novo painel')
        .addStringOption((o) => o.setName('titulo').setDescription('Título do painel').setRequired(true))
        .addStringOption((o) => o.setName('descricao').setDescription('Descrição do painel').setRequired(true))
        .addChannelOption((o) =>
          o
            .setName('canal')
            .setDescription('Canal onde o painel será publicado')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        )
        .addStringOption((o) => o.setName('cor').setDescription('Cor em hex, ex: #5865F2').setRequired(false))
        .addStringOption((o) => o.setName('thumbnail').setDescription('URL da thumbnail').setRequired(false))
        .addStringOption((o) => o.setName('imagem').setDescription('URL da imagem').setRequired(false))
        .addStringOption((o) => o.setName('rodape').setDescription('Texto do rodapé').setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('publicar')
        .setDescription('Publica (ou republica) um painel existente')
        .addStringOption((o) => o.setName('id').setDescription('ID do painel').setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('listar').setDescription('Lista todos os painéis do servidor')) as SlashCommandBuilder,

  async execute(interaction) {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'criar') {
      await interaction.deferReply({ ephemeral: true });
      const channel = interaction.options.getChannel('canal', true);

      const panel = await panelService.create({
        guildId: interaction.guild.id,
        channelId: channel.id,
        title: interaction.options.getString('titulo', true),
        description: interaction.options.getString('descricao', true),
        color: interaction.options.getString('cor') ?? undefined,
        thumbnailUrl: interaction.options.getString('thumbnail') ?? undefined,
        imageUrl: interaction.options.getString('imagem') ?? undefined,
        footerText: interaction.options.getString('rodape') ?? undefined,
      });

      await interaction.editReply({
        content: `Painel criado! ID: \`${panel.id}\`\nAgora adicione categorias com \`/categoria criar\` e depois publique com \`/painel publicar id:${panel.id}\`.`,
      });
      return;
    }

    if (sub === 'publicar') {
      await interaction.deferReply({ ephemeral: true });
      const id = interaction.options.getString('id', true);
      try {
        await panelService.publish(interaction.guild, id);
        await interaction.editReply({ content: 'Painel publicado com sucesso!' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao publicar o painel.';
        await interaction.editReply({ content: message });
      }
      return;
    }

    if (sub === 'listar') {
      await interaction.deferReply({ ephemeral: true });
      const panels = await panelRepository.listByGuild(interaction.guild.id);
      if (panels.length === 0) {
        await interaction.editReply({ content: 'Nenhum painel criado ainda.' });
        return;
      }
      const list = panels.map((p) => `• \`${p.id}\` — **${p.title}** (<#${p.channelId}>)`).join('\n');
      await interaction.editReply({ content: list });
    }
  },
};
