import { TeamFactory, GroupFactory, MatchFactory, TeamData, GroupData, MatchData } from '../../../src/domain/factories/TournamentFactories';

describe('TournamentFactories', () => {

    test('shouldCreateTeamEntityWhenValidDataIsProvided', () => {
        // Arrange
        const data: TeamData = { id: 't1', name: 'Altona 93', logo_path: null };

        // Act
        const team = TeamFactory.createFromData(data);

        // Assert
        expect(team.extractSnapshot().id).toBe('t1');
        expect(team.extractSnapshot().name).toBe('Altona 93');
    });

    test('shouldCreateGroupEntityWhenValidDataIsProvided', () => {
        // Arrange
        const data: GroupData = { id: 'g1', name: 'Finalrunde', phase: 'FINALE', field_numbers: [1, 2, 3, 4, 5, 6] };

        // Act
        const group = GroupFactory.createFromData(data);

        // Assert
        expect(group.extractSnapshot().field_numbers).toHaveLength(6);
        expect(group.extractSnapshot().phase).toBe('FINALE');
    });

    test('shouldCreateMatchEntityWhenValidDataIsProvided', () => {
        // Arrange
        const data: MatchData = {
            id: 'm1',
            group_id: 'g1',
            home_team_id: 't1',
            away_team_id: 't2',
            home_placeholder: null,
            away_placeholder: null,
            goals_home: null,
            goals_away: null,
            status: 'GEPLANT',
            match_number: 1,
            start_time: '2026-06-27T09:00:00Z',
            end_time: null
        };

        // Act
        const match = MatchFactory.createFromData(data);

        // Assert
        expect(match.extractSnapshot().match_number).toBe(1);
        expect(match.extractSnapshot().status).toBe('GEPLANT');
    });

    test('shouldCreatePlaceholderMatchWhenArgumentsAreProvided', () => {
        // Arrange
        const groupId = 'g1';
        const matchNumber = 42;
        const homePH = 'Sieger A';
        const awayPH = 'Sieger B';
        const startTime = '2026-06-27T14:00:00Z';

        // Act
        const match = MatchFactory.createPlaceholderMatch(groupId, matchNumber, homePH, awayPH, startTime);

        // Assert
        const snapshot = match.extractSnapshot();
        expect(snapshot.home_placeholder).toBe(homePH);
        expect(snapshot.home_team_id).toBeNull();
        expect(snapshot.match_number).toBe(42);
        expect(snapshot.id).toBeDefined();
    });
});