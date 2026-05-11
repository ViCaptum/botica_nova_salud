# 1. Usamos la versión de Node que sea compatible con npm 11
FROM node:22-slim

# 2. Forzamos la versión exacta de npm que tú usas
RUN npm install -g npm@11.11.0

# 3. Directorio de trabajo
WORKDIR /app

# 4. Copiamos archivos de dependencias
COPY package*.json ./

# 5. Instalamos dependencias limpias
RUN npm install

# 6. Copiamos el código del proyecto
COPY . .

# 7. El puerto que definiste en tu .env
EXPOSE 3000

# 8. Comando de arranque
CMD ["npm", "start"]