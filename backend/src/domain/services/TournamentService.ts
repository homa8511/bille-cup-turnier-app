import { 
    Match, 
    GroupStanding, 
    CombinedStanding, 
    SwissPairing, 
    SeedingAssignment, 
    FinalGroupsAllocation, 
    ScheduleUpdate 
} from '../models/Tournament';

// Diese Klasse kapselt die reinen Geschäftsregeln des Turniers ohne externe Abhängigkeiten.
export class TournamentService {

    // Diese Methode berechnet die aktuelle Gruppentabelle anhand der beendeten Spiele.
    public calculateStandings(teams: { id: string }[], completedMatches: Match[]): GroupStanding[] {
        const stats = new Map<string, GroupStanding>();

        // Initialisiert die Statistik für jedes Team mit Nullwerten.
        teams.forEach(team => {
            stats.set(team.id, {
                team_id: team.id,
                points: 0,
                matches_played: 0,
                goals_scored: 0,
                goals_conceded: 0,
                goal_diff: 0,
                rank: 0
            });
        });

        // Addiert die Punkte und Tore aus allen abgeschlossenen Spielen.
        completedMatches.forEach(match => {
            if (match.status !== 'BEENDET' || !match.home_team_id || !match.away_team_id) return;
            
            const homeGoals = match.goals_home ?? 0;
            const awayGoals = match.goals_away ?? 0;
            
            const homeStat = stats.get(match.home_team_id);
            const awayStat = stats.get(match.away_team_id);

            if (homeStat && awayStat) {
                homeStat.matches_played++;
                awayStat.matches_played++;
                homeStat.goals_scored += homeGoals;
                awayStat.goals_scored += awayGoals;
                homeStat.goals_conceded += awayGoals;
                awayStat.goals_conceded += homeGoals;

                if (homeGoals > awayGoals) {
                    homeStat.points += 3;
                } else if (homeGoals < awayGoals) {
                    awayStat.points += 3;
                } else {
                    homeStat.points += 1;
                    awayStat.points += 1;
                }
            }
        });

        const standingsArray = Array.from(stats.values());

        // Aktualisiert die Tordifferenz für alle Teams.
        standingsArray.forEach(stat => {
            stat.goal_diff = stat.goals_scored - stat.goals_conceded;
        });

        // Sortiert die Tabelle nach Punkten, Tordifferenz und geschossenen Toren.
        standingsArray.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goal_diff !== a.goal_diff) return b.goal_diff - a.goal_diff;
            return b.goals_scored - a.goals_scored;
        });

        // Vergibt die finalen Platzierungen basierend auf der Sortierung.
        return standingsArray.map((stat, index) => ({
            ...stat,
            rank: index + 1
        }));
    }

    // Diese Methode teilt das Teilnehmerfeld nach der Zwischenrunde in zwei Leistungsklassen auf.
    public splitIntoGoldAndSilver(combinedStandings: CombinedStanding[]): FinalGroupsAllocation {
        return {
            gold: combinedStandings.slice(0, 12),
            silver: combinedStandings.slice(12, 24)
        };
    }

    // Diese Methode verteilt die Mannschaften nach dem Schlangensystem auf die Zwischenrundengruppen.
    public distributeSnakeSeeding(
        vorrundenStandings: CombinedStanding[], 
        matchHistory: Record<string, string[]>
    ): SeedingAssignment[] {
        const targetGroups = ['Gruppe G', 'Gruppe H', 'Gruppe I', 'Gruppe J', 'Gruppe K', 'Gruppe L'];
        const waves = [
            [0, 1, 2, 3, 4, 5],
            [11, 10, 9, 8, 7, 6],
            [12, 13, 14, 15, 16, 17],
            [23, 22, 21, 20, 19, 18]
        ];

        let seeding: SeedingAssignment[] = [];

        // Durchläuft die definierten Wellen des Schlangensystems.
        for (let waveIndex = 0; waveIndex < waves.length; waveIndex++) {
            const wave = waves[waveIndex];
            let currentWaveTeams: SeedingAssignment[] = [];

            // Weist den Teams ihre initialen Gruppenplätze zu.
            for (let i = 0; i < wave.length; i++) {
                const teamIndex = wave[i];
                if (vorrundenStandings[teamIndex]) {
                    currentWaveTeams.push({
                        team_id: vorrundenStandings[teamIndex].team_id,
                        original_rank: teamIndex + 1,
                        assigned_group: targetGroups[i]
                    });
                }
            }

            // Löst Gruppenkonflikte durch einen Tausch innerhalb der Welle auf.
            for (let i = 0; i < currentWaveTeams.length; i++) {
                for (let j = i + 1; j < currentWaveTeams.length; j++) {
                    const teamA = currentWaveTeams[i];
                    const teamB = currentWaveTeams[j];
                    const historyA = matchHistory[teamA.team_id] || [];
                    
                    const conflict = historyA.includes(teamB.team_id);
                    
                    if (conflict) {
                        const tempGroup = teamA.assigned_group;
                        teamA.assigned_group = teamB.assigned_group;
                        teamB.assigned_group = tempGroup;
                    }
                }
            }

            seeding.push(...currentWaveTeams);
        }

        return seeding;
    }

    // Diese rekursive Methode sucht überschneidungsfreie Paarungen für das Schweizer System.
    public calculateSwissPairings(
        currentStandings: GroupStanding[], 
        matchHistory: Record<string, string[]>
    ): SwissPairing[] {
        
        const sortedTeams = [...currentStandings].sort((a, b) => a.rank - b.rank);
        
        // Diese Hilfsfunktion führt das eigentliche Backtracking durch.
        const findPairings = (teamsToPair: GroupStanding[], currentPairings: SwissPairing[]): SwissPairing[] | null => {
            if (teamsToPair.length === 0) return currentPairings;

            const homeTeam = teamsToPair[0];
            const history = matchHistory[homeTeam.team_id] || [];
            
            // Sucht den nächsten möglichen Gegner in der Rangliste.
            for (let i = 1; i < teamsToPair.length; i++) {
                const awayTeam = teamsToPair[i];
                const hasPlayed = history.includes(awayTeam.team_id);
                
                if (!hasPlayed) {
                    const newPairings = [...currentPairings, { 
                        home: { team_id: homeTeam.team_id, rank: homeTeam.rank }, 
                        away: { team_id: awayTeam.team_id, rank: awayTeam.rank } 
                    }];
                    
                    const remainingTeams = teamsToPair.filter(
                        t => t.team_id !== homeTeam.team_id && t.team_id !== awayTeam.team_id
                    );
                    
                    const result = findPairings(remainingTeams, newPairings);
                    if (result) return result;
                }
            }
            
            return null;
        };

        const optimalPairings = findPairings(sortedTeams, []);

        // Greift auf eine Notlösung zurück, falls keine perfekten Paarungen existieren.
        if (!optimalPairings && sortedTeams.length >= 2) {
            let fallbackPairings: SwissPairing[] = [];
            for (let i = 0; i < sortedTeams.length - 1; i += 2) {
                fallbackPairings.push({
                    home: { team_id: sortedTeams[i].team_id, rank: sortedTeams[i].rank },
                    away: { team_id: sortedTeams[i+1].team_id, rank: sortedTeams[i+1].rank }
                });
            }
            return fallbackPairings;
        }

        return optimalPairings || [];
    }

    // Diese Methode plant die Startzeiten der Spiele innerhalb einer Turnierphase neu.
    public calculateSchedule(
        phaseMatches: Match[], 
        startTimeIso: string, 
        matchDurationMinutes: number = 10, 
        pauseDurationMinutes: number = 2
    ): ScheduleUpdate[] {
        
        const scheduleUpdates: ScheduleUpdate[] = [];
        const matchesByGroup = new Map<string, Match[]>();

        // Gruppiert die Spiele nach ihrer jeweiligen Gruppe.
        phaseMatches.forEach(match => {
            if (!matchesByGroup.has(match.group_id)) {
                matchesByGroup.set(match.group_id, []);
            }
            matchesByGroup.get(match.group_id)!.push(match);
        });

        // Berechnet die exakten Zeiten sequenziell für jede Gruppe.
        matchesByGroup.forEach((groupMatches, groupId) => {
            // Sortiert die Spiele aufsteigend nach ihrer Spielnummer.
            groupMatches.sort((a, b) => a.match_number - b.match_number);
            
            let currentStartTime = new Date(startTimeIso).getTime();

            groupMatches.forEach(match => {
                const start = new Date(currentStartTime);
                const end = new Date(currentStartTime + matchDurationMinutes * 60000);

                scheduleUpdates.push({
                    match_id: match.id,
                    start_time: start,
                    end_time: end
                });

                currentStartTime = end.getTime() + (pauseDurationMinutes * 60000);
            });
        });

        return scheduleUpdates;
    }
}