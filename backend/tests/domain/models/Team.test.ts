import { Team } from '../../../src/domain/models/Team';

describe('Team', () => {
    let team: Team;

    beforeEach(() => {
        team = new Team('t1', 'FC Bergedorf 85', '/logo.png');
    });

    test('shouldUpdateNameWhenValidNameIsProvided', () => {
        // Arrange
        const newName = 'ASV Bergedorf';

        // Act
        team.changeName(newName);

        // Assert
        expect(team.extractSnapshot().name).toBe(newName);
    });

    test('shouldThrowErrorWhenEmptyNameIsProvided', () => {
        // Arrange
        const emptyName = '   ';

        // Act & Assert
        expect(() => team.changeName(emptyName)).toThrow('Eine Mannschaft benötigt zwingend einen gültigen Namen.');
    });

    test('shouldUpdateLogoWhenNewPathIsProvided', () => {
        // Arrange
        const newLogo = '/new-logo.png';

        // Act
        team.assignNewLogo(newLogo);

        // Assert
        expect(team.extractSnapshot().logo_path).toBe(newLogo);
    });

    test('shouldSetLogoToNullWhenLogoIsRemoved', () => {
        // Arrange
        // Das Team hat initial ein Logo aus dem beforeEach-Block.

        // Act
        team.removeLogo();

        // Assert
        expect(team.extractSnapshot().logo_path).toBeNull();
    });

    test('shouldReturnCorrectDataWhenSnapshotIsExtracted', () => {
        // Arrange
        // Das Team existiert bereits durch beforeEach.

        // Act
        const snapshot = team.extractSnapshot();

        // Assert
        expect(snapshot.id).toBe('t1');
        expect(snapshot.name).toBe('FC Bergedorf 85');
        expect(snapshot.logo_path).toBe('/logo.png');
    });
});