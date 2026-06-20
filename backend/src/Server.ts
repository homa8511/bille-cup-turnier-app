import * as dotenv from 'dotenv';
// Umgebungsvariablen als erstes laden
dotenv.config();

import express from 'express';
import cors from 'cors';
import * as path from 'path';
import apiRoutes from './routes';
import { PostgresClient } from './infrastructure/database/PostgresClient';

const app = express();

app.use(cors());
app.use(express.json());

// Diese Middleware liefert alle statischen Bilder aus dem lokalen Upload-Verzeichnis aus.
app.use('/public/images', express.static(path.join(__dirname, '../public/images')));

// Diese neue Middleware stellt die hochgeladenen PDF-Dokumente öffentlich zur Verfügung.
app.use('/public/documents', express.static(path.join(__dirname, '../public/documents')));

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Backend läuft isoliert auf Port ${PORT}`);
});

process.on('SIGINT', async () => {
    console.log('SIGINT Signal empfangen.');
    await gracefulShutdown();
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM Signal empfangen.');
    await gracefulShutdown();
});

async function gracefulShutdown() {
    console.log('Fahre HTTP-Server herunter...');
    server.close(async () => {
        console.log('HTTP-Server wurde geschlossen.');
        
        try {
            const db = PostgresClient.getInstance();
            await db.close();
            console.log('Datenbankverbindungen wurden erfolgreich getrennt.');
            process.exit(0);
        } catch (error) {
            console.error('Fehler beim Trennen der Datenbankverbindungen:', error);
            process.exit(1);
        }
    });
    
    setTimeout(() => {
        console.error('Erzwinge Beenden nach Timeout.');
        process.exit(1);
    }, 10000);
}