// Diese Schnittstelle definiert eine Mannschaft.
export interface Team {
  id: string;
  name: string;
  logo_path: string | null;
}

// Diese Schnittstelle definiert einen Tabelleneintrag.
export interface GroupStanding {
  team_id: string;
  points: number;
  matches_played: number;
  goals_scored: number;
  goals_conceded: number;
  goal_diff: number;
  rank: number;
}

// Diese Schnittstelle definiert eine Spielgruppe.
export interface Group {
  id: string;
  name: string;
  phase: string;
  field_numbers: number[];
  standings?: GroupStanding[];
}

// Diese Schnittstelle definiert ein einzelnes Spiel.
export interface Match {
  id: string;
  match_number: number;
  home_team_id: string | null;
  away_team_id: string | null;
  home_placeholder: string | null;
  away_placeholder: string | null;
  goals_home: number | null;
  goals_away: number | null;
  group_id: string;
  start_time: string;
  end_time: string;
  status: "GEPLANT" | "LIVE" | "BEENDET";
}
