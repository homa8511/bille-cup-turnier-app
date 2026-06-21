import * as dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import * as path from "path";
import { PostgresClient } from "./infrastructure/database/PostgresClient";
import apiRoutes from "./routes";

const app = express();

app.use(cors());
app.use(express.json());

// Diese Middleware protokolliert alle Anfragen für eine leichtere Fehlersuche.
app.use((req, res, next) => {
  console.log(
    `[API-Proxy] Eingehende Anfrage: ${req.method} ${req.originalUrl}`,
  );
  next();
});

app.use(
  "/public/images",
  express.static(path.join(__dirname, "../public/images")),
);
app.use(
  "/public/documents",
  express.static(path.join(__dirname, "../public/documents")),
);

// Der Server lauscht tolerant auf Routen mit und ohne API-Präfix.
app.use("/api", apiRoutes);
app.use("/", apiRoutes);

// Dieser Fallback-Handler fängt unbekannte Routen sauber ab.
app.use((req, res) => {
  console.log(`[404] Route nicht gefunden: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Route existiert nicht im Backend." });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Backend läuft isoliert auf Port ${PORT}`);
});

process.on("SIGINT", async () => {
  console.log("SIGINT Signal empfangen.");
  await gracefulShutdown();
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM Signal empfangen.");
  await gracefulShutdown();
});

async function gracefulShutdown() {
  console.log("Fahre HTTP-Server herunter...");
  server.close(async () => {
    console.log("HTTP-Server wurde geschlossen.");

    try {
      const db = PostgresClient.getInstance();
      await db.close();
      console.log("Datenbankverbindungen wurden erfolgreich getrennt.");
      process.exit(0);
    } catch (error) {
      console.error("Fehler beim Trennen der Datenbankverbindungen:", error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error("Erzwinge Beenden nach Timeout.");
    process.exit(1);
  }, 10000);
}
