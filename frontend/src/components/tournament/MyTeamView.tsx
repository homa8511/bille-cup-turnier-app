import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Search,
} from "lucide-react";
import { useState } from "react";
import type { Group, Match, Team } from "../../types";
import { TeamLogo } from "../ui/TeamLogo";
import { GroupTable } from "./GroupTable";
import { MatchCard } from "./MatchCard";
import { MatchTableRow } from "./MatchTableRow";

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
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const [collapsedSchedules, setCollapsedSchedules] = useState<
    Record<string, boolean>
  >({});

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
    .sort((a, b) => Number(a.match_number) - Number(b.match_number));
  const teamGroups = groups.filter((g) =>
    g.standings?.some((s) => s.team_id === selectedMyTeam),
  );

  const getFieldNumber = (match: Match, group: Group | undefined) => {
    if (!group?.field_numbers?.length) return "-";
    if (group.field_numbers.length === 1) return group.field_numbers[0];
    const groupMatches = matches
      .filter((m) => m.group_id === group.id)
      .sort((a, b) => Number(a.match_number) - Number(b.match_number));
    const idx = groupMatches.findIndex((m) => m.id === match.id);
    return idx !== -1
      ? group.field_numbers[idx % group.field_numbers.length]
      : group.field_numbers[0];
  };

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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
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
        <div className="flex bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 transition-colors ${viewMode === "table" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`p-2 transition-colors ${viewMode === "cards" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {myTeamView === "MATCHES" &&
        (viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMatches.map((match) => {
              const group = groups.find((g) => g.id === match.group_id);
              return (
                <MatchCard
                  key={match.id}
                  match={match}
                  group={group}
                  homeTeam={teams.find((tm) => tm.id === match.home_team_id)}
                  awayTeam={teams.find((tm) => tm.id === match.away_team_id)}
                  isAdmin={!!adminToken}
                  onUpdateResult={onUpdateResult}
                  fieldNumber={getFieldNumber(match, group)}
                  t={t}
                />
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-full">
            <table className="w-full text-sm text-left border-collapse min-w-[600px]">
              <thead className="text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-b border-slate-300 dark:border-slate-600">
                <tr>
                  <th className="px-3 py-3 text-center w-10">{t.nr}</th>
                  <th className="px-2 py-3 text-center w-10">{t.f}</th>
                  <th className="px-3 py-3 text-center w-20">{t.beginn}</th>
                  <th className="px-2 py-3 text-center w-10">{t.gr}</th>
                  <th className="px-4 py-3 text-center" colSpan={4}>
                    {t.spiel}
                  </th>
                  <th className="px-4 py-3 text-center w-24">{t.ergebnis}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {teamMatches.map((match) => {
                  const group = groups.find((g) => g.id === match.group_id);
                  return (
                    <MatchTableRow
                      key={match.id}
                      match={match}
                      group={group}
                      homeTeam={teams.find(
                        (tm) => tm.id === match.home_team_id,
                      )}
                      awayTeam={teams.find(
                        (tm) => tm.id === match.away_team_id,
                      )}
                      isAdmin={!!adminToken}
                      onUpdateResult={onUpdateResult}
                      selectedTeam={selectedMyTeam}
                      fieldNumber={getFieldNumber(match, group)}
                      t={t}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

      {myTeamView === "STANDINGS" && (
        <div className="space-y-8">
          {teamGroups.map((group) => {
            const isScheduleCollapsed = collapsedSchedules[group.id];
            const groupMatches = teamMatches
              .filter((m) => m.group_id === group.id)
              .sort((a, b) => Number(a.match_number) - Number(b.match_number));

            return (
              <div
                key={group.id}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col"
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
                <button
                  onClick={() =>
                    setCollapsedSchedules((p) => ({
                      ...p,
                      [group.id]: !p[group.id],
                    }))
                  }
                  className="w-full flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-b dark:border-slate-700"
                >
                  <span className="font-bold text-sm text-slate-600 dark:text-slate-300">
                    {t.matches} {group.name}
                  </span>
                  <div className="text-slate-400">
                    {isScheduleCollapsed ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronUp className="w-5 h-5" />
                    )}
                  </div>
                </button>
                {!isScheduleCollapsed && (
                  <div className="bg-slate-50/50 dark:bg-slate-900/20 p-4 w-full">
                    {viewMode === "cards" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {groupMatches.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            group={group}
                            homeTeam={teams.find(
                              (tm) => tm.id === match.home_team_id,
                            )}
                            awayTeam={teams.find(
                              (tm) => tm.id === match.away_team_id,
                            )}
                            isAdmin={!!adminToken}
                            onUpdateResult={onUpdateResult}
                            fieldNumber={getFieldNumber(match, group)}
                            t={t}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-full">
                        <table className="w-full text-sm text-left border-collapse min-w-[600px]">
                          <thead className="text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-b border-slate-300 dark:border-slate-600">
                            <tr>
                              <th className="px-3 py-3 text-center w-10">
                                {t.nr}
                              </th>
                              <th className="px-2 py-3 text-center w-10">
                                {t.f}
                              </th>
                              <th className="px-3 py-3 text-center w-20">
                                {t.beginn}
                              </th>
                              <th className="px-2 py-3 text-center w-10">
                                {t.gr}
                              </th>
                              <th className="px-4 py-3 text-center" colSpan={4}>
                                {t.spiel}
                              </th>
                              <th className="px-4 py-3 text-center w-24">
                                {t.ergebnis}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {groupMatches.map((match) => (
                              <MatchTableRow
                                key={match.id}
                                match={match}
                                group={group}
                                homeTeam={teams.find(
                                  (tm) => tm.id === match.home_team_id,
                                )}
                                awayTeam={teams.find(
                                  (tm) => tm.id === match.away_team_id,
                                )}
                                isAdmin={!!adminToken}
                                onUpdateResult={onUpdateResult}
                                selectedTeam={selectedMyTeam}
                                fieldNumber={getFieldNumber(match, group)}
                                t={t}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
