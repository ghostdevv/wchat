FROM ghcr.io/ghostdevv/node:24-alpine AS build

ARG GIT_HASH

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile
RUN GIT_HASH=$GIT_HASH pnpm build

FROM ghcr.io/ghostdevv/node:24-alpine

WORKDIR /app

COPY --from=build /app/build .

CMD ["node", "index.js"]
