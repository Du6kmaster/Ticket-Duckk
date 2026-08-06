/**
 * Constantes globais do Ticket Duck.
 * Nenhum valor de configuração de guild deve viver aqui — isso vem do banco.
 * Aqui ficam apenas identificadores técnicos fixos (custom IDs, limites de UI, etc).
 */

export const EMBED_COLOR_DEFAULT = 0x5865f2;

/** Prefixo dos customId para roteamento de interações */
export const CUSTOM_ID = {
  TICKET_ACTION_MENU: 'td:ticket:action-menu',
  PANEL_CATEGORY_MENU: 'td:panel:category-menu',

  USER_SELECT_TRANSFER: 'td:userselect:transfer',
  USER_SELECT_ADD_MEMBER: 'td:userselect:add-member',
  USER_SELECT_REMOVE_MEMBER: 'td:userselect:remove-member',

  MODAL_FORM: 'td:modal:form',
  MODAL_RENAME: 'td:modal:rename',
  MODAL_TRANSFER_REASON: 'td:modal:transfer-reason',
  MODAL_CLOSE_REASON: 'td:modal:close-reason',

  BUTTON_GOTO_TICKET: 'td:button:goto-ticket',
  BUTTON_RATE_PREFIX: 'td:button:rate:', // + estrelas, ex: td:button:rate:5
} as const;

export const TICKET_ACTION = {
  CLAIM: 'claim',
  CALL_MEMBER: 'call_member',
  TRANSFER: 'transfer',
  RENAME: 'rename',
  ADD_MEMBER: 'add_member',
  REMOVE_MEMBER: 'remove_member',
  LOCK: 'lock',
  UNLOCK: 'unlock',
  CLOSE_WITH_RATING: 'close_with_rating',
  CLOSE_WITHOUT_RATING: 'close_without_rating',
} as const;

export type TicketActionValue = (typeof TICKET_ACTION)[keyof typeof TICKET_ACTION];

/** Limites de UI impostos pelo próprio Discord — não configuráveis */
export const DISCORD_LIMITS = {
  SELECT_MENU_MAX_OPTIONS: 25,
  MODAL_MAX_FIELDS: 5,
  EMBED_FIELD_MAX: 25,
  CHANNEL_NAME_MAX_LENGTH: 100,
} as const;

export const CALL_MEMBER_DEFAULT_COOLDOWN_MS = 60_000;
