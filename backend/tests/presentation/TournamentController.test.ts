import { TournamentController } from '../../src/presentation/controllers/TournamentController';
import { TournamentFlowApplication } from '../../src/application/services/TournamentFlowApplication';
import { PostgresClient } from '../../src/infrastructure/database/PostgresClient';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Das System mockt die Abhängigkeiten der Anwendung.
jest.mock('../../src/application/services/TournamentFlowApplication');
jest.mock('jsonwebtoken');
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

describe('TournamentController', () => {
    let controller: TournamentController;
    let mockAppService: jest.Mocked<TournamentFlowApplication>;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
        // Die Testfunktion löscht alle bisherigen Mock-Daten.
        jest.clearAllMocks();

        mockAppService = new TournamentFlowApplication() as jest.Mocked<TournamentFlowApplication>;
        controller = new TournamentController();
        (controller as any).tournamentFlow = mockAppService;

        // Das Framework erstellt simulierte Request- und Response-Objekte.
        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
    });

    test('loginAdmin gewährt Zugriff bei korrekten Zugangsdaten', async () => {
        mockReq = { body: { username: 'admin', password: 'bille2026' } };
        (jwt.sign as jest.Mock).mockReturnValue('fake-jwt-token');

        await controller.loginAdmin(mockReq as Request, mockRes as Response);

        // Der Controller sendet das generierte Token zurück.
        expect(mockRes.json).toHaveBeenCalledWith({ token: 'fake-jwt-token' });
    });

    test('loginAdmin verweigert Zugriff bei falschen Zugangsdaten', async () => {
        mockReq = { body: { username: 'admin', password: 'wrong' } };

        await controller.loginAdmin(mockReq as Request, mockRes as Response);

        // Der Controller antwortet mit dem HTTP-Statuscode 401.
        expect(mockRes.status).toHaveBeenCalledWith(401);
        // Der Nutzer erhält eine entsprechende Fehlermeldung.
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Ungültige Zugangsdaten' });
    });

    test('updateMatchResult ruft die Anwendungsschicht auf', async () => {
        mockReq = { params: { id: 'm1' }, body: { goals_home: 2, goals_away: 1 } };
        mockAppService.processMatchResult.mockResolvedValueOnce(undefined);

        await controller.updateMatchResult(mockReq as Request, mockRes as Response);

        // Der Controller delegiert die Aufgabe an den Application Service.
        expect(mockAppService.processMatchResult).toHaveBeenCalledWith('m1', 2, 1);
        // Das System meldet die erfolgreiche Speicherung zurück.
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Ergebnis erfolgreich gespeichert' });
    });

    test('generateSwissRound generiert Paarungen über die Anwendungsschicht', async () => {
        mockReq = { params: { groupId: 'g1' } };
        mockAppService.processSwissRoundPairings.mockResolvedValueOnce(undefined);

        await controller.generateSwissRound(mockReq as Request, mockRes as Response);

        // Der Controller stößt den Prozess für das Schweizer System an.
        expect(mockAppService.processSwissRoundPairings).toHaveBeenCalledWith('g1');
        // Die Antwort bestätigt die erfolgreiche Generierung.
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Paarungen erfolgreich generiert' });
    });
});