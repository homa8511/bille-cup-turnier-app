import { GroupStanding } from "../models/GroupStanding";
import { Match } from "../models/Match";
import {
  CombinedStanding,
  FinalGroupsAllocation,
  ScheduleUpdate,
  SeedingAssignment,
  SwissPairing,
} from "../models/Tournament";

export class TournamentService {
  public calculateStandings(
    teams: { id: string }[],
    completedMatches: Match[],
  ): any[] {
    const stats = new Map<string, GroupStanding>();

    teams.forEach((team) => {
      stats.set(team.id, new GroupStanding(team.id));
    });

    completedMatches.forEach((match) => {
      const snapshot = match.extractSnapshot();
      if (
        snapshot.status !== "BEENDET" ||
        !snapshot.home_team_id ||
        !snapshot.away_team_id
      )
        return;

      const homeGoals = snapshot.goals_home ?? 0;
      const awayGoals = snapshot.goals_away ?? 0;

      const homeStat = stats.get(snapshot.home_team_id);
      const awayStat = stats.get(snapshot.away_team_id);

      if (homeStat && awayStat) {
        homeStat.processMatchPerformance(homeGoals, awayGoals);
        awayStat.processMatchPerformance(awayGoals, homeGoals);
      }
    });

    const standingsArray = Array.from(stats.values());

    standingsArray.sort((a, b) => {
      const snapA = a.extractSnapshot();
      const snapB = b.extractSnapshot();

      if (snapB.points !== snapA.points) return snapB.points - snapA.points;
      if (snapB.goal_difference !== snapA.goal_difference)
        return snapB.goal_difference - snapA.goal_difference;
      return snapB.goals_scored - snapA.goals_scored;
    });

    standingsArray.forEach((stat, index) => {
      stat.assignFinalRank(index + 1);
    });

    return standingsArray.map((stat) => stat.extractSnapshot());
  }

  public calculateCombinedStandings(
    allPhaseStandings: any[],
    allMatches: Match[],
  ): CombinedStanding[] {
    const aggregated = new Map<string, CombinedStanding>();

    allPhaseStandings.forEach((stat) => {
      if (!aggregated.has(stat.team_id)) {
        aggregated.set(stat.team_id, {
          team_id: stat.team_id,
          total_points: 0,
          total_scored: 0,
          total_conceded: 0,
          goal_diff: 0,
          final_rank: 0,
        });
      }
      const current = aggregated.get(stat.team_id)!;
      current.total_points += stat.points || 0;
      current.total_scored += stat.goals_scored || 0;
      current.total_conceded += stat.goals_conceded || 0;
      current.goal_diff = current.total_scored - current.total_conceded;
    });

    const combinedArray = Array.from(aggregated.values());

    combinedArray.sort((a, b) => {
      if (b.total_points !== a.total_points)
        return b.total_points - a.total_points;
      if (b.goal_diff !== a.goal_diff) return b.goal_diff - a.goal_diff;
      if (b.total_scored !== a.total_scored)
        return b.total_scored - a.total_scored;

      const h2hMatch = allMatches.find((m) => {
        const s = m.extractSnapshot();
        return (
          s.status === "BEENDET" &&
          ((s.home_team_id === a.team_id && s.away_team_id === b.team_id) ||
            (s.home_team_id === b.team_id && s.away_team_id === a.team_id))
        );
      });

      if (h2hMatch) {
        const s = h2hMatch.extractSnapshot();
        const aGoals =
          s.home_team_id === a.team_id ? s.goals_home! : s.goals_away!;
        const bGoals =
          s.home_team_id === b.team_id ? s.goals_home! : s.goals_away!;
        return bGoals - aGoals;
      }

      return 0;
    });

    return combinedArray.map((stat, index) => ({
      ...stat,
      final_rank: index + 1,
    }));
  }

  public splitIntoGoldAndSilver(
    combinedStandings: CombinedStanding[],
  ): FinalGroupsAllocation {
    return {
      gold: combinedStandings.slice(0, 12),
      silver: combinedStandings.slice(12, 24),
    };
  }

  // ACHTUNG FIX: Dieser Algorithmus prüft nun korrekt auf Kollisionen mit bereits platzierten Teams der vorherigen Töpfe.
  public distributeSnakeSeeding(
    vorrundenStandings: CombinedStanding[],
    vorrundenMatchHistory: Record<string, string[]>,
  ): SeedingAssignment[] {
    const targetGroups = [
      "Gruppe G",
      "Gruppe H",
      "Gruppe I",
      "Gruppe J",
      "Gruppe K",
      "Gruppe L",
    ];
    const waves = [
      [0, 1, 2, 3, 4, 5],
      [11, 10, 9, 8, 7, 6], // Snake rückwärts
      [12, 13, 14, 15, 16, 17],
      [23, 22, 21, 20, 19, 18], // Snake rückwärts
    ];
    const poolNames = [
      "Topf 1 (1. Plätze)",
      "Topf 2 (2. Plätze)",
      "Topf 3 (3. Plätze)",
      "Topf 4 (4. Plätze)",
    ];

    let finalSeeding: SeedingAssignment[] = [];
    let groupAssignments: Record<string, string[]> = {
      "Gruppe G": [],
      "Gruppe H": [],
      "Gruppe I": [],
      "Gruppe J": [],
      "Gruppe K": [],
      "Gruppe L": [],
    };

    for (let waveIndex = 0; waveIndex < waves.length; waveIndex++) {
      const wave = waves[waveIndex];
      let currentWaveTeams: SeedingAssignment[] = [];

      // 1. Initiales Placing der Teams für diese Welle (Topf)
      for (let i = 0; i < wave.length; i++) {
        const teamIndex = wave[i];
        const standing = vorrundenStandings[teamIndex];
        if (standing) {
          currentWaveTeams.push({
            team_id: standing.team_id,
            original_rank: teamIndex + 1,
            assigned_group: targetGroups[i],
            pool: poolNames[waveIndex],
            conflict_resolved: false,
            stats: {
              points: standing.total_points,
              goal_diff: standing.goal_diff,
              goals_scored: standing.total_scored,
              group_rank: standing.group_rank,
            },
          });
        }
      }

      // 2. Konflikterkennung und Auflösung (Duell-Vermeidung)
      for (let i = 0; i < currentWaveTeams.length; i++) {
        let teamA = currentWaveTeams[i];
        let historyA = vorrundenMatchHistory[teamA.team_id] || [];

        // Hat die zugewiesene Gruppe bereits ein Team, gegen das Team A in der Vorrunde gespielt hat?
        let hasConflict = groupAssignments[teamA.assigned_group].some((tId) =>
          historyA.includes(tId),
        );

        if (hasConflict) {
          // Finde einen Tauschpartner in demselben Topf, für den der Tausch ebenfalls konfliktfrei wäre
          for (let j = 0; j < currentWaveTeams.length; j++) {
            if (i === j) continue;
            let teamB = currentWaveTeams[j];
            let historyB = vorrundenMatchHistory[teamB.team_id] || [];

            let teamA_canGoTo_BGroup = !groupAssignments[
              teamB.assigned_group
            ].some((tId) => historyA.includes(tId));
            let teamB_canGoTo_AGroup = !groupAssignments[
              teamA.assigned_group
            ].some((tId) => historyB.includes(tId));

            if (teamA_canGoTo_BGroup && teamB_canGoTo_AGroup) {
              // Tausche die Zuweisungen und markiere es für das Frontend
              let tempGroup = teamA.assigned_group;
              teamA.assigned_group = teamB.assigned_group;
              teamB.assigned_group = tempGroup;
              teamA.conflict_resolved = true;
              teamB.conflict_resolved = true;
              break;
            }
          }
        }
      }

      // 3. Teams der Welle fest in die Gruppen-Historie für die nächste Welle schreiben
      currentWaveTeams.forEach((t) => {
        if (groupAssignments[t.assigned_group]) {
          groupAssignments[t.assigned_group].push(t.team_id);
        }
      });

      finalSeeding.push(...currentWaveTeams);
    }

    // Am Ende wieder in die korrekte Reihenfolge 1-24 für die Ausgabe bringen
    return finalSeeding.sort((a, b) => a.original_rank - b.original_rank);
  }

  public calculateSwissPairings(
    currentStandings: any[],
    completeMatchHistory: Record<string, string[]>,
  ): SwissPairing[] {
    const sortedTeams = [...currentStandings].sort((a, b) => a.rank - b.rank);

    const findPairings = (
      teamsToPair: any[],
      currentPairings: SwissPairing[],
    ): SwissPairing[] | null => {
      if (teamsToPair.length === 0) return currentPairings;

      const homeTeam = teamsToPair[0];
      const history = completeMatchHistory[homeTeam.team_id] || [];

      for (let i = 1; i < teamsToPair.length; i++) {
        const awayTeam = teamsToPair[i];
        const hasPlayedBefore = history.includes(awayTeam.team_id);

        if (!hasPlayedBefore) {
          const newPairings = [
            ...currentPairings,
            {
              home: { team_id: homeTeam.team_id, rank: homeTeam.rank },
              away: { team_id: awayTeam.team_id, rank: awayTeam.rank },
            },
          ];

          const remainingTeams = teamsToPair.filter(
            (t) =>
              t.team_id !== homeTeam.team_id && t.team_id !== awayTeam.team_id,
          );

          const result = findPairings(remainingTeams, newPairings);
          if (result) return result;
        }
      }
      return null;
    };

    const optimalPairings = findPairings(sortedTeams, []);

    if (!optimalPairings && sortedTeams.length >= 2) {
      let fallbackPairings: SwissPairing[] = [];
      for (let i = 0; i < sortedTeams.length - 1; i += 2) {
        fallbackPairings.push({
          home: { team_id: sortedTeams[i].team_id, rank: sortedTeams[i].rank },
          away: {
            team_id: sortedTeams[i + 1].team_id,
            rank: sortedTeams[i + 1].rank,
          },
        });
      }
      return fallbackPairings;
    }

    return optimalPairings || [];
  }

  public generateRoundRobinPairings(
    teamIds: string[],
  ): { home: string; away: string }[] {
    const pairings: { home: string; away: string }[] = [];
    const n = teamIds.length;
    if (n === 0) return pairings;

    const teams = n % 2 !== 0 ? [...teamIds, null] : [...teamIds];
    const numTeams = teams.length;
    const rounds = numTeams - 1;
    const half = numTeams / 2;

    let currentTeams = [...teams];
    for (let round = 0; round < rounds; round++) {
      for (let i = 0; i < half; i++) {
        const home = currentTeams[i];
        const away = currentTeams[numTeams - 1 - i];
        if (home !== null && away !== null) {
          pairings.push({ home, away });
        }
      }
      currentTeams = [
        currentTeams[0],
        currentTeams[numTeams - 1],
        ...currentTeams.slice(1, numTeams - 1),
      ];
    }
    return pairings;
  }

  public calculateSchedule(
    phaseMatches: Match[],
    startTimeIso: string,
    matchDurationMinutes: number = 10,
    pauseDurationMinutes: number = 2,
  ): ScheduleUpdate[] {
    const scheduleUpdates: ScheduleUpdate[] = [];
    const matchesByGroup = new Map<string, Match[]>();

    phaseMatches.forEach((match) => {
      const snapshot = match.extractSnapshot();
      if (!matchesByGroup.has(snapshot.group_id)) {
        matchesByGroup.set(snapshot.group_id, []);
      }
      matchesByGroup.get(snapshot.group_id)!.push(match);
    });

    matchesByGroup.forEach((groupMatches, groupId) => {
      groupMatches.sort(
        (a, b) =>
          a.extractSnapshot().match_number! - b.extractSnapshot().match_number!,
      );

      let currentStartTime = new Date(startTimeIso).getTime();

      groupMatches.forEach((match) => {
        const start = new Date(currentStartTime);
        const end = new Date(currentStartTime + matchDurationMinutes * 60000);

        scheduleUpdates.push({
          match_id: match.extractSnapshot().id,
          start_time: start,
          end_time: end,
        });

        currentStartTime = end.getTime() + pauseDurationMinutes * 60000;
      });
    });

    return scheduleUpdates;
  }

  public scheduleSingleFinalRound(
    roundMatches: Match[],
    startTimeIso: string,
    matchDurationMinutes: number = 10,
  ): ScheduleUpdate[] {
    const scheduleUpdates: ScheduleUpdate[] = [];
    const start = new Date(startTimeIso);
    const end = new Date(start.getTime() + matchDurationMinutes * 60000);

    roundMatches.forEach((match) => {
      scheduleUpdates.push({
        match_id: match.extractSnapshot().id,
        start_time: start,
        end_time: end,
      });
    });

    return scheduleUpdates;
  }

  public isFinalGroupComplete(matchesInGroup: Match[]): boolean {
    const playedMatches = matchesInGroup.filter(
      (m) => m.extractSnapshot().status === "BEENDET",
    );
    return playedMatches.length >= 36;
  }

  public isCurrentRoundComplete(matchesInGroup: Match[]): boolean {
    const pendingMatches = matchesInGroup.filter(
      (m) => m.extractSnapshot().status !== "BEENDET",
    );
    return pendingMatches.length === 0 && matchesInGroup.length > 0;
  }
}
