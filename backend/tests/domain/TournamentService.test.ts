import { TournamentService } from '../../src/domain/services/TournamentService';
import { Match, GroupStanding, CombinedStanding } from '../../src/domain/models/Tournament';

describe('TournamentService (DDD Domain Logic)', () => {
    let tournamentService: TournamentService;

    beforeEach(() => {
        // Der Service wird für jeden Test neu instanziiert, um Seiteneffekte zu vermeiden.
        tournamentService = new TournamentService();
    });

    test('calculateStandings berechnet Punkte und Tordifferenz korrekt', () => {
        const mockTeams = [{ id: 'teamA' }, { id: 'teamB' }, { id: 'teamC' }];
        
        // Team A schlägt Team B (2:0). Team B spielt Unentschieden gegen Team C (1:1).
        const mockMatches: Match[] = [
            {
                id: 'm1', match_number: 1, group_id: 'g1', status: 'BEENDET',
                home_team_id: 'teamA', away_team_id: 'teamB',
                goals_home: 2, goals_away: 0,
                start_time: null, end_time: null
            },
            {
                id: 'm2', match_number: 2, group_id: 'g1', status: 'BEENDET',
                home_team_id: 'teamB', away_team_id: 'teamC',
                goals_home: 1, goals_away: 1,
                start_time: null, end_time: null
            }
        ];

        const standings = tournamentService.calculateStandings(mockTeams, mockMatches);

        // Team A: 1 Sieg = 3 Punkte, 2:0 Tore
        const teamA = standings.find(s => s.team_id === 'teamA');
        expect(teamA?.points).toBe(3);
        expect(teamA?.goal_diff).toBe(2);
        expect(teamA?.rank).toBe(1);

        // Team C: 1 Unentschieden = 1 Punkt, 1:1 Tore (Rang 2, da besseres Torverhältnis als B)
        const teamC = standings.find(s => s.team_id === 'teamC');
        expect(teamC?.points).toBe(1);
        expect(teamC?.goal_diff).toBe(0);
        expect(teamC?.rank).toBe(2);

        // Team B: 1 Unentschieden, 1 Niederlage = 1 Punkt, 1:3 Tore
        const teamB = standings.find(s => s.team_id === 'teamB');
        expect(teamB?.points).toBe(1);
        expect(teamB?.goal_diff).toBe(-2);
        expect(teamB?.rank).toBe(3);
    });

    test('splitIntoGoldAndSilver teilt 24 Teams in zwei exakte Hälften', () => {
        // Erzeuge 24 Dummy-Teams
        const mockStandings: CombinedStanding[] = Array.from({ length: 24 }, (_, i) => ({
            team_id: `t${i + 1}`,
            total_points: 24 - i,
            total_scored: 10,
            total_conceded: 5,
            goal_diff: 5,
            final_rank: i + 1
        }));

        const allocation = tournamentService.splitIntoGoldAndSilver(mockStandings);

        expect(allocation.gold.length).toBe(12);
        expect(allocation.gold[0].team_id).toBe('t1');
        expect(allocation.gold[11].team_id).toBe('t12');

        expect(allocation.silver.length).toBe(12);
        expect(allocation.silver[0].team_id).toBe('t13');
        expect(allocation.silver[11].team_id).toBe('t24');
    });

    test('distributeSnakeSeeding verteilt Teams in Schlangenlinien und löst Konflikte auf', () => {
        // Erzeuge 24 Dummy-Teams
        const mockStandings: CombinedStanding[] = Array.from({ length: 24 }, (_, i) => ({
            team_id: `team${i}`,
            total_points: 100 - i,
            total_scored: 0,
            total_conceded: 0,
            goal_diff: 0,
            final_rank: i + 1
        }));

        // Simuliere, dass Team 0 und Team 11 bereits gegeneinander gespielt haben.
        // Diese Teams landen nach dem Snake-Muster beide in Gruppe G.
        const mockHistory: Record<string, string[]> = {
            'team0': ['team11'],
            'team11': ['team0']
        };

        const seeding = tournamentService.distributeSnakeSeeding(mockStandings, mockHistory);

        // Ohne Konflikt wäre Team 0 in Gruppe G und Team 11 ebenfalls in Gruppe G.
        // Wegen des Konflikts muss Team 11 mit dem nächsten Team der Welle (Team 10 in Gruppe H) tauschen.
        const team0Seeding = seeding.find(s => s.team_id === 'team0');
        const team11Seeding = seeding.find(s => s.team_id === 'team11');
        const team10Seeding = seeding.find(s => s.team_id === 'team10');

        expect(team0Seeding?.assigned_group).toBe('Gruppe G');
        
        // Da sie getauscht haben, darf Team 11 nicht mehr in Gruppe G sein.
        expect(team11Seeding?.assigned_group).not.toBe('Gruppe G');
        expect(team11Seeding?.assigned_group).toBe('Gruppe H'); // Wurde mit Team 10 getauscht
        expect(team10Seeding?.assigned_group).toBe('Gruppe G'); // Tauschpartner
    });

    test('calculateSwissPairings findet überschneidungsfreie Paarungen', () => {
        const mockStandings: GroupStanding[] = [
            { team_id: 't1', rank: 1, points: 9, matches_played: 3, goals_scored: 5, goals_conceded: 0, goal_diff: 5 },
            { team_id: 't2', rank: 2, points: 6, matches_played: 3, goals_scored: 3, goals_conceded: 1, goal_diff: 2 },
            { team_id: 't3', rank: 3, points: 3, matches_played: 3, goals_scored: 1, goals_conceded: 3, goal_diff: -2 },
            { team_id: 't4', rank: 4, points: 0, matches_played: 3, goals_scored: 0, goals_conceded: 5, goal_diff: -5 }
        ];

        // Team 1 und Team 2 haben bereits gespielt. Team 1 muss daher gegen Team 3 spielen.
        const mockHistory: Record<string, string[]> = {
            't1': ['t2'],
            't2': ['t1']
        };

        const pairings = tournamentService.calculateSwissPairings(mockStandings, mockHistory);

        expect(pairings.length).toBe(2);
        
        // Paarung 1 muss T1 gegen T3 sein
        expect(pairings[0].home.team_id).toBe('t1');
        expect(pairings[0].away.team_id).toBe('t3');

        // Paarung 2 muss T2 gegen T4 sein
        expect(pairings[1].home.team_id).toBe('t2');
        expect(pairings[1].away.team_id).toBe('t4');
    });

    test('calculateSchedule plant die Start- und Endzeiten sequenziell', () => {
        const mockMatches: Match[] = [
            { id: 'm1', group_id: 'g1', match_number: 1, status: 'GEPLANT', home_team_id: null, away_team_id: null, goals_home: null, goals_away: null, start_time: null, end_time: null },
            { id: 'm2', group_id: 'g1', match_number: 2, status: 'GEPLANT', home_team_id: null, away_team_id: null, goals_home: null, goals_away: null, start_time: null, end_time: null }
        ];

        // Startzeit ist 09:00:00 Uhr UTC
        const startTimeIso = '2026-06-27T09:00:00Z';
        
        // Wir nehmen 10 Minuten Spielzeit und 2 Minuten Pause an (Standardwerte der Methode).
        const schedule = tournamentService.calculateSchedule(mockMatches, startTimeIso, 10, 2);

        expect(schedule.length).toBe(2);

        // Das erste Spiel beginnt um 09:00 und endet um 09:10
        expect(schedule[0].match_id).toBe('m1');
        expect(schedule[0].start_time.toISOString()).toBe('2026-06-27T09:00:00.000Z');
        expect(schedule[0].end_time.toISOString()).toBe('2026-06-27T09:10:00.000Z');

        // Das zweite Spiel beginnt um 09:12 und endet um 09:22
        expect(schedule[1].match_id).toBe('m2');
        expect(schedule[1].start_time.toISOString()).toBe('2026-06-27T09:12:00.000Z');
        expect(schedule[1].end_time.toISOString()).toBe('2026-06-27T09:22:00.000Z');
    });
});