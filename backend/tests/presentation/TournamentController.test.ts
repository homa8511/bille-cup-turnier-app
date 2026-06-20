import { TournamentController } from '../../src/presentation/controllers/TournamentController';
import { TournamentFlowApplication } from '../../src/application/services/TournamentFlowApplication';
import { PostgresClient } from '../../src/infrastructure/database/PostgresClient';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

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
        jest.clearAllMocks();

        mockAppService = new TournamentFlowApplication() as jest.Mocked<TournamentFlowApplication>;
        controller = new TournamentController();
        (controller as any).tournamentFlow = mockAppService;

        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
    });

    test('loginAdmin gewährt Zugriff bei korrekten Zugangsdaten', async () => {
        // Arrange
        mockReq = { body: { username: 'admin', password: 'bille2026' } };
        (jwt.sign as jest.Mock).mockReturnValue('fake-jwt-token');

        // Act
        await controller.loginAdmin(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({ token: 'fake-jwt-token' });
    });

    test('loginAdmin verweigert Zugriff bei falschen Zugangsdaten', async () => {
        // Arrange
        mockReq = { body: { username: 'admin', password: 'wrong' } };

        // Act
        await controller.loginAdmin(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Ungültige Zugangsdaten' });
    });

    test('updateMatchResult ruft die Anwendungsschicht auf', async () => {
        // Arrange
        mockReq = { params: { id: 'm1' }, body: { goals_home: 2, goals_away: 1 } };
        mockAppService.processMatchResult.mockResolvedValueOnce(undefined);

        // Act
        await controller.updateMatchResult(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockAppService.processMatchResult).toHaveBeenCalledWith('m1', 2, 1);
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Ergebnis erfolgreich gespeichert' });
    });

    test('generateSwissRound generiert Paarungen über die Anwendungsschicht', async () => {
        // Arrange
        mockReq = { params: { groupId: 'g1' } };
        mockAppService.generateNextSwissRound.mockResolvedValueOnce(undefined);

        // Act
        await controller.generateSwissRound(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockAppService.generateNextSwissRound).toHaveBeenCalledWith('g1', expect.any(String));
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Paarungen erfolgreich generiert' });
    });

    test('getMatches gibt Spiele erfolgreich zurück', async () => {
        // Arrange
        mockReq = { query: {} };
        const mockMatches = [{ id: 'm1' }];
        const mClient = PostgresClient.getInstance();
        (mClient.query as jest.Mock).mockResolvedValueOnce({ rows: mockMatches });

        // Act
        await controller.getMatches(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith(mockMatches);
    });

    test('initializeTournament initializes the tournament', async () => {
        // Arrange
        mockReq = { body: { groups: [] } };
        mockAppService.initializeTournament.mockResolvedValueOnce(undefined);

        // Act
        await controller.initializeTournament(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockAppService.initializeTournament).toHaveBeenCalledWith({ groups: [] });
        expect(mockRes.json).toHaveBeenCalledWith({ message: "Turnier erfolgreich initialisiert und Spielplan berechnet." });
    });

    test('getTeams gibt alle Teams zurück', async () => {
        // Arrange
        mockReq = {};
        const mockTeams = [{ id: 't1' }];
        const mClient = PostgresClient.getInstance();
        (mClient.query as jest.Mock).mockResolvedValueOnce({ rows: mockTeams });

        // Act
        await controller.getTeams(mockReq as Request, mockRes as Response);

        // Assert
        expect(mClient.query).toHaveBeenCalledWith('SELECT * FROM teams');
        expect(mockRes.json).toHaveBeenCalledWith(mockTeams);
    });

    test('getGroups gibt alle Gruppen zurück', async () => {
        // Arrange
        mockReq = {};
        const mockGroups = [{ id: 'g1' }];
        const mClient = PostgresClient.getInstance();
        (mClient.query as jest.Mock).mockResolvedValueOnce({ rows: mockGroups });

        // Act
        await controller.getGroups(mockReq as Request, mockRes as Response);

        // Assert
        expect(mClient.query).toHaveBeenCalledWith(expect.stringContaining('SELECT g.id, g.name, g.phase'));
        expect(mockRes.json).toHaveBeenCalledWith(mockGroups);
    });

    test('getSettings gibt Einstellungen zurück', async () => {
        // Arrange
        mockReq = {};
        const mockSettings = { match_duration_minutes: 10 };
        (controller as any).settingsRepo = { fetchConfig: jest.fn().mockResolvedValue(mockSettings) };

        // Act
        await controller.getSettings(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith(mockSettings);
    });

    test('updateSettings aktualisiert Einstellungen', async () => {
        // Arrange
        mockReq = { body: { match_duration_minutes: 12 } };
        (controller as any).settingsRepo = { updateConfig: jest.fn().mockResolvedValue(undefined) };

        // Act
        await controller.updateSettings(mockReq as Request, mockRes as Response);

        // Assert
        expect((controller as any).settingsRepo.updateConfig).toHaveBeenCalledWith({ match_duration_minutes: 12 });
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Einstellungen erfolgreich aktualisiert' });
    });

    test('getPageContent gibt Seiteninhalt zurück', async () => {
        // Arrange
        mockReq = { params: { slug: 'home' }, query: { lang: 'de' } };
        const mockContent = { id: '1', slug: 'home', title_de: 'Start', markdown_content_de: 'Inhalt' };
        (controller as any).contentRepo = { fetchPageBySlug: jest.fn().mockResolvedValue(mockContent) };

        // Act
        await controller.getPageContent(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({ id: '1', slug: 'home', title: 'Start', content: 'Inhalt', updated_at: undefined });
    });

    test('updatePageContent aktualisiert Seiteninhalt', async () => {
        // Arrange
        mockReq = { params: { slug: 'home' }, body: { title_de: 'Start', title_en: 'Home', content_de: 'Inhalt', content_en: 'Content' } };
        (controller as any).contentRepo = { upsertPage: jest.fn().mockResolvedValue(undefined) };

        // Act
        await controller.updatePageContent(mockReq as Request, mockRes as Response);

        // Assert
        expect((controller as any).contentRepo.upsertPage).toHaveBeenCalledWith('home', 'Start', 'Home', 'Inhalt', 'Content');
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Seiteninhalt erfolgreich aktualisiert' });
    });
});
