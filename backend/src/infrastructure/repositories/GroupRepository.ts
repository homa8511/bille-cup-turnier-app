import {
  GroupData,
  TeamData,
} from "../../domain/factories/TournamentFactories";
import {
  CombinedStanding,
  SeedingAssignment,
} from "../../domain/models/Tournament";
import { PostgresClient } from "../database/PostgresClient";

export class GroupRepository {
  private db: PostgresClient;

  constructor() {
    this.db = PostgresClient.getInstance();
  }

  public async fetchGroupById(groupId: string): Promise<GroupData | null> {
    const query = "SELECT * FROM groups WHERE id = $1";
    const result = await this.db.query(query, [groupId]);
    return (result.rows[0] as GroupData) || null;
  }

  public async fetchGroupByName(
    name: string,
    phase: string,
  ): Promise<GroupData | null> {
    const query = "SELECT * FROM groups WHERE name = $1 AND phase = $2";
    const result = await this.db.query(query, [name, phase]);
    return (result.rows[0] as GroupData) || null;
  }

  public async fetchGroupsByPhase(phase: string): Promise<GroupData[]> {
    const query = "SELECT * FROM groups WHERE phase = $1 ORDER BY name ASC";
    const result = await this.db.query(query, [phase]);
    return result.rows as GroupData[];
  }

  public async fetchTeamsByGroup(groupId: string): Promise<TeamData[]> {
    const query = `
            SELECT t.* FROM teams t 
            JOIN group_teams gt ON t.id = gt.team_id 
            WHERE gt.group_id = $1
        `;
    const result = await this.db.query(query, [groupId]);
    return result.rows as TeamData[];
  }

  public async fetchStandingsForGroup(groupId: string): Promise<any[]> {
    const query =
      "SELECT * FROM group_teams WHERE group_id = $1 ORDER BY rank ASC";
    const result = await this.db.query(query, [groupId]);
    return result.rows;
  }

  // ACHTUNG FIX: Hier lag der Fehler! Die Abfrage erzwingt jetzt zuerst die Sortierung nach der internen Gruppenplatzierung (group_rank).
  public async fetchOverallStandings(
    phase: string,
  ): Promise<CombinedStanding[]> {
    const query = `
            SELECT gt.team_id, 
                   SUM(gt.points)::int as total_points, 
                   SUM(gt.goals_scored)::int as total_scored, 
                   SUM(gt.goals_conceded)::int as total_conceded, 
                   (SUM(gt.goals_scored) - SUM(gt.goals_conceded))::int as goal_diff,
                   MIN(gt.rank)::int as group_rank
            FROM group_teams gt
            JOIN groups g ON gt.group_id = g.id
            WHERE g.phase = $1
            GROUP BY gt.team_id
            ORDER BY group_rank ASC, total_points DESC, goal_diff DESC, total_scored DESC
        `;
    const result = await this.db.query(query, [phase]);
    return result.rows as CombinedStanding[];
  }

  public async fetchCombinedStandings(
    phases: string[],
  ): Promise<CombinedStanding[]> {
    const placeholders = phases.map((_, i) => `$${i + 1}`).join(",");
    const query = `
            SELECT gt.team_id, SUM(gt.points)::int as total_points, SUM(gt.goals_scored)::int as total_scored, 
                   SUM(gt.goals_conceded)::int as total_conceded, (SUM(gt.goals_scored) - SUM(gt.goals_conceded))::int as goal_diff
            FROM group_teams gt
            JOIN groups g ON gt.group_id = g.id
            WHERE g.phase IN (${placeholders})
            GROUP BY gt.team_id
            ORDER BY total_points DESC, goal_diff DESC, total_scored DESC
        `;
    const result = await this.db.query(query, phases);
    return result.rows as CombinedStanding[];
  }

  public async updateStandings(
    groupId: string,
    standings: any[],
  ): Promise<void> {
    for (const stat of standings) {
      const query = `
                UPDATE group_teams 
                SET points = $1, matches_played = $2, goals_scored = $3, goals_conceded = $4, rank = $5 
                WHERE group_id = $6 AND team_id = $7
            `;
      await this.db.query(query, [
        stat.points,
        stat.matches_played,
        stat.goals_scored,
        stat.goals_conceded,
        stat.rank,
        groupId,
        stat.team_id,
      ]);
    }
  }

  public async updateAssignedGroups(
    seeding: SeedingAssignment[],
  ): Promise<void> {
    for (const assign of seeding) {
      const groupQuery = "SELECT id FROM groups WHERE name = $1 AND phase = $2";
      const groupResult = await this.db.query(groupQuery, [
        assign.assigned_group,
        "ZWISCHENRUNDE",
      ]);
      if (groupResult.rows.length > 0) {
        const groupId = groupResult.rows[0].id;
        await this.db.query(
          "INSERT INTO group_teams (group_id, team_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [groupId, assign.team_id],
        );
      }
    }
  }

  public async assignFinalRoundGroups(
    gold: CombinedStanding[],
    silver: CombinedStanding[],
  ): Promise<void> {
    const goldGroupResult = await this.db.query(
      "SELECT id FROM groups WHERE name = $1 AND phase = $2",
      ["Goldrunde", "FINALRUNDE"],
    );
    const silverGroupResult = await this.db.query(
      "SELECT id FROM groups WHERE name = $1 AND phase = $2",
      ["Silberrunde", "FINALRUNDE"],
    );

    if (goldGroupResult.rows.length > 0) {
      const goldId = goldGroupResult.rows[0].id;
      for (const team of gold) {
        await this.db.query(
          "INSERT INTO group_teams (group_id, team_id) VALUES ($1, $2)",
          [goldId, team.team_id],
        );
      }
    }

    if (silverGroupResult.rows.length > 0) {
      const silverId = silverGroupResult.rows[0].id;
      for (const team of silver) {
        await this.db.query(
          "INSERT INTO group_teams (group_id, team_id) VALUES ($1, $2)",
          [silverId, team.team_id],
        );
      }
    }
  }
}
