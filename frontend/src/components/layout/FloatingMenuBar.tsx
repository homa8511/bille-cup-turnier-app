import { Globe, LogIn, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tabClass = (isActive: boolean) =>
    `px-4 sm:px-6 md:px-8 py-3 md:py-4 font-bold text-sm md:text-base transition-colors whitespace-nowrap shrink-0 ${
      isActive
        ? "bg-blue-500 text-white shadow-md dark:bg-blue-200 dark:text-slate-900"
        : "text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:hover:text-blue-200"
    }`;

  return (
    <div className="relative w-full z-30 mb-8" ref={menuRef}>
      <nav className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-xl rounded-2xl flex justify-between overflow-visible border border-white/20 dark:border-slate-600 w-full items-stretch">
        <div className="flex overflow-x-auto divide-x divide-gray-200 dark:divide-slate-700 hide-scrollbar">
          <button
            onClick={() => setMainMenuTab("INFO")}
            className={tabClass(mainMenuTab === "INFO")}
          >
            Info
          </button>
          <button
            onClick={() => setMainMenuTab("MY_TEAM")}
            className={tabClass(mainMenuTab === "MY_TEAM")}
          >
            Team
          </button>
          <button
            onClick={() => setMainMenuTab("SCHEDULE")}
            className={tabClass(mainMenuTab === "SCHEDULE")}
          >
            Plan
          </button>
          {adminToken && (
            <button
              onClick={() => setMainMenuTab("ADMIN")}
              className={tabClass(mainMenuTab === "ADMIN")}
            >
              Admin
            </button>
          )}
        </div>

        <div className="flex items-center px-2 sm:px-4 border-l border-gray-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-500 dark:hover:text-blue-200 rounded-lg transition-colors"
            aria-label="Menü öffnen"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
          <button
            onClick={() => {
              toggleLanguage();
              setIsMenuOpen(false);
            }}
            className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
          >
            <Globe className="w-5 h-5 text-slate-400" />
            {language === "de" ? "English" : "Deutsch"}
          </button>

          <button
            onClick={() => {
              toggleTheme();
              setIsMenuOpen(false);
            }}
            className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 text-slate-400" />
            ) : (
              <Sun className="w-5 h-5 text-slate-400" />
            )}
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>

          <div className="h-px bg-gray-100 dark:bg-slate-700 my-1"></div>

          {adminToken ? (
            <button
              onClick={() => {
                onLogout();
                setIsMenuOpen(false);
              }}
              className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 font-medium transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {t.logout || "Logout"}
            </button>
          ) : (
            <button
              onClick={() => {
                onLoginClick();
                setIsMenuOpen(false);
              }}
              className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              <LogIn className="w-5 h-5 text-slate-400" />
              {t.login || "Login"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
