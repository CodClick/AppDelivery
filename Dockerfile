# Etapa 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copia arquivos e instala dependências
COPY package.json package-lock.json ./
RUN npm install

# Copia restante do projeto e roda o build
COPY . .
RUN npm run build

# Etapa 2: Runtime leve
FROM node:20-alpine AS production

WORKDIR /app

# Copia apenas os arquivos necessários da etapa de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Exponha a porta usada pelo seu app (ajuste se necessário)
EXPOSE 4173

# Comando de execução
CMD ["npm", "run", "preview"]
