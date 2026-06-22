import { Edit, Save, X } from "lucide-react";
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

  const homeName = homeTeam?.name || match.home_placeholder || t.unknown;
  const awayName = awayTeam?.name || match.away_placeholder || t.unknown;

  let rowClasses =
    "transition-colors border-b last:border-0 dark:border-slate-700 ";
  if (isLive) rowClasses += "bg-green-50/30 dark:bg-green-900/10";
  else rowClasses += "hover:bg-slate-50 dark:hover:bg-slate-700/50";

  const formatTime = (iso: string) => {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString(t.localeCode || "de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
        {group?.name?.split(" ").pop()}
      </td>

      <td className="px-2 py-2 w-10 text-right">
        <div className="flex justify-end">
          <TeamLogo team={homeTeam} size="w-7 h-7" />
        </div>
      </td>
      <td
        className={`px-2 py-3 text-right font-semibold w-[35%] ${match.home_team_id === selectedTeam ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`}
      >
        {homeName}
      </td>
      <td
        className={`px-2 py-3 text-left font-semibold w-[35%] ${match.away_team_id === selectedTeam ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`}
      >
        {awayName}
      </td>
      <td className="px-2 py-2 w-10 text-left">
        <div className="flex justify-start">
          <TeamLogo team={awayTeam} size="w-7 h-7" />
        </div>
      </td>

      <td className="px-4 py-3 text-center font-bold whitespace-nowrap text-slate-800 dark:text-slate-100 min-w-[120px]">
        {editMode ? (
          <div className="flex items-center justify-center gap-1">
            <input
              type="number"
              min="0"
              value={hScore}
              onChange={(e) =>
                setHScore(e.target.value === "" ? 0 : Number(e.target.value))
              }
              className="w-10 text-center border rounded dark:bg-slate-900 dark:border-slate-600 outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span>:</span>
            <input
              type="number"
              min="0"
              value={aScore}
              onChange={(e) =>
                setAScore(e.target.value === "" ? 0 : Number(e.target.value))
              }
              className="w-10 text-center border rounded dark:bg-slate-900 dark:border-slate-600 outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSave}
              className="ml-2 bg-green-600 text-white p-1 rounded hover:bg-green-700"
            >
              <Save className="w-3 h-3" />
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="ml-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 p-1 rounded hover:bg-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span>
              {isFinished ? (
                `${match.goals_home} : ${match.goals_away}`
              ) : isLive ? (
                <span className="text-green-600 animate-pulse">0 : 0</span>
              ) : (
                "- : -"
              )}
            </span>
            {isAdmin && (isLive || isFinished) && (
              <button
                onClick={startEditing}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded transition"
              >
                <Edit className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
