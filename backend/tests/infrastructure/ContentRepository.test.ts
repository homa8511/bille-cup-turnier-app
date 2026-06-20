import { ContentRepository } from '../../src/infrastructure/repositories/ContentRepository';
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

describe('ContentRepository', () => {
    let repository: ContentRepository;
    let mockDb: any;

    beforeEach(() => {
        jest.clearAllMocks();
        repository = new ContentRepository();
        mockDb = PostgresClient.getInstance();
    });

    test('fetchPageBySlug should return page content if found', async () => {
        // Arrange
        const mockRow = { id: '1', slug: 'home', title_de: 'Startseite' };
        mockDb.query.mockResolvedValueOnce({ rows: [mockRow] });

        // Act
        const result = await repository.fetchPageBySlug('home');

        // Assert
        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), ['home']);
        expect(result).toEqual(mockRow);
    });

    test('fetchPageBySlug should return null if not found', async () => {
        // Arrange
        mockDb.query.mockResolvedValueOnce({ rows: [] });

        // Act
        const result = await repository.fetchPageBySlug('unknown');

        // Assert
        expect(result).toBeNull();
    });

    test('upsertPage should execute upsert query', async () => {
        // Arrange
        mockDb.query.mockResolvedValueOnce({ rowCount: 1 });

        // Act
        await repository.upsertPage('home', 'Startseite', 'Home', 'Hallo', 'Hello');

        // Assert
        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), ['home', 'Startseite', 'Home', 'Hallo', 'Hello']);
    });
});
