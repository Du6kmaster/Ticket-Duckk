import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/client.js';
import { guildConfigRepository } from '../database/repositories/guildConfig.repository.js';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Executa a configuração inicial do Ticket Duck neste servidor.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((opt) => opt.setName('logs').setDescription('Canal de logs do sistema de tickets').setRequired(false))
    .addChannelOption((opt) =>
      opt.setName('transcripts').setDescription('Canal onde transcripts serão enviados').setRequired(false),
    ) as SlashCommandBuilder,

  async execute(interaction) {
    if (!interaction.guildId) return;
    await interaction.deferReply({ ephemeral: true });

    const logsChannel = interaction.options.getChannel('logs');
    const transcriptsChannel = interaction.options.getChannel('transcripts');

    await guildConfigRepository.getOrCreate(interaction.guildId);
    await guildConfigRepository.update(interaction.guildId, {
      logsChannelId: logsChannel?.id,
      transcriptsChannelId: transcriptsChannel?.id,
    });
    await guildConfigRepository.markSetupCompleted(interaction.guildId);

    await interaction.editReply({
      content:
        '✅ Ticket Duck configurado com sucesso!\n\n' +
        'Próximos passos:\n' +
        '• `/categoria criar` — crie suas categorias de atendimento\n' +
        '• `/painel criar` — crie um painel e vincule as categorias\n' +
        '• `/config` — ajuste cargos de staff, cooldowns e permissões',
    });
  },
};
