import { Clock, Edit, Save, X } from "lucide-react";
import { useState } from "react";
import type { Group, Match, Team } from "../../types";
import { TeamLogo } from "../ui/TeamLogo";

interface MatchCardProps {
  match: Match;
  group?: Group;
  homeTeam?: Team;
  awayTeam?: Team;
  isAdmin: boolean;
  onUpdateResult: (id: string, h: number, a: number) => void;
  fieldNumber?: number | string;
  t: any;
}

export function MatchCard({
  match,
  group,
  homeTeam,
  awayTeam,
  isAdmin,
  onUpdateResult,
  fieldNumber,
  t,
}: MatchCardProps) {
  const [editMode, setEditMode] = useState(false);
  const [hScore, setHScore] = useState<number | "">(
    match.goals_home !== null ? match.goals_home : 0,
  );
  const [aScore, setAScore] = useState<number | "">(
    match.goals_away !== null ? match.goals_away : 0,
  );

  const startEditing = () => {
    setHScore(match.goals_home !== null ? match.goals_home : 0);
    setAScore(match.goals_away !== null ? match.goals_away : 0);
    setEditMode(true);
  };

  const handleSave = () => {
    if (typeof hScore === "number" && typeof aScore === "number") {
      onUpdateResult(match.id, hScore, aScore);
      setEditMode(false);
    }
  };

  const isLive = match.status === "LIVE";
  const isFinished = match.status === "BEENDET";

  const getScoreColor = (myGoals: number | null, oppGoals: number | null) => {
    if (!isFinished || myGoals === null || oppGoals === null) {
      return "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300";
    }
    if (myGoals > oppGoals) return "bg-green-500 text-white shadow-sm";
    if (myGoals < oppGoals) return "bg-red-500 text-white shadow-sm";
    return "bg-yellow-500 text-white shadow-sm";
  };

  const formatTime = (iso: string) => {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString(t.localeCode || "de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const groupNameText =
    group?.name?.length === 1
      ? `${t.groupWord || "Gruppe"} ${group.name}`
      : group?.name || "";

  const homeName = homeTeam?.name || match.home_placeholder || t.unknown;
  const awayName = awayTeam?.name || match.away_placeholder || t.unknown;

  return (
    <div
      className={`rounded-xl border shadow-sm overflow-hidden flex flex-col transition-colors relative ${isLive ? "border-green-400 ring-1 ring-green-400 dark:border-green-600" : "border-gray-200 dark:border-slate-700"} bg-white dark:bg-slate-800`}
    >
      <div className="bg-slate-100 dark:bg-slate-900/60 px-4 py-2 flex justify-between items-center border-b border-gray-100 dark:border-slate-700">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          {groupNameText}
        </span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3" /> {formatTime(match.start_time)} •{" "}
          {t.field} {fieldNumber || group?.field_numbers?.[0] || "-"}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3 flex-1 overflow-hidden pr-2">
            <TeamLogo team={homeTeam} size="w-8 h-8" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-base">
              {homeName}
            </span>
          </div>

          <div className="shrink-0">
            {editMode ? (
              <input
                type="number"
                min="0"
                className="w-10 h-10 text-center border rounded-lg bg-slate-50 dark:bg-slate-900 text-base font-bold outline-none focus:ring-2 focus:ring-blue-500"
                value={hScore}
                onChange={(e) =>
                  setHScore(e.target.value === "" ? 0 : Number(e.target.value))
                }
              />
            ) : (
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-base shadow-sm ${getScoreColor(match.goals_home, match.goals_away)}`}
              >
                {isFinished ? match.goals_home : isLive ? "0" : "-"}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3 flex-1 overflow-hidden pr-2">
            <TeamLogo team={awayTeam} size="w-8 h-8" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-base">
              {awayName}
            </span>
          </div>

          <div className="shrink-0">
            {editMode ? (
              <input
                type="number"
                min="0"
                className="w-10 h-10 text-center border rounded-lg bg-slate-50 dark:bg-slate-900 text-base font-bold outline-none focus:ring-2 focus:ring-blue-500"
                value={aScore}
                onChange={(e) =>
                  setAScore(e.target.value === "" ? 0 : Number(e.target.value))
                }
              />
            ) : (
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-base shadow-sm ${getScoreColor(match.goals_away, match.goals_home)}`}
              >
                {isFinished ? match.goals_away : isLive ? "0" : "-"}
              </div>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="mt-2 pt-3 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2 relative z-10">
            {editMode ? (
              <>
                <button
                  onClick={() => setEditMode(false)}
                  className="flex-1 px-3 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" /> Abbrechen
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-3 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center justify-center gap-1"
                >
                  <Save className="w-4 h-4" /> Speichern
                </button>
              </>
            ) : (
              <button
                onClick={startEditing}
                className="w-full px-3 py-2 text-sm font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg transition flex items-center justify-center gap-1"
              >
                <Edit className="w-4 h-4" /> Ergebnis eintragen
              </button>
            )}
          </div>
        )}
      </div>

      {isLive && !isAdmin && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
          <span className="font-bold text-green-500/10 dark:text-green-400/10 text-6xl tracking-widest animate-pulse -rotate-12">
            LIVE
          </span>
        </div>
      )}
    </div>
  );
}
