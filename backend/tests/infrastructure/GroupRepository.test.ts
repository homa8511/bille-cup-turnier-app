import { GroupRepository } from '../../src/infrastructure/repositories/GroupRepository';
import { PostgresClient } from '../../src/infrastructure/database/PostgresClient';

// Das System mockt den Datenbank-Client für isolierte Tests.
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
        // Die Testumgebung setzt alle Mocks zurück.
        jest.clearAllMocks();
        repository = new GroupRepository();
        mockDb = PostgresClient.getInstance();
    });

    test('fetchStandingsForGroup liefert die korrekte Tabelle zurück', async () => {
        const mockRows = [{ team_id: 't1', points: 3, rank: 1 }];
        mockDb.query.mockResolvedValueOnce({ rows: mockRows });

        const result = await repository.fetchStandingsForGroup('g1');

        // Das Repository ruft die Datenbank mit der korrekten Gruppen-ID auf.
        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), ['g1']);
        // Die Methode gibt die simulierten Zeilen zurück.
        expect(result).toEqual(mockRows);
    });

    test('fetchTeamsByGroup lädt alle Teams einer Gruppe', async () => {
        const mockRows = [{ id: 't1' }, { id: 't2' }];
        mockDb.query.mockResolvedValueOnce({ rows: mockRows });

        const result = await repository.fetchTeamsByGroup('g1');

        // Das Repository führt die Abfrage erfolgreich aus.
        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), ['g1']);
        // Das Ergebnis entspricht den simulierten Teams.
        expect(result).toEqual(mockRows);
    });

    test('updateStandings aktualisiert die Tabellenstände in der Datenbank', async () => {
        const mockStandings = [
            { team_id: 't1', points: 3, matches_played: 1, goals_scored: 2, goals_conceded: 0, goal_diff: 2, rank: 1 }
        ];
        mockDb.query.mockResolvedValueOnce({ rowCount: 1 });

        await repository.updateStandings('g1', mockStandings);

        // Das Repository sendet ein UPDATE-Statement an die Datenbank.
        expect(mockDb.query).toHaveBeenCalledTimes(1);
    });
});