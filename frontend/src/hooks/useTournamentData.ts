import { useEffect, useState } from "react";
import type { Group, Match, Team } from "../types";

// Dieser Hook lädt die Daten vom Backend.
export function useTournamentData() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Diese Funktion holt alle Turnierdaten asynchron ab.
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const [teamsRes, groupsRes, matchesRes] = await Promise.all([
        fetch("http://localhost:3000/api/teams"),
        fetch("http://localhost:3000/api/groups"),
        fetch("http://localhost:3000/api/matches"),
      ]);

      if (!teamsRes.ok || !groupsRes.ok || !matchesRes.ok) {
        throw new Error("Fehler beim Laden der Backend-Daten.");
      }

      setTeams(await teamsRes.json());
      setGroups(await groupsRes.json());
      setMatches(await matchesRes.json());
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Dieser Effekt führt den Ladevorgang beim ersten Rendern aus.
  useEffect(() => {
    fetchAllData();
  }, []);

  return { teams, groups, matches, isLoading, error, refetch: fetchAllData };
}
