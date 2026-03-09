FROM node:24-alpine AS build-stage

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /tmp/build

COPY package.json pnpm-lock.yaml .npmrc* ./

RUN pnpm install --frozen-lockfile

COPY . .

ARG COMMIT_SHA
RUN echo "COMMIT_SHA=${COMMIT_SHA:-Unknown}" > /tmp/build/.env.build
RUN pnpm build
RUN pnpm prune --production

FROM node:24-alpine

LABEL name="discord-bot-template"
LABEL maintainer="Stegripe Development <support@stegripe.org>"

WORKDIR /app

COPY --from=build-stage /tmp/build/package.json ./
COPY --from=build-stage /tmp/build/node_modules ./node_modules
COPY --from=build-stage /tmp/build/dist ./dist
COPY --from=build-stage /tmp/build/.env.build ./

RUN cat .env.build >> /app/.env || true
ENV NODE_ENV=production

CMD ["node", "-r", "dotenv/config", "."]
