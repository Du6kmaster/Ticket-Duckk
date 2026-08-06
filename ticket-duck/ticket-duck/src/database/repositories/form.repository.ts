import { prisma } from '../client.js';
import type { Form, QuestionStyle } from '@prisma/client';

export interface QuestionInput {
  label: string;
  style: QuestionStyle;
  required: boolean;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  order: number;
}

export class FormRepository {
  /** Cria um formulário já com suas perguntas em uma única transação */
  async createWithQuestions(name: string, questions: QuestionInput[]): Promise<Form> {
    return prisma.form.create({
      data: {
        name,
        questions: { create: questions },
      },
      include: { questions: true },
    });
  }

  async findById(id: string) {
    return prisma.form.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  }
}

export const formRepository = new FormRepository();
