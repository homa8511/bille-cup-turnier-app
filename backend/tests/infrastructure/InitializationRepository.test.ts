import { InitializationRepository } from '../../src/infrastructure/repositories/InitializationRepository';
import { PostgresClient } from '../../src/infrastructure/database/PostgresClient';

jest.mock('../../src/infrastructure/database/PostgresClient', () => {
    const mockClient = {
        query: jest.fn(),
        release: jest.fn()
    };
    const mockPool = {
        connect: jest.fn(() => mockClient)
    };
    return {
        PostgresClient: {
            getInstance: jest.fn(() => ({
                getPool: () => mockPool
            })),
        },
    };
});

describe('InitializationRepository', () => {
    let repository: InitializationRepository;
    let mockPoolClient: any;

    beforeEach(() => {
        jest.clearAllMocks();
        repository = new InitializationRepository();
        mockPoolClient = PostgresClient.getInstance().getPool().connect();
    });

    test('executeInitialization should execute transactions correctly', async () => {
        // Arrange
        mockPoolClient.query.mockResolvedValue({});

        const settings = { matchDuration: 10, pauseDuration: 2, vorrundeStartTime: '2026-06-27T10:00:00Z' };
        const teams = [{ id: 't1', name: 'Team 1', logo_path: null }];
        const groups = [{ id: 'g1', name: 'Group 1', phase: 'VORRUNDE', field_numbers: [1], teamIds: ['t1'] }];
        const matches = [{ id: 'm1', group_id: 'g1', match_number: 1, start_time: '2026-06-27T10:00:00Z' }];

        // Act
        await repository.executeInitialization(settings, teams, groups, matches);

        // Assert
        expect(mockPoolClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockPoolClient.query).toHaveBeenCalledWith(expect.stringContaining('TRUNCATE TABLE'));
        expect(mockPoolClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO tournament_settings'), expect.any(Array));
        expect(mockPoolClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO teams'), expect.any(Array));
        expect(mockPoolClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO groups'), expect.any(Array));
        expect(mockPoolClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO group_teams'), expect.any(Array));
        expect(mockPoolClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO matches'), expect.any(Array));
        expect(mockPoolClient.query).toHaveBeenCalledWith('COMMIT');
        expect(mockPoolClient.release).toHaveBeenCalled();
    });

    test('executeInitialization should rollback on error', async () => {
        // Arrange
        mockPoolClient.query.mockRejectedValueOnce(new Error('DB Error'));

        // Act & Assert
        await expect(repository.executeInitialization({}, [], [], [])).rejects.toThrow('DB Error');

        expect(mockPoolClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockPoolClient.query).toHaveBeenCalledWith('ROLLBACK');
        expect(mockPoolClient.release).toHaveBeenCalled();
    });
});
