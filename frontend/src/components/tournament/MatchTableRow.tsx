import { Edit2, Save, X } from "lucide-react";
import { useState } from "react";
import type { Group, Match, Team } from "../../types";
import { TeamLogo } from "../ui/TeamLogo";

interface MatchTableRowProps {
  match: Match;
  group?: Group;
  homeTeam?: Team;
  awayTeam?: Team;
  isAdmin: boolean;
  onUpdateResult: (id: string, h: number, a: number) => void;
  selectedTeam?: string;
  fieldNumber?: number | string;
  t: any;
}

export function MatchTableRow({
  match,
  group,
  homeTeam,
  awayTeam,
  isAdmin,
  onUpdateResult,
  selectedTeam,
  fieldNumber,
  t,
}: MatchTableRowProps) {
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

  const homeName = homeTeam?.name || match.home_placeholder || t.unknown;
  const awayName = awayTeam?.name || match.away_placeholder || t.unknown;

  let rowClasses =
    "hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group ";
  if (isLive) rowClasses += "bg-blue-50/30 dark:bg-blue-900/20";

  return (
    <tr className={rowClasses}>
      <td className="px-3 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
        {match.match_number}
      </td>
      <td className="px-2 py-3 text-center font-medium text-slate-600 dark:text-slate-400">
        {fieldNumber || group?.field_numbers?.[0] || "-"}
      </td>
      <td className="px-3 py-3 text-center font-medium text-slate-600 dark:text-slate-400">
        {formatTime(match.start_time)}
      </td>
      <td className="px-2 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
        {group?.name ? group.name.split(" ").pop() : ""}
      </td>

      <td className="px-2 py-2 w-10 text-right">
        <div className="flex justify-end">
          <TeamLogo team={homeTeam} size="w-6 h-6" />
        </div>
      </td>
      <td
        className={`px-2 py-3 text-right font-semibold w-[30%] ${match.home_team_id === selectedTeam ? "text-blue-500 dark:text-blue-200" : "text-slate-700 dark:text-slate-200"}`}
      >
        {homeName}
      </td>

      <td
        className={`px-2 py-3 text-left font-semibold w-[30%] ${match.away_team_id === selectedTeam ? "text-blue-500 dark:text-blue-200" : "text-slate-700 dark:text-slate-200"}`}
      >
        {awayName}
      </td>
      <td className="px-2 py-2 w-10 text-left">
        <div className="flex justify-start">
          <TeamLogo team={awayTeam} size="w-6 h-6" />
        </div>
      </td>

      <td className="px-4 py-3 text-center whitespace-nowrap">
        {editMode ? (
          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              min="0"
              value={homeGoals}
              onChange={(e) => setHomeGoals(parseInt(e.target.value) || 0)}
              className="w-10 h-7 text-center border rounded bg-white dark:bg-slate-900 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-200 outline-none font-bold text-xs"
            />
            <span className="font-bold text-slate-400">:</span>
            <input
              type="number"
              min="0"
              value={awayGoals}
              onChange={(e) => setAwayGoals(parseInt(e.target.value) || 0)}
              className="w-10 h-7 text-center border rounded bg-white dark:bg-slate-900 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-200 outline-none font-bold text-xs"
            />
            <button
              onClick={handleSave}
              className="p-1 text-green-500 hover:text-blue-500 dark:text-green-200 dark:hover:text-blue-200 rounded transition-colors"
              title={t.save}
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded transition-colors"
              title={t.cancel}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <span
              className={`font-bold w-12 text-center ${isFinished ? "text-slate-800 dark:text-slate-100" : isLive ? "text-blue-500 dark:text-blue-200 animate-pulse" : "text-slate-400"}`}
            >
              {isFinished
                ? `${match.goals_home} : ${match.goals_away}`
                : isLive
                  ? "LIVE"
                  : "- : -"}
            </span>
            {isAdmin && (
              <button
                onClick={() => setEditMode(true)}
                className="p-1.5 bg-green-500 hover:bg-blue-500 text-white dark:bg-green-200 dark:text-slate-900 dark:hover:bg-blue-200 rounded opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                title={t.edit}
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
