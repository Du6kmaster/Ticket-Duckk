import type {
  ChatInputCommandInteraction,
  Client,
  Collection,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

export type SlashCommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

export interface Command {
  data: SlashCommandData;
  /** Se true, só pode ser executado por owners do bot (definidos em BOT_OWNERS) */
  ownerOnly?: boolean;
  execute: (interaction: ChatInputCommandInteraction, client: TicketDuckClient) => Promise<void>;
}

export interface TicketDuckClient extends Client {
  commands: Collection<string, Command>;
}
