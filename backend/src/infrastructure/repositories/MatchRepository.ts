import {
  MatchData,
  MatchFactory,
} from "../../domain/factories/TournamentFactories";
import { ScheduleUpdate, SwissPairing } from "../../domain/models/Tournament";
import { PostgresClient } from "../database/PostgresClient";

export class MatchRepository {
  private db: PostgresClient;

  constructor() {
    this.db = PostgresClient.getInstance();
  }

  public async fetchAllMatches(): Promise<MatchData[]> {
    const result = await this.db.query(
      "SELECT * FROM matches ORDER BY match_number ASC",
    );
    return result.rows as MatchData[];
  }

  public async fetchMatchesByPhase(phase: string): Promise<MatchData[]> {
    const query = `
            SELECT m.* FROM matches m
            JOIN groups g ON m.group_id = g.id
            WHERE g.phase = $1
            ORDER BY m.match_number ASC
        `;
    const result = await this.db.query(query, [phase]);
    return result.rows as MatchData[];
  }

  public async fetchMatchesByGroup(groupId: string): Promise<MatchData[]> {
    const query =
      "SELECT * FROM matches WHERE group_id = $1 ORDER BY match_number ASC";
    const result = await this.db.query(query, [groupId]);
    return result.rows as MatchData[];
  }

  public async fetchCompletedMatchesByGroup(
    groupId: string,
  ): Promise<MatchData[]> {
    const query =
      "SELECT * FROM matches WHERE group_id = $1 AND status = $2 ORDER BY match_number ASC";
    const result = await this.db.query(query, [groupId, "BEENDET"]);
    return result.rows as MatchData[];
  }

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

  public async updateMatchTeams(
    matchId: string,
    homeTeamId: string,
    awayTeamId: string,
  ): Promise<void> {
    const query = `
            UPDATE matches 
            SET home_team_id = $1, away_team_id = $2, home_placeholder = NULL, away_placeholder = NULL 
            WHERE id = $3
        `;
    await this.db.query(query, [homeTeamId, awayTeamId, matchId]);
  }

  public async deleteMatch(matchId: string): Promise<void> {
    await this.db.query("DELETE FROM matches WHERE id = $1", [matchId]);
  }

  public async insertGeneratedPairingsAndReturn(
    groupId: string,
    pairings: SwissPairing[],
  ): Promise<MatchData[]> {
    const inserted: MatchData[] = [];
    for (const pairing of pairings) {
      const newMatch = MatchFactory.createNewMatch(
        groupId,
        pairing.home.team_id,
        pairing.away.team_id,
        0,
        new Date().toISOString(),
      );
      const snap = newMatch.extractSnapshot();
      const query = `
                INSERT INTO matches (id, match_number, home_team_id, away_team_id, group_id, start_time, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
            `;
      const result = await this.db.query(query, [
        snap.id,
        snap.match_number,
        snap.home_team_id,
        snap.away_team_id,
        snap.group_id,
        snap.start_time,
        snap.status,
      ]);
      inserted.push(result.rows[0] as MatchData);
    }
    return inserted;
  }

  public async insertMatch(matchData: any): Promise<void> {
    const query = `
            INSERT INTO matches (id, match_number, home_team_id, away_team_id, group_id, start_time, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
    await this.db.query(query, [
      matchData.id,
      matchData.match_number,
      matchData.home_team_id,
      matchData.away_team_id,
      matchData.group_id,
      matchData.start_time,
      matchData.status,
    ]);
  }

  public async updateMatchTimes(updates: ScheduleUpdate[]): Promise<void> {
    for (const update of updates) {
      await this.db.query(
        "UPDATE matches SET start_time = $1, end_time = $2 WHERE id = $3",
        [update.start_time, update.end_time, update.match_id],
      );
    }
  }

  public async fetchCompleteMatchHistory(): Promise<Record<string, string[]>> {
    const query =
      "SELECT home_team_id, away_team_id FROM matches WHERE status = 'BEENDET'";
    const result = await this.db.query(query);

    const history: Record<string, string[]> = {};
    for (const row of result.rows) {
      if (row.home_team_id && row.away_team_id) {
        if (!history[row.home_team_id]) history[row.home_team_id] = [];
        if (!history[row.away_team_id]) history[row.away_team_id] = [];
        history[row.home_team_id].push(row.away_team_id);
        history[row.away_team_id].push(row.home_team_id);
      }
    }
    return history;
  }

  public async fetchMaxMatchNumber(): Promise<number> {
    const result = await this.db.query(
      "SELECT MAX(match_number) as max_num FROM matches",
    );
    return result.rows[0].max_num || 0;
  }

  public async recalculateMatchNumbers(): Promise<void> {
    const query = `
            WITH sorted_matches AS (
                SELECT m.id, ROW_NUMBER() OVER (ORDER BY m.start_time ASC, g.field_numbers[1] ASC, g.name ASC) as new_number
                FROM matches m
                JOIN groups g ON m.group_id = g.id
            )
            UPDATE matches
            SET match_number = sm.new_number
            FROM sorted_matches sm
            WHERE matches.id = sm.id;
        `;
    await this.db.query(query);
  }
}
