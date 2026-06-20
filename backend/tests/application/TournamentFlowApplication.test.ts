import { TournamentFlowApplication } from '../../src/application/services/TournamentFlowApplication';
import { TournamentService } from '../../src/domain/services/TournamentService';
import { GroupRepository } from '../../src/infrastructure/repositories/GroupRepository';
import { MatchRepository } from '../../src/infrastructure/repositories/MatchRepository';
import { SettingsRepository } from '../../src/infrastructure/repositories/SettingsRepository';
import { InitializationRepository } from '../../src/infrastructure/repositories/InitializationRepository';

jest.mock('../../src/domain/services/TournamentService');
jest.mock('../../src/infrastructure/repositories/GroupRepository');
jest.mock('../../src/infrastructure/repositories/MatchRepository');
jest.mock('../../src/infrastructure/repositories/SettingsRepository');
jest.mock('../../src/infrastructure/repositories/InitializationRepository');

describe('TournamentFlowApplication', () => {
    let appService: TournamentFlowApplication;
    let mockTournamentService: jest.Mocked<TournamentService>;
    let mockGroupRepo: jest.Mocked<GroupRepository>;
    let mockMatchRepo: jest.Mocked<MatchRepository>;
    let mockSettingsRepo: jest.Mocked<SettingsRepository>;
    let mockInitRepo: jest.Mocked<InitializationRepository>;

    beforeEach(() => {
        jest.clearAllMocks();
        appService = new TournamentFlowApplication();
        
        mockTournamentService = (appService as any).tournamentService;
        mockGroupRepo = (appService as any).groupRepository;
        mockMatchRepo = (appService as any).matchRepository;
        mockSettingsRepo = (appService as any).settingsRepository;
        mockInitRepo = (appService as any).initializationRepository;
    });

    test('initializeTournament should initialize data correctly', async () => {
        // Arrange
        const payload = {
            matchDuration: 10,
            pauseDuration: 2,
            vorrundeStartTime: '2026-06-27T10:00:00Z',
            settings: { match_duration_minutes: 10, pause_duration_minutes: 2, phase_start_time: '2026-06-27T10:00:00Z' },
            teams: [{ id: 't1', name: 'Team 1', logo_path: null }, { id: 't2', name: 'Team 2', logo_path: null }],
            groups: [{ id: 'g1', name: 'Gruppe A', phase: 'VORRUNDE', field_numbers: [1], teamIds: ['t1', 't2'] }]
        };

        mockTournamentService.generateRoundRobinPairings.mockReturnValue([{ home: 't1', away: 't2' }]);
        mockInitRepo.executeInitialization.mockResolvedValue();

        // Act
        await appService.initializeTournament(payload);

        // Assert
        expect(mockTournamentService.generateRoundRobinPairings).toHaveBeenCalledWith(['t1', 't2']);
        expect(mockInitRepo.executeInitialization).toHaveBeenCalled();
    });

    test('generateNextSwissRound should return early if final group is complete', async () => {
        // Arrange
        mockMatchRepo.fetchMatchesByGroup.mockResolvedValueOnce([]);
        mockTournamentService.isFinalGroupComplete.mockReturnValueOnce(true);

        // Act
        await appService.generateNextSwissRound('g1', '2026-06-27T10:00:00Z');

        // Assert
        expect(mockTournamentService.isFinalGroupComplete).toHaveBeenCalled();
        expect(mockGroupRepo.fetchStandingsForGroup).not.toHaveBeenCalled();
    });

    test('shouldCallRepositoriesAndServiceWhenSwissRoundIsProcessed', async () => {
        // Arrange
        const groupId = 'g1';
        const startTimeIso = '2026-06-27T10:00:00Z';
        mockMatchRepo.fetchMatchesByGroup.mockResolvedValueOnce([]);
        mockTournamentService.isFinalGroupComplete.mockReturnValueOnce(false);
        mockGroupRepo.fetchStandingsForGroup.mockResolvedValueOnce([]);
        mockMatchRepo.fetchCompleteMatchHistory.mockResolvedValueOnce({});
        mockTournamentService.calculateSwissPairings.mockReturnValueOnce([{ home: { team_id: 't1', rank: 1 }, away: { team_id: 't2', rank: 2 } }]);
        mockMatchRepo.insertGeneratedPairingsAndReturn.mockResolvedValueOnce([]);
        mockSettingsRepo.fetchConfig.mockResolvedValueOnce({ match_duration_minutes: 10, pause_duration_minutes: 2 } as any);
        mockTournamentService.scheduleSingleFinalRound.mockReturnValueOnce([]);
        mockMatchRepo.updateMatchTimes.mockResolvedValueOnce();

        // Act
        await appService.generateNextSwissRound(groupId, startTimeIso);

        // Assert
        expect(mockMatchRepo.fetchMatchesByGroup).toHaveBeenCalledWith(groupId);
        expect(mockGroupRepo.fetchStandingsForGroup).toHaveBeenCalledWith(groupId);
        expect(mockMatchRepo.fetchCompleteMatchHistory).toHaveBeenCalled();
        expect(mockTournamentService.calculateSwissPairings).toHaveBeenCalled();
        expect(mockMatchRepo.insertGeneratedPairingsAndReturn).toHaveBeenCalledWith(groupId, expect.any(Array));
        expect(mockTournamentService.scheduleSingleFinalRound).toHaveBeenCalled();
        expect(mockMatchRepo.updateMatchTimes).toHaveBeenCalled();
    });

    test('shouldThrowErrorWhenSwissPairingsCannotBeGenerated', async () => {
        // Arrange
        const groupId = 'g1';
        const startTimeIso = '2026-06-27T10:00:00Z';
        mockMatchRepo.fetchMatchesByGroup.mockResolvedValueOnce([]);
        mockTournamentService.isFinalGroupComplete.mockReturnValueOnce(false);
        mockGroupRepo.fetchStandingsForGroup.mockResolvedValueOnce([]);
        mockMatchRepo.fetchCompleteMatchHistory.mockResolvedValueOnce({});
        mockTournamentService.calculateSwissPairings.mockReturnValueOnce([]);

        // Act & Assert
        await expect(appService.generateNextSwissRound(groupId, startTimeIso)).rejects.toThrow('Es konnten keine überschneidungsfreien Paarungen generiert werden.');
    });

    test('shouldReturnSnakeSeedingWhenCompiled', async () => {
        // Arrange
        mockGroupRepo.fetchOverallStandings.mockResolvedValueOnce([]);
        mockMatchRepo.fetchCompleteMatchHistory.mockResolvedValueOnce({});
        const mockSeeding = [{ assigned_group: 'Gruppe G', team_id: 't1', original_rank: 1 }];
        mockTournamentService.distributeSnakeSeeding.mockReturnValueOnce(mockSeeding);

        // Act
        const result = await appService.compileIntermediateSeeding();

        // Assert
        expect(mockGroupRepo.fetchOverallStandings).toHaveBeenCalledWith('VORRUNDE');
        expect(mockTournamentService.distributeSnakeSeeding).toHaveBeenCalled();
        expect(result).toEqual(mockSeeding);
    });

    test('shouldUpdateGroupsWhenSnakeSeedingIsApproved', async () => {
        // Arrange
        mockGroupRepo.updateAssignedGroups.mockResolvedValueOnce();
        mockSettingsRepo.fetchConfig.mockResolvedValueOnce({ match_duration_minutes: 10, pause_duration_minutes: 2 } as any);
        mockGroupRepo.fetchGroupsByPhase.mockResolvedValueOnce([]);
        mockMatchRepo.fetchMaxMatchNumber.mockResolvedValueOnce(0);

        // Act
        await appService.approveIntermediateSeeding([{ assigned_group: 'Gruppe G', team_id: 't1', original_rank: 1 }], '2026-06-27T10:00:00Z');

        // Assert
        expect(mockGroupRepo.updateAssignedGroups).toHaveBeenCalled();
    });

    test('shouldUpdateMatchAndTriggerStandingsWhenResultIsProcessed', async () => {
        // Arrange
        const matchId = 'm1';
        const mockMatch = { id: matchId, group_id: 'g1', goals_home: 2, goals_away: 1, status: 'BEENDET' };
        mockMatchRepo.updateMatchResult.mockResolvedValueOnce(mockMatch as any);
        mockGroupRepo.fetchGroupById.mockResolvedValueOnce({ phase: 'VORRUNDE' } as any);
        mockMatchRepo.fetchCompletedMatchesByGroup.mockResolvedValueOnce([]);
        mockGroupRepo.fetchTeamsByGroup.mockResolvedValueOnce([]);
        mockTournamentService.calculateStandings.mockReturnValueOnce([]);

        // Act
        await appService.processMatchResult(matchId, 2, 1);

        // Assert
        expect(mockMatchRepo.updateMatchResult).toHaveBeenCalledWith(matchId, 2, 1, 'BEENDET');
        expect(mockMatchRepo.fetchCompletedMatchesByGroup).toHaveBeenCalledWith('g1');
        expect(mockGroupRepo.updateStandings).toHaveBeenCalledWith('g1', expect.any(Array));
    });

    test('shouldUpdateMatchTimesWhenPhaseIsRescheduled', async () => {
        // Arrange
        const phase = 'VORRUNDE';
        mockMatchRepo.fetchMatchesByPhase.mockResolvedValueOnce([]);
        mockSettingsRepo.fetchConfig.mockResolvedValueOnce({
            match_duration_minutes: 10,
            pause_duration_minutes: 2,
            phase_start_time: '2026-06-27T09:00:00Z',
            tournament_logo_path: null,
            background_image_path: null,
            background_image_mobile_path: null,
            footer_text_de: '',
            footer_text_en: ''
        });
        mockTournamentService.calculateSchedule.mockReturnValueOnce([]);

        // Act
        await appService.reschedulePhase(phase);

        // Assert
        expect(mockMatchRepo.fetchMatchesByPhase).toHaveBeenCalledWith(phase);
        expect(mockSettingsRepo.fetchConfig).toHaveBeenCalled();
        expect(mockTournamentService.calculateSchedule).toHaveBeenCalled();
        expect(mockMatchRepo.updateMatchTimes).toHaveBeenCalled();
    });
});
