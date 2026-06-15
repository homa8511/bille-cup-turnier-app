import { PostgresClient } from '../database/PostgresClient';
import { GroupStanding, CombinedStanding, SeedingAssignment } from '../../domain/models/Tournament';

// Dieses Repository kapselt alle Datenbankzugriffe für die Entitäten der Gruppen.
export class GroupRepository {
    private db: PostgresClient;

    constructor() {
        this.db = PostgresClient.getInstance();
    }

    // Diese Methode lädt die aktuelle Tabelle einer spezifischen Gruppe aus der Datenbank.
    public async fetchStandingsForGroup(groupId: string): Promise<GroupStanding[]> {
        const query = `
            SELECT team_id, points, matches_played, goals_scored, goals_conceded, 
                   (goals_scored - goals_conceded) AS goal_diff, rank
            FROM group_teams
            WHERE group_id = $1
            ORDER BY rank ASC
        `;
        const result = await this.db.query(query, [groupId]);
        return result.rows;
    }

    // Diese Methode lädt die gebündelte Tabelle einer kompletten Turnierphase.
    public async fetchOverallStandings(phase: string): Promise<CombinedStanding[]> {
        const query = `
            SELECT gt.team_id, 
                   SUM(gt.points)::int as total_points, 
                   SUM(gt.goals_scored)::int as total_scored, 
                   SUM(gt.goals_conceded)::int as total_conceded,
                   (SUM(gt.goals_scored) - SUM(gt.goals_conceded))::int as goal_diff
            FROM group_teams gt
            JOIN groups g ON gt.group_id = g.id
            WHERE g.phase = $1
            GROUP BY gt.team_id
            ORDER BY total_points DESC, goal_diff DESC, total_scored DESC
        `;
        const result = await this.db.query(query, [phase]);
        
        return result.rows.map((row, index) => ({
            ...row,
            final_rank: index + 1
        }));
    }

    // Diese Methode lädt die kumulierte Tabelle über mehrere Turnierphasen hinweg.
    public async fetchCombinedStandings(phases: string[]): Promise<CombinedStanding[]> {
        const placeholders = phases.map((_, i) => `$${i + 1}`).join(', ');
        const query = `
            SELECT gt.team_id, 
                   SUM(gt.points)::int as total_points, 
                   SUM(gt.goals_scored)::int as total_scored, 
                   SUM(gt.goals_conceded)::int as total_conceded,
                   (SUM(gt.goals_scored) - SUM(gt.goals_conceded))::int as goal_diff
            FROM group_teams gt
            JOIN groups g ON gt.group_id = g.id
            WHERE g.phase IN (${placeholders})
            GROUP BY gt.team_id
            ORDER BY total_points DESC, goal_diff DESC, total_scored DESC
        `;
        const result = await this.db.query(query, phases);
        
        return result.rows.map((row, index) => ({
            ...row,
            final_rank: index + 1
        }));
    }

    // Diese Methode speichert die neu berechnete Setzliste für die Zwischenrunde in der Datenbank.
    public async updateAssignedGroups(newSeeding: SeedingAssignment[]): Promise<void> {
        for (const seed of newSeeding) {
            // Sucht die ID der entsprechenden Zwischenrunden-Gruppe anhand des Namens.
            const groupQuery = `SELECT id FROM groups WHERE name = $1 AND phase = 'ZWISCHENRUNDE' LIMIT 1`;
            const groupResult = await this.db.query(groupQuery, [seed.assigned_group]);
            
            if (groupResult.rows.length > 0) {
                const groupId = groupResult.rows[0].id;
                
                const insertQuery = `
                    INSERT INTO group_teams (group_id, team_id, points, matches_played, goals_scored, goals_conceded, rank)
                    VALUES ($1, $2, 0, 0, 0, 0, 0)
                    ON CONFLICT (group_id, team_id) DO NOTHING
                `;
                await this.db.query(insertQuery, [groupId, seed.team_id]);
            }
        }
    }

    // Diese Methode ordnet die Mannschaften für die Finalrunde den entsprechenden Leistungsklassen zu.
    public async assignFinalRoundGroups(gold: CombinedStanding[], silver: CombinedStanding[]): Promise<void> {
        // Sucht die ID der Goldrunde.
        const goldQuery = `SELECT id FROM groups WHERE name = 'Goldrunde' AND phase = 'FINALRUNDE' LIMIT 1`;
        const goldResult = await this.db.query(goldQuery);
        
        // Sucht die ID der Silberrunde.
        const silverQuery = `SELECT id FROM groups WHERE name = 'Silberrunde' AND phase = 'FINALRUNDE' LIMIT 1`;
        const silverResult = await this.db.query(silverQuery);

        if (goldResult.rows.length > 0) {
            const goldGroupId = goldResult.rows[0].id;
            for (const team of gold) {
                const insertQuery = `
                    INSERT INTO group_teams (group_id, team_id, points, matches_played, goals_scored, goals_conceded, rank)
                    VALUES ($1, $2, 0, 0, 0, 0, 0)
                    ON CONFLICT (group_id, team_id) DO NOTHING
                `;
                await this.db.query(insertQuery, [goldGroupId, team.team_id]);
            }
        }

        if (silverResult.rows.length > 0) {
            const silverGroupId = silverResult.rows[0].id;
            for (const team of silver) {
                const insertQuery = `
                    INSERT INTO group_teams (group_id, team_id, points, matches_played, goals_scored, goals_conceded, rank)
                    VALUES ($1, $2, 0, 0, 0, 0, 0)
                    ON CONFLICT (group_id, team_id) DO NOTHING
                `;
                await this.db.query(insertQuery, [silverGroupId, team.team_id]);
            }
        }
    }

    // Diese Methode lädt alle grundlegenden Team-Informationen für eine spezifische Gruppe.
    public async fetchTeamsByGroup(groupId: string): Promise<{ id: string }[]> {
        const query = `SELECT team_id AS id FROM group_teams WHERE group_id = $1`;
        const result = await this.db.query(query, [groupId]);
        return result.rows;
    }

    // Diese Methode speichert die neu berechneten Tabellenstände einer Gruppe in der Datenbank.
    public async updateStandings(groupId: string, newStandings: GroupStanding[]): Promise<void> {
        for (const standing of newStandings) {
            const query = `
                UPDATE group_teams 
                SET points = $1, 
                    matches_played = $2, 
                    goals_scored = $3, 
                    goals_conceded = $4, 
                    rank = $5
                WHERE group_id = $6 AND team_id = $7
            `;
            await this.db.query(query, [
                standing.points,
                standing.matches_played,
                standing.goals_scored,
                standing.goals_conceded,
                standing.rank,
                groupId,
                standing.team_id
            ]);
        }
    }
}