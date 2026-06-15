import dotenv from 'dotenv';
// Umgebungsvariablen als erstes laden
dotenv.config();

import express from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { PostgresClient } from './infrastructure/database/PostgresClient';

// Express-Instanz initialisieren
const app = express();

// Standard-Middlewares für Cross-Origin-Requests und JSON-Parsing einbinden
app.use(cors());
app.use(express.json());

// API-Routen unter dem '/api' Präfix registrieren
app.use('/api', apiRoutes);

// Webserver auf dem zugewiesenen Port starten
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Backend läuft isoliert auf Port ${PORT}`);
});

// Prozess-Signale abfangen für ein sauberes Beenden der Anwendung
process.on('SIGINT', async () => {
    console.log('SIGINT Signal empfangen (z.B. Strg+C).');
    await gracefulShutdown();
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM Signal empfangen (z.B. durch Docker/Kubernetes).');
    await gracefulShutdown();
});

// Hilfsfunktion zum sauberen Schließen aller Verbindungen
async function gracefulShutdown() {
    console.log('Fahre HTTP-Server herunter...');
    server.close(async () => {
        console.log('HTTP-Server wurde geschlossen.');
        
        try {
            // Datenbankverbindungen des Singletons sauber trennen
            const db = PostgresClient.getInstance();
            await db.close();
            console.log('Datenbankverbindungen wurden erfolgreich getrennt.');
            process.exit(0);
        } catch (error) {
            console.error('Fehler beim Trennen der Datenbankverbindungen:', error);
            process.exit(1);
        }
    });
    
    // Fallback: Erzwinge Exit nach 10 Sekunden, falls Verbindungen hängen
    setTimeout(() => {
        console.error('Erzwinge Beenden nach Timeout.');
        process.exit(1);
    }, 10000);
}