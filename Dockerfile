# Etapa 1: Build com Bun
FROM oven/bun:1.1 AS builder
WORKDIR /app
COPY . .
RUN bun install
RUN bun run build

# Etapa 2: Runtime com Node
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app /app
RUN npm install -g vite

EXPOSE 4173
CMD ["vite", "preview", "--host", "0.0.0.0"]
