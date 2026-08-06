import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/client.js';
import { userHistoryRepository } from '../database/repositories/support.repository.js';
import { ticketRepository } from '../database/repositories/ticket.repository.js';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('historico')
    .setDescription('Mostra o histórico de tickets de um usuário.')
    .addUserOption((o) => o.setName('usuario').setDescription('Usuário (padrão: você mesmo)').setRequired(false)) as SlashCommandBuilder,

  async execute(interaction) {
    if (!interaction.guildId) return;
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser('usuario') ?? interaction.user;
    const history = await userHistoryRepository.get(interaction.guildId, user.id);
    const tickets = await ticketRepository.listByUser(interaction.guildId, user.id);

    if (!history || tickets.length === 0) {
      await interaction.editReply({ content: `<@${user.id}> ainda não abriu nenhum ticket.` });
      return;
    }

    const lastFive = tickets
      .slice(0, 5)
      .map((t) => `• #${t.number} — ${t.category.name} — ${t.status}${t.rating ? ` — ${'⭐'.repeat(t.rating.stars)}` : ''}`)
      .join('\n');

    await interaction.editReply({
      content: [
        `**Histórico de <@${user.id}>**`,
        `Total de tickets: ${history.totalTickets}`,
        `Avaliação média: ${history.averageRating ? history.averageRating.toFixed(1) : 'sem avaliações'}`,
        '',
        '**Últimos atendimentos:**',
        lastFive,
      ].join('\n'),
    });
  },
};
