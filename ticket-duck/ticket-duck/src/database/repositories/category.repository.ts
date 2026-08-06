import { prisma } from '../client.js';
import type { Category, Prisma } from '@prisma/client';

export class CategoryRepository {
  async create(data: Prisma.CategoryUncheckedCreateInput): Promise<Category> {
    return prisma.category.create({ data });
  }

  async findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: { form: { include: { questions: { orderBy: { order: 'asc' } } } } },
    });
  }

  async listByPanel(panelId: string): Promise<Category[]> {
    return prisma.category.findMany({ where: { panelId } });
  }

  async attachForm(categoryId: string, formId: string): Promise<Category> {
    return prisma.category.update({ where: { id: categoryId }, data: { formId } });
  }

  async delete(id: string): Promise<void> {
    await prisma.category.delete({ where: { id } });
  }
}

export const categoryRepository = new CategoryRepository();
