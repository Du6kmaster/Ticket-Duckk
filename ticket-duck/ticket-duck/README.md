# 🦆 Ticket Duck

Bot de tickets premium para Discord — modular, escalável e com identidade própria.
Construído com Discord.js v14, TypeScript, PostgreSQL/Prisma e arquitetura em camadas
(Repository Pattern + Service Layer), pronto para Docker e Railway.

---

## Índice

- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Setup local](#setup-local)
- [Deploy no Railway](#deploy-no-railway)
- [Deploy com Docker](#deploy-com-docker)
- [Fluxo de uso](#fluxo-de-uso)
- [Slash Commands](#slash-commands)
- [Sistema de permissões](#sistema-de-permissões)
- [O que já está implementado](#o-que-já-está-implementado)
- [Limitações conhecidas e próximos passos](#limitações-conhecidas-e-próximos-passos)

---

## Stack

| Tecnologia   | Uso                                             |
|--------------|--------------------------------------------------|
| Discord.js v14 | Interação com a API do Discord (gateway + REST) |
| TypeScript (strict) | Tipagem completa, sem `any`               |
| Node.js 22+  | Runtime                                          |
| PostgreSQL   | Banco de dados                                   |
| Prisma ORM   | Migrations + queries tipadas                     |
| tsup         | Build (transpila mantendo a estrutura de pastas) |
| ESLint + Prettier | Padronização de código                      |
| Docker / Railway | Hospedagem                                   |

---

## Arquitetura

```
src/
  commands/          → Slash commands (um arquivo por comando)
  events/             → Eventos do client Discord (ready, interactionCreate, guildCreate)
  interactions/
    buttons/           → Handlers de botões
    selectMenus/        → Handlers de select menus (ação do ticket, categoria do painel, user selects)
    modals/             → Handlers de modais (formulário, renomear, motivo de transferência)
  tickets/            → Mecânica de criação de canal de ticket (permissões, nomes)
  database/
    client.ts           → Singleton do PrismaClient
    repositories/        → Uma classe por entidade — única camada que fala com o Prisma
  dashboard/          → Reservado para um painel web futuro (ver comentário no arquivo)
  utils/              → Logger, embeds, loaders de commands/events
  config/             → Carregamento e validação de variáveis de ambiente
  services/           → Regra de negócio (ticket, painel, avaliação, transcript, permissões)
  logs/               → Serviço de logging de eventos do ticket (persistência + canal Discord)
  middlewares/        → Roteador central de interações
  types/               → Tipos do client estendido
  interfaces/          → DTOs de domínio
  constants/           → customIds, limites do Discord, valores fixos
```

**Regra de ouro do projeto:** nenhuma camada "pula" a camada abaixo dela.
Commands e handlers de interação nunca chamam o Prisma diretamente — sempre
passam pelos `repositories`. Regras de negócio (criar ticket, fechar, transferir)
vivem nos `services`, nunca dentro de um command ou handler de interação.

Cada arquivo tem uma única responsabilidade — não existem arquivos "gigantes"
misturando lógica de Discord, banco de dados e regra de negócio.

---

## Setup local

### 1. Pré-requisitos
- Node.js 22+
- PostgreSQL (local ou via Docker)
- Uma aplicação Discord criada em https://discord.com/developers/applications

### 2. Instalação

```bash
git clone <seu-fork>
cd ticket-duck
npm install
cp .env.example .env
```

Preencha o `.env` com:
- `DISCORD_TOKEN` e `DISCORD_CLIENT_ID` (Developer Portal)
- `DATABASE_URL` (sua string de conexão PostgreSQL)
- `DEV_GUILD_ID` (opcional, recomendado em dev — registra comandos instantaneamente numa única guild)

### 3. Banco de dados

```bash
npm run prisma:migrate
```

Isso cria as tabelas no banco a partir de `prisma/schema.prisma`.

### 4. Registrar os slash commands

```bash
npm run deploy-commands
```

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

### 6. Build de produção

```bash
npm run build
npm start
```

---

## Deploy no Railway

1. Crie um novo projeto no Railway e adicione um serviço PostgreSQL (o Railway
   já expõe `DATABASE_URL` automaticamente — cole-a nas variáveis do serviço do bot).
2. Adicione um serviço a partir deste repositório (Railway detecta o `Dockerfile`
   automaticamente).
3. Configure as variáveis de ambiente do `.env.example` no serviço do bot.
4. No primeiro deploy, rode uma vez (via Railway Shell ou um Release Command):
   ```bash
   npx prisma migrate deploy
   npm run deploy-commands
   ```
5. Pronto — o bot inicia com `node dist/index.js` (definido no `Dockerfile`).

---

## Deploy com Docker

```bash
docker compose up -d --build
```

O `docker-compose.yml` já sobe um PostgreSQL local junto com o bot para
desenvolvimento/teste. Em produção, prefira um Postgres gerenciado (Railway,
RDS, Supabase etc.) e use apenas o `Dockerfile` do bot.

---

## Fluxo de uso

1. `/setup` — configura canais de log/transcript.
2. `/config cargos` — define quais cargos são Admin / Supervisor / Moderador / Suporte.
3. `/painel criar` — cria um painel (embed) em um canal.
4. `/categoria criar painel_id:<id>` — adiciona categorias ao painel (Suporte, Compras, etc).
5. `/formulario criar categoria_id:<id>` *(opcional)* — vincula até 5 perguntas
   (limite estrutural do Discord: um Modal aceita no máximo 5 campos) que o
   cliente responde antes do ticket ser criado.
6. `/painel publicar id:<id>` — publica (ou republica) a mensagem do painel com
   o select menu de categorias.
7. Cliente escolhe uma categoria → preenche o formulário (se houver) → canal do
   ticket é criado automaticamente, com o embed de status e o **menu único de
   ações** (assumir, chamar, transferir, renomear, adicionar/remover membro,
   trancar/destrancar, fechar com/sem avaliação).
8. Ao fechar, um transcript HTML é gerado e salvo no banco (`/transcript` para
   reenviar), o canal é arquivado e o histórico do cliente é atualizado.

---

## Slash Commands

| Comando        | Descrição                                                   |
|----------------|--------------------------------------------------------------|
| `/setup`       | Configuração inicial (canais de log/transcript)              |
| `/painel`      | `criar` / `publicar` / `listar` painéis                       |
| `/categoria`   | `criar` / `listar` / `remover` categorias de um painel         |
| `/formulario`  | Cria um formulário (até 5 perguntas) e vincula a uma categoria |
| `/config`      | `cargos` / `cooldown` / `ver` — configurações gerais           |
| `/staff`       | `adicionar` / `remover` / `listar` membros da equipe            |
| `/fechar`      | Fecha o ticket atual (alternativa ao menu, aceita motivo)      |
| `/status`      | Altera o status do ticket atual                                |
| `/prioridade`  | Altera a prioridade do ticket atual                            |
| `/historico`   | Mostra o histórico de tickets de um usuário                    |
| `/transcript`  | Reenvia o transcript HTML de um ticket já fechado (por número) |
| `/logs`        | Mostra o histórico de eventos do ticket atual                  |
| `/help`        | Lista todos os comandos disponíveis                            |
| `/reload`      | Recarrega os comandos em memória (restrito aos donos do bot)   |

---

## Sistema de permissões

Definido centralmente em `src/services/permission.service.ts`, com hierarquia:

```
owner (BOT_OWNERS no .env) > admin > supervisor > moderador > suporte > none
```

Cargos de cada nível são configurados por servidor via `/config cargos` e
armazenados no `GuildConfig`. Nenhum comando ou handler verifica cargos "na
unha" — todos delegam para este serviço.

---

## O que já está implementado

- ✅ Schema completo do banco (todos os models pedidos) com migrations prontas
- ✅ Painéis ilimitados, com categorias e formulários configuráveis
- ✅ Criação de ticket com permissões corretas por cargo/categoria
- ✅ Menu único de ações (sem múltiplos botões), com checagem de permissão
- ✅ Assumir, chamar membro (com cooldown configurável), transferir (com motivo),
  renomear, adicionar/remover membro, trancar/destrancar
- ✅ Fechamento com/sem avaliação, avaliação por estrelas via DM com comentário opcional
- ✅ Transcript HTML autocontido, logs completos (banco + canal Discord)
- ✅ Embed do ticket sempre editado na mesma mensagem (nunca recriado)
- ✅ Histórico de usuário (total de tickets, média de avaliação)
- ✅ Blacklist de usuários, cooldowns genéricos por chave
- ✅ Setup automático, Docker + Railway ready

## Limitações conhecidas e próximos passos

Este é um scaffold **premium e funcional de ponta a ponta**, mas alguns pontos
foram deliberadamente simplificados para caber em um primeiro entregável —
documentados aqui para não serem confundidos com bugs:

- **Formulários limitados a 5 perguntas por Modal** — limite estrutural do
  próprio Discord (não é possível abrir um Modal com mais de 5 campos). Para
  formulários maiores, a solução é encadear múltiplos Modals (não implementado
  ainda).
- **`/formulario criar` usa uma sintaxe compacta** (`"Rótulo | obrigatorio:s/n |
  placeholder"`) por pergunta, já que slash commands não aceitam um número
  arbitrário de opções. Uma extensão natural é migrar isso para um fluxo de
  Modals sequenciais.
- **Dashboard web** — a pasta `src/dashboard` está reservada e documentada,
  mas ainda não implementada (ver comentário em `src/dashboard/index.ts`).
  Como toda a lógica já está isolada em `repositories`/`services`, adicionar
  um dashboard Express/Next não deve exigir mudanças no bot em si.
- **Rate limit / sharding** — para milhares de servidores simultâneos,
  recomenda-se adicionar `@discordjs/sharding` (o código já é compatível,
  pois toda a lógica de negócio é stateless por guild).
- **Testes automatizados** — não incluídos neste entregável; a separação em
  repositories/services facilita adicionar testes unitários (mockando o
  Prisma Client) posteriormente.

---

## Licença

Projeto entregue como base de código para uso e modificação livre pelo
solicitante.
