import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TournamentController } from './presentation/controllers/TournamentController';

const router = Router();
const tournamentController = new TournamentController();

const JWT_SECRET = process.env.JWT_SECRET || 'turniergeheimnis2026';

// Diese Middleware überprüft das Token der Administratoren.
const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.sendStatus(401);
        return;
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        (req as any).user = user;
        next();
    });
};

// Dieser Endpunkt baut die persistente Verbindung für Live-Updates auf.
router.get('/live', (req: Request, res: Response) => {
    tournamentController.handleLiveConnection(req, res);
});

// Diese Routen verarbeiten alle öffentlichen Anfragen ohne Login.
router.post('/admin/login', (req: Request, res: Response) => tournamentController.loginAdmin(req, res));
router.get('/teams', (req: Request, res: Response) => tournamentController.getTeams(req, res));
router.get('/groups', (req: Request, res: Response) => tournamentController.getGroups(req, res));
router.get('/matches', (req: Request, res: Response) => tournamentController.getMatches(req, res));

// Diese geschützten Routen erfordern ein gültiges Admin-Token.
router.post('/admin/matches/:id/result', authenticateToken, (req: Request, res: Response) => tournamentController.updateMatchResult(req, res));
router.get('/admin/preview-snake', authenticateToken, (req: Request, res: Response) => tournamentController.previewSnakeSeeding(req, res));
router.post('/admin/groups/:groupId/generate-swiss', authenticateToken, (req: Request, res: Response) => tournamentController.generateSwissRound(req, res));

export default router;