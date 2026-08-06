import 'dotenv/config';

/**
 * Carrega e valida as variáveis de ambiente uma única vez na inicialização.
 * Falha rápido (fail-fast) se algo obrigatório estiver faltando —
 * é preferível travar no boot do que quebrar em produção no meio de uma interação.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`[env] Variável obrigatória ausente: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  DISCORD_TOKEN: required('DISCORD_TOKEN'),
  DISCORD_CLIENT_ID: required('DISCORD_CLIENT_ID'),
  DEV_GUILD_ID: optional('DEV_GUILD_ID'),
  DATABASE_URL: required('DATABASE_URL'),
  NODE_ENV: optional('NODE_ENV', 'development'),
  LOG_LEVEL: optional('LOG_LEVEL', 'info'),
  BOT_OWNERS: optional('BOT_OWNERS')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
} as const;

export const isProduction = env.NODE_ENV === 'production';
