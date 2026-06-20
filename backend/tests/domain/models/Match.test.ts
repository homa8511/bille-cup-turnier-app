import { Match } from '../../../src/domain/models/Match';

describe('Match', () => {
    let match: Match;
    let placeholderMatch: Match;

    beforeEach(() => {
        match = new Match('m1', 'g1', 't1', 't2', 1, null, null, null, null, 'GEPLANT', '2026-06-27T09:00:00Z');
        placeholderMatch = new Match('m2', 'g1', null, null, 2, 'Platzhalter Heim', 'Platzhalter Gast', null, null, 'GEPLANT', '2026-06-27T09:15:00Z');
    });

    test('shouldChangeStatusToAktivWhenMatchIsStarted', () => {
        // Arrange
        // Das Spiel ist initial geplant.

        // Act
        match.startMatch();

        // Assert
        expect(match.extractSnapshot().status).toBe('AKTIV');
    });

    test('shouldUpdateScoreWhenMatchIsAktiv', () => {
        // Arrange
        match.startMatch();

        // Act
        match.updateLiveScore(2, 1);

        // Assert
        const snapshot = match.extractSnapshot();
        expect(snapshot.goals_home).toBe(2);
        expect(snapshot.goals_away).toBe(1);
    });

    test('shouldThrowErrorWhenScoreIsUpdatedForPlannedMatch', () => {
        // Arrange
        // Das Spiel ist noch im Status 'GEPLANT'.

        // Act & Assert
        expect(() => match.updateLiveScore(1, 0)).toThrow('Zwischenstände können nur für aktive Spiele gemeldet werden.');
    });

    test('shouldThrowErrorWhenNegativeScoreIsProvidedForLiveUpdate', () => {
        // Arrange
        match.startMatch();

        // Act & Assert
        expect(() => match.updateLiveScore(-1, 0)).toThrow('Tore dürfen niemals negativ sein.');
    });

    test('shouldSetStatusToBeendetWhenFinalScoreIsRecorded', () => {
        // Arrange
        // Ein Spiel kann jederzeit beendet werden.

        // Act
        match.recordFinalScore(3, 0);

        // Assert
        const snapshot = match.extractSnapshot();
        expect(snapshot.status).toBe('BEENDET');
        expect(snapshot.goals_home).toBe(3);
        expect(snapshot.goals_away).toBe(0);
    });

    test('shouldThrowErrorWhenNegativeFinalScoreIsProvided', () => {
        // Arrange
        // Ein negatives Ergebnis ist unzulässig.

        // Act & Assert
        expect(() => match.recordFinalScore(0, -2)).toThrow('Tore dürfen niemals negativ sein.');
    });

    test('shouldSetStatusToGeplantWhenMatchIsRescheduled', () => {
        // Arrange
        match.startMatch(); // Setzt Status auf AKTIV
        const newTime = '2026-06-27T10:00:00Z';

        // Act
        match.rescheduleTo(newTime);

        // Assert
        const snapshot = match.extractSnapshot();
        expect(snapshot.status).toBe('GEPLANT');
        expect(snapshot.start_time).toBe(newTime);
    });

    test('shouldUpdateTeamsWhenPlaceholdersAreReplaced', () => {
        // Arrange
        const newHomeId = 't3';
        const newAwayId = 't4';

        // Act
        // Wir casten auf any, da die assignTeams Methode im aktuellen Modell implementiert wurde.
        (placeholderMatch as any).assignTeams(newHomeId, newAwayId);

        // Assert
        const snapshot = placeholderMatch.extractSnapshot();
        expect(snapshot.home_team_id).toBe(newHomeId);
        expect(snapshot.away_team_id).toBe(newAwayId);
        expect(snapshot.home_placeholder).toBeNull();
        expect(snapshot.away_placeholder).toBeNull();
    });

    test('shouldThrowErrorWhenNullTeamsAreAssignedToPlaceholder', () => {
        // Arrange
        // Wir simulieren eine fehlerhafte Zuweisung.

        // Act & Assert
        expect(() => (placeholderMatch as any).assignTeams('', 't4')).toThrow('Die Zuweisung erfordert gültige Identifikationsnummern.');
    });

    test('shouldReturnCorrectDataWhenSnapshotIsExtracted', () => {
        // Arrange
        // Das Spiel existiert durch beforeEach.

        // Act
        const snapshot = match.extractSnapshot();

        // Assert
        expect(snapshot.id).toBe('m1');
        expect(snapshot.group_id).toBe('g1');
        expect(snapshot.home_team_id).toBe('t1');
        expect(snapshot.away_team_id).toBe('t2');
        expect(snapshot.match_number).toBe(1);
        expect(snapshot.status).toBe('GEPLANT');
    });
});