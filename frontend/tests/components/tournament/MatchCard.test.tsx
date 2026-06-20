import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
// Die Importe zeigen nun mit "../../../src/..." zurück in den Quellcode-Ordner
import { MatchCard } from "../../../src/components/tournament/MatchCard";
import type { Match, Team } from "../../../src/types";

describe("MatchCard Komponente", () => {
  it("should call onUpdateResult when admin saves a live match", () => {
    // Arrange
    const mockMatch: Match = {
      id: "m1",
      group_id: "g1",
      home_team_id: "t1",
      away_team_id: "t2",
      match_number: 1,
      home_placeholder: null,
      away_placeholder: null,
      goals_home: null,
      goals_away: null,
      status: "LIVE",
      start_time: "2026-06-27T09:00:00Z",
      end_time: "2026-06-27T09:10:00Z",
    };
    const mockHomeTeam: Team = { id: "t1", name: "Heimteam", logo_path: null };
    const mockAwayTeam: Team = { id: "t2", name: "Gastteam", logo_path: null };
    const updateMock = vi.fn();

    render(
      <MatchCard
        match={mockMatch}
        homeTeam={mockHomeTeam}
        awayTeam={mockAwayTeam}
        isAdmin={true}
        onUpdateResult={updateMock}
      />,
    );

    // Act
    const inputs = screen.getAllByRole("spinbutton");
    fireEvent.change(inputs[0], { target: { value: "2" } });
    fireEvent.change(inputs[1], { target: { value: "1" } });

    const saveButton = screen.getByText("Speichern");
    fireEvent.click(saveButton);

    // Assert
    expect(updateMock).toHaveBeenCalledWith("m1", 2, 1);
  });

  it("should display the final score when the match is finished", () => {
    // Arrange
    const mockMatch: Match = {
      id: "m2",
      group_id: "g1",
      home_team_id: "t1",
      away_team_id: "t2",
      match_number: 2,
      home_placeholder: null,
      away_placeholder: null,
      goals_home: 3,
      goals_away: 0,
      status: "BEENDET",
      start_time: "2026-06-27T09:00:00Z",
      end_time: "2026-06-27T09:10:00Z",
    };
    const updateMock = vi.fn();

    // Act
    render(
      <MatchCard
        match={mockMatch}
        isAdmin={false}
        onUpdateResult={updateMock}
      />,
    );

    // Assert
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.queryByText("LIVE")).not.toBeInTheDocument();
  });
});
