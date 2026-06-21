// Diese Schnittstelle definiert eine Paarung im Schweizer System.
export interface SwissPairing {
  home: { team_id: string; rank: number };
  away: { team_id: string; rank: number };
}

// Diese Schnittstelle beschreibt eine Zuweisung in der Setzliste.
export interface SeedingAssignment {
  team_id: string;
  original_rank: number;
  assigned_group: string;
}

// Diese Schnittstelle bündelt die kombinierte Tabellenplatzierung über mehrere Runden.
export interface CombinedStanding {
  team_id: string;
  total_points: number;
  total_scored: number;
  total_conceded: number;
  goal_diff: number;
  final_rank: number;
}

// Diese Schnittstelle strukturiert die Aufteilung in die Finalgruppen.
export interface FinalGroupsAllocation {
  gold: CombinedStanding[];
  silver: CombinedStanding[];
}

// Diese Schnittstelle enthält die Daten für eine zeitliche Spielplanänderung.
export interface ScheduleUpdate {
  match_id: string;
  start_time: Date;
  end_time: Date;
}
