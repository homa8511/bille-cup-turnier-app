import { Request, Response } from 'express';
import { TournamentFlowApplication } from '../../application/services/TournamentFlowApplication';

export class TournamentController {
    private tournamentFlow: TournamentFlowApplication;

    constructor() {
        this.tournamentFlow = new TournamentFlowApplication();
    }

    // Nimmt den HTTP Request entgegen und ruft den Application Layer auf
    public async generateNextRound(req: Request, res: Response): Promise<void> {
        try {
            const { groupId } = req.body;
            
            if (!groupId) {
                res.status(400).json({ error: 'Group ID is required' });
                return;
            }

            await this.tournamentFlow.processSwissRoundPairings(groupId);
            
            res.status(200).json({ message: 'Next round generated successfully' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}