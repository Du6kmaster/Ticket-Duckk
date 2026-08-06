import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/client.js';
import { ticketRepository } from '../database/repositories/ticket.repository.js';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Mostra o histórico de eventos do ticket atual.') as SlashCommandBuilder,

  async execute(interaction) {
    const ticket = await ticketRepository.findByChannelId(interaction.channelId);
    if (!ticket) {
      await interaction.reply({ content: 'Este canal não é um ticket ativo.', ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const logs = await ticketRepository.listLogs(ticket.id);

    if (logs.length === 0) {
      await interaction.editReply({ content: 'Nenhum log registrado ainda para este ticket.' });
      return;
    }

    const lines = logs.map((l) => `\`${l.createdAt.toLocaleString('pt-BR')}\` — **${l.type}**${l.actorId ? ` — <@${l.actorId}>` : ''}`);
    await interaction.editReply({ content: lines.join('\n') });
  },
};
