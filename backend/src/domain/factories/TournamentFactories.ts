import * as crypto from "crypto";
import { Group } from "../models/Group";
import { Match } from "../models/Match";
import { Team } from "../models/Team";

// Diese Schnittstellen definieren die rohen Datenstrukturen aus der Datenbank.

export interface TeamData {
  id: string;
  name: string;
  logo_path: string | null;
}

export interface GroupData {
  id: string;
  name: string;
  phase: string;
  field_numbers: number[];
}

export interface MatchData {
  id: string;
  group_id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_placeholder: string | null;
  away_placeholder: string | null;
  goals_home: number | null;
  goals_away: number | null;
  status: string;
  match_number: number;
  start_time: string | null;
  end_time: string | null;
}

// Diese Klassen erzeugen valide Entitäten aus rohen Daten oder erzeugen völlig neue Objekte.

export class TeamFactory {
  public static createFromData(data: TeamData): Team {
    return new Team(data.id, data.name, data.logo_path);
  }
}

export class GroupFactory {
  public static createFromData(data: GroupData): Group {
    return new Group(data.id, data.name, data.phase, data.field_numbers);
  }
}

export class MatchFactory {
  public static createFromData(data: MatchData): Match {
    return new Match(
      data.id,
      data.group_id,
      data.home_team_id,
      data.away_team_id,
      data.match_number,
      data.home_placeholder,
      data.away_placeholder,
      data.goals_home,
      data.goals_away,
      data.status as "GEPLANT" | "LIVE" | "BEENDET",
      data.start_time,
      data.end_time,
    );
  }

  public static createPlaceholderMatch(
    groupId: string,
    matchNumber: number,
    homePlaceholder: string,
    awayPlaceholder: string,
    startTime: string,
  ): Match {
    const id = crypto.randomUUID();
    return new Match(
      id,
      groupId,
      null,
      null,
      matchNumber,
      homePlaceholder,
      awayPlaceholder,
      null,
      null,
      "GEPLANT",
      startTime,
      null,
    );
  }

  public static createNewMatch(
    groupId: string,
    homeTeamId: string,
    awayTeamId: string,
    matchNumber: number,
    startTime: string,
  ): Match {
    if (homeTeamId === awayTeamId) {
      throw new Error("Eine Mannschaft kann nicht gegen sich selbst spielen.");
    }

    const id = crypto.randomUUID();
    return new Match(
      id,
      groupId,
      homeTeamId,
      awayTeamId,
      matchNumber,
      null,
      null,
      null,
      null,
      "GEPLANT",
      startTime,
      null,
    );
  }
}
