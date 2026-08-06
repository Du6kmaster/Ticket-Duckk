import { prisma } from '../client.js';
import type { StaffRole } from '@prisma/client';

/**
 * Repositórios pequenos e correlatos agrupados em um único arquivo
 * para evitar excesso de arquivos triviais de 10 linhas cada.
 * Cada classe ainda mantém responsabilidade única.
 */

export class StaffRepository {
  async upsert(guildId: string, userId: string, role: StaffRole) {
    return prisma.staff.upsert({
      where: { guildId_userId: { guildId, userId } },
      update: { role },
      create: { guildId, userId, role },
    });
  }

  async findByUser(guildId: string, userId: string) {
    return prisma.staff.findUnique({ where: { guildId_userId: { guildId, userId } } });
  }

  async listByGuild(guildId: string) {
    return prisma.staff.findMany({ where: { guildId } });
  }

  async remove(guildId: string, userId: string) {
    await prisma.staff.delete({ where: { guildId_userId: { guildId, userId } } }).catch(() => undefined);
  }
}

export class BlacklistRepository {
  async add(guildId: string, userId: string, reason?: string) {
    return prisma.blacklistedUser.upsert({
      where: { guildId_userId: { guildId, userId } },
      update: { reason },
      create: { guildId, userId, reason },
    });
  }

  async remove(guildId: string, userId: string) {
    await prisma.blacklistedUser
      .delete({ where: { guildId_userId: { guildId, userId } } })
      .catch(() => undefined);
  }

  async isBlacklisted(guildId: string, userId: string): Promise<boolean> {
    const entry = await prisma.blacklistedUser.findUnique({
      where: { guildId_userId: { guildId, userId } },
    });
    return entry !== null;
  }
}

export class CooldownRepository {
  async isActive(guildId: string, key: string, userId: string): Promise<boolean> {
    const entry = await prisma.cooldown.findUnique({
      where: { guildId_key_userId: { guildId, key, userId } },
    });
    if (!entry) return false;
    if (entry.expiresAt.getTime() <= Date.now()) {
      await prisma.cooldown.delete({ where: { id: entry.id } }).catch(() => undefined);
      return false;
    }
    return true;
  }

  async set(guildId: string, key: string, userId: string, durationMs: number): Promise<void> {
    const expiresAt = new Date(Date.now() + durationMs);
    await prisma.cooldown.upsert({
      where: { guildId_key_userId: { guildId, key, userId } },
      update: { expiresAt },
      create: { guildId, key, userId, expiresAt },
    });
  }
}

export class UserHistoryRepository {
  async recordTicketClosed(guildId: string, userId: string, rating?: number): Promise<void> {
    const existing = await prisma.userHistory.findUnique({
      where: { guildId_userId: { guildId, userId } },
    });

    const totalTickets = (existing?.totalTickets ?? 0) + 1;
    const averageRating =
      rating === undefined
        ? existing?.averageRating
        : existing?.averageRating
          ? (existing.averageRating * (totalTickets - 1) + rating) / totalTickets
          : rating;

    await prisma.userHistory.upsert({
      where: { guildId_userId: { guildId, userId } },
      update: { totalTickets, averageRating, lastTicketAt: new Date() },
      create: { guildId, userId, totalTickets, averageRating, lastTicketAt: new Date() },
    });
  }

  async get(guildId: string, userId: string) {
    return prisma.userHistory.findUnique({ where: { guildId_userId: { guildId, userId } } });
  }
}

export const staffRepository = new StaffRepository();
export const blacklistRepository = new BlacklistRepository();
export const cooldownRepository = new CooldownRepository();
export const userHistoryRepository = new UserHistoryRepository();
