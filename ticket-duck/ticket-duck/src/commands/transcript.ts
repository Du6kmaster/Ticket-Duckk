import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/client.js';
import { ticketRepository } from '../database/repositories/ticket.repository.js';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('transcript')
    .setDescription('Reenvia o transcript de um ticket já fechado.')
    .addIntegerOption((o) => o.setName('numero').setDescription('Número do ticket').setRequired(true)) as SlashCommandBuilder,

  async execute(interaction) {
    if (!interaction.guildId) return;
    await interaction.deferReply({ ephemeral: true });

    const numero = interaction.options.getInteger('numero', true);
    const ticket = await ticketRepository.findByNumberWithTranscript(interaction.guildId, numero);

    if (!ticket?.transcript) {
      await interaction.editReply({ content: 'Transcript não encontrado para este ticket.' });
      return;
    }

    const attachment = new AttachmentBuilder(Buffer.from(ticket.transcript.html, 'utf-8'), {
      name: `transcript-ticket-${numero}.html`,
    });

    await interaction.editReply({ content: `Transcript do ticket #${numero}:`, files: [attachment] });
  },
};
