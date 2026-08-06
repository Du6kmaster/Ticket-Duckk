import { ChannelType, PermissionFlagsBits, type Guild, type TextChannel } from 'discord.js';
import type { Category, GuildConfig } from '@prisma/client';

/**
 * Responsável exclusivamente por criar o canal Discord de um ticket
 * com as permissões corretas. Não conhece banco de dados nem embeds —
 * apenas a mecânica de criação do canal em si.
 */
export class TicketChannelBuilder {
  async create(
    guild: Guild,
    category: Category,
    config: GuildConfig,
    openerId: string,
    ticketNumber: number,
  ): Promise<TextChannel> {
    const channelName = `ticket-${String(ticketNumber).padStart(4, '0')}`;

    const staffRoleIds = [
      ...config.staffRoleIds,
      ...config.moderatorRoleIds,
      ...config.supervisorRoleIds,
      ...config.adminRoleIds,
      ...(category.responsibleRoleId ? [category.responsibleRoleId] : []),
    ];

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.discordCategoryId ?? undefined,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: openerId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
          ],
        },
        ...staffRoleIds.map((roleId) => ({
          id: roleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.AttachFiles,
          ],
        })),
      ],
    });

    return channel as TextChannel;
  }

  async setClientCanSend(channel: TextChannel, openerId: string, canSend: boolean): Promise<void> {
    await channel.permissionOverwrites.edit(openerId, {
      SendMessages: canSend,
    });
  }
}

export const ticketChannelBuilder = new TicketChannelBuilder();
