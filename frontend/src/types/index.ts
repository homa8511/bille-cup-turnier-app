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

// Diese Schnittstelle definiert eine Infobox auf der Startseite.
export interface InfoBox {
  id: string;
  icon: string;
  title: string;
  content: string;
}

// Diese Schnittstelle definiert die globalen Turniereinstellungen.
export interface GlobalSettings {
  tournament_name: string | null;
  match_duration_minutes: number;
  pause_duration_minutes: number;
  phase_start_time: string | null;
  tournament_logo_path: string | null;
  background_image_path: string | null;
  background_image_mobile_path: string | null;
  footer_text_de: string | null;
  footer_text_en: string | null;
}

// Diese Schnittstelle definiert einen Eintrag in der Setzliste.
export interface SeedingItem {
  team_id: string;
  vorrunden_platz: number;
  assigned_group: string;
  potIndex?: number;
  conflict_with_team_id?: string | null;
  conflict_resolved?: boolean;
  stats?: {
    points: number;
    goal_diff: number;
    goals_scored: number;
  };
}
