import { TournamentFlowApplication } from '../../src/application/services/TournamentFlowApplication';
import { TournamentService } from '../../src/domain/services/TournamentService';
import { GroupRepository } from '../../src/infrastructure/repositories/GroupRepository';
import { MatchRepository } from '../../src/infrastructure/repositories/MatchRepository';
import { SettingsRepository } from '../../src/infrastructure/repositories/SettingsRepository';

jest.mock('../../src/domain/services/TournamentService');
jest.mock('../../src/infrastructure/repositories/GroupRepository');
jest.mock('../../src/infrastructure/repositories/MatchRepository');
jest.mock('../../src/infrastructure/repositories/SettingsRepository');

describe('TournamentFlowApplication', () => {
    let appService: TournamentFlowApplication;
    let mockTournamentService: jest.Mocked<TournamentService>;
    let mockGroupRepo: jest.Mocked<GroupRepository>;
    let mockMatchRepo: jest.Mocked<MatchRepository>;
    let mockSettingsRepo: jest.Mocked<SettingsRepository>;

    beforeEach(() => {
        jest.clearAllMocks();
        appService = new TournamentFlowApplication();
        
        mockTournamentService = (appService as any).tournamentService;
        mockGroupRepo = (appService as any).groupRepository;
        mockMatchRepo = (appService as any).matchRepository;
        mockSettingsRepo = (appService as any).settingsRepository;
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

    test('shouldUpdateGroupsWhenSnakeSeedingIsCompiled', async () => {
        // Arrange
        mockGroupRepo.fetchOverallStandings.mockResolvedValueOnce([]);
        mockMatchRepo.fetchCompleteMatchHistory.mockResolvedValueOnce({});
        mockTournamentService.distributeSnakeSeeding.mockReturnValueOnce([]);

        // Act
        await appService.compileIntermediateSeeding();

        // Assert
        expect(mockGroupRepo.fetchOverallStandings).toHaveBeenCalledWith('VORRUNDE');
        expect(mockTournamentService.distributeSnakeSeeding).toHaveBeenCalled();
    });

    test('shouldUpdateMatchAndTriggerStandingsWhenResultIsProcessed', async () => {
        // Arrange
        const matchId = 'm1';
        const mockMatch = { id: matchId, group_id: 'g1', goals_home: 2, goals_away: 1, status: 'BEENDET' };
        mockMatchRepo.updateMatchResult.mockResolvedValueOnce(mockMatch as any);
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