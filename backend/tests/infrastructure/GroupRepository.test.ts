import { GroupRepository } from '../../src/infrastructure/repositories/GroupRepository';
import { PostgresClient } from '../../src/infrastructure/database/PostgresClient';

jest.mock('../../src/infrastructure/database/PostgresClient', () => {
    const mClient = {
        query: jest.fn(),
    };
    return {
        PostgresClient: {
            getInstance: jest.fn(() => mClient),
        },
    };
});

describe('GroupRepository', () => {
    let repository: GroupRepository;
    let mockDb: any;

    beforeEach(() => {
        jest.clearAllMocks();
        repository = new GroupRepository();
        mockDb = PostgresClient.getInstance();
    });

    test('fetchStandingsForGroup lädt die korrekte Tabelle zurück', async () => {
        // Arrange
        const mockRows = [{ team_id: 't1', points: 3, rank: 1 }];
        mockDb.query.mockResolvedValueOnce({ rows: mockRows });

        // Act
        const result = await repository.fetchStandingsForGroup('g1');

        // Assert
        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), ['g1']);
        expect(result).toEqual(mockRows);
    });

    test('fetchTeamsByGroup lädt alle Teams einer Gruppe', async () => {
        // Arrange
        const mockRows = [{ id: 't1' }, { id: 't2' }];
        mockDb.query.mockResolvedValueOnce({ rows: mockRows });

        // Act
        const result = await repository.fetchTeamsByGroup('g1');

        // Assert
        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), ['g1']);
        expect(result).toEqual(mockRows);
    });

    test('updateStandings aktualisiert die Tabellenstände in der Datenbank', async () => {
        // Arrange
        const mockStandings = [
            { team_id: 't1', points: 3, matches_played: 1, goals_scored: 2, goals_conceded: 0, goal_diff: 2, rank: 1 }
        ];
        mockDb.query.mockResolvedValueOnce({ rowCount: 1 });

        // Act
        await repository.updateStandings('g1', mockStandings);

        // Assert
        expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    test('fetchGroupById lädt eine Gruppe anhand der ID', async () => {
        // Arrange
        const mockGroup = { id: 'g1', name: 'Gruppe A', phase: 'VORRUNDE' };
        mockDb.query.mockResolvedValueOnce({ rows: [mockGroup] });

        // Act
        const result = await repository.fetchGroupById('g1');

        // Assert
        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), ['g1']);
        expect(result).toEqual(mockGroup);
    });

    test('fetchGroupByName lädt eine Gruppe anhand von Name und Phase', async () => {
        // Arrange
        const mockGroup = { id: 'g1', name: 'Gruppe A', phase: 'VORRUNDE' };
        mockDb.query.mockResolvedValueOnce({ rows: [mockGroup] });

        // Act
        const result = await repository.fetchGroupByName('Gruppe A', 'VORRUNDE');

        // Assert
        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), ['Gruppe A', 'VORRUNDE']);
        expect(result).toEqual(mockGroup);
    });

    test('fetchGroupsByPhase lädt alle Gruppen einer Phase', async () => {
        // Arrange
        const mockGroups = [{ id: 'g1', name: 'Gruppe A', phase: 'VORRUNDE' }];
        mockDb.query.mockResolvedValueOnce({ rows: mockGroups });

        // Act
        const result = await repository.fetchGroupsByPhase('VORRUNDE');

        // Assert
        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), ['VORRUNDE']);
        expect(result).toEqual(mockGroups);
    });

    test('fetchOverallStandings lädt die Gesamttabelle einer Phase', async () => {
        // Arrange
        const mockStandings = [{ team_id: 't1', points: 3 }];
        mockDb.query.mockResolvedValueOnce({ rows: mockStandings });

        // Act
        const result = await repository.fetchOverallStandings('VORRUNDE');

        // Assert
        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), ['VORRUNDE']);
        expect(result).toEqual(mockStandings);
    });

    test('updateAssignedGroups aktualisiert die Gruppenzuweisungen', async () => {
        // Arrange
        mockDb.query.mockResolvedValue({ rows: [{ id: 'g1' }] });

        // Act
        await repository.updateAssignedGroups([{ team_id: 't1', original_rank: 1, assigned_group: 'Gruppe G' }]);

        // Assert
        expect(mockDb.query).toHaveBeenCalled();
    });

    test('fetchCombinedStandings aggregiert Tabellenstände über mehrere Phasen', async () => {
        // Arrange
        const mockStandings = [{ team_id: 't1', points: 3 }];
        mockDb.query.mockResolvedValueOnce({ rows: mockStandings });

        // Act
        const result = await repository.fetchCombinedStandings(['VORRUNDE', 'ZWISCHENRUNDE']);

        // Assert
        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), ['VORRUNDE', 'ZWISCHENRUNDE']);
        expect(result).toEqual(mockStandings);
    });

    test('assignFinalRoundGroups ordnet Teams den Finalrunden zu', async () => {
        // Arrange
        mockDb.query.mockResolvedValue({ rows: [{ id: 'g1' }] });

        // Act
        await repository.assignFinalRoundGroups([{ team_id: 't1' } as any], [{ team_id: 't2' } as any]);

        // Assert
        expect(mockDb.query).toHaveBeenCalled();
    });
});
