import { PostgresClient } from '../database/PostgresClient';
import { Match, SwissPairing, ScheduleUpdate } from '../../domain/models/Tournament';

// Dieses Repository kapselt alle Datenbankzugriffe für die Entitäten der Spiele.
export class MatchRepository {
    private db: PostgresClient;

    constructor() {
        this.db = PostgresClient.getInstance();
    }

    // Diese Methode lädt alle beendeten Spiele einer Gruppe, um die Tabelle zu berechnen.
    public async fetchCompletedMatchesByGroup(groupId: string): Promise<Match[]> {
        const query = `
            SELECT * FROM matches 
            WHERE group_id = $1 AND status = 'BEENDET'
        `;
        const result = await this.db.query(query, [groupId]);
        return result.rows;
    }

    // Diese Methode lädt alle Spiele einer bestimmten Turnierphase, z.B. für die Zeitplanung.
    public async fetchMatchesByPhase(phase: string): Promise<Match[]> {
        const query = `
            SELECT m.* FROM matches m
            JOIN groups g ON m.group_id = g.id
            WHERE g.phase = $1
            ORDER BY m.group_id, m.match_number ASC
        `;
        const result = await this.db.query(query, [phase]);
        return result.rows;
    }

    // Diese Methode speichert ein Spielergebnis und aktualisiert den Status.
    public async updateMatchResult(matchId: string, goalsHome: number, goalsAway: number, status: string): Promise<Match | null> {
        const query = `
            UPDATE matches 
            SET goals_home = $1, 
                goals_away = $2, 
                status = $3 
            WHERE id = $4 
            RETURNING *
        `;
        const result = await this.db.query(query, [goalsHome, goalsAway, status, matchId]);
        return result.rows[0] || null;
    }

    // Diese Methode speichert die generierten Paarungen für eine Schweizer-System-Runde.
    public async insertGeneratedPairings(groupId: string, pairings: SwissPairing[]): Promise<void> {
        // Ermittelt die nächste freie Spielnummer für diese Gruppe.
        const maxNumberQuery = `SELECT MAX(match_number) as max_num FROM matches WHERE group_id = $1`;
        const maxNumberResult = await this.db.query(maxNumberQuery, [groupId]);
        let nextMatchNumber = (maxNumberResult.rows[0]?.max_num || 0) + 1;

        for (const pairing of pairings) {
            const insertQuery = `
                INSERT INTO matches (match_number, home_team_id, away_team_id, group_id, status)
                VALUES ($1, $2, $3, $4, 'GEPLANT')
            `;
            await this.db.query(insertQuery, [
                nextMatchNumber++, 
                pairing.home.team_id, 
                pairing.away.team_id, 
                groupId
            ]);
        }
    }

    // Diese Methode aktualisiert die Start- und Endzeiten für eine Liste von Spielen.
    public async updateMatchTimes(scheduleUpdates: ScheduleUpdate[]): Promise<void> {
        for (const update of scheduleUpdates) {
            const query = `
                UPDATE matches 
                SET start_time = $1, 
                    end_time = $2 
                WHERE id = $3
            `;
            await this.db.query(query, [update.start_time, update.end_time, update.match_id]);
        }
    }

    // Diese Methode lädt die Historie aller bereits gespielten Paarungen für eine Gruppe.
    public async fetchMatchHistoryMatrix(groupId: string): Promise<Record<string, string[]>> {
        const query = `
            SELECT home_team_id, away_team_id 
            FROM matches 
            WHERE group_id = $1 AND status = 'BEENDET' AND home_team_id IS NOT NULL AND away_team_id IS NOT NULL
        `;
        const result = await this.db.query(query, [groupId]);
        
        const history: Record<string, string[]> = {};
        
        result.rows.forEach(match => {
            if (!history[match.home_team_id]) history[match.home_team_id] = [];
            if (!history[match.away_team_id]) history[match.away_team_id] = [];
            
            history[match.home_team_id].push(match.away_team_id);
            history[match.away_team_id].push(match.home_team_id);
        });
        
        return history;
    }

    // Diese Methode lädt die komplette Historie aller Paarungen über das gesamte Turnier hinweg.
    public async fetchCompleteMatchHistory(): Promise<Record<string, string[]>> {
        const query = `
            SELECT home_team_id, away_team_id 
            FROM matches 
            WHERE status = 'BEENDET' AND home_team_id IS NOT NULL AND away_team_id IS NOT NULL
        `;
        const result = await this.db.query(query);
        
        const history: Record<string, string[]> = {};
        
        result.rows.forEach(match => {
            if (!history[match.home_team_id]) history[match.home_team_id] = [];
            if (!history[match.away_team_id]) history[match.away_team_id] = [];
            
            history[match.home_team_id].push(match.away_team_id);
            history[match.away_team_id].push(match.home_team_id);
        });
        
        return history;
    }
}