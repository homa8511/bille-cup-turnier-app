import { PostgresClient } from '../../src/infrastructure/database/PostgresClient';

const mockPoolClient = {
    query: jest.fn(),
    release: jest.fn(),
};

const mockPool = {
    connect: jest.fn(() => Promise.resolve(mockPoolClient)),
    on: jest.fn(),
    end: jest.fn(),
};

jest.mock('pg', () => {
    return { Pool: jest.fn(() => mockPool) };
});

describe('PostgresClient', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset the singleton instance for testing
        (PostgresClient as any).instance = undefined;
    });

    test('getInstance should return a singleton instance', () => {
        // Arrange (none)

        // Act
        const instance1 = PostgresClient.getInstance();
        const instance2 = PostgresClient.getInstance();

        // Assert
        expect(instance1).toBe(instance2);
    });

    test('query should execute query on pool', async () => {
        // Arrange
        const client = PostgresClient.getInstance();
        const mockResult = { rows: [] };
        mockPoolClient.query.mockResolvedValueOnce(mockResult);

        // Act
        const result = await client.query('SELECT 1');

        // Assert
        expect(mockPoolClient.query).toHaveBeenCalledWith('SELECT 1', undefined);
        expect(mockPoolClient.release).toHaveBeenCalled();
        expect(result).toBe(mockResult);
    });

    test('getPool should return the pool instance', () => {
        // Arrange
        const client = PostgresClient.getInstance();

        // Act
        const pool = client.getPool();

        // Assert
        expect(pool).toBeDefined();
    });
});
