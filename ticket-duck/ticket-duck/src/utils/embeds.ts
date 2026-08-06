import { EmbedBuilder, time } from 'discord.js';
import { EMBED_COLOR_DEFAULT } from '../constants/index.js';
import type { TicketEmbedData } from '../interfaces/ticket.interface.js';

const STATUS_LABEL: Record<string, string> = {
  WAITING: '🟡 Aguardando atendimento',
  IN_PROGRESS: '🔵 Em atendimento',
  WAITING_CLIENT: '🟠 Aguardando cliente',
  TRANSFERRED: '🔁 Transferido',
  RESOLVED: '🟢 Resolvido',
  CLOSED: '⚫ Fechado',
};

const PRIORITY_LABEL: Record<string, string> = {
  LOW: '🟢 Baixa',
  MEDIUM: '🟡 Média',
  HIGH: '🟠 Alta',
  URGENT: '🔴 Urgente',
};

/**
 * Constrói (ou reconstrói) o embed principal de um ticket.
 * Este embed é sempre EDITADO na mesma mensagem — nunca recriado —
 * conforme especificado no requisito de "Atualização do Embed".
 */
export function buildTicketEmbed(data: TicketEmbedData): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(EMBED_COLOR_DEFAULT)
    .setTitle(`🎫 Ticket #${data.number}`)
    .addFields(
      { name: 'Cliente', value: `<@${data.openerId}>`, inline: true },
      {
        name: 'Atendente',
        value: data.claimedById ? `<@${data.claimedById}>` : 'Ninguém assumiu ainda',
        inline: true,
      },
      { name: 'Categoria', value: data.categoryName, inline: true },
      { name: 'Status', value: STATUS_LABEL[data.status] ?? data.status, inline: true },
      { name: 'Prioridade', value: PRIORITY_LABEL[data.priority] ?? data.priority, inline: true },
      { name: 'Chamadas', value: String(data.callCount), inline: true },
      { name: 'Aberto em', value: time(data.createdAt, 'f'), inline: true },
      { name: 'Tempo aberto', value: time(data.createdAt, 'R'), inline: true },
    )
    .setFooter({ text: `ID: ${data.number}` })
    .setTimestamp();
}

export function buildLogEmbed(title: string, description: string, color = EMBED_COLOR_DEFAULT): EmbedBuilder {
  return new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).setTimestamp();
}
