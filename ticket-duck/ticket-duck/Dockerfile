# ============================
# Ticket Duck — Dockerfile
# ============================

FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install --omit=dev=false

# ---- build ----
FROM base AS build
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- runtime ----
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

RUN npx prisma generate

CMD ["node", "dist/index.js"]
