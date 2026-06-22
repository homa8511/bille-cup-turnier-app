import { PlayCircle } from "lucide-react";
import type { Group, Match, Team } from "../../types";
import { MatchCard } from "./MatchCard";

interface TimeSlotProps {
  time: string;
  matches: Match[];
  isAdmin: boolean;
  onStartRound: (time: string) => void;
  onUpdateResult: (matchId: string, home: number, away: number) => void;
  t: any;
  teams?: Team[];
  groups?: Group[];
}

export function TimeSlot({
  time,
  matches,
  isAdmin,
  onStartRound,
  onUpdateResult,
  t,
  teams = [],
  groups = [],
}: TimeSlotProps) {
  const canStartRound = matches.some((m) => m.status === "GEPLANT");

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center bg-slate-200 dark:bg-slate-800 px-4 py-2 rounded-t-lg">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
          {new Date(time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          Uhr
        </h3>

        {isAdmin && canStartRound && (
          <button
            onClick={() => onStartRound(time)}
            className="flex items-center gap-2 bg-green-500 hover:bg-blue-500 text-white dark:bg-green-200 dark:hover:bg-blue-200 dark:text-slate-900 px-4 py-1.5 rounded-md text-sm font-semibold transition-colors shadow-sm"
          >
            <PlayCircle className="w-4 h-4" />
            Alle anpfeifen
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-t-0 border-slate-200 dark:border-slate-800 rounded-b-lg">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            group={groups.find((g) => g.id === match.group_id)}
            homeTeam={teams.find((tm) => tm.id === match.home_team_id)}
            awayTeam={teams.find((tm) => tm.id === match.away_team_id)}
            isAdmin={isAdmin}
            onUpdateResult={onUpdateResult}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}
