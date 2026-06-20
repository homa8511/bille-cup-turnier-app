// Diese Klasse schützt den Lebenszyklus eines einzelnen Spiels.
export class Match {
    constructor(
        private readonly id: string,
        private readonly groupId: string,
        private readonly homeTeamId: string | null,
        private readonly awayTeamId: string | null,
        private readonly matchNumber: number,
        private homePlaceholder: string | null = null,
        private awayPlaceholder: string | null = null,
        private goalsHome: number | null = null,
        private goalsAway: number | null = null,
        private status: 'GEPLANT' | 'LIVE' | 'BEENDET' = 'GEPLANT',
        private startTime: string | null = null,
        private endTime: string | null = null
    ) {}

    // Diese Methode weist dem Spiel nach Abschluss einer Vorrunde echte Mannschaften zu.
    public assignTeams(homeId: string, awayId: string): void {
        if (!homeId || !awayId) {
            throw new Error('Die Zuweisung erfordert gültige Identifikationsnummern.');
        }
        (this as any).homeTeamId = homeId;
        (this as any).awayTeamId = awayId;
        this.homePlaceholder = null;
        this.awayPlaceholder = null;
    }

    // Diese Methode markiert den offiziellen Anpfiff.
    public startMatch(): void {
        this.status = 'LIVE';
    }

    // Diese Methode aktualisiert einen Zwischenstand während einer laufenden Partie.
    public updateLiveScore(goalsHome: number, goalsAway: number): void {
        if (this.status !== 'LIVE') {
            throw new Error('Zwischenstände können nur für aktive Spiele gemeldet werden.');
        }
        if (goalsHome < 0 || goalsAway < 0) {
            throw new Error('Tore dürfen niemals negativ sein.');
        }
        this.goalsHome = goalsHome;
        this.goalsAway = goalsAway;
    }

    // Diese Methode speichert das finale Endergebnis zu jedem beliebigen Zeitpunkt.
    public recordFinalScore(goalsHome: number, goalsAway: number): void {
        if (goalsHome < 0 || goalsAway < 0) {
            throw new Error('Tore dürfen niemals negativ sein.');
        }
        this.goalsHome = goalsHome;
        this.goalsAway = goalsAway;
        this.status = 'BEENDET';
    }

    // Diese Methode verschiebt die Startzeit und Endzeit der Partie auf einen neuen Wert.
    public rescheduleTo(newStartTime: string, newEndTime: string): void {
        this.startTime = newStartTime;
        this.endTime = newEndTime;
        this.status = 'GEPLANT';
    }

    // Diese Methode liefert ein vollständiges Datenpaket für die Datenbank.
    public extractSnapshot() {
        return {
            id: this.id,
            group_id: this.groupId,
            home_team_id: this.homeTeamId,
            away_team_id: this.awayTeamId,
            home_placeholder: this.homePlaceholder,
            away_placeholder: this.awayPlaceholder,
            goals_home: this.goalsHome,
            goals_away: this.goalsAway,
            status: this.status,
            match_number: this.matchNumber,
            start_time: this.startTime,
            end_time: this.endTime
        };
    }
}