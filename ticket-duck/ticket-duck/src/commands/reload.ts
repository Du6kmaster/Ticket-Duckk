import { SlashCommandBuilder } from 'discord.js';
import type { Command, TicketDuckClient } from '../types/client.js';
import { loadCommands, attachCommands } from '../utils/commandLoader.js';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Recarrega os comandos em memória sem reiniciar o processo (apenas donos do bot).') as SlashCommandBuilder,
  ownerOnly: true,

  async execute(interaction, client: TicketDuckClient) {
    await interaction.deferReply({ ephemeral: true });
    const commands = await loadCommands();
    attachCommands(client, commands);
    await interaction.editReply({ content: `${commands.size} comando(s) recarregado(s) em memória.` });
  },
};
