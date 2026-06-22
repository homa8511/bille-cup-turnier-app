import {
  Edit2,
  FileSpreadsheet,
  Image as ImageIcon,
  Save,
  Settings2,
  Trophy,
  Upload,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import type { Team } from "../../types";
import { TeamLogo } from "../ui/TeamLogo";

interface AdminDashboardProps {
  adminToken: string;
  teams: Team[];
  refetch: () => Promise<void> | void;
  onSettingsChanged: () => void;
  t: any;
  globalSettings?: any;
}

export function AdminDashboard({
  adminToken,
  teams,
  refetch,
  onSettingsChanged,
  t,
  globalSettings,
}: AdminDashboardProps) {
  const [adminTournamentName, setAdminTournamentName] = useState(
    globalSettings?.tournament_name || "",
  );
  const [adminMatchDuration, setAdminMatchDuration] = useState(
    globalSettings?.match_duration_minutes || 10,
  );
  const [adminPauseDuration, setAdminPauseDuration] = useState(
    globalSettings?.pause_duration_minutes || 2,
  );
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

  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState("");

  useEffect(() => {
    if (globalSettings) {
      setAdminTournamentName(globalSettings.tournament_name || "");
      setAdminMatchDuration(globalSettings.match_duration_minutes || 10);
      setAdminPauseDuration(globalSettings.pause_duration_minutes || 2);
    }
  }, [globalSettings]);

  const handleSaveSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          tournament_name: adminTournamentName,
          match_duration_minutes: adminMatchDuration,
          pause_duration_minutes: adminPauseDuration,
        }),
      });
      if (res.ok) {
        alert("Einstellungen erfolgreich gespeichert!");
        onSettingsChanged();
      } else {
        alert("Fehler beim Speichern der Einstellungen.");
      }
    } catch {
      alert("Netzwerkfehler");
    }
  };

  const handleBackgroundUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files?.[0]) return;
    const formData = new FormData();
    formData.append("background", e.target.files[0]);
    try {
      const res = await fetch(`/api/admin/settings/background`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: formData,
      });
      if (res.ok) {
        alert("Hintergrundbild erfolgreich hochgeladen!");
        onSettingsChanged();
      } else alert("Fehler beim Upload");
    } catch (err) {
      console.error(err);
    }
  };

  const handleTeamLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    teamId: string,
  ) => {
    if (!e.target.files?.[0]) return;
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

  const handleSaveTeamName = async (teamId: string) => {
    if (!editTeamName.trim()) return;
    try {
      const res = await fetch(`/api/admin/teams/${teamId}/name`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: editTeamName.trim() }),
      });
      if (res.ok) {
        setEditingTeamId(null);
        refetch();
      } else alert("Fehler beim Speichern des Teamnamens");
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 max-w-4xl mx-auto space-y-10">
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-indigo-500" />
          {t.settings}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Turnier Name
            </label>
            <input
              type="text"
              value={adminTournamentName}
              onChange={(e) => setAdminTournamentName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Hintergrundbild (Desktop/Tablet)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Spieldauer (Min)
            </label>
            <input
              type="number"
              value={adminMatchDuration}
              onChange={(e) => setAdminMatchDuration(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Pause (Min)
            </label>
            <input
              type="number"
              value={adminPauseDuration}
              onChange={(e) => setAdminPauseDuration(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          onClick={handleSaveSettings}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
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
                {editingTeamId === team.id ? (
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={editTeamName}
                      onChange={(e) => setEditTeamName(e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded dark:bg-slate-900 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveTeamName(team.id)}
                      className="text-green-600 hover:text-green-700 p-1"
                      title={t.save}
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingTeamId(null)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                      title={t.cancel}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1 group">
                    <p className="font-bold text-sm truncate" title={team.name}>
                      {team.name}
                    </p>
                    <button
                      onClick={() => {
                        setEditingTeamId(team.id);
                        setEditTeamName(team.name);
                      }}
                      className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Namen bearbeiten"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <label className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 cursor-pointer flex items-center gap-1 transition w-max">
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
          Turnier-Setup
        </h2>
        <p className="text-sm text-slate-500 mb-6">{t.initWarning}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border dark:border-slate-700">
            <label className="block text-sm font-bold mb-2">
              {t.bulkTeamsLabel}
            </label>
            <div className="mb-4">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700 transition">
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
                className="w-full h-48 px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-sm font-mono whitespace-pre focus:ring-2 focus:ring-blue-500"
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
                onChange={(e) => setAdminVorrundeStart(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">
                Startzeit {t.zwischenrunde}
              </label>
              <input
                type="datetime-local"
                value={adminZwischenrundeStart}
                onChange={(e) => setAdminZwischenrundeStart(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">
                Startzeit {t.finalrunde}
              </label>
              <input
                type="datetime-local"
                value={adminFinalrundeStart}
                onChange={(e) => setAdminFinalrundeStart(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleInitializeTournament}
              className="w-full mt-auto flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 font-bold transition"
            >
              <Trophy className="w-5 h-5" /> Automatisches Setup starten
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
