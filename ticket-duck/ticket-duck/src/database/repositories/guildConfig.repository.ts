import { prisma } from '../client.js';
import type { GuildConfig } from '@prisma/client';

/**
 * Repository responsável por toda leitura/escrita de GuildConfig.
 * Nenhuma outra camada deve chamar `prisma.guildConfig` diretamente —
 * sempre passar por aqui, para manter uma única fonte de verdade sobre a query.
 */
export class GuildConfigRepository {
  /** Garante que exista uma config para a guild, criando com defaults se necessário */
  async getOrCreate(guildId: string): Promise<GuildConfig> {
    const existing = await prisma.guildConfig.findUnique({ where: { guildId } });
    if (existing) return existing;

    return prisma.guildConfig.create({
      data: { guildId },
    });
  }

  async update(guildId: string, data: Partial<GuildConfig>): Promise<GuildConfig> {
    return prisma.guildConfig.update({
      where: { guildId },
      data,
    });
  }

  async markSetupCompleted(guildId: string): Promise<void> {
    await prisma.guildConfig.update({
      where: { guildId },
      data: { setupCompleted: true },
    });
  }
}

export const guildConfigRepository = new GuildConfigRepository();
