import type { Group, Team } from "../../types/index";
import { TeamLogo } from "../ui/TeamLogo";

interface GroupTableProps {
  group: Group;
  teams: Team[];
  selectedTeam?: string;
  t: any;
}

export function GroupTable({ group, teams, selectedTeam, t }: GroupTableProps) {
  const getTeam = (teamId: string) => teams.find((tm) => tm.id === teamId);

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm text-left whitespace-nowrap">
        <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 border-b dark:border-slate-700">
          <tr>
            <th className="px-4 py-3 font-semibold w-8 text-center">
              {t.rankShort}
            </th>
            <th className="px-2 py-3 font-semibold">{t.participant}</th>
            <th className="px-2 py-3 font-semibold text-center">{t.sp}</th>
            <th className="px-2 py-3 font-semibold text-center">
              {t.goalsShort}
            </th>
            <th className="px-2 py-3 font-semibold text-center">{t.tdShort}</th>
            <th className="px-4 py-3 font-semibold text-center bg-blue-600 text-white dark:bg-blue-700">
              {t.ptsShort}
            </th>
          </tr>
        </thead>
        <tbody>
          {group.standings && group.standings.length > 0 ? (
            group.standings.map((row, index) => {
              const isSelected = row.team_id === selectedTeam;
              const team = getTeam(row.team_id);

              return (
                <tr
                  key={row.team_id || index}
                  className={`border-b last:border-0 dark:border-slate-700 ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/50"}`}
                >
                  <td className="px-4 py-3 font-semibold text-center">
                    {row.rank}
                  </td>

                  <td
                    className={`px-2 py-3 flex items-center gap-2 ${isSelected ? "font-bold text-blue-700 dark:text-blue-400" : "font-medium"}`}
                  >
                    <TeamLogo team={team} size="w-6 h-6" />
                    {team?.name || t.unknown}
                  </td>

                  <td className="px-2 py-3 text-center text-slate-600 dark:text-slate-400">
                    {row.matches_played ?? 0}
                  </td>

                  <td className="px-2 py-3 text-center text-slate-600 dark:text-slate-400">
                    {row.goals_scored ?? 0}:{row.goals_conceded ?? 0}
                  </td>

                  <td className="px-2 py-3 text-center text-slate-600 dark:text-slate-400">
                    {row.goal_diff ?? 0}
                  </td>

                  <td className="px-4 py-3 text-center font-bold text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                    {row.points}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="p-4 text-center text-slate-500 italic">
                {t.noTableData}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
