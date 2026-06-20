import { Clock, Save } from "lucide-react";
import { useState } from "react";
import type { Match, Team } from "../../types";

// Diese Schnittstelle definiert die Eigenschaften der Spielkarte.
interface MatchCardProps {
  match: Match;
  homeTeam?: Team;
  awayTeam?: Team;
  isAdmin: boolean;
  onUpdateResult: (matchId: string, home: number, away: number) => void;
}

// Diese Komponente stellt ein einzelnes Spiel optisch dar.
export function MatchCard({
  match,
  homeTeam,
  awayTeam,
  isAdmin,
  onUpdateResult,
}: MatchCardProps) {
  const isLive = match.status === "LIVE";
  const isFinished = match.status === "BEENDET";

  const [editGoalsHome, setEditGoalsHome] = useState<number | "">(
    match.goals_home ?? "",
  );
  const [editGoalsAway, setEditGoalsAway] = useState<number | "">(
    match.goals_away ?? "",
  );

  const homeName = homeTeam?.name || match.home_placeholder || "Unbekannt";
  const awayName = awayTeam?.name || match.away_placeholder || "Unbekannt";

  // Diese Funktion verarbeitet das Speichern des Ergebnisses.
  const handleSave = () => {
    if (
      typeof editGoalsHome === "number" &&
      typeof editGoalsAway === "number"
    ) {
      onUpdateResult(match.id, editGoalsHome, editGoalsAway);
    }
  };

  // Diese Funktion formatiert die Startzeit des Spiels.
  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Diese Funktion ermittelt die Hintergrundfarbe für das Ergebnis.
  const getScoreBoxColor = (
    myGoals: number | null,
    oppGoals: number | null,
  ) => {
    if (!isFinished || myGoals === null || oppGoals === null)
      return "bg-slate-200 dark:bg-slate-700 text-slate-500";
    if (myGoals > oppGoals) return "bg-green-500 text-white";
    if (myGoals < oppGoals) return "bg-red-500 text-white";
    return "bg-yellow-500 text-white";
  };

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border ${isLive ? "border-green-500 ring-1 ring-green-500" : "border-gray-200 dark:border-slate-700"} overflow-hidden relative`}
    >
      <div className="bg-slate-100 dark:bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 flex justify-between items-center border-b border-gray-100 dark:border-slate-700">
        <span>Spiel {match.match_number}</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTime(match.start_time)}
        </span>
      </div>

      <div className="p-3 space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-sm truncate pr-2">
            {homeName}
          </span>

          {isAdmin && isLive ? (
            <input
              type="number"
              min="0"
              value={editGoalsHome}
              onChange={(e) =>
                setEditGoalsHome(
                  e.target.value === "" ? "" : parseInt(e.target.value),
                )
              }
              className="w-12 h-8 text-center border rounded bg-slate-50 dark:bg-slate-900 text-sm font-bold"
            />
          ) : (
            <div
              className={`w-8 h-8 flex items-center justify-center rounded font-bold text-sm ${getScoreBoxColor(match.goals_home, match.goals_away)}`}
            >
              {isFinished ? match.goals_home : "-"}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <span className="font-semibold text-sm truncate pr-2">
            {awayName}
          </span>

          {isAdmin && isLive ? (
            <input
              type="number"
              min="0"
              value={editGoalsAway}
              onChange={(e) =>
                setEditGoalsAway(
                  e.target.value === "" ? "" : parseInt(e.target.value),
                )
              }
              className="w-12 h-8 text-center border rounded bg-slate-50 dark:bg-slate-900 text-sm font-bold"
            />
          ) : (
            <div
              className={`w-8 h-8 flex items-center justify-center rounded font-bold text-sm ${getScoreBoxColor(match.goals_away, match.goals_home)}`}
            >
              {isFinished ? match.goals_away : "-"}
            </div>
          )}
        </div>

        {isAdmin && isLive && (
          <button
            onClick={handleSave}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-sm font-semibold transition"
          >
            <Save className="w-4 h-4" /> Speichern
          </button>
        )}

        {isLive && !isAdmin && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <span className="font-bold text-green-500 text-3xl tracking-widest animate-pulse">
              LIVE
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
