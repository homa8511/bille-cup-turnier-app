// Diese Datei definiert die strikten Verträge für alle Turnier-Entitäten im Domain-Layer.

export type TournamentPhase = 'VORRUNDE' | 'ZWISCHENRUNDE' | 'FINALRUNDE';
export type MatchStatus = 'GEPLANT' | 'LIVE' | 'BEENDET';

export interface Team {
    id: string;
    name: string;
    logo_path?: string;
    created_at?: Date;
}

export interface Group {
    id: string;
    name: string;
    phase: TournamentPhase;
    field_number: number;
}

export interface GroupStanding {
    team_id: string;
    points: number;
    matches_played: number;
    goals_scored: number;
    goals_conceded: number;
    goal_diff: number;
    rank: number;
}

export interface CombinedStanding {
    team_id: string;
    total_points: number;
    total_scored: number;
    total_conceded: number;
    goal_diff: number;
    final_rank: number;
}

export interface Match {
    id: string;
    match_number: number;
    home_team_id: string | null;
    away_team_id: string | null;
    goals_home: number | null;
    goals_away: number | null;
    group_id: string;
    start_time: Date | null;
    end_time: Date | null;
    status: MatchStatus;
}

export interface SwissPairing {
    home: { team_id: string; rank: number };
    away: { team_id: string; rank: number };
}

export interface SeedingAssignment {
    team_id: string;
    original_rank: number;
    assigned_group: string;
}

export interface FinalGroupsAllocation {
    gold: CombinedStanding[];
    silver: CombinedStanding[];
}

export interface ScheduleUpdate {
    match_id: string;
    start_time: Date;
    end_time: Date;
}