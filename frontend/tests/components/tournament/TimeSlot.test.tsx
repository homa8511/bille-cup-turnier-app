import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
// Die Importe zeigen nun mit "../../../src/..." zurück in den Quellcode-Ordner
import { TimeSlot } from "../../../src/components/tournament/TimeSlot";
import type { Match } from "../../../src/types";

describe("TimeSlot Komponente", () => {
  it("should trigger onStartRound when admin clicks the start button", () => {
    // Arrange
    const mockTime = "2026-06-27T09:00:00Z";
    const mockMatches: Match[] = [
      {
        id: "m1",
        group_id: "g1",
        home_team_id: "t1",
        away_team_id: "t2",
        match_number: 1,
        home_placeholder: null,
        away_placeholder: null,
        goals_home: null,
        goals_away: null,
        status: "GEPLANT",
        start_time: mockTime,
        end_time: "2026-06-27T09:10:00Z",
      },
    ];
    const startRoundMock = vi.fn();
    const updateResultMock = vi.fn();

    render(
      <TimeSlot
        time={mockTime}
        matches={mockMatches}
        isAdmin={true}
        onStartRound={startRoundMock}
        onUpdateResult={updateResultMock}
      />,
    );

    // Act
    const startButton = screen.getByText("Alle anpfeifen");
    fireEvent.click(startButton);

    // Assert
    expect(startRoundMock).toHaveBeenCalledWith(mockTime);
  });

  it("should hide the start button for non-admins", () => {
    // Arrange
    const mockTime = "2026-06-27T09:00:00Z";
    const mockMatches: Match[] = [
      {
        id: "m1",
        group_id: "g1",
        home_team_id: "t1",
        away_team_id: "t2",
        match_number: 1,
        home_placeholder: null,
        away_placeholder: null,
        goals_home: null,
        goals_away: null,
        status: "GEPLANT",
        start_time: mockTime,
        end_time: "2026-06-27T09:10:00Z",
      },
    ];
    const startRoundMock = vi.fn();
    const updateResultMock = vi.fn();

    // Act
    render(
      <TimeSlot
        time={mockTime}
        matches={mockMatches}
        isAdmin={false}
        onStartRound={startRoundMock}
        onUpdateResult={updateResultMock}
      />,
    );

    // Assert
    expect(screen.queryByText("Alle anpfeifen")).not.toBeInTheDocument();
  });
});
