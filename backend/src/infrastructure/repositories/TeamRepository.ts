import { TeamData } from "../../domain/factories/TournamentFactories";
import { PostgresClient } from "../database/PostgresClient";

export class TeamRepository {
  private db: PostgresClient;

  constructor() {
    this.db = PostgresClient.getInstance();
  }

  // Das Repository liefert nun explizit das rohe Daten-Interface zurück.
  public async fetchAllTeams(): Promise<TeamData[]> {
    const query = `SELECT id, name, logo_path FROM teams ORDER BY name ASC`;
    const result = await this.db.query(query);
    return result.rows as TeamData[];
  }

  public async fetchTeamById(id: string): Promise<TeamData | null> {
    const query = `SELECT id, name, logo_path FROM teams WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rows[0] ? (result.rows[0] as TeamData) : null;
  }

  // Diese Methode aktualisiert den Namen eines Teams.
  public async updateTeamName(id: string, name: string): Promise<void> {
    await this.db.query("UPDATE teams SET name = $1 WHERE id = $2", [name, id]);
  }

  // Diese Methode speichert den Dateipfad für das hochgeladene Team-Logo.
  public async updateTeamLogo(id: string, logoPath: string): Promise<void> {
    await this.db.query("UPDATE teams SET logo_path = $1 WHERE id = $2", [
      logoPath,
      id,
    ]);
  }
}
