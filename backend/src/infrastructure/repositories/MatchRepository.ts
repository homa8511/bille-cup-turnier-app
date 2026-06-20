import { MatchData } from "../../domain/factories/TournamentFactories";
import { ScheduleUpdate, SwissPairing } from "../../domain/models/Tournament";
import { PostgresClient } from "../database/PostgresClient";

// Diese Klasse verwaltet alle Datenbankzugriffe für die Spiele.
export class MatchRepository {
  private db: PostgresClient;

  constructor() {
    this.db = PostgresClient.getInstance();
  }

  // Diese Methode ermittelt die höchste vergebene Spielnummer im System.
  public async fetchMaxMatchNumber(): Promise<number> {
    const query = "SELECT MAX(match_number) as max_num FROM matches";
    const result = await this.db.query(query);
    return result.rows[0].max_num || 0;
  }

  // Diese Methode speichert eine große Menge an Spielen auf einmal.
  public async insertMassMatches(matches: any[]): Promise<void> {
    for (const match of matches) {
      await this.db.query(
        `INSERT INTO matches (id, group_id, home_team_id, away_team_id, match_number, status, start_time, end_time) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          match.id,
          match.group_id,
          match.home_team_id,
          match.away_team_id,
          match.match_number,
          match.status,
          match.start_time,
          match.end_time,
        ],
      );
    }
  }

  // Diese Methode holt alle abgeschlossenen Spiele einer bestimmten Gruppe.
  public async fetchCompletedMatchesByGroup(
    groupId: string,
  ): Promise<MatchData[]> {
    const query = "SELECT * FROM matches WHERE group_id = $1 AND status = $2";
    const result = await this.db.query(query, [groupId, "BEENDET"]);
    return result.rows as MatchData[];
  }

  // Diese Methode holt alle Spiele einer bestimmten Gruppe.
  public async fetchMatchesByGroup(groupId: string): Promise<MatchData[]> {
    const query =
      "SELECT * FROM matches WHERE group_id = $1 ORDER BY start_time ASC";
    const result = await this.db.query(query, [groupId]);
    return result.rows as MatchData[];
  }

  // Diese Methode holt alle Spiele einer bestimmten Turnierphase.
  public async fetchMatchesByPhase(phase: string): Promise<MatchData[]> {
    const query = `
            SELECT m.* FROM matches m 
            JOIN groups g ON m.group_id = g.id 
            WHERE g.phase = $1 ORDER BY m.start_time ASC
        `;
    const result = await this.db.query(query, [phase]);
    return result.rows as MatchData[];
  }

  // Diese Methode generiert eine Matrix aller bisherigen Begegnungen.
  public async fetchCompleteMatchHistory(): Promise<Record<string, string[]>> {
    const query =
      "SELECT home_team_id, away_team_id FROM matches WHERE home_team_id IS NOT NULL AND away_team_id IS NOT NULL";
    const result = await this.db.query(query);
    const history: Record<string, string[]> = {};

    result.rows.forEach((row: any) => {
      if (!history[row.home_team_id]) history[row.home_team_id] = [];
      if (!history[row.away_team_id]) history[row.away_team_id] = [];
      history[row.home_team_id].push(row.away_team_id);
      history[row.away_team_id].push(row.home_team_id);
    });

    return history;
  }

  // Diese Methode speichert neue Paarungen für das Schweizer System und gibt diese zurück.
  public async insertGeneratedPairingsAndReturn(
    groupId: string,
    pairings: SwissPairing[],
  ): Promise<MatchData[]> {
    const insertedMatches: MatchData[] = [];
    let currentMatchNumber = (await this.fetchMaxMatchNumber()) + 1;

    for (const pair of pairings) {
      const query = `
                INSERT INTO matches (group_id, home_team_id, away_team_id, match_number, status) 
                VALUES ($1, $2, $3, $4, $5) RETURNING *
            `;
      const result = await this.db.query(query, [
        groupId,
        pair.home.team_id,
        pair.away.team_id,
        currentMatchNumber++,
        "GEPLANT",
      ]);
      insertedMatches.push(result.rows[0] as MatchData);
    }

    return insertedMatches;
  }

  // Diese Methode aktualisiert ein Spielergebnis in der Datenbank.
  public async updateMatchResult(
    matchId: string,
    goalsHome: number,
    goalsAway: number,
    status: string,
  ): Promise<MatchData | null> {
    const query = `
            UPDATE matches SET goals_home = $1, goals_away = $2, status = $3 
            WHERE id = $4 RETURNING *
        `;
    const result = await this.db.query(query, [
      goalsHome,
      goalsAway,
      status,
      matchId,
    ]);
    return (result.rows[0] as MatchData) || null;
  }

  // Diese Methode speichert die neuen Anstoßzeiten für mehrere Spiele gleichzeitig.
  public async updateMatchTimes(updates: ScheduleUpdate[]): Promise<void> {
    for (const update of updates) {
      await this.db.query(
        "UPDATE matches SET start_time = $1, end_time = $2 WHERE id = $3",
        [
          update.start_time.toISOString(),
          update.end_time.toISOString(),
          update.match_id,
        ],
      );
    }
  }
}
