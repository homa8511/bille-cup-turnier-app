import { TournamentService } from '../../domain/services/TournamentService';
import { GroupRepository } from '../../infrastructure/repositories/GroupRepository';
import { MatchRepository } from '../../infrastructure/repositories/MatchRepository';

export class TournamentFlowApplication {
    private tournamentService: TournamentService;
    private groupRepository: GroupRepository;
    private matchRepository: MatchRepository;

    constructor() {
        this.tournamentService = new TournamentService();
        // Die Repositories kapseln die eigentlichen SQL-Anfragen an die PostgreSQL-Datenbank.
        this.groupRepository = new GroupRepository();
        this.matchRepository = new MatchRepository();
    }

    // Dieser Use Case generiert die überschneidungsfreien Paarungen für das Schweizer System.
    public async processSwissRoundPairings(groupId: string): Promise<void> {
        const standings = await this.groupRepository.fetchStandingsForGroup(groupId);
        const matchHistory = await this.matchRepository.fetchMatchHistoryMatrix(groupId);

        const newPairings = this.tournamentService.calculateSwissPairings(standings, matchHistory);

        if (!newPairings || newPairings.length === 0) {
            throw new Error("Es konnten keine überschneidungsfreien Paarungen generiert werden.");
        }

        await this.matchRepository.insertGeneratedPairings(groupId, newPairings);
    }

    // Dieser Use Case verarbeitet die Setzliste für die Zwischenrunde nach dem Schlangensystem.
    public async compileIntermediateSeeding(): Promise<void> {
        const vorrundenStandings = await this.groupRepository.fetchOverallStandings('VORRUNDE');
        const completeMatchHistory = await this.matchRepository.fetchCompleteMatchHistory();

        const newSeeding = this.tournamentService.distributeSnakeSeeding(vorrundenStandings, completeMatchHistory);

        await this.groupRepository.updateAssignedGroups(newSeeding);
    }

    // Dieser Use Case teilt das Teilnehmerfeld für die Finalrunde in Gold- und Silberrunde auf.
    public async compileFinalRoundGroups(): Promise<void> {
        const combinedStandings = await this.groupRepository.fetchCombinedStandings(['VORRUNDE', 'ZWISCHENRUNDE']);
        
        const finalGroups = this.tournamentService.splitIntoGoldAndSilver(combinedStandings);

        await this.groupRepository.assignFinalRoundGroups(finalGroups.gold, finalGroups.silver);
    }

    // Dieser Use Case speichert ein neues Spielergebnis und löst die Tabellenberechnung aus.
    public async processMatchResult(matchId: string, goalsHome: number, goalsAway: number): Promise<void> {
        const match = await this.matchRepository.updateMatchResult(matchId, goalsHome, goalsAway, 'BEENDET');
        
        if (match && match.group_id) {
            await this.compileGroupStandings(match.group_id);
        }
    }

    // Dieser Use Case berechnet die aktuelle Tabelle einer spezifischen Gruppe neu.
    public async compileGroupStandings(groupId: string): Promise<void> {
        const completedMatches = await this.matchRepository.fetchCompletedMatchesByGroup(groupId);
        const currentTeams = await this.groupRepository.fetchTeamsByGroup(groupId);

        const newStandings = this.tournamentService.calculateStandings(currentTeams, completedMatches);

        await this.groupRepository.updateStandings(groupId, newStandings);
    }

    // Dieser Use Case plant die zeitlichen Abläufe einer gesamten Turnierphase neu.
    public async reschedulePhase(phase: string, startTimeIso: string): Promise<void> {
        const phaseMatches = await this.matchRepository.fetchMatchesByPhase(phase);
        
        const updatedSchedule = this.tournamentService.calculateSchedule(phaseMatches, startTimeIso);

        await this.matchRepository.updateMatchTimes(updatedSchedule);
    }
}