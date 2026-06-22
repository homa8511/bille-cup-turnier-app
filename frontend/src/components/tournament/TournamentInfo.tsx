import {
  Calendar,
  Edit,
  Info,
  Mail,
  MapPin,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { MarkdownEditor } from "../ui/MarkdownEditor";

export interface InfoBox {
  id: string;
  icon: string;
  title: string;
  content: string;
}

interface TournamentInfoProps {
  content: string;
  boxes: InfoBox[];
  isAdmin: boolean;
  adminToken: string;
  onSaveContent: (newContent: string) => void;
  onSaveBoxes: (newBoxes: InfoBox[]) => void;
  t: any;
}

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

const getIconComponent = (iconName: string) => {
  const iconProps = { className: "w-6 h-6" };
  switch (iconName) {
    case "Calendar":
      return <Calendar {...iconProps} />;
    case "MapPin":
      return <MapPin {...iconProps} />;
    case "Mail":
      return <Mail {...iconProps} />;
    case "Star":
      return <Star {...iconProps} />;
    case "Info":
    default:
      return <Info {...iconProps} />;
  }
};

export function TournamentInfo({
  content,
  boxes,
  isAdmin,
  adminToken,
  onSaveContent,
  onSaveBoxes,
  t,
}: TournamentInfoProps) {
  const [isEditingMain, setIsEditingMain] = useState(false);
  const [editingBoxId, setEditingBoxId] = useState<string | null>(null);
  const [editBoxData, setEditBoxData] = useState<InfoBox | null>(null);

  const handleAddBox = () => {
    const newBox: InfoBox = {
      id: crypto.randomUUID(),
      icon: "Info",
      title: "Neue Box",
      content: "Informationen hier eintragen...",
    };
    setEditBoxData(newBox);
    setEditingBoxId(newBox.id);
  };

  const handleStartEditBox = (box: InfoBox) => {
    setEditBoxData({ ...box });
    setEditingBoxId(box.id);
  };

  const handleSaveBox = (markdownContent: string) => {
    if (!editBoxData) return;
    const finalBox = { ...editBoxData, content: markdownContent };

    const boxExists = boxes.some((b) => b.id === finalBox.id);
    const newBoxes = boxExists
      ? boxes.map((b) => (b.id === finalBox.id ? finalBox : b))
      : [...boxes, finalBox];

    onSaveBoxes(newBoxes);
    setEditingBoxId(null);
  };

  const handleDeleteBox = (id: string) => {
    if (confirm("Möchtest du diese Box wirklich löschen?")) {
      onSaveBoxes(boxes.filter((b) => b.id !== id));
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full">
      {/* Linke Spalte: Hauptinhalt */}
      <div className="w-full lg:w-2/3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Info className="w-6 h-6 text-blue-600" />
            {t.infos}
          </h2>
          {isAdmin && !isEditingMain && (
            <button
              onClick={() => setIsEditingMain(true)}
              className="flex items-center gap-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition font-semibold text-sm"
            >
              <Edit className="w-4 h-4" /> {t.edit}
            </button>
          )}
        </div>

        {isEditingMain ? (
          <MarkdownEditor
            initialValue={content}
            onSave={(val) => {
              onSaveContent(val);
              setIsEditingMain(false);
            }}
            onCancel={() => setIsEditingMain(false)}
            t={t}
            adminToken={adminToken}
          />
        ) : (
          <div
            className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300"
            dangerouslySetInnerHTML={renderMarkdown(content)}
          />
        )}
      </div>

      {/* Rechte Spalte: Dynamische Info-Boxen */}
      <div className="w-full lg:w-1/3 space-y-6">
        {boxes.map((box) => (
          <div
            key={box.id}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-5 relative group"
          >
            {editingBoxId === box.id && editBoxData ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editBoxData.title}
                  onChange={(e) =>
                    setEditBoxData({ ...editBoxData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 font-bold bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={editBoxData.icon}
                  onChange={(e) =>
                    setEditBoxData({ ...editBoxData, icon: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Info">Info Icon</option>
                  <option value="Calendar">Kalender Icon</option>
                  <option value="MapPin">Ort Icon</option>
                  <option value="Mail">Mail Icon</option>
                  <option value="Star">Stern Icon</option>
                </select>
                <MarkdownEditor
                  initialValue={editBoxData.content}
                  onSave={handleSaveBox}
                  onCancel={() => setEditingBoxId(null)}
                  t={t}
                  adminToken={adminToken}
                />
              </div>
            ) : (
              <>
                {isAdmin && (
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => handleStartEditBox(box)}
                      className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBox(box.id)}
                      className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                    {getIconComponent(box.icon)}
                  </div>
                  <div className="overflow-hidden w-full">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-1 truncate">
                      {box.title}
                    </h3>
                    <div
                      className="text-sm text-slate-600 dark:text-slate-400 prose-sm dark:prose-invert prose-p:my-0 prose-a:text-blue-600 w-full break-words"
                      dangerouslySetInnerHTML={renderMarkdown(box.content)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Box hinzufügen Button */}
        {isAdmin && editingBoxId === null && (
          <button
            onClick={handleAddBox}
            className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all gap-2 font-medium"
          >
            <Plus className="w-6 h-6" />
            {t.addBox || "Neue Box hinzufügen"}
          </button>
        )}
      </div>
    </div>
  );
}
