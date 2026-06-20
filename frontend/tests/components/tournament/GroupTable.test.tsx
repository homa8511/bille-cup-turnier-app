import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GroupTable } from "../../../src/components/tournament/GroupTable";
import type { Group, Team } from "../../../src/types";

describe("GroupTable Komponente", () => {
  it("should render table rows correctly when standings are provided", () => {
    // Arrange
    const mockTeams: Team[] = [
      { id: "t1", name: "FC Bergedorf 85", logo_path: null },
      { id: "t2", name: "ASV Bergedorf", logo_path: null },
    ];
    const mockGroup: Group = {
      id: "g1",
      name: "Gruppe A",
      phase: "VORRUNDE",
      field_numbers: [1],
      standings: [
        {
          team_id: "t1",
          points: 3,
          matches_played: 1,
          goals_scored: 2,
          goals_conceded: 0,
          goal_diff: 2,
          rank: 1,
        },
        {
          team_id: "t2",
          points: 0,
          matches_played: 1,
          goals_scored: 0,
          goals_conceded: 2,
          goal_diff: -2,
          rank: 2,
        },
      ],
    };

    // Act
    render(<GroupTable group={mockGroup} teams={mockTeams} />);

    // Assert
    expect(screen.getByText("FC Bergedorf 85")).toBeInTheDocument();
    expect(screen.getByText("ASV Bergedorf")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // Punkte von Team 1
  });

  it("should display a fallback message when no standings exist", () => {
    // Arrange
    const mockTeams: Team[] = [];
    const mockGroup: Group = {
      id: "g2",
      name: "Gruppe B",
      phase: "VORRUNDE",
      field_numbers: [2],
      standings: [],
    };

    // Act
    render(<GroupTable group={mockGroup} teams={mockTeams} />);

    // Assert
    expect(
      screen.getByText("Noch keine Tabellendaten verfügbar."),
    ).toBeInTheDocument();
  });

  it("should highlight the row of the selected team", () => {
    // Arrange
    const mockTeams: Team[] = [
      { id: "t1", name: "FC Bergedorf 85", logo_path: null },
    ];
    const mockGroup: Group = {
      id: "g1",
      name: "Gruppe A",
      phase: "VORRUNDE",
      field_numbers: [1],
      standings: [
        {
          team_id: "t1",
          points: 3,
          matches_played: 1,
          goals_scored: 2,
          goals_conceded: 0,
          goal_diff: 2,
          rank: 1,
        },
      ],
    };
    const selectedTeamId = "t1";

    // Act
    const { container } = render(
      <GroupTable
        group={mockGroup}
        teams={mockTeams}
        selectedTeam={selectedTeamId}
      />,
    );

    // Assert
    // Wir suchen nach der spezifischen Tailwind-Klasse für die Hervorhebung
    const highlightedRow = container.querySelector("tr.bg-blue-50");
    expect(highlightedRow).toBeInTheDocument();
  });
});
