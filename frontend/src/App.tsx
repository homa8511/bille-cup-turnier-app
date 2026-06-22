import {
  ChevronDown,
  ChevronUp,
  Edit,
  LayoutGrid,
  List,
  LogIn,
  Moon,
  Plus,
  Search,
  Settings2,
  Sun,
  Trash2,
  Trophy,
  Upload,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { SeedingModal } from "./components/admin/SeedingModal";
import { GroupTable } from "./components/tournament/GroupTable";
import { MatchCard } from "./components/tournament/MatchCard";
import { MatchTableRow } from "./components/tournament/MatchTableRow";
import {
  TournamentInfo,
  type InfoBox,
} from "./components/tournament/TournamentInfo";
import { MarkdownEditor } from "./components/ui/MarkdownEditor";
import { Modal } from "./components/ui/Modal";
import { useTournamentData } from "./hooks/useTournamentData";
import { translations, type Language } from "./locales/translations";

const initialMarkdown = `# Willkommen beim U10 Bille Cup 2026!\n\nDas größte Jugendturnier im Osten Hamburgs freut sich auf spannende Spiele.\n\n![Stadion](https://images.unsplash.com/photo-1518605368461-1ee7e163396f?auto=format&fit=crop&q=80&w=800)\n\n### Aktuelle Turnierregeln\n* Die reguläre Spieldauer beträgt exakt 10 Minuten.\n* Für einen Sieg erhält die Mannschaft 3 Punkte.\n* Bei einem Unentschieden bekommt jedes Team 1 Punkt.\n* Die Rückpassregel ist für den Torwart aufgehoben.`;

const initialBoxes: InfoBox[] = [
  {
    id: "1",
    icon: "Calendar",
    title: "Turnierdatum",
    content: "Samstag, 27. Juni 2026\n09:00 - 18:00 Uhr",
  },
  {
    id: "2",
    icon: "MapPin",
    title: "Veranstaltungsort",
    content: "Billtalstadion\n21029 Hamburg-Bergedorf",
  },
  {
    id: "3",
    icon: "Mail",
    title: "Kontakt & Fragen",
    content: "Turnierleitung U10\n[info@billecup.de](mailto:info@billecup.de)",
  },
];

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
    .replace(
      /^\*\s+(.*$)/gim,
      '<div class="ml-4 flex gap-2"><span>•</span><span>$1</span></div>',
    )
    .replace(
      /^(\d+)\.\s+(.*$)/gim,
      '<div class="ml-4 flex gap-2"><span class="font-bold">$1.</span><span>$2</span></div>',
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
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");

  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  const [tournamentInfo, setTournamentInfo] = useState(initialMarkdown);
  const [infoBoxes, setInfoBoxes] = useState<InfoBox[]>(initialBoxes);
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
      } else alert("Login fehlgeschlagen.");
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
    } catch (err) {
      console.error(err);
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

  const handleOpenSeedingModal = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch("/api/admin/preview-snake", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        setSeedingData(await res.json());
        setIsSeedingModalOpen(true);
      } else
        alert(
          "Fehler beim Laden der Setzliste. Sind alle Vorrunden-Spiele absolviert?",
        );
    } catch (err) {
      console.error(err);
    }
  };

  const saveSeedingData = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch("/api/admin/approve-seeding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          seeding: seedingData,
          startTimeIso: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        alert("Zwischenrunde erfolgreich generiert!");
        setIsSeedingModalOpen(false);
        refetch();
      } else alert("Fehler beim Speichern der Setzliste.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartFinalRound = async () => {
    if (!adminToken || !confirm("Finalrunde jetzt berechnen und starten?"))
      return;
    try {
      const res = await fetch("/api/admin/start-finalround", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ startTimeIso: new Date().toISOString() }),
      });
      if (res.ok) {
        alert("Finalrunde erfolgreich gestartet!");
        refetch();
      } else alert("Fehler beim Starten der Finalrunde.");
    } catch (err) {
      console.error(err);
    }
  };

  const sortedGroups = [...groups].sort((a, b) => a.name.localeCompare(b.name));
  const filteredGroups = sortedGroups.filter((g) => {
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
          <p className="font-medium">{t.loadingData || "Lade..."}</p>
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
                  alt="Logo"
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

              <div className="flex items-center gap-4 shrink-0">
                {adminToken && activeTab === "ZWISCHENRUNDE" && (
                  <button
                    onClick={handleOpenSeedingModal}
                    className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors font-semibold text-sm"
                  >
                    <Settings2 className="w-5 h-5" />
                    {t.editSeeding}
                  </button>
                )}
                {adminToken && activeTab === "FINALRUNDE" && (
                  <button
                    onClick={handleStartFinalRound}
                    className="flex items-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl shadow-sm transition-colors font-semibold text-sm"
                  >
                    <Trophy className="w-5 h-5" />
                    {t.startFinalRound}
                  </button>
                )}

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
              <AdminDashboard
                adminToken={adminToken}
                teams={teams}
                refetch={refetch}
                t={t}
              />
            )}

            {activeTab === "INFOS" && (
              <TournamentInfo
                content={tournamentInfo}
                boxes={infoBoxes}
                isAdmin={!!adminToken}
                adminToken={adminToken || ""}
                onSaveContent={setTournamentInfo}
                onSaveBoxes={setInfoBoxes}
                t={t}
              />
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
                        </div>
                        <GroupTable
                          group={group}
                          teams={teams}
                          selectedTeam={selectedTeam}
                          t={t}
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
                                    group={group}
                                    homeTeam={teams.find(
                                      (t) => t.id === match.home_team_id,
                                    )}
                                    awayTeam={teams.find(
                                      (t) => t.id === match.away_team_id,
                                    )}
                                    isAdmin={!!adminToken}
                                    onUpdateResult={handleUpdateResult}
                                    t={t}
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
                                        t={t}
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

        {adminToken && (
          <SeedingModal
            isOpen={isSeedingModalOpen}
            onClose={() => setIsSeedingModalOpen(false)}
            seedingData={seedingData}
            teams={teams}
            onUpdateGroup={(teamId, newGroup) => {
              setSeedingData((prev) =>
                prev.map((i) =>
                  i.team_id === teamId ? { ...i, assigned_group: newGroup } : i,
                ),
              );
            }}
            onSave={saveSeedingData}
            t={t}
          />
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
                <div className="mt-2">
                  <MarkdownEditor
                    initialValue={editOrganizerText}
                    onSave={(val) => {
                      setOrganizerInfo(val);
                      setIsEditingOrganizer(false);
                    }}
                    onCancel={() => setIsEditingOrganizer(false)}
                    t={t}
                    adminToken={adminToken || ""}
                  />
                </div>
              ) : (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed"
                  dangerouslySetInnerHTML={renderMarkdown(organizerInfo)}
                />
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
                        onClick={() =>
                          setSponsors((p) => p.filter((_, i) => i !== idx))
                        }
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </footer>

        <Modal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title={t.login}
          maxWidth="sm"
        >
          <form onSubmit={handleLogin} className="p-6 space-y-4">
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
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-slate-900"
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
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-slate-900"
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
