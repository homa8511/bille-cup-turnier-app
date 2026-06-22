import {
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Search,
  Settings2,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { GroupTable } from "../components/tournament/GroupTable";
import { MatchCard } from "../components/tournament/MatchCard";
import { MatchTableRow } from "../components/tournament/MatchTableRow";
import type { Group, Match, Team } from "../types";

interface ScheduleViewProps {
  teams: Team[];
  groups: Group[];
  matches: Match[];
  adminToken: string | null;
  onOpenSeedingModal: () => void;
  onStartFinalRound: () => void;
  onUpdateResult: (matchId: string, home: number, away: number) => void;
  t: any;
}

export function ScheduleView({
  teams,
  groups,
  matches,
  adminToken,
  onOpenSeedingModal,
  onStartFinalRound,
  onUpdateResult,
  t,
}: ScheduleViewProps) {
  const [phaseTab, setPhaseTab] = useState("ALL");
  const [teamSearchFilter, setTeamSearchFilter] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const [collapsedSchedules, setCollapsedSchedules] = useState<
    Record<string, boolean>
  >({});

  const sortedGroups = [...groups].sort((a, b) => a.name.localeCompare(b.name));
  const filteredGroupsForSchedule = sortedGroups.filter((g) => {
    if (g.phase !== phaseTab) return false;
    if (!teamSearchFilter) return true;
    return (
      g.standings?.some((s) => s.team_id === teamSearchFilter) ||
      matches.some(
        (m) =>
          m.group_id === g.id &&
          (m.home_team_id === teamSearchFilter ||
            m.away_team_id === teamSearchFilter),
      )
    );
  });

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <nav className="flex bg-white dark:bg-slate-800 rounded-xl shadow-sm p-1 min-w-max border border-gray-100 dark:border-slate-700">
          {["ALL", "VORRUNDE", "ZWISCHENRUNDE", "FINALRUNDE"].map((tab) => (
            <button
              key={tab}
              onClick={() => setPhaseTab(tab)}
              className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${phaseTab === tab ? "bg-blue-500 text-white dark:bg-blue-200 dark:text-slate-900 shadow-sm" : "text-slate-500 hover:text-blue-500 dark:hover:text-blue-200 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              {tab === "ALL" ? t.allMatches : t[tab.toLowerCase()]}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={teamSearchFilter}
              onChange={(e) => setTeamSearchFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-200 transition-shadow"
            >
              <option value="">{t.allTeams}</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          {adminToken && phaseTab === "ZWISCHENRUNDE" && (
            <button
              onClick={onOpenSeedingModal}
              className="flex items-center justify-center gap-2 p-2 bg-green-500 hover:bg-blue-500 text-white dark:bg-green-200 dark:hover:bg-blue-200 dark:text-slate-900 rounded-lg transition-colors"
              title={t.editSeeding}
            >
              <Settings2 className="w-5 h-5" />
            </button>
          )}
          {adminToken && phaseTab === "FINALRUNDE" && (
            <button
              onClick={onStartFinalRound}
              className="flex items-center justify-center gap-2 p-2 bg-green-500 hover:bg-blue-500 text-white dark:bg-green-200 dark:hover:bg-blue-200 dark:text-slate-900 rounded-lg transition-colors"
              title={t.startFinalRound}
            >
              <Trophy className="w-5 h-5" />
            </button>
          )}
          <div className="flex bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 transition-colors ${viewMode === "table" ? "bg-blue-500 text-white dark:bg-blue-200 dark:text-slate-900" : "text-slate-500 hover:text-blue-500 dark:hover:text-blue-200 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-2 transition-colors ${viewMode === "cards" ? "bg-blue-500 text-white dark:bg-blue-200 dark:text-slate-900" : "text-slate-500 hover:text-blue-500 dark:hover:text-blue-200 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {phaseTab === "ALL" ? (
        viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {matches
              .filter(
                (m) =>
                  !teamSearchFilter ||
                  m.home_team_id === teamSearchFilter ||
                  m.away_team_id === teamSearchFilter,
              )
              .sort((a, b) => Number(a.match_number) - Number(b.match_number))
              .map((match) => {
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
                {matches
                  .filter(
                    (m) =>
                      !teamSearchFilter ||
                      m.home_team_id === teamSearchFilter ||
                      m.away_team_id === teamSearchFilter,
                  )
                  .sort(
                    (a, b) => Number(a.match_number) - Number(b.match_number),
                  )
                  .map((match) => {
                    const group = groups.find((g) => g.id === match.group_id);
                    return (
                      <MatchTableRow
                        key={match.id}
                        match={match}
                        group={group}
                        homeTeam={teams.find(
                          (t) => t.id === match.home_team_id,
                        )}
                        awayTeam={teams.find(
                          (t) => t.id === match.away_team_id,
                        )}
                        isAdmin={!!adminToken}
                        onUpdateResult={onUpdateResult}
                        selectedTeam={teamSearchFilter}
                        fieldNumber={getFieldNumber(match, group)}
                        t={t}
                      />
                    );
                  })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-8 w-full">
          {filteredGroupsForSchedule.length === 0 ? (
            <div className="w-full bg-white dark:bg-slate-800 p-8 rounded-2xl text-center text-slate-500">
              {t.noMatches}
            </div>
          ) : (
            filteredGroupsForSchedule.map((group) => {
              const isScheduleCollapsed = collapsedSchedules[group.id];
              const groupMatches = matches.filter(
                (m) =>
                  m.group_id === group.id &&
                  (!teamSearchFilter ||
                    m.home_team_id === teamSearchFilter ||
                    m.away_team_id === teamSearchFilter),
              );

              return (
                <div
                  key={group.id}
                  className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col"
                >
                  <div className="bg-slate-100 dark:bg-slate-900/50 px-4 py-3 border-b dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {group.name}
                    </h2>
                  </div>
                  <GroupTable
                    group={group}
                    teams={teams}
                    selectedTeam={teamSearchFilter}
                    t={t}
                  />
                  <button
                    onClick={() =>
                      setCollapsedSchedules((p) => ({
                        ...p,
                        [group.id]: !p[group.id],
                      }))
                    }
                    className="w-full flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-b dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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
                          {groupMatches
                            .sort(
                              (a, b) =>
                                Number(a.match_number) - Number(b.match_number),
                            )
                            .map((match) => (
                              <MatchCard
                                key={match.id}
                                match={match}
                                group={group}
                                homeTeam={teams.find(
                                  (t) => t.id === match.home_team_id,
                                )}
                                awayTeam={teams.find(
                                  (t) => t.id === match.away_team_id,
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
                                <th
                                  className="px-4 py-3 text-center"
                                  colSpan={4}
                                >
                                  {t.spiel}
                                </th>
                                <th className="px-4 py-3 text-center w-24">
                                  {t.ergebnis}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                              {groupMatches
                                .sort(
                                  (a, b) =>
                                    Number(a.match_number) -
                                    Number(b.match_number),
                                )
                                .map((match) => (
                                  <MatchTableRow
                                    key={match.id}
                                    match={match}
                                    group={group}
                                    homeTeam={teams.find(
                                      (t) => t.id === match.home_team_id,
                                    )}
                                    awayTeam={teams.find(
                                      (t) => t.id === match.away_team_id,
                                    )}
                                    isAdmin={!!adminToken}
                                    onUpdateResult={onUpdateResult}
                                    selectedTeam={teamSearchFilter}
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
            })
          )}
        </div>
      )}
    </div>
  );
}
