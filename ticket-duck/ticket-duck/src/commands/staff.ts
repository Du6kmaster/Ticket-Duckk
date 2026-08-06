import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/client.js';
import { staffRepository } from '../database/repositories/support.repository.js';
import type { StaffRole } from '@prisma/client';

const ROLE_CHOICES: Array<{ name: string; value: StaffRole }> = [
  { name: 'Administrador', value: 'ADMIN' },
  { name: 'Supervisor', value: 'SUPERVISOR' },
  { name: 'Moderador', value: 'MODERATOR' },
  { name: 'Suporte', value: 'SUPPORT' },
];

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('staff')
    .setDescription('Gerencia a equipe de atendimento.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('adicionar')
        .setDescription('Adiciona um membro à equipe')
        .addUserOption((o) => o.setName('usuario').setDescription('Usuário').setRequired(true))
        .addStringOption((o) => o.setName('cargo').setDescription('Nível de staff').setChoices(...ROLE_CHOICES).setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('remover')
        .setDescription('Remove um membro da equipe')
        .addUserOption((o) => o.setName('usuario').setDescription('Usuário').setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('listar').setDescription('Lista a equipe atual')) as SlashCommandBuilder,

  async execute(interaction) {
    if (!interaction.guildId) return;
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    if (sub === 'adicionar') {
      const user = interaction.options.getUser('usuario', true);
      const role = interaction.options.getString('cargo', true) as StaffRole;
      await staffRepository.upsert(interaction.guildId, user.id, role);
      await interaction.editReply({ content: `<@${user.id}> adicionado como **${role}**.` });
      return;
    }

    if (sub === 'remover') {
      const user = interaction.options.getUser('usuario', true);
      await staffRepository.remove(interaction.guildId, user.id);
      await interaction.editReply({ content: `<@${user.id}> removido da equipe.` });
      return;
    }

    if (sub === 'listar') {
      const staff = await staffRepository.listByGuild(interaction.guildId);
      if (staff.length === 0) {
        await interaction.editReply({ content: 'Nenhum membro de staff cadastrado.' });
        return;
      }
      const list = staff.map((s) => `• <@${s.userId}> — **${s.role}**`).join('\n');
      await interaction.editReply({ content: list });
    }
  },
};
