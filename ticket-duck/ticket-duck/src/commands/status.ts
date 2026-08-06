import { SlashCommandBuilder } from 'discord.js';
import type { TicketStatus } from '@prisma/client';
import type { Command } from '../types/client.js';
import { ticketRepository } from '../database/repositories/ticket.repository.js';
import { guildConfigRepository } from '../database/repositories/guildConfig.repository.js';
import { permissionService } from '../services/permission.service.js';

const STATUS_CHOICES: Array<{ name: string; value: TicketStatus }> = [
  { name: 'Aguardando atendimento', value: 'WAITING' },
  { name: 'Em atendimento', value: 'IN_PROGRESS' },
  { name: 'Aguardando cliente', value: 'WAITING_CLIENT' },
  { name: 'Transferido', value: 'TRANSFERRED' },
  { name: 'Resolvido', value: 'RESOLVED' },
];

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Altera o status do ticket atual.')
    .addStringOption((o) => o.setName('novo').setDescription('Novo status').setChoices(...STATUS_CHOICES).setRequired(true)) as SlashCommandBuilder,

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
      await interaction.editReply({ content: 'Você não tem permissão para alterar o status deste ticket.' });
      return;
    }

    const novo = interaction.options.getString('novo', true) as TicketStatus;
    await ticketRepository.setStatus(ticket.id, novo);
    await interaction.editReply({ content: `Status atualizado para **${novo}**.` });
  },
};
