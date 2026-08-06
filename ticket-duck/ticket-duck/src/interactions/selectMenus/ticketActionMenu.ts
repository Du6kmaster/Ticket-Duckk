import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
  type StringSelectMenuInteraction,
  type TextChannel,
} from 'discord.js';
import { ticketRepository } from '../../database/repositories/ticket.repository.js';
import { guildConfigRepository } from '../../database/repositories/guildConfig.repository.js';
import { cooldownRepository } from '../../database/repositories/support.repository.js';
import { permissionService } from '../../services/permission.service.js';
import { ticketService } from '../../services/ticket.service.js';
import { CUSTOM_ID, TICKET_ACTION, CALL_MEMBER_DEFAULT_COOLDOWN_MS } from '../../constants/index.js';
import { sendRatingDm } from '../../services/rating.service.js';

/**
 * Ponto único de entrada para TODAS as ações do ticket, disparadas pelo
 * select menu fixado no canal (conforme requisito: "Não utilizar vários botões").
 */
export async function handleTicketActionMenu(interaction: StringSelectMenuInteraction): Promise<void> {
  if (!interaction.guild || !interaction.member) return;

  const ticket = await ticketRepository.findByChannelId(interaction.channelId);
  if (!ticket) {
    await interaction.reply({ content: 'Este canal não é um ticket ativo.', ephemeral: true });
    return;
  }

  const config = await guildConfigRepository.getOrCreate(interaction.guild.id);
  const member = await interaction.guild.members.fetch(interaction.user.id);
  const isStaff = permissionService.canManageTicketActions(member, config);

  if (!isStaff) {
    await interaction.reply({ content: 'Você não tem permissão para executar ações neste ticket.', ephemeral: true });
    return;
  }

  const action = interaction.values[0];
  const channel = interaction.channel as TextChannel;

  switch (action) {
    case TICKET_ACTION.CLAIM: {
      if (ticket.claimedById) {
        await interaction.reply({ content: 'Este ticket já foi assumido por outro atendente.', ephemeral: true });
        return;
      }
      await ticketService.claim(interaction.guild, ticket.id, interaction.user.id);
      await interaction.reply({ content: `Ticket assumido por <@${interaction.user.id}>.` });
      return;
    }

    case TICKET_ACTION.CALL_MEMBER: {
      const cooldownKey = `call-member:${ticket.id}`;
      const active = await cooldownRepository.isActive(interaction.guild.id, cooldownKey, interaction.user.id);
      if (active) {
        await interaction.reply({ content: 'Aguarde o cooldown antes de chamar o cliente novamente.', ephemeral: true });
        return;
      }
      await cooldownRepository.set(
        interaction.guild.id,
        cooldownKey,
        interaction.user.id,
        config.defaultCooldownMs || CALL_MEMBER_DEFAULT_COOLDOWN_MS,
      );
      await ticketService.callMember(interaction.guild, ticket.id, interaction.user.id);
      await interaction.reply({ content: `<@${ticket.openerId}>, você foi chamado(a) neste ticket!` });
      return;
    }

    case TICKET_ACTION.TRANSFER: {
      const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId(`${CUSTOM_ID.USER_SELECT_TRANSFER}:${ticket.id}`)
          .setPlaceholder('Selecione o novo atendente')
          .setMinValues(1)
          .setMaxValues(1),
      );
      await interaction.reply({ content: 'Selecione para quem transferir o ticket:', components: [row], ephemeral: true });
      return;
    }

    case TICKET_ACTION.RENAME: {
      const modal = new ModalBuilder()
        .setCustomId(`${CUSTOM_ID.MODAL_RENAME}:${ticket.id}`)
        .setTitle('Renomear ticket')
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('new-name')
              .setLabel('Novo nome do canal')
              .setStyle(TextInputStyle.Short)
              .setMaxLength(90)
              .setRequired(true),
          ),
        );
      await interaction.showModal(modal);
      return;
    }

    case TICKET_ACTION.ADD_MEMBER: {
      const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId(`${CUSTOM_ID.USER_SELECT_ADD_MEMBER}:${ticket.id}`)
          .setPlaceholder('Selecione o membro para adicionar')
          .setMinValues(1)
          .setMaxValues(1),
      );
      await interaction.reply({ content: 'Selecione o membro para adicionar ao ticket:', components: [row], ephemeral: true });
      return;
    }

    case TICKET_ACTION.REMOVE_MEMBER: {
      const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId(`${CUSTOM_ID.USER_SELECT_REMOVE_MEMBER}:${ticket.id}`)
          .setPlaceholder('Selecione o membro para remover')
          .setMinValues(1)
          .setMaxValues(1),
      );
      await interaction.reply({ content: 'Selecione o membro para remover do ticket:', components: [row], ephemeral: true });
      return;
    }

    case TICKET_ACTION.LOCK: {
      await ticketService.lock(interaction.guild, ticket.id, channel, interaction.user.id);
      await interaction.reply({ content: 'Ticket trancado. O cliente não pode mais enviar mensagens.' });
      return;
    }

    case TICKET_ACTION.UNLOCK: {
      await ticketService.unlock(interaction.guild, ticket.id, channel, interaction.user.id);
      await interaction.reply({ content: 'Ticket destrancado. O cliente pode enviar mensagens novamente.' });
      return;
    }

    case TICKET_ACTION.CLOSE_WITH_RATING: {
      await interaction.reply({ content: 'Fechando o ticket e enviando avaliação ao cliente...' });
      await sendRatingDm(interaction.guild, ticket.id, ticket.openerId);
      await ticketService.close(interaction.guild, ticket.id, channel, interaction.user.id);
      return;
    }

    case TICKET_ACTION.CLOSE_WITHOUT_RATING: {
      await interaction.reply({ content: 'Fechando o ticket...' });
      await ticketService.close(interaction.guild, ticket.id, channel, interaction.user.id);
      return;
    }

    default:
      await interaction.reply({ content: 'Ação desconhecida.', ephemeral: true });
  }
}
