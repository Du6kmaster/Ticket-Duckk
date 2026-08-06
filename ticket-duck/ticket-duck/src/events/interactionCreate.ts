import { Events, type Interaction } from 'discord.js';
import type { TicketDuckClient } from '../types/client.js';
import { routeInteraction } from '../middlewares/interactionRouter.js';

export const name = Events.InteractionCreate;

export async function execute(interaction: Interaction, client: TicketDuckClient): Promise<void> {
  await routeInteraction(interaction, client);
}
