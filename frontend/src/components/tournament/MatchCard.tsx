import { Clock, Save, X } from "lucide-react";
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
  const [homeGoals, setHomeGoals] = useState(match.goals_home ?? 0);
  const [awayGoals, setAwayGoals] = useState(match.goals_away ?? 0);

  const isLive = match.status === "LIVE";
  const isFinished = match.status === "BEENDET";

  const formatTime = (iso: string | null) => {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString(t.localeCode || "de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSave = () => {
    onUpdateResult(match.id, homeGoals, awayGoals);
    setEditMode(false);
  };

  const getScoreBoxColor = (
    myGoals: number | null,
    oppGoals: number | null,
    isFin: boolean,
  ) => {
    if (!isFin || myGoals === null || oppGoals === null)
      return "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400";
    if (myGoals > oppGoals)
      return "bg-green-500 text-white dark:bg-green-200 dark:text-slate-900 shadow-sm";
    if (myGoals < oppGoals) return "bg-red-500 text-white shadow-sm";
    return "bg-slate-400 text-white shadow-sm";
  };

  const homeName = homeTeam?.name || match.home_placeholder || t.unknown;
  const awayName = awayTeam?.name || match.away_placeholder || t.unknown;
  const groupNameText =
    group?.name?.length === 1
      ? `${t.groupWord || "Gruppe"} ${group.name}`
      : group?.name || "";

  return (
    <div
      className={`rounded-xl border shadow-sm overflow-hidden flex flex-col transition-colors relative ${isLive ? "border-blue-500 ring-1 ring-blue-500 dark:border-blue-200 dark:ring-blue-200" : "border-gray-200 dark:border-slate-700"} bg-white dark:bg-slate-800`}
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
      <div className="p-4 flex flex-col gap-3 relative">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <TeamLogo team={homeTeam} size="w-8 h-8" />
            <span
              className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate max-w-[120px]"
              title={homeName}
            >
              {homeName}
            </span>
          </div>
          {editMode ? (
            <input
              type="number"
              min="0"
              value={homeGoals}
              onChange={(e) => setHomeGoals(parseInt(e.target.value) || 0)}
              className="w-12 h-8 text-center border rounded bg-white dark:bg-slate-900 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-200 outline-none font-bold"
            />
          ) : (
            <div
              className={`w-8 h-8 flex items-center justify-center rounded font-bold text-sm transition-colors ${getScoreBoxColor(match.goals_home, match.goals_away, isFinished)}`}
            >
              {isFinished ? match.goals_home : "-"}
            </div>
          )}
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <TeamLogo team={awayTeam} size="w-8 h-8" />
            <span
              className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate max-w-[120px]"
              title={awayName}
            >
              {awayName}
            </span>
          </div>
          {editMode ? (
            <input
              type="number"
              min="0"
              value={awayGoals}
              onChange={(e) => setAwayGoals(parseInt(e.target.value) || 0)}
              className="w-12 h-8 text-center border rounded bg-white dark:bg-slate-900 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-200 outline-none font-bold"
            />
          ) : (
            <div
              className={`w-8 h-8 flex items-center justify-center rounded font-bold text-sm transition-colors ${getScoreBoxColor(match.goals_away, match.goals_home, isFinished)}`}
            >
              {isFinished ? match.goals_away : "-"}
            </div>
          )}
        </div>
        {isLive && !editMode && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <span className="font-bold text-blue-500 dark:text-blue-200 text-3xl tracking-widest animate-pulse">
              LIVE
            </span>
          </div>
        )}
      </div>
      {isAdmin && (
        <div className="bg-slate-50 dark:bg-slate-900/40 border-t border-gray-100 dark:border-slate-700 p-2 flex justify-end gap-2">
          {editMode ? (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> {t.cancel}
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-xs font-semibold bg-green-500 hover:bg-blue-500 text-white dark:bg-green-200 dark:hover:bg-blue-200 dark:text-slate-900 rounded shadow-sm transition-colors flex items-center gap-1"
              >
                <Save className="w-3 h-3" /> {t.save}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="w-full py-1.5 text-xs font-semibold bg-green-500 hover:bg-blue-500 text-white dark:bg-green-200 dark:hover:bg-blue-200 dark:text-slate-900 rounded transition-colors"
            >
              {t.edit}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
