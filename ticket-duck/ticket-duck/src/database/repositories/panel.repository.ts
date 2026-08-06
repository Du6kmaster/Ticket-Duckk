import { prisma } from '../client.js';
import type { Panel, Prisma } from '@prisma/client';

export class PanelRepository {
  async create(data: Prisma.PanelUncheckedCreateInput): Promise<Panel> {
    return prisma.panel.create({ data });
  }

  async findById(id: string): Promise<Panel | null> {
    return prisma.panel.findUnique({
      where: { id },
      include: { categories: { include: { form: { include: { questions: true } } } } },
    });
  }

  async listByGuild(guildId: string): Promise<Panel[]> {
    return prisma.panel.findMany({ where: { guildId }, orderBy: { createdAt: 'asc' } });
  }

  async setMessageId(id: string, messageId: string): Promise<void> {
    await prisma.panel.update({ where: { id }, data: { messageId } });
  }

  async delete(id: string): Promise<void> {
    await prisma.panel.delete({ where: { id } });
  }
}

export const panelRepository = new PanelRepository();
