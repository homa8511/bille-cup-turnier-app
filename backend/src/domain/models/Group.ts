// Diese Klasse verwaltet den exakten Zustand einer Spielgruppe inklusive mehrerer Spielfelder.
export class Group {
  constructor(
    private readonly id: string,
    private name: string,
    private readonly phase: string,
    private fieldNumbers: number[],
  ) {}

  // Diese Methode verlegt die gesamte Gruppe auf ein oder mehrere neue Spielfelder.
  public relocateToFields(newFieldNumbers: number[]): void {
    if (!newFieldNumbers || newFieldNumbers.length === 0) {
      throw new Error(
        "Eine Gruppe benötigt mindestens ein zugewiesenes Spielfeld.",
      );
    }

    for (const field of newFieldNumbers) {
      if (field <= 0 || field > 6) {
        throw new Error("Die Platznummer muss zwischen 1 und 6 liegen.");
      }
    }

    this.fieldNumbers = newFieldNumbers;
  }

  // Diese Methode korrigiert die sichtbare Bezeichnung der Spielgruppe.
  public renameGroup(newName: string): void {
    if (!newName || newName.trim() === "") {
      throw new Error("Eine Gruppe benötigt einen sichtbaren Namen.");
    }
    this.name = newName;
  }

  // Diese Methode erzeugt ein sauberes Objekt für das Speichern im Gruppen-Repository.
  public extractSnapshot() {
    return {
      id: this.id,
      name: this.name,
      phase: this.phase,
      field_numbers: this.fieldNumbers,
    };
  }
}
