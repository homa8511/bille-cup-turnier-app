import { Group } from '../../../src/domain/models/Group';

describe('Group', () => {
    let group: Group;

    beforeEach(() => {
        group = new Group('g1', 'Gruppe A', 'VORRUNDE', [1]);
    });

    test('shouldUpdateFieldsWhenValidArrayIsProvided', () => {
        // Arrange
        const newFields = [1, 2, 3];

        // Act
        group.relocateToFields(newFields);

        // Assert
        expect(group.extractSnapshot().field_numbers).toEqual(newFields);
    });

    test('shouldThrowErrorWhenEmptyFieldArrayIsProvided', () => {
        // Arrange
        const emptyFields: number[] = [];

        // Act & Assert
        expect(() => group.relocateToFields(emptyFields)).toThrow('Eine Gruppe benötigt mindestens ein zugewiesenes Spielfeld.');
    });

    test('shouldThrowErrorWhenInvalidFieldNumberIsProvided', () => {
        // Arrange
        const invalidFields = [1, 7];

        // Act & Assert
        expect(() => group.relocateToFields(invalidFields)).toThrow('Die Platznummer muss zwischen 1 und 6 liegen.');
    });

    test('shouldUpdateNameWhenValidNameIsProvided', () => {
        // Arrange
        const newName = 'Gruppe B';

        // Act
        group.renameGroup(newName);

        // Assert
        expect(group.extractSnapshot().name).toBe(newName);
    });

    test('shouldThrowErrorWhenEmptyNameIsProvided', () => {
        // Arrange
        const emptyName = '';

        // Act & Assert
        expect(() => group.renameGroup(emptyName)).toThrow('Eine Gruppe benötigt einen sichtbaren Namen.');
    });

    test('shouldReturnCorrectDataWhenSnapshotIsExtracted', () => {
        // Arrange
        // Die Gruppe existiert bereits durch beforeEach.

        // Act
        const snapshot = group.extractSnapshot();

        // Assert
        expect(snapshot.id).toBe('g1');
        expect(snapshot.name).toBe('Gruppe A');
        expect(snapshot.phase).toBe('VORRUNDE');
        expect(snapshot.field_numbers).toEqual([1]);
    });
});