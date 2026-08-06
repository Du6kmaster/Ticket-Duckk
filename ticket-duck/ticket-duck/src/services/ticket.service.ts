import { ActionRowBuilder, StringSelectMenuBuilder, type Guild, type TextChannel } from 'discord.js';
import { ticketRepository } from '../database/repositories/ticket.repository.js';
import { categoryRepository } from '../database/repositories/category.repository.js';
import { guildConfigRepository } from '../database/repositories/guildConfig.repository.js';
import { userHistoryRepository } from '../database/repositories/support.repository.js';
import { ticketChannelBuilder } from '../tickets/ticketChannel.builder.js';
import { transcriptService } from './transcript.service.js';
import { logService } from '../logs/log.service.js';
import { buildTicketEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';
import { CUSTOM_ID } from '../constants/index.js';
import type { CreateTicketInput, TicketEmbedData } from '../interfaces/ticket.interface.js';

/** Opções do menu único de ações — conforme requisito "Não utilizar vários botões" */
function buildActionMenuRow(): ActionRowBuilder<StringSelectMenuBuilder> {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(CUSTOM_ID.TICKET_ACTION_MENU)
      .setPlaceholder('Selecione uma ação para este ticket')
      .addOptions(
        { label: 'Assumir Ticket', value: 'claim', emoji: '🙋' },
        { label: 'Chamar Membro', value: 'call_member', emoji: '📣' },
        { label: 'Transferir Ticket', value: 'transfer', emoji: '🔁' },
        { label: 'Renomear Ticket', value: 'rename', emoji: '✏️' },
        { label: 'Adicionar Membro', value: 'add_member', emoji: '➕' },
        { label: 'Remover Membro', value: 'remove_member', emoji: '➖' },
        { label: 'Trancar Ticket', value: 'lock', emoji: '🔒' },
        { label: 'Destrancar Ticket', value: 'unlock', emoji: '🔓' },
        { label: 'Fechar com Avaliação', value: 'close_with_rating', emoji: '⭐' },
        { label: 'Fechar sem Avaliação', value: 'close_without_rating', emoji: '📕' },
      ),
  );
}

/**
 * Camada de orquestração de negócio para tickets.
 * Commands e interactions NUNCA falam diretamente com o TicketRepository —
 * sempre passam por aqui, que coordena banco + canal Discord + logs.
 */
export class TicketService {
  async createTicket(guild: Guild, input: CreateTicketInput) {
    const category = await categoryRepository.findById(input.categoryId);
    if (!category) throw new Error('Categoria não encontrada.');

    const existing = await ticketRepository.findOpenTicketByUserInCategory(
      input.categoryId,
      input.openerId,
    );
    if (existing) {
      throw new Error('Você já possui um ticket aberto nesta categoria.');
    }

    const config = await guildConfigRepository.getOrCreate(guild.id);
    const number = await ticketRepository.nextNumber(guild.id);

    const channel = await ticketChannelBuilder.create(guild, category, config, input.openerId, number);

    const ticket = await ticketRepository.create({
      number,
      guildId: guild.id,
      categoryId: category.id,
      channelId: channel.id,
      openerId: input.openerId,
      priority: category.priority,
      answers: {
        create: input.answers.map((a) => ({ questionId: a.questionId, answer: a.answer })),
      },
    });

    const embed = buildTicketEmbed(this.toEmbedData(ticket, category.name));
    const message = await channel.send({
      content: category.initialMessage
        ? category.initialMessage.replace('{user}', `<@${input.openerId}>`)
        : `Olá <@${input.openerId}>! Em breve nossa equipe irá atendê-lo(a).`,
      embeds: [embed],
      components: [buildActionMenuRow()],
    });
    await message.pin().catch(() => undefined);

    await logService.record(
      guild,
      ticket.id,
      ticket.number,
      'CREATED',
      `Ticket criado por <@${input.openerId}> na categoria **${category.name}**.`,
      input.openerId,
    );

    return { ticket, channel };
  }

  async claim(guild: Guild, ticketId: string, staffId: string) {
    const ticket = await ticketRepository.setClaimedBy(ticketId, staffId);
    await this.refreshEmbed(guild, ticketId);
    await logService.record(guild, ticketId, ticket.number, 'CLAIMED', `Assumido por <@${staffId}>.`, staffId);
    return ticket;
  }

  async callMember(guild: Guild, ticketId: string, staffId: string) {
    const ticket = await ticketRepository.incrementCallCount(ticketId);
    await this.refreshEmbed(guild, ticketId);
    await logService.record(
      guild,
      ticketId,
      ticket.number,
      'MEMBER_CALLED',
      `<@${ticket.openerId}> foi chamado por <@${staffId}>.`,
      staffId,
      ticket.openerId,
    );
    return ticket;
  }

  async transfer(guild: Guild, ticketId: string, staffId: string, newStaffId: string, reason: string) {
    const ticket = await ticketRepository.setClaimedBy(ticketId, newStaffId);
    await ticketRepository.setStatus(ticketId, 'TRANSFERRED');
    await this.refreshEmbed(guild, ticketId);
    await logService.record(
      guild,
      ticketId,
      ticket.number,
      'TRANSFERRED',
      `Transferido de <@${staffId}> para <@${newStaffId}>. Motivo: ${reason}`,
      staffId,
      newStaffId,
    );
    return ticket;
  }

  async rename(guild: Guild, ticketId: string, channel: TextChannel, newName: string, staffId: string) {
    await channel.setName(newName);
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new Error('Ticket não encontrado.');
    await logService.record(guild, ticketId, ticket.number, 'RENAMED', `Renomeado para \`${newName}\`.`, staffId);
    return ticket;
  }

  async addMember(guild: Guild, ticketId: string, channel: TextChannel, userId: string, staffId: string) {
    await ticketRepository.addMember(ticketId, userId);
    await channel.permissionOverwrites.edit(userId, { ViewChannel: true, SendMessages: true });
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new Error('Ticket não encontrado.');
    await logService.record(
      guild,
      ticketId,
      ticket.number,
      'MEMBER_ADDED',
      `<@${userId}> adicionado por <@${staffId}>.`,
      staffId,
      userId,
    );
    return ticket;
  }

  async removeMember(guild: Guild, ticketId: string, channel: TextChannel, userId: string, staffId: string) {
    await ticketRepository.removeMember(ticketId, userId);
    await channel.permissionOverwrites.delete(userId).catch(() => undefined);
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new Error('Ticket não encontrado.');
    await logService.record(
      guild,
      ticketId,
      ticket.number,
      'MEMBER_REMOVED',
      `<@${userId}> removido por <@${staffId}>.`,
      staffId,
      userId,
    );
    return ticket;
  }

  async lock(guild: Guild, ticketId: string, channel: TextChannel, staffId: string) {
    const ticket = await ticketRepository.lock(ticketId);
    await ticketChannelBuilder.setClientCanSend(channel, ticket.openerId, false);
    await logService.record(guild, ticketId, ticket.number, 'LOCKED', `Trancado por <@${staffId}>.`, staffId);
    return ticket;
  }

  async unlock(guild: Guild, ticketId: string, channel: TextChannel, staffId: string) {
    const ticket = await ticketRepository.unlock(ticketId);
    await ticketChannelBuilder.setClientCanSend(channel, ticket.openerId, true);
    await logService.record(guild, ticketId, ticket.number, 'UNLOCKED', `Destrancado por <@${staffId}>.`, staffId);
    return ticket;
  }

  /** Fecha o ticket, gera transcript, envia no canal de logs e arquiva o canal */
  async close(guild: Guild, ticketId: string, channel: TextChannel, staffId: string, reason?: string) {
    const html = await transcriptService.generate(channel, (await ticketRepository.findById(ticketId))!.number);
    await ticketRepository.saveTranscript(ticketId, html);

    const ticket = await ticketRepository.close(ticketId, staffId, reason);

    await logService.record(
      guild,
      ticketId,
      ticket.number,
      'TRANSCRIPT_GENERATED',
      `Transcript gerado para o ticket #${ticket.number}.`,
      staffId,
    );
    await logService.record(
      guild,
      ticketId,
      ticket.number,
      'CLOSED',
      `Fechado por <@${staffId}>.${reason ? ` Motivo: ${reason}` : ''}`,
      staffId,
    );

    await userHistoryRepository.recordTicketClosed(guild.id, ticket.openerId);

    try {
      await channel.delete('Ticket fechado');
    } catch (error) {
      logger.warn({ error, ticketId }, 'Falha ao deletar canal do ticket após o fechamento');
    }

    return ticket;
  }

  async rate(guild: Guild, ticketId: string, stars: number, comment?: string) {
    await ticketRepository.saveRating(ticketId, stars, comment);
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new Error('Ticket não encontrado.');

    await userHistoryRepository.recordTicketClosed(guild.id, ticket.openerId, stars);
    await logService.record(
      guild,
      ticketId,
      ticket.number,
      'RATED',
      `Avaliação recebida: ${'⭐'.repeat(stars)} (${stars}/5).${comment ? ` Comentário: ${comment}` : ''}`,
      ticket.openerId,
    );
    return ticket;
  }

  /** Reconstrói e re-envia (edita) o embed principal do ticket na mensagem fixada */
  private async refreshEmbed(guild: Guild, ticketId: string): Promise<void> {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) return;

    const channel = (await guild.channels.fetch(ticket.channelId).catch(() => null)) as TextChannel | null;
    if (!channel) return;

    const pinned = await channel.messages.fetchPinned();
    const message = pinned.first();
    if (!message) return;

    const embed = buildTicketEmbed(this.toEmbedData(ticket, ticket.category.name));
    await message.edit({ embeds: [embed] }).catch((error) => {
      logger.warn({ error, ticketId }, 'Falha ao editar embed do ticket');
    });
  }

  private toEmbedData(
    ticket: { number: number; openerId: string; claimedById: string | null; status: string; priority: string; callCount: number; createdAt: Date },
    categoryName: string,
  ): TicketEmbedData {
    return {
      number: ticket.number,
      openerId: ticket.openerId,
      claimedById: ticket.claimedById,
      categoryName,
      status: ticket.status as TicketEmbedData['status'],
      priority: ticket.priority as TicketEmbedData['priority'],
      callCount: ticket.callCount,
      createdAt: ticket.createdAt,
    };
  }
}

export const ticketService = new TicketService();
