FROM ghcr.io/ghostdevv/node:24-alpine AS build

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM ghcr.io/ghostdevv/node:24-alpine

WORKDIR /app

COPY --from=build /app/build .

CMD ["node", "index.js"]
