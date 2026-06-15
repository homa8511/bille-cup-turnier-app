import { TournamentFlowApplication } from '../../src/application/services/TournamentFlowApplication';
import { TournamentService } from '../../src/domain/services/TournamentService';
import { GroupRepository } from '../../src/infrastructure/repositories/GroupRepository';
import { MatchRepository } from '../../src/infrastructure/repositories/MatchRepository';
import { GroupStanding, Match, SwissPairing, CombinedStanding, SeedingAssignment, FinalGroupsAllocation, ScheduleUpdate } from '../../src/domain/models/Tournament';

// Das Framework mockt die externen Abhängigkeiten vollständig.
jest.mock('../../src/domain/services/TournamentService');
jest.mock('../../src/infrastructure/repositories/GroupRepository');
jest.mock('../../src/infrastructure/repositories/MatchRepository');

describe('TournamentFlowApplication (Application Layer)', () => {
    let appService: TournamentFlowApplication;
    let mockTournamentService: jest.Mocked<TournamentService>;
    let mockGroupRepo: jest.Mocked<GroupRepository>;
    let mockMatchRepo: jest.Mocked<MatchRepository>;

    beforeEach(() => {
        // Das System setzt alle Mocks vor jedem Test zurück.
        jest.clearAllMocks();

        // Das System instanziiert die gemockten Klassen.
        mockTournamentService = new TournamentService() as jest.Mocked<TournamentService>;
        mockGroupRepo = new GroupRepository() as jest.Mocked<GroupRepository>;
        mockMatchRepo = new MatchRepository() as jest.Mocked<MatchRepository>;

        // Die Anwendungsschicht baut auf diesen konkreten Mocks auf.
        appService = new TournamentFlowApplication();
        
        // Wir injizieren die Mocks hart in die Instanz für den Test.
        (appService as any).tournamentService = mockTournamentService;
        (appService as any).groupRepository = mockGroupRepo;
        (appService as any).matchRepository = mockMatchRepo;
    });

    test('processSwissRoundPairings orchestriert die Generierung erfolgreich', async () => {
        const mockGroupId = 'group1';
        const mockStandings: GroupStanding[] = [];
        const mockHistory = {};
        const mockPairings: SwissPairing[] = [
            { home: { team_id: 't1', rank: 1 }, away: { team_id: 't2', rank: 2 } }
        ];

        mockGroupRepo.fetchStandingsForGroup.mockResolvedValue(mockStandings);
        mockMatchRepo.fetchMatchHistoryMatrix.mockResolvedValue(mockHistory);
        mockTournamentService.calculateSwissPairings.mockReturnValue(mockPairings);

        await appService.processSwissRoundPairings(mockGroupId);

        // Das System prüft die Einhaltung des exakten Aufrufablaufs.
        expect(mockGroupRepo.fetchStandingsForGroup).toHaveBeenCalledWith(mockGroupId);
        expect(mockMatchRepo.fetchMatchHistoryMatrix).toHaveBeenCalledWith(mockGroupId);
        expect(mockTournamentService.calculateSwissPairings).toHaveBeenCalledWith(mockStandings, mockHistory);
        expect(mockMatchRepo.insertGeneratedPairings).toHaveBeenCalledWith(mockGroupId, mockPairings);
    });

    test('processSwissRoundPairings wirft einen Fehler bei fehlenden Paarungen', async () => {
        const mockGroupId = 'group1';

        mockGroupRepo.fetchStandingsForGroup.mockResolvedValue([]);
        mockMatchRepo.fetchMatchHistoryMatrix.mockResolvedValue({});
        mockTournamentService.calculateSwissPairings.mockReturnValue([]);

        // Der Test verifiziert die definierte Fehlerbehandlung.
        await expect(appService.processSwissRoundPairings(mockGroupId)).rejects.toThrow(
            "Es konnten keine überschneidungsfreien Paarungen generiert werden."
        );
        expect(mockMatchRepo.insertGeneratedPairings).not.toHaveBeenCalled();
    });

    test('compileIntermediateSeeding orchestriert das Schlangensystem', async () => {
        const mockStandings: CombinedStanding[] = [];
        const mockHistory = {};
        const mockSeeding: SeedingAssignment[] = [];

        mockGroupRepo.fetchOverallStandings.mockResolvedValue(mockStandings);
        mockMatchRepo.fetchCompleteMatchHistory.mockResolvedValue(mockHistory);
        mockTournamentService.distributeSnakeSeeding.mockReturnValue(mockSeeding);

        await appService.compileIntermediateSeeding();

        // Der Test bestätigt die korrekte Delegation an die Repositories.
        expect(mockGroupRepo.fetchOverallStandings).toHaveBeenCalledWith('VORRUNDE');
        expect(mockMatchRepo.fetchCompleteMatchHistory).toHaveBeenCalled();
        expect(mockTournamentService.distributeSnakeSeeding).toHaveBeenCalledWith(mockStandings, mockHistory);
        expect(mockGroupRepo.updateAssignedGroups).toHaveBeenCalledWith(mockSeeding);
    });

    test('compileFinalRoundGroups orchestriert die Aufteilung in Leistungsklassen', async () => {
        const mockStandings: CombinedStanding[] = [];
        const mockAllocation: FinalGroupsAllocation = { gold: [], silver: [] };

        mockGroupRepo.fetchCombinedStandings.mockResolvedValue(mockStandings);
        mockTournamentService.splitIntoGoldAndSilver.mockReturnValue(mockAllocation);

        await appService.compileFinalRoundGroups();

        // Die Anwendungsebene übergibt die berechneten Daten an die Infrastruktur.
        expect(mockGroupRepo.fetchCombinedStandings).toHaveBeenCalledWith(['VORRUNDE', 'ZWISCHENRUNDE']);
        expect(mockTournamentService.splitIntoGoldAndSilver).toHaveBeenCalledWith(mockStandings);
        expect(mockGroupRepo.assignFinalRoundGroups).toHaveBeenCalledWith(mockAllocation.gold, mockAllocation.silver);
    });

    test('processMatchResult speichert Ergebnisse und aktualisiert die Tabelle', async () => {
        const mockMatchId = 'match1';
        const mockMatch = { id: mockMatchId, group_id: 'group1' } as Match;
        
        mockMatchRepo.updateMatchResult.mockResolvedValue(mockMatch);
        
        // Wir mocken die tabellenberechnende Methode für diesen isolierten Testteil.
        const compileSpy = jest.spyOn(appService, 'compileGroupStandings').mockResolvedValue();

        await appService.processMatchResult(mockMatchId, 2, 1);

        // Das Speichern des Ergebnisses zieht zwingend eine Tabellenberechnung nach sich.
        expect(mockMatchRepo.updateMatchResult).toHaveBeenCalledWith(mockMatchId, 2, 1, 'BEENDET');
        expect(compileSpy).toHaveBeenCalledWith('group1');
    });

    test('compileGroupStandings berechnet die Tabelle neu und speichert sie', async () => {
        const mockGroupId = 'group1';
        const mockMatches: Match[] = [];
        const mockTeams = [{ id: 't1' }];
        const mockNewStandings: GroupStanding[] = [];

        mockMatchRepo.fetchCompletedMatchesByGroup.mockResolvedValue(mockMatches);
        mockGroupRepo.fetchTeamsByGroup.mockResolvedValue(mockTeams);
        mockTournamentService.calculateStandings.mockReturnValue(mockNewStandings);

        await appService.compileGroupStandings(mockGroupId);

        // Die Geschäftslogik kalkuliert die Tabellenstände aus den rohen Spieldaten.
        expect(mockMatchRepo.fetchCompletedMatchesByGroup).toHaveBeenCalledWith(mockGroupId);
        expect(mockGroupRepo.fetchTeamsByGroup).toHaveBeenCalledWith(mockGroupId);
        expect(mockTournamentService.calculateStandings).toHaveBeenCalledWith(mockTeams, mockMatches);
        expect(mockGroupRepo.updateStandings).toHaveBeenCalledWith(mockGroupId, mockNewStandings);
    });

    test('reschedulePhase berechnet Zeitpläne neu und speichert diese', async () => {
        const mockPhase = 'FINALRUNDE';
        const mockStartTime = '2026-06-27T10:00:00Z';
        const mockMatches: Match[] = [];
        const mockUpdates: ScheduleUpdate[] = [];

        mockMatchRepo.fetchMatchesByPhase.mockResolvedValue(mockMatches);
        mockTournamentService.calculateSchedule.mockReturnValue(mockUpdates);

        await appService.reschedulePhase(mockPhase, mockStartTime);

        // Das System plant die Turnierphasen anhand der Zeitstempel iterativ ein.
        expect(mockMatchRepo.fetchMatchesByPhase).toHaveBeenCalledWith(mockPhase);
        expect(mockTournamentService.calculateSchedule).toHaveBeenCalledWith(mockMatches, mockStartTime);
        expect(mockMatchRepo.updateMatchTimes).toHaveBeenCalledWith(mockUpdates);
    });
});