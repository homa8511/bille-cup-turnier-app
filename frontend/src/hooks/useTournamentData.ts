import { useCallback, useEffect, useState } from "react";
import type { Group, Match, Team } from "../types";

export function useTournamentData() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      const [teamsRes, groupsRes, matchesRes] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/groups"),
        fetch("/api/matches"),
      ]);

      if (!teamsRes.ok || !groupsRes.ok || !matchesRes.ok) {
        throw new Error("Fehler beim Laden der Backend-Daten.");
      }

      setTeams(await teamsRes.json());
      setGroups(await groupsRes.json());
      setMatches(await matchesRes.json());
      setError(null);
    } catch (err) {
      setError("Fehler beim Laden der Backend-Daten.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();

    const eventSource = new EventSource("/api/live");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (
          data.type === "MATCH_UPDATED" ||
          data.type === "STANDINGS_UPDATED" ||
          data.type === "SCHEDULE_UPDATED"
        ) {
          fetchAllData();
        }
      } catch (e) {
        console.error("Fehler beim Verarbeiten des Live-Events", e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [fetchAllData]);

  return { teams, groups, matches, isLoading, error, refetch: fetchAllData };
}
