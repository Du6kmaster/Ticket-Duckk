import type { TextChannel } from 'discord.js';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Gera um transcript HTML autocontido (sem dependências externas) a partir
 * do histórico de mensagens de um canal de ticket.
 */
export class TranscriptService {
  async generate(channel: TextChannel, ticketNumber: number): Promise<string> {
    const messages = await this.fetchAllMessages(channel);

    const rows = messages
      .reverse()
      .map((m) => {
        const author = escapeHtml(m.author.tag);
        const avatar = m.author.displayAvatarURL({ size: 64 });
        const content = escapeHtml(m.content || '(anexo/embed sem texto)');
        const timestamp = new Date(m.createdTimestamp).toLocaleString('pt-BR');
        return `
          <div class="message">
            <img class="avatar" src="${avatar}" alt="avatar" />
            <div class="body">
              <div class="meta"><span class="author">${author}</span><span class="time">${timestamp}</span></div>
              <div class="content">${content}</div>
            </div>
          </div>`;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Transcript — Ticket #${ticketNumber}</title>
<style>
  body { background:#313338; color:#dbdee1; font-family: 'gg sans', 'Segoe UI', sans-serif; margin:0; padding:24px; }
  h1 { color:#fff; }
  .message { display:flex; gap:12px; padding:8px 0; border-bottom:1px solid #3f4147; }
  .avatar { width:40px; height:40px; border-radius:50%; }
  .meta { display:flex; gap:8px; align-items:baseline; }
  .author { font-weight:600; color:#fff; }
  .time { font-size:12px; color:#949ba4; }
  .content { white-space:pre-wrap; word-break:break-word; }
</style>
</head>
<body>
  <h1>Transcript — Ticket #${ticketNumber}</h1>
  <p>Canal: #${escapeHtml(channel.name)} • Gerado em ${new Date().toLocaleString('pt-BR')}</p>
  ${rows}
</body>
</html>`;
  }

  /** Percorre o histórico completo do canal em lotes de 100 (limite da API do Discord) */
  private async fetchAllMessages(channel: TextChannel) {
    const all = [];
    let lastId: string | undefined;

    for (;;) {
      const batch = await channel.messages.fetch({ limit: 100, before: lastId });
      if (batch.size === 0) break;
      all.push(...batch.values());
      lastId = batch.last()?.id;
      if (batch.size < 100) break;
    }

    return all;
  }
}

export const transcriptService = new TranscriptService();
