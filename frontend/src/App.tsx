import {
  ChevronDown,
  ChevronUp,
  Edit,
  FileSpreadsheet,
  Image as ImageIcon,
  LayoutGrid,
  List,
  LogIn,
  Moon,
  Plus,
  Save,
  Search,
  Settings2,
  Sun,
  Trash2,
  Trophy,
  Upload,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";

// --- Types ---
export type Team = { id: string; name: string; logo_path?: string };
export type GroupStanding = {
  team_id: string;
  matches_played: number;
  goals_scored: number;
  goals_conceded: number;
  points: number;
  goal_diff: number;
  rank: number;
};
export type Group = {
  id: string;
  name: string;
  phase: string;
  field_numbers?: number[];
  standings?: GroupStanding[];
  teamIds?: string[];
};
export type Match = {
  id: string;
  group_id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  match_number: number;
  start_time: string;
  status: "GEPLANT" | "LIVE" | "BEENDET";
  goals_home: number | null;
  goals_away: number | null;
  home_placeholder: string | null;
  away_placeholder: string | null;
};

// --- Hooks ---
export function useTournamentData() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = React.useCallback(async () => {
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

// --- Components ---
export function TeamLogo({
  team,
  size = "w-8 h-8",
}: {
  team?: Team;
  size?: string;
}) {
  if (!team || !team.logo_path)
    return (
      <div
        className={`${size} rounded-full bg-slate-200 dark:bg-slate-700 shrink-0`}
      />
    );
  return (
    <div
      className={`${size} flex items-center justify-center bg-white rounded-full border border-gray-200 dark:border-slate-600 shadow-sm shrink-0 overflow-hidden`}
    >
      <img
        src={team.logo_path}
        alt={team.name}
        className="w-[90%] h-[90%] object-contain"
      />
    </div>
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md my-8 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-2">{children}</div>
      </div>
    </div>
  );
}

export function GroupTable({
  group,
  teams,
  selectedTeam,
}: {
  group: Group;
  teams: Team[];
  selectedTeam?: string;
}) {
  if (!group.standings || group.standings.length === 0) return null;
  return (
    <div className="overflow-x-auto w-full bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
      <table className="w-full text-sm text-left whitespace-nowrap">
        <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3">Pl.</th>
            <th className="px-4 py-3">Team</th>
            <th className="px-4 py-3 text-center">Sp.</th>
            <th className="px-4 py-3 text-center">Tore</th>
            <th className="px-4 py-3 text-center">Diff</th>
            <th className="px-4 py-3 text-center bg-blue-600 text-white dark:bg-blue-700">
              Pkt
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
          {group.standings.map((s, i) => {
            const team = teams.find((t) => t.id === s.team_id);
            const isSelected = selectedTeam === s.team_id;
            return (
              <tr
                key={s.team_id}
                className={`transition-colors ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
              >
                <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                  {s.rank ?? i + 1}.
                </td>
                <td
                  className={`px-4 py-3 font-semibold ${isSelected ? "text-blue-700 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"}`}
                >
                  {team?.name || "Unbekannt"}
                </td>
                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                  {s.matches_played ?? 0}
                </td>
                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                  {s.goals_scored ?? 0}:{s.goals_conceded ?? 0}
                </td>
                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                  {s.goal_diff ?? 0}
                </td>
                <td className="px-4 py-3 text-center font-bold text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                  {s.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function MatchCard({
  match,
  homeTeam,
  awayTeam,
  isAdmin,
  onUpdateResult,
}: {
  match: Match;
  homeTeam?: Team;
  awayTeam?: Team;
  isAdmin: boolean;
  onUpdateResult: (id: string, h: number, a: number) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [hScore, setHScore] = useState<number | "">("");
  const [aScore, setAScore] = useState<number | "">("");

  const startEditing = () => {
    setHScore(match.goals_home ?? 0);
    setAScore(match.goals_away ?? 0);
    setEditMode(true);
  };

  const handleSave = () => {
    if (typeof hScore === "number" && typeof aScore === "number") {
      onUpdateResult(match.id, hScore, aScore);
      setEditMode(false);
    }
  };

  const isLive = match.status === "LIVE";
  const isFinished = match.status === "BEENDET";
  const homeName = homeTeam?.name || match.home_placeholder || "Unbekannt";
  const awayName = awayTeam?.name || match.away_placeholder || "Unbekannt";

  return (
    <div
      className={`p-4 rounded-xl border transition-colors shadow-sm flex flex-col gap-3 ${isLive ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800/50" : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"} relative`}
    >
      <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
        <span>Spiel {match.match_number}</span>
        <span className="flex items-center gap-1">
          {isLive && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          )}
          {new Date(match.start_time).toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="flex justify-between items-center gap-2 z-10 relative">
        <span className="flex-1 text-right font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
          {homeName}
        </span>
        <div className="w-20 shrink-0 text-center font-bold text-lg bg-slate-100 dark:bg-slate-900 rounded-lg py-1.5 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
          {editMode ? (
            <div className="flex justify-center gap-1 items-center px-1">
              <input
                type="number"
                min="0"
                className="w-6 text-center bg-transparent border-b border-blue-400 focus:outline-none appearance-none"
                value={hScore}
                onChange={(e) =>
                  setHScore(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
              <span>:</span>
              <input
                type="number"
                min="0"
                className="w-6 text-center bg-transparent border-b border-blue-400 focus:outline-none appearance-none"
                value={aScore}
                onChange={(e) =>
                  setAScore(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>
          ) : isFinished ? (
            `${match.goals_home} : ${match.goals_away}`
          ) : isLive ? (
            <span className="text-green-600 animate-pulse">0 : 0</span>
          ) : (
            "- : -"
          )}
        </div>
        <span className="flex-1 text-left font-semibold text-slate-800 dark:text-slate-200 truncate pl-2">
          {awayName}
        </span>
      </div>
      {isAdmin && (
        <div className="mt-2 pt-3 border-t border-gray-100 dark:border-slate-700 flex justify-center z-10 relative">
          {editMode ? (
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setEditMode(false)}
                className="flex-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 py-1.5 rounded transition"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                className="flex-1 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white py-1.5 rounded transition"
              >
                Speichern
              </button>
            </div>
          ) : (
            <button
              onClick={startEditing}
              className="w-full text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 py-1.5 rounded transition"
            >
              Ergebnis eintragen
            </button>
          )}
        </div>
      )}
      {isLive && !isAdmin && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none z-0">
          <span className="font-bold text-green-500 text-4xl tracking-widest animate-pulse">
            LIVE
          </span>
        </div>
      )}
    </div>
  );
}

export function MatchTableRow({
  match,
  group,
  homeTeam,
  awayTeam,
  isAdmin,
  onUpdateResult,
  selectedTeam,
}: any) {
  const [editMode, setEditMode] = useState(false);
  const [hScore, setHScore] = useState<number | "">("");
  const [aScore, setAScore] = useState<number | "">("");

  const startEditing = () => {
    setHScore(match.goals_home ?? 0);
    setAScore(match.goals_away ?? 0);
    setEditMode(true);
  };

  const handleSave = () => {
    if (typeof hScore === "number" && typeof aScore === "number") {
      onUpdateResult(match.id, hScore, aScore);
      setEditMode(false);
    }
  };

  const isLive = match.status === "LIVE";
  const isFinished = match.status === "BEENDET";

  const homeName = homeTeam?.name || match.home_placeholder || "Unbekannt";
  const awayName = awayTeam?.name || match.away_placeholder || "Unbekannt";

  let rowClasses =
    "transition-colors border-b last:border-0 dark:border-slate-700 ";
  if (isLive) rowClasses += "bg-green-50/30 dark:bg-green-900/10";
  else rowClasses += "hover:bg-slate-50 dark:hover:bg-slate-700/50";

  const formatTime = (iso: string) => {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <tr className={rowClasses}>
      <td className="px-3 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
        {match.match_number}
      </td>
      <td className="px-2 py-3 text-center font-medium text-slate-600 dark:text-slate-400">
        {group?.field_numbers?.[0] || "-"}
      </td>
      <td className="px-3 py-3 text-center font-medium text-slate-600 dark:text-slate-400">
        {formatTime(match.start_time)}
      </td>
      <td className="px-2 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
        {group?.name?.split(" ").pop()}
      </td>

      <td className="px-2 py-2 w-10 text-right">
        <div className="flex justify-end">
          <TeamLogo team={homeTeam} size="w-7 h-7" />
        </div>
      </td>
      <td
        className={`px-2 py-3 text-right font-semibold w-[35%] ${match.home_team_id === selectedTeam ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`}
      >
        {homeName}
      </td>
      <td
        className={`px-2 py-3 text-left font-semibold w-[35%] ${match.away_team_id === selectedTeam ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`}
      >
        {awayName}
      </td>
      <td className="px-2 py-2 w-10 text-left">
        <div className="flex justify-start">
          <TeamLogo team={awayTeam} size="w-7 h-7" />
        </div>
      </td>

      <td className="px-4 py-3 text-center font-bold whitespace-nowrap text-slate-800 dark:text-slate-100 min-w-[120px]">
        {editMode ? (
          <div className="flex items-center justify-center gap-1">
            <input
              type="number"
              min="0"
              value={hScore}
              onChange={(e) =>
                setHScore(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-10 text-center border rounded dark:bg-slate-900 dark:border-slate-600"
            />
            <span>:</span>
            <input
              type="number"
              min="0"
              value={aScore}
              onChange={(e) =>
                setAScore(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-10 text-center border rounded dark:bg-slate-900 dark:border-slate-600"
            />
            <button
              onClick={handleSave}
              className="ml-2 bg-green-600 text-white p-1 rounded hover:bg-green-700"
            >
              <Save className="w-3 h-3" />
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="ml-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 p-1 rounded hover:bg-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span>
              {isFinished ? (
                `${match.goals_home} : ${match.goals_away}`
              ) : isLive ? (
                <span className="text-green-600 animate-pulse">0 : 0</span>
              ) : (
                "- : -"
              )}
            </span>
            {isAdmin && (isLive || isFinished) && (
              <button
                onClick={startEditing}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded transition"
              >
                <Edit className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

const initialMarkdown = `# Willkommen beim U10 Bille Cup 2026!\n\n**Datum:** 27.06.2026\n**Ort:** Billtalstadion, Hamburg-Bergedorf\n\n![Stadion](https://images.unsplash.com/photo-1518605368461-1ee7e163396f?auto=format&fit=crop&q=80&w=800)\n\n### Turnierregeln\n* Spieldauer: 10 Minuten\n* Sieg: 3 Punkte\n* Unentschieden: 1 Punkt`;

type Language = "de" | "en";
const translations: Record<Language, Record<string, string>> = {
  de: {
    title: "U10 Bille Cup 2026",
    vorrunde: "Vorrunde",
    zwischenrunde: "Zwischenrunde",
    finalrunde: "Finalrunde",
    infos: "Turnierinfos",
    search: "Nach Team suchen...",
    filterLabel: "Mannschaft filtern",
    allTeams: "Alle Teams anzeigen",
    login: "Admin Login",
    logout: "Abmelden",
    username: "Benutzername",
    password: "Passwort",
    edit: "Bearbeiten",
    save: "Speichern",
    cancel: "Abbrechen",
    field: "Feld",
    live: "Live",
    next: "Nächstes Spiel",
    noMatches: "Keine Spiele gefunden.",
    standings: "Tabelle",
    matches: "Spielplan",
    team: "Teilnehmer",
    sp: "SP",
    goals: "T",
    td: "TD",
    pts: "PKT",
    nr: "Nr.",
    f: "F",
    beginn: "Beginn",
    gr: "Gr",
    spiel: "Spiel",
    ergebnis: "Ergebnis",
    unknown: "Unbekanntes Team",
    placeholderHome: "Sieger Heim",
    placeholderAway: "Sieger Gast",
    organizer: "Ausrichter / Verein",
    sponsors: "Sponsoren",
    uploadLogo: "Logo hochladen",
    addSponsor: "Sponsor hinzufügen",
    remove: "Entfernen",
    viewCards: "Kartenansicht",
    viewTable: "Tabellenansicht",
    editSeeding: "Setzliste bearbeiten",
    seedingTitle: "Setzliste Zwischenrunde (Snake-System)",
    vorrundenPlatz: "VR-Platz",
    zugewieseneGruppe: "Zugewiesene Gruppe",
    adminArea: "Admin-Bereich",
    settings: "Globale Einstellungen",
    initTournament: "Turnier Initialisieren",
    initWarning:
      "Achtung: Dies löscht alle aktuellen Daten und berechnet den Spielplan komplett neu!",
    matchDuration: "Spieldauer (Min)",
    pauseDuration: "Pause (Min)",
    startTime: "Startzeit",
    bulkTeamsLabel: "24 Mannschaften eintragen oder CSV hochladen",
    uploadCsvLabel: "Teams per CSV hochladen",
    csvFormatHint: "Format: Team-Name;Gruppe (z.B. HSV I;Gruppe B)",
    csvSuccess: "CSV erfolgreich geladen",
    discardCsv: "CSV verwerfen",
    editTeams: "Teams & Logos bearbeiten",
    uploadTeamLogo: "Neues Wappen",
  },
  en: {
    title: "U10 Bille Cup 2026",
    vorrunde: "Preliminaries",
    zwischenrunde: "Intermediate",
    finalrunde: "Finals",
    infos: "Tournament Info",
    search: "Search team...",
    filterLabel: "Filter by team",
    allTeams: "Show all teams",
    login: "Admin Login",
    logout: "Logout",
    username: "Username",
    password: "Password",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    field: "Pitch",
    live: "Live",
    next: "Next match",
    noMatches: "No matches found.",
    standings: "Standings",
    matches: "Matches",
    team: "Team",
    sp: "MP",
    goals: "G",
    td: "GD",
    pts: "PTS",
    nr: "No.",
    f: "P",
    beginn: "Start",
    gr: "Gr",
    spiel: "Match",
    ergebnis: "Result",
    unknown: "Unknown Team",
    placeholderHome: "Winner Home",
    placeholderAway: "Winner Away",
    organizer: "Organizer / Club",
    sponsors: "Sponsors",
    uploadLogo: "Upload Logo",
    addSponsor: "Add Sponsor",
    remove: "Remove",
    viewCards: "Card View",
    viewTable: "Table View",
    editSeeding: "Edit Seeding List",
    seedingTitle: "Intermediate Seeding (Snake System)",
    vorrundenPlatz: "Prelim Rank",
    zugewieseneGruppe: "Assigned Group",
    adminArea: "Admin Area",
    settings: "Global Settings",
    initTournament: "Initialize Tournament",
    initWarning:
      "Warning: This will delete all current data and recalculate the entire schedule!",
    matchDuration: "Match Duration (Min)",
    pauseDuration: "Pause (Min)",
    startTime: "Start Time",
    bulkTeamsLabel: "Enter 24 Teams or upload CSV",
    uploadCsvLabel: "Upload Teams via CSV",
    csvFormatHint: "Format: Team Name;Group (e.g. HSV I;Group B)",
    csvSuccess: "CSV loaded successfully",
    discardCsv: "Discard CSV",
    editTeams: "Edit Teams & Logos",
    uploadTeamLogo: "New Crest",
  },
};

const renderMarkdown = (text: string | null | undefined) => {
  if (!text) return { __html: "" };
  let html = text
    .replace(
      /^### (.*$)/gim,
      '<h3 class="text-xl font-bold mt-4 mb-2 dark:text-gray-100">$1</h3>',
    )
    .replace(
      /^## (.*$)/gim,
      '<h2 class="text-2xl font-bold mt-5 mb-2 dark:text-gray-100">$1</h2>',
    )
    .replace(
      /^# (.*$)/gim,
      '<h1 class="text-3xl font-bold mt-6 mb-4 text-blue-700 dark:text-blue-400">$1</h1>',
    )
    .replace(
      /\*\*(.*)\*\*/gim,
      '<strong class="dark:text-gray-200">$1</strong>',
    )
    .replace(/\*(.*)\*/gim, '<em class="dark:text-gray-300">$1</em>')
    .replace(
      /!\[(.*?)\]\((.*?)\)/gim,
      "<img alt='$1' src='$2' class='my-4 max-w-full h-auto rounded-lg shadow-md' />",
    )
    .replace(
      /\[(.*?)\]\((.*?)\)/gim,
      "<a href='$2' class='text-blue-500 hover:underline'>$1</a>",
    )
    .replace(/\n/gim, "<br />");
  return { __html: html };
};

export default function App() {
  const { teams, groups, matches, isLoading, refetch } = useTournamentData();
  const [activeTab, setActiveTab] = useState("VORRUNDE");
  const [language, setLanguage] = useState<Language>("de");
  const [theme, setTheme] = useState("light");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [tournamentInfo, setTournamentInfo] = useState(initialMarkdown);
  const [editInfoText, setEditInfoText] = useState("");
  const [collapsedSchedules, setCollapsedSchedules] = useState<
    Record<string, boolean>
  >({});
  const [tournamentLogo, setTournamentLogo] = useState<string | null>(null);
  const [organizerInfo, setOrganizerInfo] = useState(
    "TSG Bergedorf\nBilltalstadion\n21029 Hamburg",
  );
  const [isEditingOrganizer, setIsEditingOrganizer] = useState(false);
  const [editOrganizerText, setEditOrganizerText] = useState("");
  const [sponsors, setSponsors] = useState<string[]>([
    "https://placehold.co/300x150/ffffff/000000?text=Sponsor+1",
  ]);
  const [isSeedingModalOpen, setIsSeedingModalOpen] = useState(false);
  const [seedingData, setSeedingData] = useState<any[]>([]);

  // Admin Init State
  const [adminMatchDuration, setAdminMatchDuration] = useState(10);
  const [adminPauseDuration, setAdminPauseDuration] = useState(2);
  const [adminVorrundeStart, setAdminVorrundeStart] =
    useState("2026-06-27T10:00");
  const [adminZwischenrundeStart, setAdminZwischenrundeStart] =
    useState("2026-06-27T11:30");
  const [adminFinalrundeStart, setAdminFinalrundeStart] =
    useState("2026-06-27T13:30");
  const [bulkTeamsText, setBulkTeamsText] = useState("");
  const [csvTeams, setCsvTeams] = useState<
    { id: string; name: string; group: string }[]
  >([]);

  const t = translations[language];

  useEffect(() => {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleLanguage = () => setLanguage((l) => (l === "de" ? "en" : "de"));
  const toggleTheme = () => {
    setTheme((current) => {
      const isDark = current === "light";
      document.documentElement.classList.toggle("dark", isDark);
      return isDark ? "dark" : "light";
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      if (res.ok) {
        const data = await res.json();
        setAdminToken(data.token);
        setShowLoginModal(false);
        setLoginForm({ username: "", password: "" });
      } else {
        alert("Login fehlgeschlagen.");
      }
    } catch {
      alert("Netzwerkfehler beim Login.");
    }
  };

  const handleUpdateResult = async (
    matchId: string,
    home: number,
    away: number,
  ) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ goals_home: home, goals_away: away }),
      });
      if (res.ok) refetch();
      else alert("Fehler beim Speichern.");
    } catch {
      console.error("Netzwerkfehler beim Speichern");
    }
  };

  const handleSaveSettings = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          match_duration_minutes: adminMatchDuration,
          pause_duration_minutes: adminPauseDuration,
          phase_start_time: new Date(adminVorrundeStart).toISOString(),
        }),
      });
      if (res.ok) alert("Einstellungen erfolgreich gespeichert!");
      else alert("Fehler beim Speichern der Einstellungen.");
    } catch {
      alert("Netzwerkfehler");
    }
  };

  const handleTeamLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    teamId: string,
  ) => {
    if (!adminToken || !e.target.files?.[0]) return;
    const formData = new FormData();
    formData.append("logo", e.target.files[0]);
    try {
      const res = await fetch(`/api/admin/teams/${teamId}/logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: formData,
      });
      if (res.ok) {
        alert("Wappen erfolgreich hochgeladen!");
        refetch();
      } else alert("Fehler beim Upload");
    } catch (err) {
      console.error(err);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0);
      const parsed = lines
        .map((line) => {
          const parts = line.split(/[;,]/);
          return {
            id: crypto.randomUUID(),
            name: parts[0]?.trim() || "",
            group: parts[1]?.trim() || "",
          };
        })
        .filter((t) => t.name && t.group);

      if (
        parsed.length > 0 &&
        (parsed[0].name.toLowerCase().includes("team") ||
          parsed[0].group.toLowerCase().includes("gruppe"))
      ) {
        parsed.shift();
      }
      setCsvTeams(parsed);
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  };

  const handleInitializeTournament = async () => {
    if (!adminToken) return;
    let mappedTeams: { id: string; name: string }[] = [];
    let autoGeneratedGroups: any[] = [];

    if (csvTeams.length > 0) {
      if (csvTeams.length !== 24)
        return alert(
          `Der Bille Cup erfordert exakt 24 Teams. CSV enthält: ${csvTeams.length}`,
        );
      mappedTeams = csvTeams.map((t) => ({ id: t.id, name: t.name }));
      const uniqueGroupNames = Array.from(
        new Set(csvTeams.map((t) => t.group)),
      ).sort();
      if (uniqueGroupNames.length !== 6)
        return alert(
          `Die CSV muss genau 6 unterschiedliche Gruppen enthalten. Gefunden: ${uniqueGroupNames.length}`,
        );

      autoGeneratedGroups = uniqueGroupNames.map((gName, idx) => ({
        id: crypto.randomUUID(),
        name: gName,
        phase: "VORRUNDE",
        fieldNumbers: [idx + 1],
        teamIds: csvTeams.filter((t) => t.group === gName).map((t) => t.id),
      }));
    } else {
      const parsedTeamNames = bulkTeamsText
        .split("\n")
        .map((n) => n.trim())
        .filter((n) => n.length > 0);
      if (parsedTeamNames.length !== 24)
        return alert(
          `Der Bille Cup erfordert exakt 24 Teams. Im Textfeld erfasst: ${parsedTeamNames.length}`,
        );
      mappedTeams = parsedTeamNames.map((name) => ({
        id: crypto.randomUUID(),
        name,
      }));
      autoGeneratedGroups = [
        {
          id: crypto.randomUUID(),
          name: "Gruppe A",
          phase: "VORRUNDE",
          fieldNumbers: [1],
          teamIds: mappedTeams.slice(0, 4).map((t) => t.id),
        },
        {
          id: crypto.randomUUID(),
          name: "Gruppe B",
          phase: "VORRUNDE",
          fieldNumbers: [2],
          teamIds: mappedTeams.slice(4, 8).map((t) => t.id),
        },
        {
          id: crypto.randomUUID(),
          name: "Gruppe C",
          phase: "VORRUNDE",
          fieldNumbers: [3],
          teamIds: mappedTeams.slice(8, 12).map((t) => t.id),
        },
        {
          id: crypto.randomUUID(),
          name: "Gruppe D",
          phase: "VORRUNDE",
          fieldNumbers: [4],
          teamIds: mappedTeams.slice(12, 16).map((t) => t.id),
        },
        {
          id: crypto.randomUUID(),
          name: "Gruppe E",
          phase: "VORRUNDE",
          fieldNumbers: [5],
          teamIds: mappedTeams.slice(16, 20).map((t) => t.id),
        },
        {
          id: crypto.randomUUID(),
          name: "Gruppe F",
          phase: "VORRUNDE",
          fieldNumbers: [6],
          teamIds: mappedTeams.slice(20, 24).map((t) => t.id),
        },
      ];
    }

    if (!confirm(t.initWarning)) return;

    autoGeneratedGroups.push(
      {
        id: crypto.randomUUID(),
        name: "Gruppe G",
        phase: "ZWISCHENRUNDE",
        fieldNumbers: [1],
        teamIds: [],
      },
      {
        id: crypto.randomUUID(),
        name: "Gruppe H",
        phase: "ZWISCHENRUNDE",
        fieldNumbers: [2],
        teamIds: [],
      },
      {
        id: crypto.randomUUID(),
        name: "Gruppe I",
        phase: "ZWISCHENRUNDE",
        fieldNumbers: [3],
        teamIds: [],
      },
      {
        id: crypto.randomUUID(),
        name: "Gruppe J",
        phase: "ZWISCHENRUNDE",
        fieldNumbers: [4],
        teamIds: [],
      },
      {
        id: crypto.randomUUID(),
        name: "Gruppe K",
        phase: "ZWISCHENRUNDE",
        fieldNumbers: [5],
        teamIds: [],
      },
      {
        id: crypto.randomUUID(),
        name: "Gruppe L",
        phase: "ZWISCHENRUNDE",
        fieldNumbers: [6],
        teamIds: [],
      },
      {
        id: crypto.randomUUID(),
        name: "Goldrunde",
        phase: "FINALRUNDE",
        fieldNumbers: [1, 2, 3, 4, 5, 6],
        teamIds: [],
      },
      {
        id: crypto.randomUUID(),
        name: "Silberrunde",
        phase: "FINALRUNDE",
        fieldNumbers: [1, 2, 3, 4, 5, 6],
        teamIds: [],
      },
    );

    try {
      const res = await fetch("/api/admin/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          matchDuration: adminMatchDuration,
          pauseDuration: adminPauseDuration,
          vorrundeStartTime: new Date(adminVorrundeStart).toISOString(),
          zwischenrundeStartTime: new Date(
            adminZwischenrundeStart,
          ).toISOString(),
          finalrundeStartTime: new Date(adminFinalrundeStart).toISOString(),
          teams: mappedTeams,
          groups: autoGeneratedGroups,
        }),
      });
      if (res.ok) {
        alert("Turnier erfolgreich initialisiert!");
        setCsvTeams([]);
        setBulkTeamsText("");
        refetch();
      } else alert("Fehler bei der Initialisierung.");
    } catch {
      alert("Netzwerkfehler bei der Initialisierung.");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTournamentLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSponsorUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setSponsors((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    }
  };

  const removeSponsor = (indexToRemove: number) => {
    setSponsors((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const updateSeedingGroup = (teamId: string, newGroup: string) => {
    setSeedingData((prev) =>
      prev.map((item) =>
        item.team_id === teamId ? { ...item, assigned_group: newGroup } : item,
      ),
    );
  };

  const saveSeedingData = () => {
    setIsSeedingModalOpen(false);
  };

  const filteredGroups = groups.filter((g) => {
    if (g.phase !== activeTab) return false;
    if (!selectedTeam) return true;
    return (
      g.standings?.some((s) => s.team_id === selectedTeam) ||
      matches.some(
        (m) =>
          m.group_id === g.id &&
          (m.home_team_id === selectedTeam || m.away_team_id === selectedTeam),
      )
    );
  });

  if (isLoading && teams.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center animate-pulse">
          <Trophy className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <p className="font-medium">Turnierdaten werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
        <header className="bg-blue-900 dark:bg-slate-950 text-white p-4 shadow-md sticky top-0 z-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {tournamentLogo ? (
                <img
                  src={tournamentLogo}
                  alt="Turnier Logo"
                  className="h-12 w-auto object-contain bg-white rounded p-1 shadow-sm"
                />
              ) : (
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  {t.title}
                </h1>
              )}
              {adminToken && (
                <label
                  className="cursor-pointer p-2 bg-blue-800 rounded-full hover:bg-blue-700 transition"
                  title={t.uploadLogo}
                >
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleLanguage}
                className="w-10 h-10 flex items-center justify-center bg-blue-800 rounded-full hover:bg-blue-700 transition shadow-inner text-xl"
              >
                {language === "de" ? "🇬🇧" : "🇩🇪"}
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 bg-blue-800 rounded-full hover:bg-blue-700 transition"
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>
              {adminToken ? (
                <button
                  onClick={() => setAdminToken(null)}
                  className="text-sm font-medium px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-md transition"
                >
                  {t.logout}
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="p-2 bg-blue-800 rounded-full hover:bg-blue-700 transition"
                >
                  <LogIn className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1">
          {activeTab !== "INFOS" && activeTab !== "ADMIN" && (
            <div className="max-w-7xl mx-auto px-4 mt-6 flex justify-between items-end gap-4">
              <div className="w-full sm:w-96 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm appearance-none outline-none"
                >
                  <option value="">{t.allTeams}</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-3 transition-colors ${viewMode === "table" ? "bg-blue-100 dark:bg-blue-900 text-blue-700" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`p-3 transition-colors ${viewMode === "cards" ? "bg-blue-100 dark:bg-blue-900 text-blue-700" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <nav className="max-w-7xl mx-auto px-4 mt-6 overflow-x-auto">
            <div className="flex bg-white dark:bg-slate-800 rounded-xl shadow-sm p-1 min-w-max">
              {[
                "VORRUNDE",
                "ZWISCHENRUNDE",
                "FINALRUNDE",
                "INFOS",
                ...(adminToken ? ["ADMIN"] : []),
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === tab ? "bg-blue-100 dark:bg-blue-900 text-blue-700" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {tab === "ADMIN" ? t.adminArea : t[tab.toLowerCase()]}
                </button>
              ))}
            </div>
          </nav>

          <main className="max-w-7xl mx-auto p-4 mt-2 space-y-6">
            {activeTab === "ADMIN" && adminToken && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 max-w-4xl mx-auto space-y-10">
                <section>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Settings2 className="w-6 h-6 text-indigo-500" />
                    {t.settings}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t.matchDuration}
                      </label>
                      <input
                        type="number"
                        value={adminMatchDuration}
                        onChange={(e) =>
                          setAdminMatchDuration(parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t.pauseDuration}
                      </label>
                      <input
                        type="number"
                        value={adminPauseDuration}
                        onChange={(e) =>
                          setAdminPauseDuration(parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    <Save className="w-4 h-4" /> {t.save}
                  </button>
                </section>
                <hr className="border-gray-200 dark:border-slate-700" />

                <section>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-indigo-600">
                    <ImageIcon className="w-6 h-6" />
                    {t.editTeams}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                    {teams.map((team) => (
                      <div
                        key={team.id}
                        className="p-4 border rounded-xl flex items-center gap-4 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm"
                      >
                        <TeamLogo team={team} size="w-12 h-12" />
                        <div className="flex-1 overflow-hidden">
                          <p
                            className="font-bold text-sm truncate"
                            title={team.name}
                          >
                            {team.name}
                          </p>
                          <label className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 cursor-pointer flex items-center gap-1 mt-1 transition">
                            <Upload className="w-3 h-3" /> {t.uploadTeamLogo}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleTeamLogoUpload(e, team.id)}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <hr className="border-gray-200 dark:border-slate-700" />
                <section>
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-red-600">
                    <Trophy className="w-6 h-6" />
                    {t.initTournament}
                  </h2>
                  <p className="text-sm text-slate-500 mb-6">{t.initWarning}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border dark:border-slate-700">
                      <label className="block text-sm font-bold mb-2">
                        {t.bulkTeamsLabel}
                      </label>
                      <div className="mb-4">
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50">
                          <FileSpreadsheet className="w-6 h-6 text-gray-500 mb-2" />
                          <span className="text-sm text-gray-500 font-semibold">
                            {t.uploadCsvLabel}
                          </span>
                          <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleCsvUpload}
                          />
                        </label>
                      </div>
                      {csvTeams.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-green-600">
                              {t.csvSuccess} ({csvTeams.length})
                            </span>
                            <button
                              onClick={() => setCsvTeams([])}
                              className="text-xs font-semibold text-red-500 hover:underline"
                            >
                              {t.discardCsv}
                            </button>
                          </div>
                          <table className="w-full text-xs text-left bg-white rounded overflow-hidden">
                            <thead className="bg-slate-200">
                              <tr>
                                <th className="p-2">Team</th>
                                <th className="p-2">Gruppe</th>
                              </tr>
                            </thead>
                            <tbody>
                              {csvTeams.map((ct, i) => (
                                <tr key={i} className="border-b">
                                  <td className="p-2 font-medium">{ct.name}</td>
                                  <td className="p-2">{ct.group}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <textarea
                          value={bulkTeamsText}
                          onChange={(e) => setBulkTeamsText(e.target.value)}
                          className="w-full h-48 px-3 py-2 border rounded-lg bg-white text-sm font-mono whitespace-pre"
                          placeholder="Team 1&#10;Team 2&#10;..."
                        />
                      )}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border dark:border-slate-700 flex flex-col gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-1">
                          Startzeit {t.vorrunde}
                        </label>
                        <input
                          type="datetime-local"
                          value={adminVorrundeStart}
                          onChange={(e) =>
                            setAdminVorrundeStart(e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-1">
                          Startzeit {t.zwischenrunde}
                        </label>
                        <input
                          type="datetime-local"
                          value={adminZwischenrundeStart}
                          onChange={(e) =>
                            setAdminZwischenrundeStart(e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-1">
                          Startzeit {t.finalrunde}
                        </label>
                        <input
                          type="datetime-local"
                          value={adminFinalrundeStart}
                          onChange={(e) =>
                            setAdminFinalrundeStart(e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded-lg bg-white"
                        />
                      </div>
                      <button
                        onClick={handleInitializeTournament}
                        className="w-full mt-auto flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 font-bold"
                      >
                        <Trophy className="w-5 h-5" /> Automatisches Setup
                        starten
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "INFOS" && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 max-w-4xl mx-auto">
                {adminToken && !isEditingInfo && (
                  <button
                    onClick={() => {
                      setEditInfoText(tournamentInfo);
                      setIsEditingInfo(true);
                    }}
                    className="mb-4 flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg"
                  >
                    <Edit className="w-4 h-4" /> {t.edit}
                  </button>
                )}
                {isEditingInfo ? (
                  <div className="space-y-4">
                    <textarea
                      value={editInfoText}
                      onChange={(e) => setEditInfoText(e.target.value)}
                      className="w-full h-64 p-4 border rounded-xl bg-gray-50 font-mono text-sm"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setTournamentInfo(editInfoText);
                          setIsEditingInfo(false);
                        }}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg"
                      >
                        <Save className="w-4 h-4" /> {t.save}
                      </button>
                      <button
                        onClick={() => setIsEditingInfo(false)}
                        className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-lg"
                      >
                        <X className="w-4 h-4" /> {t.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={renderMarkdown(tournamentInfo)}
                  />
                )}
              </div>
            )}

            {activeTab !== "INFOS" && activeTab !== "ADMIN" && (
              <div className="flex flex-col gap-8 w-full">
                {filteredGroups.length === 0 ? (
                  <div className="w-full bg-white dark:bg-slate-800 p-8 rounded-2xl text-center text-gray-500">
                    {t.noMatches}
                  </div>
                ) : (
                  filteredGroups.map((group) => {
                    const isScheduleCollapsed = collapsedSchedules[group.id];
                    const groupMatches = matches.filter(
                      (m) =>
                        m.group_id === group.id &&
                        (!selectedTeam ||
                          m.home_team_id === selectedTeam ||
                          m.away_team_id === selectedTeam),
                    );

                    return (
                      <div
                        key={group.id}
                        className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col"
                      >
                        <div className="bg-slate-100 dark:bg-slate-900/50 px-4 py-3 border-b dark:border-slate-700 flex justify-between items-center">
                          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            {group.name}
                          </h2>
                          {adminToken && activeTab === "ZWISCHENRUNDE" && (
                            <button
                              onClick={() => setIsSeedingModalOpen(true)}
                              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                              <Settings2 className="w-4 h-4" /> {t.editSeeding}
                            </button>
                          )}
                        </div>
                        <GroupTable
                          group={group}
                          teams={teams}
                          selectedTeam={selectedTeam}
                        />
                        <button
                          onClick={() =>
                            setCollapsedSchedules((p) => ({
                              ...p,
                              [group.id]: !p[group.id],
                            }))
                          }
                          className="w-full flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-b dark:border-slate-700"
                        >
                          <span className="font-bold text-sm text-slate-600 dark:text-slate-300">
                            {t.matches} {group.name}
                          </span>
                          <div className="text-slate-400">
                            {isScheduleCollapsed ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronUp className="w-5 h-5" />
                            )}
                          </div>
                        </button>
                        {!isScheduleCollapsed && (
                          <div className="bg-slate-50/50 dark:bg-slate-900/20 p-4 w-full">
                            {viewMode === "cards" ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groupMatches.map((match) => (
                                  <MatchCard
                                    key={match.id}
                                    match={match}
                                    homeTeam={teams.find(
                                      (t) => t.id === match.home_team_id,
                                    )}
                                    awayTeam={teams.find(
                                      (t) => t.id === match.away_team_id,
                                    )}
                                    isAdmin={!!adminToken}
                                    onUpdateResult={handleUpdateResult}
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-full">
                                <table className="w-full text-sm text-left border-collapse min-w-[600px]">
                                  <thead className="text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-b border-slate-300 dark:border-slate-600">
                                    <tr>
                                      <th className="px-3 py-3 text-center w-10">
                                        {t.nr}
                                      </th>
                                      <th className="px-2 py-3 text-center w-10">
                                        {t.f}
                                      </th>
                                      <th className="px-3 py-3 text-center w-20">
                                        {t.beginn}
                                      </th>
                                      <th className="px-2 py-3 text-center w-10">
                                        {t.gr}
                                      </th>
                                      <th
                                        className="px-4 py-3 text-center"
                                        colSpan={4}
                                      >
                                        {t.spiel}
                                      </th>
                                      <th className="px-4 py-3 text-center w-24">
                                        {t.ergebnis}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {groupMatches.map((match) => (
                                      <MatchTableRow
                                        key={match.id}
                                        match={match}
                                        group={group}
                                        homeTeam={teams.find(
                                          (t) => t.id === match.home_team_id,
                                        )}
                                        awayTeam={teams.find(
                                          (t) => t.id === match.away_team_id,
                                        )}
                                        isAdmin={!!adminToken}
                                        onUpdateResult={handleUpdateResult}
                                        selectedTeam={selectedTeam}
                                      />
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </main>
        </div>

        {isSeedingModalOpen && adminToken && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-full">
              <div className="p-4 md:p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <h3 className="font-bold text-lg md:text-xl text-slate-800 dark:text-white flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  {t.seedingTitle}
                </h3>
                <button
                  onClick={() => setIsSeedingModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 md:p-6 overflow-y-auto bg-slate-50/30 dark:bg-slate-800/30">
                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-center">
                          {t.vorrundenPlatz}
                        </th>
                        <th className="px-4 py-3">{t.team}</th>
                        <th className="px-4 py-3">{t.zugewieseneGruppe}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {seedingData.map((item) => {
                        const team = teams.find((t) => t.id === item.team_id);
                        return (
                          <tr
                            key={item.team_id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                              {item.vorrunden_platz}
                            </td>
                            <td className="px-4 py-3 flex items-center gap-3 font-medium text-slate-800 dark:text-slate-200">
                              <TeamLogo team={team} size="w-8 h-8" />
                              {team?.name || "Unbekannt"}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={item.assigned_group}
                                onChange={(e) =>
                                  updateSeedingGroup(
                                    item.team_id,
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold transition-all cursor-pointer"
                              >
                                <option value="Gruppe G">Gruppe G</option>
                                <option value="Gruppe H">Gruppe H</option>
                                <option value="Gruppe I">Gruppe I</option>
                                <option value="Gruppe J">Gruppe J</option>
                                <option value="Gruppe K">Gruppe K</option>
                                <option value="Gruppe L">Gruppe L</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 md:p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3 bg-white dark:bg-slate-800">
                <button
                  onClick={() => setIsSeedingModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={saveSeedingData}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 py-10">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">
                {t.organizer}
              </h3>
              {adminToken && !isEditingOrganizer && (
                <button
                  onClick={() => {
                    setEditOrganizerText(organizerInfo);
                    setIsEditingOrganizer(true);
                  }}
                  className="mb-4 flex items-center gap-2 text-blue-600 text-sm hover:underline"
                >
                  <Edit className="w-4 h-4" /> {t.edit}
                </button>
              )}

              {isEditingOrganizer ? (
                <div className="space-y-3">
                  <textarea
                    value={editOrganizerText}
                    onChange={(e) => setEditOrganizerText(e.target.value)}
                    className="w-full h-32 p-3 border rounded-lg bg-gray-50 dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setOrganizerInfo(editOrganizerText);
                        setIsEditingOrganizer(false);
                      }}
                      className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition"
                    >
                      <Save className="w-4 h-4" /> {t.save}
                    </button>
                    <button
                      onClick={() => setIsEditingOrganizer(false)}
                      className="flex items-center gap-1 bg-gray-200 dark:bg-slate-700 px-3 py-1.5 rounded text-sm hover:bg-gray-300 dark:hover:bg-slate-600 transition"
                    >
                      <X className="w-4 h-4" /> {t.cancel}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                  {organizerInfo}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                  {t.sponsors}
                </h3>
                {adminToken && (
                  <label className="cursor-pointer flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition">
                    <Plus className="w-4 h-4" /> {t.addSponsor}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSponsorUpload}
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-center">
                {sponsors.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-gray-100 dark:border-slate-700 aspect-video flex items-center justify-center"
                  >
                    <img
                      src={img}
                      alt={`Sponsor ${idx + 1}`}
                      className="max-w-full max-h-full object-contain"
                    />
                    {adminToken && (
                      <button
                        onClick={() => removeSponsor(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title={t.remove}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {sponsors.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  Noch keine Sponsoren hinterlegt.
                </p>
              )}
            </div>
          </div>
        </footer>

        <Modal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title={t.login}
        >
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                {t.username}
              </label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, username: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                {t.password}
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition mt-2"
            >
              {t.login}
            </button>
          </form>
        </Modal>
      </div>
    </div>
  );
}
