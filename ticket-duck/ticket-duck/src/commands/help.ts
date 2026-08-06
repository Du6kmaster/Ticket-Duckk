import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/client.js';

export const command: Command = {
  data: new SlashCommandBuilder().setName('help').setDescription('Mostra todos os comandos do Ticket Duck.') as SlashCommandBuilder,

  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setTitle('🦆 Ticket Duck — Comandos')
      .setColor('#5865F2')
      .setDescription(
        client.commands
          .map((cmd) => `\`/${cmd.data.name}\` — ${cmd.data.description}`)
          .sort()
          .join('\n'),
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
