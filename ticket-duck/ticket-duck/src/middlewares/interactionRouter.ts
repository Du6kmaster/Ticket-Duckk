import type { Interaction } from 'discord.js';
import type { TicketDuckClient } from '../types/client.js';
import { logger } from '../utils/logger.js';
import { CUSTOM_ID } from '../constants/index.js';
import { env } from '../config/env.js';

import { handlePanelCategoryMenu } from '../interactions/selectMenus/panelCategoryMenu.js';
import { handleTicketActionMenu } from '../interactions/selectMenus/ticketActionMenu.js';
import { handleTransferUserSelect } from '../interactions/selectMenus/transferUserSelect.js';
import {
  handleAddMemberUserSelect,
  handleRemoveMemberUserSelect,
} from '../interactions/selectMenus/memberUserSelect.js';

import { handleFormModal } from '../interactions/modals/formModal.js';
import { handleRenameModal } from '../interactions/modals/renameModal.js';
import { handleTransferReasonModal } from '../interactions/modals/transferReasonModal.js';

import { handleRateButton } from '../interactions/buttons/rateTicket.js';
import { handleGotoTicketButton } from '../interactions/buttons/gotoTicket.js';

/**
 * Único ponto de entrada para todas as interações do bot.
 * Roteia por tipo (command / select menu / modal / button) e, dentro de
 * cada tipo, pelo prefixo do customId. Adicionar uma nova interação
 * significa registrar uma nova entrada aqui — nunca espalhar `if`s pelo evento.
 */
export async function routeInteraction(interaction: Interaction, client: TicketDuckClient): Promise<void> {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      if (command.ownerOnly && !env.BOT_OWNERS.includes(interaction.user.id)) {
        await interaction.reply({ content: 'Este comando é restrito aos donos do bot.', ephemeral: true });
        return;
      }

      await command.execute(interaction, client);
      return;
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === CUSTOM_ID.PANEL_CATEGORY_MENU) return handlePanelCategoryMenu(interaction);
      if (interaction.customId === CUSTOM_ID.TICKET_ACTION_MENU) return handleTicketActionMenu(interaction);
      return;
    }

    if (interaction.isUserSelectMenu()) {
      if (interaction.customId.startsWith(CUSTOM_ID.USER_SELECT_TRANSFER)) return handleTransferUserSelect(interaction);
      if (interaction.customId.startsWith(CUSTOM_ID.USER_SELECT_ADD_MEMBER)) return handleAddMemberUserSelect(interaction);
      if (interaction.customId.startsWith(CUSTOM_ID.USER_SELECT_REMOVE_MEMBER))
        return handleRemoveMemberUserSelect(interaction);
      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith(CUSTOM_ID.MODAL_FORM)) return handleFormModal(interaction);
      if (interaction.customId.startsWith(CUSTOM_ID.MODAL_RENAME)) return handleRenameModal(interaction);
      if (interaction.customId.startsWith(CUSTOM_ID.MODAL_TRANSFER_REASON))
        return handleTransferReasonModal(interaction);
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith(CUSTOM_ID.BUTTON_RATE_PREFIX)) return handleRateButton(interaction);
      if (interaction.customId === CUSTOM_ID.BUTTON_GOTO_TICKET) return handleGotoTicketButton(interaction);
      return;
    }
  } catch (error) {
    logger.error({ error, customId: 'customId' in interaction ? interaction.customId : undefined }, 'Erro ao processar interação');

    if (interaction.isRepliable()) {
      const payload = { content: 'Ocorreu um erro ao processar essa ação.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => undefined);
      } else {
        await interaction.reply(payload).catch(() => undefined);
      }
    }
  }
}
