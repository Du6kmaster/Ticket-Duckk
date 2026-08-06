import { SlashCommandBuilder } from 'discord.js';
import type { TicketPriority } from '@prisma/client';
import type { Command } from '../types/client.js';
import { ticketRepository } from '../database/repositories/ticket.repository.js';
import { guildConfigRepository } from '../database/repositories/guildConfig.repository.js';
import { permissionService } from '../services/permission.service.js';

const PRIORITY_CHOICES: Array<{ name: string; value: TicketPriority }> = [
  { name: 'Baixa', value: 'LOW' },
  { name: 'Média', value: 'MEDIUM' },
  { name: 'Alta', value: 'HIGH' },
  { name: 'Urgente', value: 'URGENT' },
];

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('prioridade')
    .setDescription('Altera a prioridade do ticket atual.')
    .addStringOption((o) =>
      o.setName('nova').setDescription('Nova prioridade').setChoices(...PRIORITY_CHOICES).setRequired(true),
    ) as SlashCommandBuilder,

  async execute(interaction) {
    if (!interaction.guild) return;
    await interaction.deferReply();

    const ticket = await ticketRepository.findByChannelId(interaction.channelId);
    if (!ticket) {
      await interaction.editReply({ content: 'Este canal não é um ticket ativo.' });
      return;
    }

    const config = await guildConfigRepository.getOrCreate(interaction.guild.id);
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!permissionService.canManageTicketActions(member, config)) {
      await interaction.editReply({ content: 'Você não tem permissão para alterar a prioridade deste ticket.' });
      return;
    }

    const nova = interaction.options.getString('nova', true) as TicketPriority;
    await ticketRepository.setPriority(ticket.id, nova);
    await interaction.editReply({ content: `Prioridade atualizada para **${nova}**.` });
  },
};
