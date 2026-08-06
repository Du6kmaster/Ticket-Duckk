import { SlashCommandBuilder, type TextChannel } from 'discord.js';
import type { Command } from '../types/client.js';
import { ticketRepository } from '../database/repositories/ticket.repository.js';
import { guildConfigRepository } from '../database/repositories/guildConfig.repository.js';
import { permissionService } from '../services/permission.service.js';
import { ticketService } from '../services/ticket.service.js';
import { sendRatingDm } from '../services/rating.service.js';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('fechar')
    .setDescription('Fecha o ticket atual (deve ser usado dentro do canal do ticket).')
    .addStringOption((o) => o.setName('motivo').setDescription('Motivo do fechamento').setRequired(false))
    .addBooleanOption((o) => o.setName('avaliar').setDescription('Enviar pesquisa de avaliação ao cliente? (padrão: sim)').setRequired(false)) as SlashCommandBuilder,

  async execute(interaction) {
    if (!interaction.guild || !interaction.member) return;
    await interaction.deferReply();

    const ticket = await ticketRepository.findByChannelId(interaction.channelId);
    if (!ticket) {
      await interaction.editReply({ content: 'Este canal não é um ticket ativo.' });
      return;
    }

    const config = await guildConfigRepository.getOrCreate(interaction.guild.id);
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!permissionService.canManageTicketActions(member, config)) {
      await interaction.editReply({ content: 'Você não tem permissão para fechar tickets.' });
      return;
    }

    const withRating = interaction.options.getBoolean('avaliar') ?? true;
    const reason = interaction.options.getString('motivo') ?? undefined;

    if (withRating) {
      await sendRatingDm(interaction.guild, ticket.id, ticket.openerId);
    }

    await interaction.editReply({ content: 'Fechando o ticket...' });
    await ticketService.close(interaction.guild, ticket.id, interaction.channel as TextChannel, interaction.user.id, reason);
  },
};
