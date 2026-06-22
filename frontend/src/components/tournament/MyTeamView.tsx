import { ArrowLeft, Search } from "lucide-react";
import { useState } from "react";
import type { Group, Match, Team } from "../../types";
import { TeamLogo } from "../ui/TeamLogo";
import { GroupTable } from "./GroupTable";
import { MatchCard } from "./MatchCard";

interface MyTeamViewProps {
  teams: Team[];
  groups: Group[];
  matches: Match[];
  adminToken: string | null;
  onUpdateResult: (matchId: string, home: number, away: number) => void;
  t: any;
}

export function MyTeamView({
  teams,
  groups,
  matches,
  adminToken,
  onUpdateResult,
  t,
}: MyTeamViewProps) {
  const [selectedMyTeam, setSelectedMyTeam] = useState("");
  const [myTeamView, setMyTeamView] = useState<"MATCHES" | "STANDINGS">(
    "MATCHES",
  );
  const [teamSearchFilter, setTeamSearchFilter] = useState("");

  if (!selectedMyTeam) {
    return (
      <div className="space-y-8 w-full">
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t.search}
            value={teamSearchFilter}
            onChange={(e) => setTeamSearchFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {teams
            .filter((team) =>
              team.name.toLowerCase().includes(teamSearchFilter.toLowerCase()),
            )
            .map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedMyTeam(team.id)}
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-slate-700 flex flex-col items-center gap-4 hover:-translate-y-1"
              >
                <TeamLogo team={team} size="w-16 h-16" />
                <span className="font-bold text-center text-sm md:text-base text-slate-800 dark:text-slate-200">
                  {team.name}
                </span>
              </button>
            ))}
        </div>
      </div>
    );
  }

  const selectedTeamObj = teams.find((team) => team.id === selectedMyTeam);
  const teamMatches = matches
    .filter(
      (m) =>
        m.home_team_id === selectedMyTeam || m.away_team_id === selectedMyTeam,
    )
    .sort((a, b) => a.match_number - b.match_number);
  const teamGroups = groups.filter((g) =>
    g.standings?.some((s) => s.team_id === selectedMyTeam),
  );

  return (
    <div className="space-y-6 w-full">
      <button
        onClick={() => setSelectedMyTeam("")}
        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> {t.backToTeams}
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm border border-gray-200 dark:border-slate-700">
        <TeamLogo team={selectedTeamObj} size="w-24 h-24 md:w-32 md:h-32" />
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white text-center md:text-left">
          {selectedTeamObj?.name}
        </h2>
      </div>

      <div className="flex bg-slate-200 dark:bg-slate-800 p-1.5 rounded-xl w-full sm:w-max">
        <button
          onClick={() => setMyTeamView("MATCHES")}
          className={`flex-1 sm:flex-none px-8 py-2.5 rounded-lg font-bold text-sm transition-all ${myTeamView === "MATCHES" ? "bg-white dark:bg-slate-600 text-blue-700 dark:text-blue-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700"}`}
        >
          {t.matchesTab}
        </button>
        <button
          onClick={() => setMyTeamView("STANDINGS")}
          className={`flex-1 sm:flex-none px-8 py-2.5 rounded-lg font-bold text-sm transition-all ${myTeamView === "STANDINGS" ? "bg-white dark:bg-slate-600 text-blue-700 dark:text-blue-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700"}`}
        >
          {t.standingsTab}
        </button>
      </div>

      {myTeamView === "MATCHES" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              group={groups.find((g) => g.id === match.group_id)}
              homeTeam={teams.find((tm) => tm.id === match.home_team_id)}
              awayTeam={teams.find((tm) => tm.id === match.away_team_id)}
              isAdmin={!!adminToken}
              onUpdateResult={onUpdateResult}
              t={t}
            />
          ))}
        </div>
      )}

      {myTeamView === "STANDINGS" && (
        <div className="space-y-8">
          {teamGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="bg-slate-100 dark:bg-slate-900/50 p-4 border-b border-gray-200 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                  {group.name}
                </h3>
              </div>
              <GroupTable
                group={group}
                teams={teams}
                selectedTeam={selectedMyTeam}
                t={t}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
