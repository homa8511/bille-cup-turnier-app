// Diese Klasse errechnet die Platzierungswerte anhand der fachlichen Turnierregeln.
export class GroupStanding {
    constructor(
        private readonly teamId: string,
        private points: number = 0,
        private matchesPlayed: number = 0,
        private goalsScored: number = 0,
        private goalsConceded: number = 0,
        private rank: number = 0
    ) {}

    // Diese Methode verarbeitet die sportliche Leistung aus einem neu gespielten Match.
    public processMatchPerformance(scoredGoals: number, concededGoals: number): void {
        if (scoredGoals < 0 || concededGoals < 0) {
            throw new Error('Geworfene Tore können nicht negativ sein.');
        }
        
        this.matchesPlayed += 1;
        this.goalsScored += scoredGoals;
        this.goalsConceded += concededGoals;

        if (scoredGoals > concededGoals) {
            this.points += 3;
        } else if (scoredGoals === concededGoals) {
            this.points += 1;
        }
    }

    // Diese Methode weist der Mannschaft ihren finalen Tabellenplatz zu.
    public assignFinalRank(newRank: number): void {
        if (newRank <= 0) {
            throw new Error('Ein Tabellenplatz muss mindestens eins sein.');
        }
        this.rank = newRank;
    }

    // Diese Methode beantwortet die Frage nach der Zugehörigkeit zu einem Team.
    public belongsToTeam(queriedTeamId: string): boolean {
        return this.teamId === queriedTeamId;
    }

    // Diese Methode stellt alle berechneten Werte für die persistente Tabellenspeicherung bereit.
    public extractSnapshot() {
        return {
            team_id: this.teamId,
            points: this.points,
            matches_played: this.matchesPlayed,
            goals_scored: this.goalsScored,
            goals_conceded: this.goalsConceded,
            goal_difference: this.goalsScored - this.goalsConceded,
            rank: this.rank
        };
    }
}