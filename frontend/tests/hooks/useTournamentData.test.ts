import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
// Der Import zeigt nun mit "../../src/..." zurück in den Quellcode-Ordner
import { useTournamentData } from "../../src/hooks/useTournamentData";

describe("useTournamentData Hook", () => {
  beforeEach(() => {
    // Der globale Fetch-Client wird vor jedem Test zurückgesetzt.
    vi.restoreAllMocks();
  });

  it("should provide data when the backend requests succeed", async () => {
    // Arrange
    const mockTeams = [{ id: "t1", name: "Team A" }];
    const mockGroups = [{ id: "g1", name: "Gruppe A" }];
    const mockMatches = [{ id: "m1", match_number: 1 }];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/teams")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTeams),
        });
      }
      if (url.includes("/api/groups")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGroups),
        });
      }
      if (url.includes("/api/matches")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMatches),
        });
      }
      return Promise.reject(new Error("Unbekannte URL"));
    });

    // Act
    const { result } = renderHook(() => useTournamentData());

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.teams).toEqual(mockTeams);
    expect(result.current.groups).toEqual(mockGroups);
    expect(result.current.matches).toEqual(mockMatches);
    expect(result.current.error).toBeNull();
  });

  it("should set an error message when a backend request fails", async () => {
    // Arrange
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    // Act
    const { result } = renderHook(() => useTournamentData());

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Fehler beim Laden der Backend-Daten.");
    expect(result.current.teams).toEqual([]);
  });
});
