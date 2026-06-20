import { PostgresClient } from '../database/PostgresClient';
import { TeamData } from '../../domain/factories/TournamentFactories';

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
        return result.rows[0] ? result.rows[0] as TeamData : null;
    }
}