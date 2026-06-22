import type { Team } from "../../types";

interface TeamLogoProps {
  team?: Team;
  size?: string;
}

export function TeamLogo({ team, size = "w-8 h-8" }: TeamLogoProps) {
  if (!team || !team.logo_path) {
    return (
      <div
        className={`${size} bg-slate-200 dark:bg-slate-700 shrink-0 rounded`}
      />
    );
  }

  return (
    <div className={`${size} flex items-center justify-center shrink-0`}>
      <img
        src={team.logo_path}
        alt={team.name}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
}
