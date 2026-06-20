# Stage 1: Build-Umgebung
FROM node:24-alpine AS builder

# Arbeitsverzeichnis festlegen
WORKDIR /usr/src/app

# Abhängigkeiten kopieren und installieren
COPY package*.json ./
RUN npm ci

# Quellcode und Konfiguration kopieren
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY src/ ./src/
COPY public/ ./public/

# Frontend zu statischen Dateien kompilieren
RUN npm run build

# Stage 2: Produktions-Umgebung (Nginx)
FROM nginx:alpine

# Eigene Nginx-Konfiguration kopieren
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Die kompilierten Dateien aus der Build-Stage kopieren
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Port 80 freigeben
EXPOSE 80

# Nginx im Vordergrund starten
CMD ["nginx", "-g", "daemon off;"]