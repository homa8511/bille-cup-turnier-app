import { MatchRepository } from '../../src/infrastructure/repositories/MatchRepository';
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

describe('MatchRepository', () => {
    let repository: MatchRepository;
    let mockDb: any;

    beforeEach(() => {
        jest.clearAllMocks();
        repository = new MatchRepository();
        mockDb = PostgresClient.getInstance();
    });

    test('fetchCompletedMatchesByGroup lädt nur beendete Spiele', async () => {
        // Arrange
        const mockRows = [{ id: 'm1', status: 'BEENDET' }];
        mockDb.query.mockResolvedValueOnce({ rows: mockRows });

        // Act
        const result = await repository.fetchCompletedMatchesByGroup('g1');

        // Assert
        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), ['g1', 'BEENDET']);
        expect(result).toEqual(mockRows);
    });

    test('updateMatchResult speichert Tore und aktualisiert den Status', async () => {
        // Arrange
        const mockMatch = { id: 'm1', goals_home: 2, goals_away: 1, status: 'BEENDET' };
        mockDb.query.mockResolvedValueOnce({ rows: [mockMatch] });

        // Act
        const result = await repository.updateMatchResult('m1', 2, 1, 'BEENDET');

        // Assert
        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), [2, 1, 'BEENDET', 'm1']);
        expect(result).toEqual(mockMatch);
    });

    test('fetchCompleteMatchHistory erstellt eine korrekte Matrix', async () => {
        // Arrange
        const mockRows = [
            { home_team_id: 't1', away_team_id: 't2' }
        ];
        mockDb.query.mockResolvedValueOnce({ rows: mockRows });

        // Act
        const history = await repository.fetchCompleteMatchHistory();

        // Assert
        expect(history['t1']).toContain('t2');
        expect(history['t2']).toContain('t1');
    });

    test('fetchMaxMatchNumber ermittelt die höchste Spielnummer', async () => {
        // Arrange
        mockDb.query.mockResolvedValueOnce({ rows: [{ max_num: 42 }] });

        // Act
        const result = await repository.fetchMaxMatchNumber();

        // Assert
        expect(result).toBe(42);
    });

    test('fetchMaxMatchNumber gibt 0 zurück, wenn keine Spiele existieren', async () => {
        // Arrange
        mockDb.query.mockResolvedValueOnce({ rows: [{ max_num: null }] });

        // Act
        const result = await repository.fetchMaxMatchNumber();

        // Assert
        expect(result).toBe(0);
    });

    test('insertMassMatches speichert Spiele massenhaft', async () => {
        // Arrange
        const matches = [{ id: 'm1', group_id: 'g1', home_team_id: 't1', away_team_id: 't2', match_number: 1, status: 'GEPLANT', start_time: null, end_time: null }];

        // Act
        await repository.insertMassMatches(matches);

        // Assert
        expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO matches'), expect.any(Array));
    });

    test('fetchMatchesByGroup lädt alle Spiele einer Gruppe', async () => {
        // Arrange
        const mockMatches = [{ id: 'm1' }];
        mockDb.query.mockResolvedValueOnce({ rows: mockMatches });

        // Act
        const result = await repository.fetchMatchesByGroup('g1');

        // Assert
        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), ['g1']);
        expect(result).toEqual(mockMatches);
    });

    test('fetchMatchesByPhase lädt alle Spiele einer Phase', async () => {
        // Arrange
        const mockMatches = [{ id: 'm1' }];
        mockDb.query.mockResolvedValueOnce({ rows: mockMatches });

        // Act
        const result = await repository.fetchMatchesByPhase('VORRUNDE');

        // Assert
        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), ['VORRUNDE']);
        expect(result).toEqual(mockMatches);
    });

    test('updateMatchTimes aktualisiert die Zeiten mehrerer Spiele', async () => {
        // Arrange
        const updates = [{ match_id: 'm1', start_time: new Date(), end_time: new Date() }];

        // Act
        await repository.updateMatchTimes(updates);

        // Assert
        expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE matches'), expect.any(Array));
    });

    test('insertGeneratedPairingsAndReturn fügt generierte Paarungen ein und gibt diese zurück', async () => {
        // Arrange
        mockDb.query.mockResolvedValueOnce({ rows: [{ max_num: 1 }] });
        const mockReturn = [{ id: 'm1' }];
        mockDb.query.mockResolvedValueOnce({ rows: mockReturn });

        // Act
        const pairings = [{ home: { team_id: 't1', rank: 1 }, away: { team_id: 't2', rank: 2 } }];
        const result = await repository.insertGeneratedPairingsAndReturn('g1', pairings);

        // Assert
        expect(mockDb.query).toHaveBeenCalledTimes(2);
        expect(result).toEqual(mockReturn);
    });
});
