/**
 * Módulo de Dashboard — PONTO DE EXTENSÃO FUTURO.
 *
 * A pasta `src/dashboard` está reservada para um painel web (ex.: Express +
 * REST API autenticada via Discord OAuth2) que consumiria os mesmos
 * repositories já existentes em `src/database/repositories`.
 *
 * Sugestão de arquitetura quando for implementado:
 *  - src/dashboard/server.ts        → bootstrap do servidor HTTP
 *  - src/dashboard/routes/          → rotas REST (painéis, categorias, tickets)
 *  - src/dashboard/auth/            → OAuth2 do Discord + sessão
 *  - src/dashboard/middlewares/     → validação de permissão por guild
 *
 * Como os repositories já isolam todo o acesso ao Prisma, o dashboard pode
 * ser adicionado sem qualquer alteração no código do bot em si.
 */
export {};
