# Etapa 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copia package.json e package-lock.json e instala dependências
COPY package*.json ./
RUN npm install

# Copia o restante do código e faz o build
COPY . .
RUN npm run build

# Etapa 2: Imagem final com apenas o necessário
FROM node:20-alpine AS production

WORKDIR /app

# Copia o resultado da build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Porta que seu app roda (mude se for diferente)
EXPOSE 3000

# Comando para rodar o app — ajuste se necessário!
CMD ["npm", "run", "preview"]
