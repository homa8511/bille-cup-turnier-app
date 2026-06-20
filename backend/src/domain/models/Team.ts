// Diese Klasse kapselt alle Eigenschaften und Verhaltensweisen einer Mannschaft vollständig.
export class Team {
    constructor(
        private readonly id: string,
        private name: string,
        private logoPath: string | null
    ) {}

    // Diese Methode ändert den offiziellen Namen der Mannschaft im System.
    public changeName(newName: string): void {
        if (!newName || newName.trim() === '') {
            throw new Error('Eine Mannschaft benötigt zwingend einen gültigen Namen.');
        }
        this.name = newName;
    }

    // Diese Methode weist der Mannschaft ein neues Vereinswappen zu.
    public assignNewLogo(newLogoPath: string): void {
        this.logoPath = newLogoPath;
    }

    // Diese Methode entfernt das aktuell hinterlegte Logo der Mannschaft.
    public removeLogo(): void {
        this.logoPath = null;
    }

    // Diese Methode extrahiert den aktuellen Zustand für die Persistenzschicht ohne herkömmliche Getter.
    public extractSnapshot() {
        return {
            id: this.id,
            name: this.name,
            logo_path: this.logoPath
        };
    }
}