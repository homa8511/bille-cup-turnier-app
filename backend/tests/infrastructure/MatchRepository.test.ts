import { MatchRepository } from '../../src/infrastructure/repositories/MatchRepository';
import { PostgresClient } from '../../src/infrastructure/database/PostgresClient';

// Das System mockt den PostgreSQL-Client vollständig.
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
        // Die Testumgebung bereinigt alte Aufrufe.
        jest.clearAllMocks();
        repository = new MatchRepository();
        mockDb = PostgresClient.getInstance();
    });

    test('fetchCompletedMatchesByGroup lädt nur beendete Spiele', async () => {
        const mockRows = [{ id: 'm1', status: 'BEENDET' }];
        mockDb.query.mockResolvedValueOnce({ rows: mockRows });

        const result = await repository.fetchCompletedMatchesByGroup('g1');

        // Die Methode verwendet die übergebene Gruppen-ID für die Suche.
        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), ['g1', 'BEENDET']);
        // Die Rückgabe enthält die beendeten Spiele.
        expect(result).toEqual(mockRows);
    });

    test('updateMatchResult speichert Tore und aktualisiert den Status', async () => {
        const mockMatch = { id: 'm1', goals_home: 2, goals_away: 1, status: 'BEENDET' };
        mockDb.query.mockResolvedValueOnce({ rows: [mockMatch] });

        const result = await repository.updateMatchResult('m1', 2, 1, 'BEENDET');

        // Das Repository speichert die neuen Werte in der Tabelle.
        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), [2, 1, 'BEENDET', 'm1']);
        // Die Funktion liefert das aktualisierte Spiel zurück.
        expect(result).toEqual(mockMatch);
    });

    test('fetchCompleteMatchHistory erstellt eine korrekte Matrix', async () => {
        const mockRows = [
            { home_team_id: 't1', away_team_id: 't2' }
        ];
        mockDb.query.mockResolvedValueOnce({ rows: mockRows });

        const history = await repository.fetchCompleteMatchHistory();

        // Das Team t1 hat laut Matrix gegen t2 gespielt.
        expect(history['t1']).toContain('t2');
        // Das Team t2 hat laut Matrix gegen t1 gespielt.
        expect(history['t2']).toContain('t1');
    });
});