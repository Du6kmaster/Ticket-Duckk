import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/client.js';
import { guildConfigRepository } from '../database/repositories/guildConfig.repository.js';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Ajusta as configurações gerais do Ticket Duck.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('cargos')
        .setDescription('Define os cargos de cada nível de staff')
        .addRoleOption((o) => o.setName('admin').setDescription('Cargo de Administrador').setRequired(false))
        .addRoleOption((o) => o.setName('supervisor').setDescription('Cargo de Supervisor').setRequired(false))
        .addRoleOption((o) => o.setName('moderador').setDescription('Cargo de Moderador').setRequired(false))
        .addRoleOption((o) => o.setName('suporte').setDescription('Cargo de Suporte').setRequired(false)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('cooldown')
        .setDescription('Define o cooldown padrão (em segundos) para chamar membros')
        .addIntegerOption((o) => o.setName('segundos').setDescription('Cooldown em segundos').setRequired(true).setMinValue(0)),
    )
    .addSubcommand((sub) => sub.setName('ver').setDescription('Mostra a configuração atual')) as SlashCommandBuilder,

  async execute(interaction) {
    if (!interaction.guildId) return;
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    if (sub === 'cargos') {
      const admin = interaction.options.getRole('admin');
      const supervisor = interaction.options.getRole('supervisor');
      const moderador = interaction.options.getRole('moderador');
      const suporte = interaction.options.getRole('suporte');

      const current = await guildConfigRepository.getOrCreate(interaction.guildId);
      await guildConfigRepository.update(interaction.guildId, {
        adminRoleIds: admin ? [...new Set([...current.adminRoleIds, admin.id])] : current.adminRoleIds,
        supervisorRoleIds: supervisor
          ? [...new Set([...current.supervisorRoleIds, supervisor.id])]
          : current.supervisorRoleIds,
        moderatorRoleIds: moderador
          ? [...new Set([...current.moderatorRoleIds, moderador.id])]
          : current.moderatorRoleIds,
        staffRoleIds: suporte ? [...new Set([...current.staffRoleIds, suporte.id])] : current.staffRoleIds,
      });

      await interaction.editReply({ content: 'Cargos atualizados com sucesso.' });
      return;
    }

    if (sub === 'cooldown') {
      const seconds = interaction.options.getInteger('segundos', true);
      await guildConfigRepository.update(interaction.guildId, { defaultCooldownMs: seconds * 1000 });
      await interaction.editReply({ content: `Cooldown padrão definido para ${seconds}s.` });
      return;
    }

    if (sub === 'ver') {
      const config = await guildConfigRepository.getOrCreate(interaction.guildId);
      await interaction.editReply({
        content: [
          `**Canal de logs:** ${config.logsChannelId ? `<#${config.logsChannelId}>` : 'não definido'}`,
          `**Canal de transcripts:** ${config.transcriptsChannelId ? `<#${config.transcriptsChannelId}>` : 'não definido'}`,
          `**Cooldown padrão:** ${config.defaultCooldownMs / 1000}s`,
          `**Cargos Admin:** ${config.adminRoleIds.map((id) => `<@&${id}>`).join(', ') || 'nenhum'}`,
          `**Cargos Supervisor:** ${config.supervisorRoleIds.map((id) => `<@&${id}>`).join(', ') || 'nenhum'}`,
          `**Cargos Moderador:** ${config.moderatorRoleIds.map((id) => `<@&${id}>`).join(', ') || 'nenhum'}`,
          `**Cargos Suporte:** ${config.staffRoleIds.map((id) => `<@&${id}>`).join(', ') || 'nenhum'}`,
        ].join('\n'),
      });
    }
  },
};
