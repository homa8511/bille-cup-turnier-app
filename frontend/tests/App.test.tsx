import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

// Wir mocken den Hook aus src/hooks/useTournamentData
vi.mock("../src/hooks/useTournamentData", () => {
  return {
    useTournamentData: vi.fn(),
  };
});
import { useTournamentData } from "../src/hooks/useTournamentData";

describe("App Hauptkomponente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display the loading screen when data is being fetched", () => {
    // Arrange
    vi.mocked(useTournamentData).mockReturnValue({
      teams: [],
      groups: [],
      matches: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    render(<App />);

    // Assert
    expect(
      screen.getByText("Turnierdaten werden geladen..."),
    ).toBeInTheDocument();
  });

  it("should render the tournament interface when data is successfully loaded", async () => {
    // Arrange
    vi.mocked(useTournamentData).mockReturnValue({
      teams: [{ id: "t1", name: "FC Bergedorf 85", logo_path: undefined }],
      groups: [
        {
          id: "g1",
          name: "Gruppe A",
          phase: "VORRUNDE",
          field_numbers: [1],
          standings: [],
        },
      ],
      matches: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    // Act
    render(<App />);

    // Assert
    expect(screen.getByText("U10 Bille Cup 2026")).toBeInTheDocument();
    expect(screen.getByText("Gruppe A")).toBeInTheDocument();
  });

  it("should switch to the info tab when the corresponding button is clicked", async () => {
    // Arrange
    vi.mocked(useTournamentData).mockReturnValue({
      teams: [{ id: "t1", name: "FC Bergedorf 85", logo_path: undefined }],
      groups: [],
      matches: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<App />);

    // Act
    const infoTabButton = screen.getByRole("button", { name: /Turnierinfos/i });
    fireEvent.click(infoTabButton);

    // Assert
    expect(screen.getByText("Turnierregeln")).toBeInTheDocument();
  });

  it("should open the login modal when the login button is clicked", async () => {
    // Arrange
    vi.mocked(useTournamentData).mockReturnValue({
      teams: [{ id: "t1", name: "FC Bergedorf 85", logo_path: undefined }],
      groups: [],
      matches: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<App />);

    // Act
    const loginButton = screen
    .getAllByRole("button")
    .find((btn) => btn.innerHTML.includes("lucide-log-in") || btn.innerHTML.includes("LogIn") || btn.querySelector('svg.lucide-log-in'));
    if (loginButton) {
        fireEvent.click(loginButton);
    }

    // Assert
    expect(screen.getByText("Benutzername")).toBeInTheDocument();
    expect(screen.getByText("Passwort")).toBeInTheDocument();
  });
});
