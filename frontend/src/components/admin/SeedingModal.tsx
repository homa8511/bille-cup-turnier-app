import { Info, Save, Settings2 } from "lucide-react";
import type { Team } from "../../types";
import { Modal } from "../ui/Modal";
import { TeamLogo } from "../ui/TeamLogo";

interface SeedingModalProps {
  isOpen: boolean;
  onClose: () => void;
  seedingData: any[];
  teams: Team[];
  onUpdateGroup: (teamId: string, newGroup: string) => void;
  onSave: () => void;
  t: any;
}

export function SeedingModal({
  isOpen,
  onClose,
  seedingData,
  teams,
  onUpdateGroup,
  onSave,
  t,
}: SeedingModalProps) {
  const pools = [
    { index: 0, name: t.pool1 },
    { index: 1, name: t.pool2 },
    { index: 2, name: t.pool3 },
    { index: 3, name: t.pool4 },
  ];
  const intermediateGroups = [
    "Gruppe G",
    "Gruppe H",
    "Gruppe I",
    "Gruppe J",
    "Gruppe K",
    "Gruppe L",
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <>
          <Settings2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          {t.seedingTitle}
        </>
      }
      maxWidth="3xl"
    >
      <div className="p-4 md:p-6 overflow-y-auto flex-1">
        {pools.map((pool) => {
          const poolTeams = seedingData.filter(
            (d) => d.potIndex === pool.index,
          );
          if (poolTeams.length === 0) return null;

          return (
            <div key={pool.index} className="mb-8 last:mb-0">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 px-1">
                {pool.name}
              </h4>
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 w-12 text-center">
                        {t.rankSymbol}
                      </th>
                      <th className="px-4 py-3">{t.team}</th>
                      <th
                        className="px-2 py-3 text-center"
                        title={t.pointsTooltip}
                      >
                        {t.ptsShort}
                      </th>
                      <th
                        className="px-2 py-3 text-center"
                        title={t.goalDiffTooltip}
                      >
                        {t.tdShort}
                      </th>
                      <th
                        className="px-2 py-3 text-center"
                        title={t.goalsScoredTooltip}
                      >
                        {t.goalsShort}
                      </th>
                      <th className="px-4 py-3 w-48">{t.zugewieseneGruppe}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {poolTeams.map((item, index) => {
                      const team = teams.find((tm) => tm.id === item.team_id);
                      const conflictTeam = item.conflict_with_team_id
                        ? teams.find(
                            (tm) => tm.id === item.conflict_with_team_id,
                          )
                        : null;

                      return (
                        <tr
                          key={item.team_id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-center font-bold text-slate-400">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 flex items-center gap-3 font-medium text-slate-800 dark:text-slate-200">
                            <TeamLogo team={team} size="w-6 h-6" />
                            <span className="truncate">
                              {team?.name || t.unknown}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                            {item.stats?.points ?? "-"}
                          </td>
                          <td className="px-2 py-3 text-center text-slate-600 dark:text-slate-400">
                            {item.stats?.goal_diff ?? "-"}
                          </td>
                          <td className="px-2 py-3 text-center text-slate-600 dark:text-slate-400">
                            {item.stats?.goals_scored ?? "-"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <select
                                value={item.assigned_group}
                                onChange={(e) =>
                                  onUpdateGroup(item.team_id, e.target.value)
                                }
                                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold transition-all cursor-pointer"
                              >
                                {intermediateGroups.map((g) => (
                                  <option key={g} value={g}>
                                    {g}
                                  </option>
                                ))}
                              </select>
                              {item.conflict_resolved && (
                                <div
                                  title={`${t.groupSwappedTooltip}\n\nBereits gespielt gegen:\n${conflictTeam?.name || t.unknown}`}
                                  className="text-amber-500 cursor-help shrink-0"
                                >
                                  <Info className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 md:p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3 bg-white dark:bg-slate-800 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          {t.cancel}
        </button>
        <button
          onClick={onSave}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {t.releaseAndGenerate}
        </button>
      </div>
    </Modal>
  );
}
