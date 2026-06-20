# Stage 1: Build-Umgebung
FROM node:24-alpine AS builder

# Arbeitsverzeichnis festlegen
WORKDIR /usr/src/app

# Abhängigkeiten kopieren und installieren (inklusive devDependencies für TypeScript)
COPY package*.json ./
RUN npm ci

# Quellcode und Konfiguration kopieren
COPY tsconfig.json ./
COPY src/ ./src/

# TypeScript zu JavaScript kompilieren
RUN npm run build

# Stage 2: Produktions-Umgebung (Minimal)
FROM node:24-alpine

# Umgebungsvariable für Produktion setzen
ENV NODE_ENV=production

# Arbeitsverzeichnis festlegen
WORKDIR /usr/src/app

# Nur die package.json Dateien für die Produktions-Abhängigkeiten kopieren
COPY package*.json ./

# Ausschließlich Produktions-Abhängigkeiten installieren und Cache bereinigen
RUN npm ci --only=production && npm cache clean --force

# Den kompilierten Code aus der Build-Stage kopieren
COPY --from=builder /usr/src/app/dist ./dist

# Berechtigungen für den integrierten, nicht-privilegierten "node" Benutzer anpassen
RUN chown -R node:node /usr/src/app

# Aus Sicherheitsgründen auf den nicht-privilegierten Benutzer wechseln
USER node

# Port freigeben, auf dem das Backend lauscht
EXPOSE 3000

# Startbefehl für den Server
CMD ["node", "dist/Server.js"]