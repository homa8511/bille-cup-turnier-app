import { X } from "lucide-react";
import type { ReactNode } from "react";

// Diese Schnittstelle definiert die Eigenschaften der Modal-Komponente.
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | ReactNode;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}

// Diese Komponente rendert ein überlagerndes Dialogfenster.
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
}: ModalProps) {
  if (!isOpen) {
    return null;
  }

  // Dieses Objekt ordnet die Größenbezeichnungen den passenden Tailwind-Klassen zu.
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div
        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full ${maxWidthClasses[maxWidth]} my-8 overflow-hidden flex flex-col max-h-full`}
      >
        {/* Dieser Bereich stellt den Kopf des Fensters mit Titel und Schließen-Button dar. */}
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold text-lg md:text-xl text-slate-800 dark:text-white flex items-center gap-2">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dieser Container nimmt den eigentlichen Inhalt des Modals auf. */}
        <div className="overflow-y-auto bg-slate-50/30 dark:bg-slate-800/30 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
