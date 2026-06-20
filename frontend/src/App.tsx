import {
  ChevronDown,
  ChevronUp,
  Edit,
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
import { GroupTable } from "./components/tournament/GroupTable";
import { TimeSlot } from "./components/tournament/TimeSlot";
import { Modal } from "./components/ui/Modal";
import { useTournamentData } from "./hooks/useTournamentData";

const initialMarkdown = `
# Willkommen beim U10 Bille Cup 2026!

**Datum:** 27.06.2026
**Ort:** Billtalstadion, Hamburg-Bergedorf

![Stadion](https://images.unsplash.com/photo-1518605368461-1ee7e163396f?auto=format&fit=crop&q=80&w=800)

### Turnierregeln
* Spieldauer: 10 Minuten
* Sieg: 3 Punkte
* Unentschieden: 1 Punkt
`;

const defaultSponsors = [
  "https://placehold.co/300x150/ffffff/000000?text=Sponsor+1",
  "https://placehold.co/300x150/ffffff/000000?text=Sponsor+2",
];

const translations: Record<string, any> = {
  de: {
    title: "U10 Bille Cup 2026",
    vorrunde: "Vorrunde",
    zwischenrunde: "Zwischenrunde",
    finalrunde: "Finalrunde",
    infos: "Turnierinfos",
    filterLabel: "Mannschaft filtern",
    allTeams: "Alle Teams anzeigen",
    login: "Admin Login",
    logout: "Abmelden",
    username: "Benutzername",
    password: "Passwort",
    edit: "Bearbeiten",
    save: "Speichern",
    cancel: "Abbrechen",
    matches: "Spielplan",
    noMatches: "Keine Spiele gefunden.",
    organizer: "Ausrichter / Verein",
    sponsors: "Sponsoren",
    uploadLogo: "Logo hochladen",
    addSponsor: "Sponsor hinzufügen",
    remove: "Entfernen",
    editSeeding: "Setzliste bearbeiten",
    seedingTitle: "Setzliste Zwischenrunde (Snake-System)",
    loading: "Turnierdaten werden geladen...",
  },
  en: {
    title: "U10 Bille Cup 2026",
    vorrunde: "Preliminaries",
    zwischenrunde: "Intermediate",
    finalrunde: "Finals",
    infos: "Tournament Info",
    filterLabel: "Filter by team",
    allTeams: "Show all teams",
    login: "Admin Login",
    logout: "Logout",
    username: "Username",
    password: "Password",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    matches: "Matches",
    noMatches: "No matches found.",
    organizer: "Organizer / Club",
    sponsors: "Sponsors",
    uploadLogo: "Upload Logo",
    addSponsor: "Add Sponsor",
    remove: "Remove",
    editSeeding: "Edit Seeding List",
    seedingTitle: "Intermediate Seeding (Snake System)",
    loading: "Loading tournament data...",
  },
};

const renderMarkdown = (text: string) => {
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
  const [language, setLanguage] = useState("de");
  const [theme, setTheme] = useState("light");
  const [selectedTeam, setSelectedTeam] = useState("");

  const [adminToken, setAdminToken] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editInfoText, setEditInfoText] = useState("");
  const [tournamentInfo, setTournamentInfo] = useState(initialMarkdown);
  const [collapsedSchedules, setCollapsedSchedules] = useState<
    Record<string, boolean>
  >({});

  const [tournamentLogo, setTournamentLogo] = useState<string | null>(null);
  const [organizerInfo, setOrganizerInfo] = useState(
    "TSG Bergedorf\nBilltalstadion\n21029 Hamburg",
  );
  const [isEditingOrganizer, setIsEditingOrganizer] = useState(false);
  const [editOrganizerText, setEditOrganizerText] = useState("");
  const [sponsors, setSponsors] = useState<string[]>(defaultSponsors);

  // Hintergrundbild State
  const [bgImage] = useState(
    "https://images.unsplash.com/photo-1518605368461-1ee7e163396f?auto=format&fit=crop&q=80&w=1920",
  );

  const [isSeedingModalOpen, setIsSeedingModalOpen] = useState(false);
  const [seedingData, setSeedingData] = useState<any[]>([]); // Wird später vom Backend befüllt

  const t = translations[language];

  useEffect(() => {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setTheme("dark");
    }
  }, []);

  const toggleLanguage = () => setLanguage((l) => (l === "de" ? "en" : "de"));
  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  const toggleSchedule = (groupId: string) =>
    setCollapsedSchedules((prev) => ({ ...prev, [groupId]: !prev[groupId] }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      if (response.ok) {
        const data = await response.json();
        setAdminToken(data.token);
        setShowLoginModal(false);
      } else {
        alert("Login fehlgeschlagen.");
      }
    } catch (err) {
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
      const response = await fetch(`/api/admin/matches/${matchId}/result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ goals_home: home, goals_away: away }),
      });
      if (response.ok) {
        refetch();
      }
    } catch (err) {
      console.error("Fehler beim Speichern des Ergebnisses", err);
    }
  };

  const handleStartRound = async (time: string) => {
    if (!adminToken) return;
    console.log("Runde anpfeifen für:", time);
    alert(
      `Alle geplanten Spiele für ${new Date(time).toLocaleTimeString()} wurden angepfiffen! (Backend-Integration folgt)`,
    );
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

  const filteredGroups = groups.filter((group) => {
    if (group.phase !== activeTab) return false;
    if (!selectedTeam) return true;
    const inStandings = group.standings?.some(
      (s) => s.team_id === selectedTeam,
    );
    const inMatches = matches.some(
      (m) =>
        m.group_id === group.id &&
        (m.home_team_id === selectedTeam || m.away_team_id === selectedTeam),
    );
    return inStandings || inMatches;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Trophy className="w-12 h-12 text-yellow-400 animate-pulse" />
          <span>{t.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      {/* Globaler Hintergrund */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div className="absolute inset-0 bg-slate-100/85 dark:bg-slate-900/90 backdrop-blur-md" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
        {/* Header (Transparent & Icons rechtsbündig) */}
        <header className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-lg border-b border-gray-200/50 dark:border-slate-800/50 text-slate-800 dark:text-white p-3 sm:p-4 shadow-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
              {tournamentLogo ? (
                <img
                  src={tournamentLogo}
                  alt="Turnier Logo"
                  className="h-10 sm:h-12 w-auto object-contain bg-white/80 rounded p-1 shadow-sm shrink-0"
                />
              ) : (
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 shrink-0" />
              )}
              <h1 className="text-base sm:text-2xl font-bold truncate">
                {t.title}
              </h1>
              {adminToken && (
                <label
                  className="cursor-pointer p-1.5 sm:p-2 bg-slate-200 dark:bg-slate-800 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition shrink-0"
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

            {/* Icons forced to the right */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
              <button
                onClick={toggleLanguage}
                className="text-lg sm:text-xl leading-none w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-slate-200 dark:bg-slate-800 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition shadow-inner"
                title={
                  language === "de"
                    ? "Switch to English"
                    : "Auf Deutsch wechseln"
                }
              >
                {language === "de" ? "🇬🇧" : "🇩🇪"}
              </button>

              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 bg-slate-200 dark:bg-slate-800 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition"
              >
                {theme === "light" ? (
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>

              {adminToken ? (
                <button
                  onClick={() => setAdminToken("")}
                  className="text-xs sm:text-sm font-medium px-2 sm:px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
                >
                  {t.logout}
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="p-1.5 sm:p-2 bg-slate-200 dark:bg-slate-800 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                >
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1">
          {/* Filter */}
          {activeTab !== "INFOS" && (
            <div className="max-w-7xl mx-auto px-4 mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                <div className="w-full sm:w-96">
                  <label
                    htmlFor="team-filter"
                    className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2"
                  >
                    {t.filterLabel}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      id="team-filter"
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-800 dark:text-slate-200 shadow-sm appearance-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="">{t.allTeams}</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {adminToken && activeTab === "ZWISCHENRUNDE" && (
                  <button
                    onClick={() => setIsSeedingModalOpen(true)}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors font-semibold text-sm"
                  >
                    <Settings2 className="w-5 h-5" />
                    {t.editSeeding}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation Tabs - Desktop */}
          <nav className="hidden md:flex max-w-7xl mx-auto px-4 mt-6 overflow-x-auto">
            <div className="flex bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl shadow-sm p-1 min-w-max border border-gray-200/50 dark:border-slate-700/50">
              {["VORRUNDE", "ZWISCHENRUNDE", "FINALRUNDE", "INFOS"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${
                      activeTab === tab
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {t[tab.toLowerCase()]}
                  </button>
                ),
              )}
            </div>
          </nav>

          {/* Navigation Dropdown - Mobile */}
          <div className="md:hidden max-w-7xl mx-auto px-4 mt-6">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-800 dark:text-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 font-bold outline-none"
            >
              {["VORRUNDE", "ZWISCHENRUNDE", "FINALRUNDE", "INFOS"].map(
                (tab) => (
                  <option key={tab} value={tab}>
                    {t[tab.toLowerCase()]}
                  </option>
                ),
              )}
            </select>
          </div>

          <main className="max-w-7xl mx-auto p-4 mt-2 space-y-6">
            {activeTab === "INFOS" && (
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200/50 dark:border-slate-700/50 p-6 max-w-4xl mx-auto">
                {adminToken && !isEditingInfo && (
                  <button
                    onClick={() => {
                      setEditInfoText(tournamentInfo);
                      setIsEditingInfo(true);
                    }}
                    className="mb-4 flex items-center gap-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                  >
                    <Edit className="w-4 h-4" /> {t.edit}
                  </button>
                )}

                {isEditingInfo ? (
                  <div className="space-y-4">
                    <textarea
                      value={editInfoText}
                      onChange={(e) => setEditInfoText(e.target.value)}
                      className="w-full h-64 p-4 border rounded-xl bg-gray-50 dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setTournamentInfo(editInfoText);
                          setIsEditingInfo(false);
                        }}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        <Save className="w-4 h-4" /> {t.save}
                      </button>
                      <button
                        onClick={() => setIsEditingInfo(false)}
                        className="flex items-center gap-2 bg-gray-200 dark:bg-slate-700 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition"
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

            {activeTab !== "INFOS" && (
              <div className="flex flex-col gap-8 w-full">
                {filteredGroups.length === 0 ? (
                  <div className="w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-gray-100/50 dark:border-slate-700/50 text-center text-gray-500 dark:text-gray-400">
                    {t.noMatches}
                  </div>
                ) : (
                  filteredGroups.map((group) => {
                    const isScheduleCollapsed = collapsedSchedules[group.id];
                    const groupMatches = matches.filter((match) => {
                      if (match.group_id !== group.id) return false;
                      if (!selectedTeam) return true;
                      return (
                        match.home_team_id === selectedTeam ||
                        match.away_team_id === selectedTeam
                      );
                    });

                    const uniqueTimes = Array.from(
                      new Set(groupMatches.map((m) => m.start_time)),
                    ).sort();

                    return (
                      <div
                        key={group.id}
                        className="w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl shadow-sm border border-gray-200/50 dark:border-slate-700/50 overflow-hidden flex flex-col"
                      >
                        <div className="bg-slate-100/80 dark:bg-slate-900/50 px-4 py-3 border-b dark:border-slate-700">
                          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            {group.name}
                          </h2>
                        </div>

                        <GroupTable
                          group={group}
                          teams={teams}
                          selectedTeam={selectedTeam}
                        />

                        <button
                          onClick={() => toggleSchedule(group.id)}
                          className="w-full flex justify-between items-center px-4 py-3 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-t border-b dark:border-slate-700"
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
                          <div className="bg-slate-50/40 dark:bg-slate-900/20 p-4 flex-1 w-full">
                            {groupMatches.length === 0 ? (
                              <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center">
                                {t.noMatches}
                              </p>
                            ) : (
                              uniqueTimes.map((time) => {
                                const matchesAtTime = groupMatches.filter(
                                  (m) => m.start_time === time,
                                );
                                return (
                                  <TimeSlot
                                    key={time}
                                    time={time}
                                    matches={matchesAtTime}
                                    isAdmin={!!adminToken}
                                    onStartRound={handleStartRound}
                                    onUpdateResult={handleUpdateResult}
                                  />
                                );
                              })
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

        {/* Modal: Setzliste bearbeiten */}
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
                        const teamObj = teams.find(
                          (t) => t.id === item.team_id,
                        );
                        return (
                          <tr
                            key={item.team_id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                              {item.vorrunden_platz}
                            </td>
                            <td className="px-4 py-3 flex items-center gap-3 font-medium text-slate-800 dark:text-slate-200">
                              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-600">
                                {teamObj?.logo_path ? (
                                  <img
                                    src={teamObj.logo_path}
                                    alt={teamObj.name}
                                    className="w-[90%] h-[90%] object-contain"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-slate-200 dark:bg-slate-700" />
                                )}
                              </div>
                              {teamObj ? teamObj.name : item.team_id}
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
                                {[
                                  "Gruppe G",
                                  "Gruppe H",
                                  "Gruppe I",
                                  "Gruppe J",
                                  "Gruppe K",
                                  "Gruppe L",
                                ].map((groupName) => (
                                  <option key={groupName} value={groupName}>
                                    {groupName}
                                  </option>
                                ))}
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
                  onClick={() => setIsSeedingModalOpen(false)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer für Ausrichter & Sponsoren (Mobile optimiert) */}
        <footer className="mt-12 bg-white/70 dark:bg-slate-900/80 backdrop-blur-lg border-t border-gray-200/50 dark:border-slate-700/50 py-10">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:grid md:grid-cols-2 gap-10">
            {/* Sponsoren: Mobil oben (order-1), Desktop rechts (md:order-2) */}
            <div className="order-1 md:order-2">
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

              {/* Mobil 1-spaltig, ab sm 2-spaltig, ab lg 3-spaltig */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
                {sponsors.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group bg-slate-50/80 dark:bg-slate-900/80 rounded-lg p-3 border border-gray-100/50 dark:border-slate-700/50 aspect-video flex items-center justify-center backdrop-blur-sm shadow-sm"
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

            {/* Ausrichter: Mobil unten (order-2), Desktop links (md:order-1) */}
            <div className="order-2 md:order-1">
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
                <div className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed font-medium">
                  {organizerInfo}
                </div>
              )}
            </div>
          </div>
        </footer>

        {/* Login Modal */}
        <Modal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title={t.login}
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
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              {t.login}
            </button>
          </form>
        </Modal>
      </div>
    </div>
  );
}
