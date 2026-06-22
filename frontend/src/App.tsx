import { Edit, Plus, Trash2, Trophy, Upload } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Modal } from "./components/ui/Modal";
import { useTournamentData } from "./hooks/useTournamentData";

import { FloatingMenuBar } from "./components/layout/FloatingMenuBar";
import { MainViewContainer } from "./components/layout/MainViewContainer";
import { MarkdownEditor } from "./components/ui/MarkdownEditor";
import { SeedingModal } from "./components/ui/SeedingModal";
import { translations, type Language } from "./locales/translations";
import type { GlobalSettings, InfoBox, SeedingItem } from "./types/index";
import { AdminDashboard as AdminDashboardView } from "./views/AdminDashboardView";
import { MyTeamView } from "./views/MyTeamView";
import { ScheduleView } from "./views/ScheduleView";
import { TournamentInfo as TournamentInfoView } from "./views/TournamentInfoView";

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
      '<h3 class="text-xl font-bold mt-4 mb-2 text-green-500 dark:text-green-200">$1</h3>',
    )
    .replace(
      /^## (.*$)/gim,
      '<h2 class="text-2xl font-bold mt-5 mb-2 text-green-500 dark:text-green-200">$1</h2>',
    )
    .replace(
      /^# (.*$)/gim,
      '<h1 class="text-3xl font-bold mt-6 mb-4 text-green-500 dark:text-green-200">$1</h1>',
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
      "<a href='$2' class='text-green-500 hover:text-blue-500 dark:text-green-200 dark:hover:text-blue-200 underline transition-colors'>$1</a>",
    )
    .replace(
      /^\*\s+(.*$)/gim,
      '<div class="ml-4 flex gap-2"><span class="text-green-500 dark:text-green-200">•</span><span>$1</span></div>',
    )
    .replace(
      /^(\d+)\.\s+(.*$)/gim,
      '<div class="ml-4 flex gap-2"><span class="font-bold text-green-500 dark:text-green-200">$1.</span><span>$2</span></div>',
    )
    .replace(/\n/gim, "<br />");
  return { __html: html };
};

export default function App() {
  const { teams, groups, matches, isLoading, refetch } = useTournamentData();
  const [mainMenuTab, setMainMenuTab] = useState<
    "INFO" | "MY_TEAM" | "SCHEDULE" | "ADMIN"
  >("INFO");
  const [language, setLanguage] = useState<Language>("de");
  const [theme, setTheme] = useState("light");

  const [adminToken, setAdminToken] = useState<string | null>(() =>
    localStorage.getItem("adminToken"),
  );
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  const [tournamentInfo, setTournamentInfo] = useState(initialMarkdown);
  const [infoBoxes, setInfoBoxes] = useState<InfoBox[]>(initialBoxes);

  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(
    null,
  );
  const [organizerInfo, setOrganizerInfo] = useState(
    "TSG Bergedorf\nBilltalstadion\n21029 Hamburg",
  );
  const [isEditingOrganizer, setIsEditingOrganizer] = useState(false);
  const [sponsors, setSponsors] = useState<string[]>([]);

  const [isSeedingModalOpen, setIsSeedingModalOpen] = useState(false);
  const [seedingData, setSeedingData] = useState<SeedingItem[]>([]);

  const t = translations[language];

  const fetchSettings = () => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then(setGlobalSettings)
      .catch(() => null);
  };

  useEffect(() => {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
    fetchSettings();
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
        localStorage.setItem("adminToken", data.token);
        setShowLoginModal(false);
        setLoginForm({ username: "", password: "" });
      } else alert("Login fehlgeschlagen.");
    } catch {
      alert("Netzwerkfehler beim Login.");
    }
  };

  const handleLogout = () => {
    setAdminToken(null);
    localStorage.removeItem("adminToken");
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("logo", file);
    try {
      const res = await fetch("/api/admin/settings/logo", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: formData,
      });
      if (res.ok) fetchSettings();
      else alert("Fehler beim Upload des Logos.");
    } catch (err) {
      console.error(err);
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

  if (isLoading && teams.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center animate-pulse">
          <Trophy className="w-12 h-12 text-green-500 dark:text-green-200 mx-auto mb-4" />
          <p className="font-medium">{t.loadingData}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 relative overflow-x-hidden">
        <div className="fixed inset-0 -z-20 bg-slate-200 dark:bg-slate-950" />

        <div className="fixed top-0 left-0 w-full -z-10 bg-slate-900">
          <picture>
            <source media="(min-width: 768px)" srcSet="/bg-desktop.webp" />
            <img
              src="/bg-mobile.webp"
              alt="Tournament Background"
              className="w-full h-[100dvh] lg:h-auto object-cover object-center lg:object-top opacity-60 mix-blend-overlay lg:mix-blend-normal lg:opacity-100"
            />
          </picture>
        </div>

        <div className="w-[90%] max-w-7xl mx-auto flex flex-col min-h-screen z-10">
          <div className="pt-12 pb-8 flex flex-col items-center text-center relative z-20 mt-4">
            <div className="relative mb-4 w-full flex justify-center">
              <img
                src="/logo.webp"
                className="w-[35vw] max-w-[400px] min-w-[200px] object-contain drop-shadow-2xl"
                alt="Logo"
              />
              {adminToken && (
                <label
                  className="absolute -right-4 -top-4 cursor-pointer p-2 bg-green-500 hover:bg-blue-500 text-white rounded-full transition-colors shadow-lg"
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

            <h2
              className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white drop-shadow-lg tracking-wide"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
            >
              27.06.2026
            </h2>

            {globalSettings?.phase_start_time && (
              <p className="text-white text-lg md:text-xl font-bold bg-black/40 px-5 py-1.5 rounded-full backdrop-blur-sm shadow-lg border border-white/20 mt-4">
                Start:{" "}
                {new Date(globalSettings.phase_start_time).toLocaleTimeString(
                  t.localeCode,
                  { hour: "2-digit", minute: "2-digit" },
                )}{" "}
                Uhr
              </p>
            )}
          </div>

          <FloatingMenuBar
            mainMenuTab={mainMenuTab}
            setMainMenuTab={setMainMenuTab}
            adminToken={adminToken}
            language={language}
            theme={theme}
            toggleLanguage={toggleLanguage}
            toggleTheme={toggleTheme}
            onLogout={handleLogout}
            onLoginClick={() => setShowLoginModal(true)}
            t={t}
          />

          <MainViewContainer>
            {mainMenuTab === "ADMIN" && adminToken && (
              <AdminDashboardView
                adminToken={adminToken}
                teams={teams}
                refetch={refetch}
                onSettingsChanged={fetchSettings}
                t={t}
                globalSettings={globalSettings}
              />
            )}

            {mainMenuTab === "INFO" && (
              <TournamentInfoView
                content={tournamentInfo}
                boxes={infoBoxes}
                isAdmin={!!adminToken}
                adminToken={adminToken || ""}
                onSaveContent={setTournamentInfo}
                onSaveBoxes={setInfoBoxes}
                t={t}
              />
            )}

            {mainMenuTab === "MY_TEAM" && (
              <MyTeamView
                teams={teams}
                groups={groups}
                matches={matches}
                adminToken={adminToken}
                onUpdateResult={handleUpdateResult}
                t={t}
              />
            )}

            {mainMenuTab === "SCHEDULE" && (
              <ScheduleView
                teams={teams}
                groups={groups}
                matches={matches}
                adminToken={adminToken}
                onOpenSeedingModal={handleOpenSeedingModal}
                onStartFinalRound={handleStartFinalRound}
                onUpdateResult={handleUpdateResult}
                t={t}
              />
            )}
          </MainViewContainer>

          {adminToken && (
            <SeedingModal
              isOpen={isSeedingModalOpen}
              onClose={() => setIsSeedingModalOpen(false)}
              seedingData={seedingData}
              teams={teams}
              onUpdateGroup={(teamId: string, newGroup: string) => {
                setSeedingData((prev) =>
                  prev.map((i) =>
                    i.team_id === teamId
                      ? { ...i, assigned_group: newGroup }
                      : i,
                  ),
                );
              }}
              onSave={saveSeedingData}
              t={t}
            />
          )}

          <footer className="mt-auto bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-xl rounded-t-3xl border-t border-gray-200 dark:border-slate-700 py-10 z-20 px-6 sm:px-10 mb-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h3 className="font-bold text-lg mb-4 text-green-500 dark:text-green-400">
                  {t.organizer}
                </h3>
                {adminToken && !isEditingOrganizer && (
                  <button
                    onClick={() => {
                      setIsEditingOrganizer(true);
                    }}
                    className="mb-4 flex items-center gap-2 text-green-500 hover:text-blue-500 transition-colors text-sm hover:underline"
                  >
                    <Edit className="w-4 h-4" /> {t.edit}
                  </button>
                )}

                {isEditingOrganizer ? (
                  <div className="mt-2">
                    <MarkdownEditor
                      initialValue={organizerInfo}
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
                  <h3 className="font-bold text-lg text-green-500 dark:text-green-400">
                    {t.sponsors}
                  </h3>
                  {adminToken && (
                    <label className="cursor-pointer flex items-center gap-1 text-sm text-green-500 hover:text-blue-500 transition-colors">
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
        </div>

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
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-green-500 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors mt-2"
            >
              {t.login}
            </button>
          </form>
        </Modal>
      </div>
    </div>
  );
}
