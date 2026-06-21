import { useEffect, useState, useCallback } from "react";
import type { Group, Match, Team } from "../types";

export function useTournamentData() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      const isPreview =
        window.location.protocol.startsWith("blob") ||
        window.location.origin === "null";
      if (isPreview) {
        setIsLoading(false);
        return;
      }

      const [teamsRes, groupsRes, matchesRes] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/groups"),
        fetch("/api/matches"),
      ]);

      if (!teamsRes.ok || !groupsRes.ok || !matchesRes.ok)
        throw new Error("Fehler beim Laden der Backend-Daten.");

      setTeams(await teamsRes.json());
      setGroups(await groupsRes.json());
      setMatches(await matchesRes.json());
      setError(null);
    } catch (err) {
      setError("Fehler beim Laden der Backend-Daten.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    const isPreview =
      window.location.protocol.startsWith("blob") ||
      window.location.origin === "null";
    if (isPreview) return;

    const eventSource = new EventSource("/api/live");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (
          [
            "MATCH_UPDATED",
            "STANDINGS_UPDATED",
            "SCHEDULE_UPDATED",
            "TOURNAMENT_INITIALIZED",
            "TEAM_UPDATED",
          ].includes(data.type)
        ) {
          fetchAllData();
        }
      } catch (e) {
        console.error("SSE Error", e);
      }
    };
    return () => eventSource.close();
  }, [fetchAllData]);

  return { teams, groups, matches, isLoading, error, refetch: fetchAllData };
}
