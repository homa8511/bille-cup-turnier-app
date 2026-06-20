import { Pool, PoolConfig, QueryConfig, QueryResult } from "pg";
import * as process from "process";

/**
 * PostgresClient verwaltet den Verbindungspool zur PostgreSQL-Datenbank.
 * Es verwendet das Singleton-Muster, um sicherzustellen, dass nur ein Pool existiert.
 */
export class PostgresClient {
  private static instance: PostgresClient;
  private pool: Pool;

  // Der private Konstruktor verhindert die direkte Instanziierung von außen.
  private constructor() {
    const config: PoolConfig = {
      user: process.env.DB_USER || "postgres",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "billecup",
      password: process.env.DB_PASSWORD || "postgres",
      port: parseInt(process.env.DB_PORT || "5432", 10),
      // Optionale Konfiguration für Produktionsumgebungen
      max: 20, // Maximale Anzahl von Clients im Pool
      idleTimeoutMillis: 30000, // Wie lange ein Client inaktiv sein darf, bevor er geschlossen wird
      connectionTimeoutMillis: 5000, // Wie lange auf eine Verbindung gewartet wird
    };

    this.pool = new Pool(config);

    // Event-Listener für unerwartete Fehler auf inaktiven Clients
    this.pool.on("error", (err: Error, _client: any) => {
      console.error("Unerwarteter Fehler im PostgreSQL-Client-Pool:", err);
      // In einer kritischen Produktionsumgebung könnte hier process.exit(-1) stehen.
    });

    console.log(
      `PostgresClient initialisiert. Verbinde zu ${config.host}:${config.port}/${config.database}`,
    );
  }

  /**
   * Gibt die einzige Instanz des PostgresClient zurück oder erstellt sie, falls sie noch nicht existiert.
   */
  public static getInstance(): PostgresClient {
    if (!PostgresClient.instance) {
      PostgresClient.instance = new PostgresClient();
    }
    return PostgresClient.instance;
  }

  /**
   * Gibt den zugrunde liegenden pg.Pool zurück, falls direkter Zugriff nötig ist.
   */
  public getPool(): Pool {
    return this.pool;
  }

  /**
   * Führt eine SQL-Abfrage aus. Dies ist die bevorzugte Methode für Repositories.
   * @param queryTextOrConfig Der SQL-String oder ein Konfigurationsobjekt.
   * @param values Optionale Parameter für vorbereitete Statements.
   */
  public async query<T extends QueryResult<any> = QueryResult<any>>(
    queryTextOrConfig: string | QueryConfig,
    values?: any[],
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(queryTextOrConfig, values);
      return result as T;
    } finally {
      // Wichtig: Den Client immer zurück in den Pool geben, auch bei Fehlern.
      client.release();
    }
  }

  /**
   * Beendet den Verbindungspool sauber (z.B. beim Herunterfahren des Servers).
   */
  public async close(): Promise<void> {
    await this.pool.end();
    console.log("PostgresClient Verbindungspool geschlossen.");
  }
}
