# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copia os arquivos de dependência e instala
COPY package*.json ./
RUN npm install

# Copia o restante do código e roda o build
COPY . .
RUN npm run build

# Etapa 2: Runtime
FROM node:20-alpine AS production

WORKDIR /app

# Copia apenas o necessário para o runtime
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Porta padrão do vite preview
EXPOSE 4173

# Comando que inicia o servidor estático
CMD ["npm", "run", "preview"]
