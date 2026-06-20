import { TournamentService } from '../../src/domain/services/TournamentService';
import { MatchFactory } from '../../src/domain/factories/TournamentFactories';
import { Match } from '../../src/domain/models/Match';
import { CombinedStanding } from '../../src/domain/models/Tournament';

describe('TournamentService', () => {
    let service: TournamentService;

    beforeEach(() => {
        service = new TournamentService();
    });

    test('calculateStandings should handle teams with no matches', () => {
        // Arrange
        const teams = [{ id: 't1' }, { id: 't2' }];

        // Act
        const standings = service.calculateStandings(teams, []);

        // Assert
        expect(standings.length).toBe(2);
        expect(standings[0].points).toBe(0);
        expect(standings[1].points).toBe(0);
    });

    test('calculateStandings should process completed matches correctly', () => {
        // Arrange
        const teams = [{ id: 't1' }, { id: 't2' }];
        const match = MatchFactory.createNewMatch('g1', 't1', 't2', 1, '2026-06-27T10:00:00Z');
        match.startMatch();
        match.recordFinalScore(2, 1);

        // Act
        const standings = service.calculateStandings(teams, [match]);

        // Assert
        expect(standings.length).toBe(2);
        const t1Stat = standings.find(s => s.team_id === 't1');
        const t2Stat = standings.find(s => s.team_id === 't2');

        expect(t1Stat?.points).toBe(3);
        expect(t1Stat?.goals_scored).toBe(2);
        expect(t1Stat?.goals_conceded).toBe(1);

        expect(t2Stat?.points).toBe(0);
        expect(t2Stat?.goals_scored).toBe(1);
        expect(t2Stat?.goals_conceded).toBe(2);
    });

    test('calculateCombinedStandings should aggregate standings from multiple phases', () => {
        // Arrange
        const allPhaseStandings = [
            { team_id: 't1', points: 3, goals_scored: 2, goals_conceded: 1 },
            { team_id: 't1', points: 1, goals_scored: 1, goals_conceded: 1 },
            { team_id: 't2', points: 0, goals_scored: 1, goals_conceded: 2 }
        ];

        // Act
        const combined = service.calculateCombinedStandings(allPhaseStandings, []);

        // Assert
        expect(combined.length).toBe(2);
        const t1 = combined.find(c => c.team_id === 't1');
        expect(t1?.total_points).toBe(4);
        expect(t1?.total_scored).toBe(3);
        expect(t1?.total_conceded).toBe(2);
        expect(t1?.goal_diff).toBe(1);
    });

    test('calculateCombinedStandings should use head-to-head for tiebreaker', () => {
        // Arrange
        const allPhaseStandings = [
            { team_id: 't1', points: 3, goals_scored: 2, goals_conceded: 1 },
            { team_id: 't2', points: 3, goals_scored: 2, goals_conceded: 1 }
        ];

        const match = MatchFactory.createNewMatch('g1', 't1', 't2', 1, '2026-06-27T10:00:00Z');
        match.startMatch();
        match.recordFinalScore(1, 0); // t1 wins

        // Act
        const combined = service.calculateCombinedStandings(allPhaseStandings, [match]);

        // Assert
        expect(combined[0].team_id).toBe('t1');
        expect(combined[1].team_id).toBe('t2');
    });

    test('splitIntoGoldAndSilver should divide 24 teams evenly', () => {
        // Arrange
        const combinedStandings: CombinedStanding[] = [];
        for (let i = 0; i < 24; i++) {
            combinedStandings.push({
                team_id: `t${i}`,
                total_points: 0,
                total_scored: 0,
                total_conceded: 0,
                goal_diff: 0,
                final_rank: i + 1
            });
        }

        // Act
        const allocation = service.splitIntoGoldAndSilver(combinedStandings);

        // Assert
        expect(allocation.gold.length).toBe(12);
        expect(allocation.silver.length).toBe(12);
        expect(allocation.gold[0].team_id).toBe('t0');
        expect(allocation.silver[0].team_id).toBe('t12');
    });

    test('distributeSnakeSeeding should distribute teams avoiding conflicts', () => {
        // Arrange
        const standings: CombinedStanding[] = Array.from({ length: 24 }).map((_, i) => ({
            team_id: `t${i}`,
            total_points: 0,
            total_scored: 0,
            total_conceded: 0,
            goal_diff: 0,
            final_rank: i + 1
        }));

        // Simuliere Konflikt t0 vs t1
        const history = { 't0': ['t1'] };

        // Act
        const seeding = service.distributeSnakeSeeding(standings, history);

        // Assert
        expect(seeding.length).toBe(24);
        expect(seeding[0].team_id).toBe('t0');
        // Because of the conflict, t0 and t1 swap their assigned groups in the first wave.
        // Initially: t0 -> G, t1 -> H. After swap: t0 -> H, t1 -> G
        expect(seeding[0].assigned_group).toBe('Gruppe H');
    });

    test('calculateSwissPairings should calculate non-conflicting pairings', () => {
        // Arrange
        const currentStandings = [
            { team_id: 't1', rank: 1 },
            { team_id: 't2', rank: 2 },
            { team_id: 't3', rank: 3 },
            { team_id: 't4', rank: 4 }
        ];

        const completeMatchHistory = { 't1': ['t2'] }; // t1 and t2 have played

        // Act
        const pairings = service.calculateSwissPairings(currentStandings, completeMatchHistory);

        // Assert
        expect(pairings.length).toBe(2);
        expect(pairings[0].home.team_id).toBe('t1');
        expect(pairings[0].away.team_id).toBe('t3'); // should play t3, not t2
    });

    test('calculateSwissPairings should return fallback if optimal not found', () => {
        // Arrange
        const currentStandings = [
            { team_id: 't1', rank: 1 },
            { team_id: 't2', rank: 2 }
        ];
        const history = { 't1': ['t2'] };

        // Act
        const pairings = service.calculateSwissPairings(currentStandings, history);

        // Assert
        expect(pairings.length).toBe(1);
    });

    test('generateRoundRobinPairings should create correct pairings', () => {
        // Arrange (none)

        // Act
        const pairings = service.generateRoundRobinPairings(['t1', 't2', 't3']);

        // Assert
        expect(pairings.length).toBe(3); // (t1,t2), (t1,t3), (t2,t3)
    });

    test('calculateSchedule should schedule group matches correctly', () => {
        // Arrange
        const match1 = MatchFactory.createNewMatch('g1', 't1', 't2', 1, '2026-06-27T10:00:00Z');
        const match2 = MatchFactory.createNewMatch('g1', 't3', 't4', 2, '2026-06-27T10:00:00Z');

        // Act
        const schedule = service.calculateSchedule([match1, match2], '2026-06-27T10:00:00Z', 10, 2);

        // Assert
        expect(schedule.length).toBe(2);
        expect(schedule[0].start_time.toISOString()).toBe(new Date('2026-06-27T10:00:00Z').toISOString());
        expect(schedule[1].start_time.toISOString()).toBe(new Date('2026-06-27T10:12:00Z').toISOString());
    });

    test('scheduleSingleFinalRound should schedule round parallelly', () => {
        // Arrange
        const match1 = MatchFactory.createNewMatch('g1', 't1', 't2', 1, '2026-06-27T10:00:00Z');

        // Act
        const schedule = service.scheduleSingleFinalRound([match1], '2026-06-27T10:00:00Z', 10);

        // Assert
        expect(schedule.length).toBe(1);
    });

    test('isFinalGroupComplete should return true if 36 matches played', () => {
        // Arrange
        const matches: Match[] = [];
        for (let i = 0; i < 36; i++) {
            const m = MatchFactory.createNewMatch('g1', 't1', 't2', i, '2026-06-27T10:00:00Z');
            m.startMatch();
            m.recordFinalScore(0, 0);
            matches.push(m);
        }

        // Act
        const result = service.isFinalGroupComplete(matches);

        // Assert
        expect(result).toBe(true);
    });

    test('isCurrentRoundComplete should return true if all matches finished', () => {
        // Arrange
        const match1 = MatchFactory.createNewMatch('g1', 't1', 't2', 1, '2026-06-27T10:00:00Z');
        match1.startMatch();
        match1.recordFinalScore(0, 0);

        // Act
        const result = service.isCurrentRoundComplete([match1]);

        // Assert
        expect(result).toBe(true);
    });

    test('isCurrentRoundComplete should return false if pending matches', () => {
        // Arrange
        const match1 = MatchFactory.createNewMatch('g1', 't1', 't2', 1, '2026-06-27T10:00:00Z');

        // Act
        const result = service.isCurrentRoundComplete([match1]);

        // Assert
        expect(result).toBe(false);
    });
});
