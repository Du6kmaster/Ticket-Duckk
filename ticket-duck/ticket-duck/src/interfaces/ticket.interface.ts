import type { TicketPriority, TicketStatus } from '@prisma/client';

/** Payload necessário para abrir um novo ticket a partir de uma categoria */
export interface CreateTicketInput {
  guildId: string;
  categoryId: string;
  openerId: string;
  answers: Array<{ questionId: string; answer: string }>;
}

/** Estado exibido no embed do ticket — usado para renderizar e re-renderizar o embed */
export interface TicketEmbedData {
  number: number;
  openerId: string;
  claimedById: string | null;
  categoryName: string;
  status: TicketStatus;
  priority: TicketPriority;
  callCount: number;
  createdAt: Date;
}
