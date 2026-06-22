import {
  CalendarDays,
  Info,
  LogIn,
  LogOut,
  Moon,
  Settings2,
  Shirt,
  Sun,
} from "lucide-react";
import type { Language } from "../../locales/translations";

interface FloatingMenuBarProps {
  mainMenuTab: string;
  setMainMenuTab: (tab: any) => void;
  adminToken: string | null;
  language: Language;
  theme: string;
  toggleLanguage: () => void;
  toggleTheme: () => void;
  onLogout: () => void;
  onLoginClick: () => void;
  t: any;
}

export function FloatingMenuBar({
  mainMenuTab,
  setMainMenuTab,
  adminToken,
  language,
  theme,
  toggleLanguage,
  toggleTheme,
  onLogout,
  onLoginClick,
  t,
}: FloatingMenuBarProps) {
  const activeTabClass =
    "px-5 md:px-8 py-4 flex flex-col md:flex-row items-center gap-2 font-semibold transition-colors whitespace-nowrap shrink-0 bg-blue-500 text-white shadow-md dark:bg-blue-200 dark:text-slate-900";
  const inactiveTabClass =
    "px-5 md:px-8 py-4 flex flex-col md:flex-row items-center gap-2 font-semibold transition-colors whitespace-nowrap shrink-0 text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:hover:text-blue-200";
  const adminInactiveClass =
    "px-5 md:px-8 py-4 flex flex-col md:flex-row items-center gap-2 font-semibold transition-colors whitespace-nowrap shrink-0 text-green-500 dark:text-green-200 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:hover:text-blue-200";

  return (
    <nav className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-xl rounded-2xl flex overflow-x-auto divide-x divide-gray-200 dark:divide-slate-700 z-20 mb-8 border border-white/20 dark:border-slate-600 w-full items-stretch">
      <button
        onClick={() => setMainMenuTab("INFO")}
        className={mainMenuTab === "INFO" ? activeTabClass : inactiveTabClass}
      >
        <Info className="w-5 h-5" />{" "}
        <span className="text-sm md:text-base">{t.infos}</span>
      </button>
      <button
        onClick={() => setMainMenuTab("MY_TEAM")}
        className={
          mainMenuTab === "MY_TEAM" ? activeTabClass : inactiveTabClass
        }
      >
        <Shirt className="w-5 h-5" />{" "}
        <span className="text-sm md:text-base">{t.myTeam}</span>
      </button>
      <button
        onClick={() => setMainMenuTab("SCHEDULE")}
        className={
          mainMenuTab === "SCHEDULE" ? activeTabClass : inactiveTabClass
        }
      >
        <CalendarDays className="w-5 h-5" />{" "}
        <span className="text-sm md:text-base">{t.scheduleTab}</span>
      </button>
      {adminToken && (
        <button
          onClick={() => setMainMenuTab("ADMIN")}
          className={
            mainMenuTab === "ADMIN" ? activeTabClass : adminInactiveClass
          }
        >
          <Settings2 className="w-5 h-5" />{" "}
          <span className="text-sm md:text-base">Admin</span>
        </button>
      )}

      <div className="flex items-center gap-2 px-4 py-2 ml-auto shrink-0">
        <button
          onClick={toggleLanguage}
          className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition text-lg"
          title={
            language === "de" ? "Switch to English" : "Auf Deutsch wechseln"
          }
        >
          {language === "de" ? "🇬🇧" : "🇩🇪"}
        </button>
        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
          title="Design wechseln"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>
        {adminToken ? (
          <button
            onClick={onLogout}
            className="w-10 h-10 flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition"
            title={t.logout}
          >
            <LogOut className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onLoginClick}
            className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
            title={t.login}
          >
            <LogIn className="w-5 h-5" />
          </button>
        )}
      </div>
    </nav>
  );
}
