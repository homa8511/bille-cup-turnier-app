import type { ReactNode } from "react";

interface MainViewContainerProps {
  children: ReactNode;
}

export function MainViewContainer({ children }: MainViewContainerProps) {
  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl rounded-3xl p-4 sm:p-8 z-20 mb-12 flex-1 border border-white/20 dark:border-slate-700">
      <main className="space-y-8">{children}</main>
    </div>
  );
}
