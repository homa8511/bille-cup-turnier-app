import { GroupStanding } from '../../../src/domain/models/GroupStanding';

describe('GroupStanding', () => {
    let standing: GroupStanding;

    beforeEach(() => {
        standing = new GroupStanding('t1');
    });

    test('shouldAddThreePointsWhenTeamWins', () => {
        // Arrange
        const goalsScored = 3;
        const goalsConceded = 1;

        // Act
        standing.processMatchPerformance(goalsScored, goalsConceded);

        // Assert
        const snapshot = standing.extractSnapshot();
        expect(snapshot.points).toBe(3);
        expect(snapshot.matches_played).toBe(1);
    });

    test('shouldAddOnePointWhenTeamDraws', () => {
        // Arrange
        const goalsScored = 2;
        const goalsConceded = 2;

        // Act
        standing.processMatchPerformance(goalsScored, goalsConceded);

        // Assert
        const snapshot = standing.extractSnapshot();
        expect(snapshot.points).toBe(1);
    });

    test('shouldAddZeroPointsWhenTeamLoses', () => {
        // Arrange
        const goalsScored = 0;
        const goalsConceded = 2;

        // Act
        standing.processMatchPerformance(goalsScored, goalsConceded);

        // Assert
        const snapshot = standing.extractSnapshot();
        expect(snapshot.points).toBe(0);
    });

    test('shouldThrowErrorWhenNegativeGoalsAreProcessed', () => {
        // Arrange
        const invalidGoals = -1;

        // Act & Assert
        expect(() => standing.processMatchPerformance(invalidGoals, 2)).toThrow('Geworfene Tore können nicht negativ sein.');
    });

    test('shouldUpdateRankWhenValidRankIsAssigned', () => {
        // Arrange
        const newRank = 2;

        // Act
        standing.assignFinalRank(newRank);

        // Assert
        expect(standing.extractSnapshot().rank).toBe(newRank);
    });

    test('shouldThrowErrorWhenInvalidRankIsAssigned', () => {
        // Arrange
        const invalidRank = 0;

        // Act & Assert
        expect(() => standing.assignFinalRank(invalidRank)).toThrow('Ein Tabellenplatz muss mindestens eins sein.');
    });

    test('shouldReturnTrueWhenTeamIdMatches', () => {
        // Arrange
        const queryId = 't1';

        // Act
        const isMatch = standing.belongsToTeam(queryId);

        // Assert
        expect(isMatch).toBe(true);
    });

    test('shouldReturnCorrectDataWhenSnapshotIsExtracted', () => {
        // Arrange
        standing.processMatchPerformance(4, 1);
        standing.assignFinalRank(1);

        // Act
        const snapshot = standing.extractSnapshot();

        // Assert
        expect(snapshot.team_id).toBe('t1');
        expect(snapshot.points).toBe(3);
        expect(snapshot.goal_difference).toBe(3);
        expect(snapshot.rank).toBe(1);
    });
});