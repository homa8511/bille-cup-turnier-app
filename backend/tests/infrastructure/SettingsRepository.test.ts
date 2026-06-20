import { SettingsRepository } from '../../src/infrastructure/repositories/SettingsRepository';
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

describe('SettingsRepository', () => {
    let repository: SettingsRepository;
    let mockDb: any;

    beforeEach(() => {
        jest.clearAllMocks();
        repository = new SettingsRepository();
        mockDb = PostgresClient.getInstance();
    });

    test('fetchConfig should return config if present', async () => {
        // Arrange
        const mockConfig = { match_duration_minutes: 10, pause_duration_minutes: 2 };
        mockDb.query.mockResolvedValueOnce({ rows: [mockConfig] });

        // Act
        const result = await repository.fetchConfig();

        // Assert
        expect(result).toEqual(mockConfig);
    });

    test('fetchConfig should return default config if empty', async () => {
        // Arrange
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        // Act
        const result = await repository.fetchConfig();

        // Assert
        expect(result.match_duration_minutes).toBe(10);
        expect(result.pause_duration_minutes).toBe(2);
    });

    test('updateConfig should update partial config', async () => {
        // Arrange
        mockDb.query.mockResolvedValue({ rows: [] });

        // Act
        await repository.updateConfig({ match_duration_minutes: 12 });

        // Assert
        expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE'), expect.any(Array));
    });
});
