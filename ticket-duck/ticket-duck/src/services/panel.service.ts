import {
  ActionRowBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  type Guild,
  type TextChannel,
} from 'discord.js';
import { panelRepository } from '../database/repositories/panel.repository.js';
import { CUSTOM_ID, DISCORD_LIMITS } from '../constants/index.js';
import { logger } from '../utils/logger.js';

export interface CreatePanelInput {
  guildId: string;
  channelId: string;
  title: string;
  description: string;
  color?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  footerText?: string;
}

/**
 * Responsável pela criação de painéis e pela publicação/atualização
 * da mensagem do painel (embed + select menu de categorias) no Discord.
 */
export class PanelService {
  async create(input: CreatePanelInput) {
    return panelRepository.create({
      guildId: input.guildId,
      channelId: input.channelId,
      title: input.title,
      description: input.description,
      color: input.color,
      thumbnailUrl: input.thumbnailUrl,
      imageUrl: input.imageUrl,
      footerText: input.footerText,
    });
  }

  /** Publica (ou republica) a mensagem do painel com o menu de categorias atualizado */
  async publish(guild: Guild, panelId: string): Promise<void> {
    const panel = await panelRepository.findById(panelId);
    if (!panel) throw new Error('Painel não encontrado.');

    const channel = (await guild.channels.fetch(panel.channelId).catch(() => null)) as TextChannel | null;
    if (!channel) throw new Error('Canal do painel não encontrado.');

    const embed = new EmbedBuilder()
      .setTitle(panel.title)
      .setDescription(panel.description)
      .setColor((panel.color as `#${string}`) ?? '#5865F2');

    if (panel.thumbnailUrl) embed.setThumbnail(panel.thumbnailUrl);
    if (panel.imageUrl) embed.setImage(panel.imageUrl);
    if (panel.footerText) embed.setFooter({ text: panel.footerText, iconURL: panel.footerIconUrl ?? undefined });

    const options = panel.categories.slice(0, DISCORD_LIMITS.SELECT_MENU_MAX_OPTIONS).map((category) => ({
      label: category.name,
      value: category.id,
      description: category.description?.slice(0, 100),
      emoji: category.emoji ?? undefined,
    }));

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(CUSTOM_ID.PANEL_CATEGORY_MENU)
        .setPlaceholder(panel.menuPlaceholder)
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(
          options.length > 0
            ? options
            : [{ label: 'Nenhuma categoria configurada', value: 'none', description: 'Use /categoria' }],
        ),
    );

    if (panel.messageId) {
      const existing = await channel.messages.fetch(panel.messageId).catch(() => null);
      if (existing) {
        await existing.edit({ embeds: [embed], components: [row] });
        return;
      }
    }

    const message = await channel.send({ embeds: [embed], components: [row] });
    await panelRepository.setMessageId(panel.id, message.id);
    logger.info({ panelId: panel.id, channelId: channel.id }, 'Painel publicado');
  }
}

export const panelService = new PanelService();
