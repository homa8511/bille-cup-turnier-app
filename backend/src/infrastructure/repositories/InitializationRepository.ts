import { PostgresClient } from "../database/PostgresClient";

// Diese Klasse übernimmt die massenhafte Speicherung der Initialisierungsdaten.
export class InitializationRepository {
  private db: PostgresClient;

  constructor() {
    this.db = PostgresClient.getInstance();
  }

  // Diese Methode speichert alle Initialisierungsdaten in einer einzigen sicheren Transaktion.
  public async executeInitialization(
    settings: any,
    teams: any[],
    groups: any[],
    matches: any[],
  ): Promise<void> {
    const pool = this.db.getPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        "TRUNCATE TABLE matches, group_teams, groups, teams RESTART IDENTITY CASCADE",
      );

      const settingsQuery = `
                INSERT INTO tournament_settings (id, match_duration_minutes, pause_duration_minutes, phase_start_time)
                VALUES (1, $1, $2, $3)
                ON CONFLICT (id) DO UPDATE 
                SET match_duration_minutes = $1, pause_duration_minutes = $2, phase_start_time = $3
            `;
      await client.query(settingsQuery, [
        settings.matchDuration,
        settings.pauseDuration,
        settings.vorrundeStartTime,
      ]);

      for (const team of teams) {
        await client.query("INSERT INTO teams (id, name) VALUES ($1, $2)", [
          team.id,
          team.name,
        ]);
      }

      for (const group of groups) {
        await client.query(
          "INSERT INTO groups (id, name, phase, field_numbers) VALUES ($1, $2, $3, $4)",
          [group.id, group.name, group.phase, group.fieldNumbers],
        );

        for (const teamId of group.teamIds) {
          await client.query(
            "INSERT INTO group_teams (group_id, team_id, points, matches_played, goals_scored, goals_conceded, rank) VALUES ($1, $2, 0, 0, 0, 0, 0)",
            [group.id, teamId],
          );
        }
      }

      for (const match of matches) {
        const startTimeDate = new Date(match.start_time);
        const endTimeDate = new Date(
          startTimeDate.getTime() + settings.matchDuration * 60000,
        );

        await client.query(
          `INSERT INTO matches (id, match_number, home_team_id, away_team_id, group_id, start_time, end_time, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            match.id,
            match.match_number,
            match.home_team_id,
            match.away_team_id,
            match.group_id,
            match.start_time,
            endTimeDate.toISOString(),
            match.status,
          ],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
