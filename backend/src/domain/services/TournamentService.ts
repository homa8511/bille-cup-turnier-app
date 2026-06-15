import { SwissPairing, GroupStanding } from '../models/Tournament';

export class TournamentService {
    
    // Reine Domänenlogik: Erhält Arrays im Speicher, gibt neue Arrays zurück. Keine Datenbank!
    public calculateSwissPairings(
        currentStandings: GroupStanding[], 
        pastMatchesHistory: Record<string, string[]>
    ): SwissPairing[] {
        
        let pairings: SwissPairing[] = [];
        let availableTeams = [...currentStandings].sort((a, b) => a.rank - b.rank);

        while (availableTeams.length >= 2) {
            const homeTeam = availableTeams[0];
            let awayTeamIndex = 1;
            let foundMatch = false;

            // Suche nach einem Gegner, gegen den noch nicht gespielt wurde
            while (awayTeamIndex < availableTeams.length) {
                const awayTeam = availableTeams[awayTeamIndex];
                const hasPlayed = pastMatchesHistory[homeTeam.team_id]?.includes(awayTeam.team_id);

                if (!hasPlayed) {
                    pairings.push({ 
                        home: { team_id: homeTeam.team_id, rank: homeTeam.rank }, 
                        away: { team_id: awayTeam.team_id, rank: awayTeam.rank } 
                    });
                    
                    // Teams aus dem Pool entfernen
                    availableTeams.splice(awayTeamIndex, 1);
                    availableTeams.splice(0, 1);
                    foundMatch = true;
                    break;
                }
                awayTeamIndex++;
            }

            // Fallback, falls keine perfekte Paarung gefunden wurde (vereinfacht)
            if (!foundMatch) {
                const awayTeam = availableTeams[1];
                pairings.push({ 
                    home: { team_id: homeTeam.team_id, rank: homeTeam.rank }, 
                    away: { team_id: awayTeam.team_id, rank: awayTeam.rank } 
                });
                availableTeams.splice(1, 1);
                availableTeams.splice(0, 1);
            }
        }

        return pairings;
    }
}