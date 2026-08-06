import { prisma } from '../client.js';
import type { Ticket, TicketLogType, TicketStatus, TicketPriority, Prisma } from '@prisma/client';

export class TicketRepository {
  /** Próximo número sequencial de ticket dentro da guild */
  async nextNumber(guildId: string): Promise<number> {
    const last = await prisma.ticket.findFirst({
      where: { guildId },
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    return (last?.number ?? 0) + 1;
  }

  async create(data: Prisma.TicketUncheckedCreateInput): Promise<Ticket> {
    return prisma.ticket.create({ data });
  }

  async findById(id: string) {
    return prisma.ticket.findUnique({
      where: { id },
      include: { category: true, answers: { include: { question: true } }, members: true },
    });
  }

  async findByChannelId(channelId: string) {
    return prisma.ticket.findUnique({
      where: { channelId },
      include: { category: true, answers: { include: { question: true } }, members: true },
    });
  }

  async findOpenTicketByUserInCategory(categoryId: string, openerId: string) {
    return prisma.ticket.findFirst({
      where: {
        categoryId,
        openerId,
        status: { not: 'CLOSED' },
      },
    });
  }

  async setClaimedBy(id: string, staffId: string): Promise<Ticket> {
    return prisma.ticket.update({
      where: { id },
      data: { claimedById: staffId, status: 'IN_PROGRESS' },
    });
  }

  async setStatus(id: string, status: TicketStatus): Promise<Ticket> {
    return prisma.ticket.update({ where: { id }, data: { status } });
  }

  async setPriority(id: string, priority: TicketPriority): Promise<Ticket> {
    return prisma.ticket.update({ where: { id }, data: { priority } });
  }

  async incrementCallCount(id: string): Promise<Ticket> {
    return prisma.ticket.update({ where: { id }, data: { callCount: { increment: 1 } } });
  }

  async lock(id: string): Promise<Ticket> {
    return prisma.ticket.update({ where: { id }, data: { lockedAt: new Date() } });
  }

  async unlock(id: string): Promise<Ticket> {
    return prisma.ticket.update({ where: { id }, data: { lockedAt: null } });
  }

  async close(id: string, closedById: string, reason?: string): Promise<Ticket> {
    return prisma.ticket.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date(), closedById, closeReason: reason },
    });
  }

  async addMember(ticketId: string, userId: string): Promise<void> {
    await prisma.ticketMember.upsert({
      where: { ticketId_userId: { ticketId, userId } },
      update: {},
      create: { ticketId, userId },
    });
  }

  async removeMember(ticketId: string, userId: string): Promise<void> {
    await prisma.ticketMember
      .delete({ where: { ticketId_userId: { ticketId, userId } } })
      .catch(() => undefined); // idempotente — se não existir, ignora
  }

  async addLog(
    ticketId: string,
    type: TicketLogType,
    actorId?: string,
    targetId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await prisma.ticketLog.create({
      data: { ticketId, type, actorId, targetId, metadata: metadata as Prisma.InputJsonValue },
    });
  }

  async saveTranscript(ticketId: string, html: string): Promise<void> {
    await prisma.transcript.upsert({
      where: { ticketId },
      update: { html },
      create: { ticketId, html },
    });
  }

  async saveRating(ticketId: string, stars: number, comment?: string): Promise<void> {
    await prisma.rating.upsert({
      where: { ticketId },
      update: { stars, comment },
      create: { ticketId, stars, comment },
    });
  }

  async findByNumberWithTranscript(guildId: string, number: number) {
    return prisma.ticket.findUnique({
      where: { guildId_number: { guildId, number } },
      include: { transcript: true },
    });
  }

  async listLogs(ticketId: string, take = 25) {
    return prisma.ticketLog.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      take,
    });
  }

  async listByUser(guildId: string, userId: string) {
    return prisma.ticket.findMany({
      where: { guildId, openerId: userId },
      include: { rating: true, category: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const ticketRepository = new TicketRepository();
