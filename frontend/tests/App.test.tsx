import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// We can mock global.fetch to provide the values instead of mocking the hook,
// this allows us to test the component properly without having to extract the hook.
import App from "../src/App";

const mockTeams = [{ id: "t1", name: "FC Bergedorf 85", logo_path: undefined }];
const mockGroups = [
  {
    id: "g1",
    name: "Gruppe A",
    phase: "VORRUNDE",
    field_numbers: [1],
    standings: [],
  },
];
const mockMatches: any[] = [];

describe("App Hauptkomponente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display the loading screen when data is being fetched", () => {
    // Arrange
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    // Act
    render(<App />);

    // Assert
    expect(
      screen.getByText("Turnierdaten werden geladen..."),
    ).toBeInTheDocument();
  });

  it("should render the tournament interface when data is successfully loaded", async () => {
    // Arrange
    global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/teams")) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTeams) });
        if (url.includes("/api/groups")) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGroups) });
        if (url.includes("/api/matches")) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockMatches) });
        return Promise.reject(new Error("Unbekannte URL"));
    });

    // Act
    render(<App />);

    // Assert
    expect(await screen.findByText("U10 Bille Cup 2026")).toBeInTheDocument();
    expect(await screen.findByText("Gruppe A")).toBeInTheDocument();
  });

  it("should switch to the info tab when the corresponding button is clicked", async () => {
    // Arrange
    global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/teams")) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTeams) });
        if (url.includes("/api/groups")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        if (url.includes("/api/matches")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        return Promise.reject(new Error("Unbekannte URL"));
    });
    render(<App />);

    // Act
    const infoTabButton = await screen.findByRole("button", { name: /Turnierinfos/i });
    fireEvent.click(infoTabButton);

    // Assert
    expect(await screen.findByText("Turnierregeln")).toBeInTheDocument();
  });

  it("should open the login modal when the login button is clicked", async () => {
    // Arrange
    global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/teams")) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTeams) });
        if (url.includes("/api/groups")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        if (url.includes("/api/matches")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        return Promise.reject(new Error("Unbekannte URL"));
    });
    render(<App />);

    await screen.findByText("U10 Bille Cup 2026");

    const loginButton = screen
      .getAllByRole("button")
      .find((btn) => btn.innerHTML.includes("lucide-log-in") || btn.querySelector("svg.lucide-log-in") || btn.innerHTML.includes("LogIn"));

    // Act
    if (loginButton) {
      fireEvent.click(loginButton);
    }

    // Assert
    expect(await screen.findByText("Benutzername")).toBeInTheDocument();
    expect(await screen.findByText("Passwort")).toBeInTheDocument();
  });
});
