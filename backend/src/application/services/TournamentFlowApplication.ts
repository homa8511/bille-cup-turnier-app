import { TournamentService } from '../../domain/services/TournamentService';
import { GroupRepository } from '../../infrastructure/repositories/GroupRepository';
import { MatchRepository } from '../../infrastructure/repositories/MatchRepository';
import { SettingsRepository } from '../../infrastructure/repositories/SettingsRepository';
import { InitializationRepository } from '../../infrastructure/repositories/InitializationRepository';
import { MatchFactory } from '../../domain/factories/TournamentFactories';
import { SeedingAssignment } from '../../domain/models/Tournament';

// Dieser Service orchestriert den kompletten Turnierablauf inklusive aller Phasenübergänge.
export class TournamentFlowApplication {
    private tournamentService: TournamentService;
    private groupRepository: GroupRepository;
    private matchRepository: MatchRepository;
    private settingsRepository: SettingsRepository;
    private initializationRepository: InitializationRepository;

    constructor() {
        this.tournamentService = new TournamentService();
        this.groupRepository = new GroupRepository();
        this.matchRepository = new MatchRepository();
        this.settingsRepository = new SettingsRepository();
        this.initializationRepository = new InitializationRepository();
    }

    // Diese Methode verarbeitet den initialen Payload zur Anlage der Vorrunde.
    public async initializeTournament(payload: any): Promise<void> {
        const matchesData: any[] = [];
        let globalMatchCounter = 1;

        for (const group of payload.groups) {
            if (group.phase === 'VORRUNDE' && group.teamIds.length > 1) {
                const pairings = this.tournamentService.generateRoundRobinPairings(group.teamIds);
                
                let currentTime = new Date(payload.vorrundeStartTime).getTime();
                const durationMs = payload.matchDuration * 60000;
                const pauseMs = payload.pauseDuration * 60000;

                for (const pairing of pairings) {
                    const startTimeIso = new Date(currentTime).toISOString();
                    const newMatch = MatchFactory.createNewMatch(group.id, pairing.home, pairing.away, globalMatchCounter++, startTimeIso);
                    matchesData.push(newMatch.extractSnapshot());
                    currentTime += durationMs + pauseMs;
                }
            }
        }

        await this.initializationRepository.executeInitialization(payload, payload.teams, payload.groups, matchesData);
    }

    // Diese Methode berechnet den ersten Entwurf der Setzliste nach Abschluss der Vorrunde.
    public async compileIntermediateSeeding(): Promise<SeedingAssignment[]> {
        const vorrundenStandings = await this.groupRepository.fetchOverallStandings('VORRUNDE');
        const completeMatchHistory = await this.matchRepository.fetchCompleteMatchHistory();
        return this.tournamentService.distributeSnakeSeeding(vorrundenStandings, completeMatchHistory);
    }

    // Diese Methode verarbeitet die vom Administrator manuell freigegebene Setzliste.
    public async approveIntermediateSeeding(approvedSeeding: SeedingAssignment[], startTimeIso: string): Promise<void> {
        await this.groupRepository.updateAssignedGroups(approvedSeeding);
        
        const config = await this.settingsRepository.fetchConfig();
        const groups = await this.groupRepository.fetchGroupsByPhase('ZWISCHENRUNDE');
        const matchesData: any[] = [];
        let matchCounter = await this.matchRepository.fetchMaxMatchNumber() + 1;

        for (const group of groups) {
            const teamIds = await this.groupRepository.fetchTeamsByGroup(group.id);
            const pairings = this.tournamentService.generateRoundRobinPairings(teamIds.map(t => t.id));
            
            let currentTime = new Date(startTimeIso).getTime();
            const durationMs = config.match_duration_minutes * 60000;
            const pauseMs = config.pause_duration_minutes * 60000;

            for (const pairing of pairings) {
                const startIso = new Date(currentTime).toISOString();
                const newMatch = MatchFactory.createNewMatch(group.id, pairing.home, pairing.away, matchCounter++, startIso);
                matchesData.push(newMatch.extractSnapshot());
                currentTime += durationMs + pauseMs;
            }
        }

        await this.matchRepository.insertMassMatches(matchesData);
    }

    // Diese Methode überführt das Turnier nach der Zwischenrunde in die Finalrunde.
    public async transitionToFinalRound(startTimeIso: string): Promise<void> {
        const standings = await this.groupRepository.fetchCombinedStandings(['VORRUNDE', 'ZWISCHENRUNDE']);
        
        const allocation = this.tournamentService.splitIntoGoldAndSilver(standings);
        await this.groupRepository.assignFinalRoundGroups(allocation.gold, allocation.silver);

        const goldGroup = await this.groupRepository.fetchGroupByName('Goldrunde', 'FINALRUNDE');
        const silverGroup = await this.groupRepository.fetchGroupByName('Silberrunde', 'FINALRUNDE');

        if (goldGroup) await this.generateNextSwissRound(goldGroup.id, startTimeIso);
        
        const config = await this.settingsRepository.fetchConfig();
        const silverStartTime = new Date(new Date(startTimeIso).getTime() + (config.match_duration_minutes + config.pause_duration_minutes) * 60000).toISOString();
        
        if (silverGroup) await this.generateNextSwissRound(silverGroup.id, silverStartTime);
    }

    // Diese Methode berechnet die nächste Runde innerhalb der Finalrunde.
    public async generateNextSwissRound(groupId: string, startTimeIso: string): Promise<void> {
        const currentMatchesData = await this.matchRepository.fetchMatchesByGroup(groupId);
        const currentMatches = currentMatchesData.map(m => MatchFactory.createFromData(m as any));
        
        if (this.tournamentService.isFinalGroupComplete(currentMatches)) return;

        const standings = await this.groupRepository.fetchStandingsForGroup(groupId);
        const history = await this.matchRepository.fetchCompleteMatchHistory();
        
        const pairings = this.tournamentService.calculateSwissPairings(standings, history);
        if (pairings.length === 0) throw new Error('Es konnten keine überschneidungsfreien Paarungen generiert werden.');

        const insertedMatchesData = await this.matchRepository.insertGeneratedPairingsAndReturn(groupId, pairings);
        const insertedMatches = insertedMatchesData.map(m => MatchFactory.createFromData(m as any));
        
        const config = await this.settingsRepository.fetchConfig();
        const scheduleUpdates = this.tournamentService.scheduleSingleFinalRound(insertedMatches, startTimeIso, config.match_duration_minutes);
        await this.matchRepository.updateMatchTimes(scheduleUpdates);
    }

    // Diese Methode speichert ein Spielergebnis und prüft auf Folgeschritte.
    public async processMatchResult(matchId: string, goalsHome: number, goalsAway: number): Promise<void> {
        const updatedMatchData = await this.matchRepository.updateMatchResult(matchId, goalsHome, goalsAway, 'BEENDET');
        if (!updatedMatchData) return;

        const groupMatchesData = await this.matchRepository.fetchCompletedMatchesByGroup(updatedMatchData.group_id);
        const groupMatches = groupMatchesData.map(m => MatchFactory.createFromData(m as any));
        const teamsInGroup = await this.groupRepository.fetchTeamsByGroup(updatedMatchData.group_id);
        
        const newStandings = this.tournamentService.calculateStandings(teamsInGroup, groupMatches);
        await this.groupRepository.updateStandings(updatedMatchData.group_id, newStandings);

        const groupInfo = await this.groupRepository.fetchGroupById(updatedMatchData.group_id);
        if (groupInfo && groupInfo.phase === 'FINALRUNDE') {
            const allGroupMatchesData = await this.matchRepository.fetchMatchesByGroup(updatedMatchData.group_id);
            const allGroupMatches = allGroupMatchesData.map(m => MatchFactory.createFromData(m as any));
            
            if (this.tournamentService.isCurrentRoundComplete(allGroupMatches) && !this.tournamentService.isFinalGroupComplete(allGroupMatches)) {
                const config = await this.settingsRepository.fetchConfig();
                const lastMatchData = allGroupMatchesData[allGroupMatchesData.length - 1];
                const lastMatchEnd = (lastMatchData as any).end_time;
                const nextStartTime = new Date(new Date(lastMatchEnd).getTime() + (config.match_duration_minutes + config.pause_duration_minutes * 2) * 60000).toISOString();
                
                await this.generateNextSwissRound(updatedMatchData.group_id, nextStartTime);
            }
        }
    }

    // Diese Methode verplant eine komplette Phase zeitlich neu.
    public async reschedulePhase(phase: string): Promise<void> {
        const phaseMatchesData = await this.matchRepository.fetchMatchesByPhase(phase);
        const phaseMatches = phaseMatchesData.map(m => MatchFactory.createFromData(m as any));
        const config = await this.settingsRepository.fetchConfig();
        const startTime = config.phase_start_time || new Date().toISOString();
        
        const scheduleUpdates = this.tournamentService.calculateSchedule(
            phaseMatches, 
            startTime, 
            config.match_duration_minutes, 
            config.pause_duration_minutes
        );

        await this.matchRepository.updateMatchTimes(scheduleUpdates);
    }
}