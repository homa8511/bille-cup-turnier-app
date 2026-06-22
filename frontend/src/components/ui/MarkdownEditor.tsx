import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  FileText,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List as ListIcon,
  ListOrdered,
  Palette,
  Smile,
} from "lucide-react";
import React, { useRef, useState } from "react";

interface MarkdownEditorProps {
  initialValue: string;
  onSave: (v: string) => void;
  onCancel: () => void;
  t: any;
  placeholder?: string;
  adminToken: string;
}

export const MarkdownEditor = ({
  initialValue,
  onSave,
  onCancel,
  t,
  placeholder = "",
  adminToken,
}: MarkdownEditorProps) => {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [showLinkPrompt, setShowLinkPrompt] = useState(false);
  const [linkData, setLinkData] = useState({ text: "", url: "" });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const insertText = (prefix: string, suffix: string = "") => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      value.substring(end);
    setValue(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Das Bild muss im Format JPG, PNG oder WEBP vorliegen.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Das Bild darf maximal 2 MB groß sein.");
      e.target.value = "";
      return;
    }

    setUploadError(null);

    const formData = new FormData();
    formData.append("background", file);
    try {
      const res = await fetch("/api/admin/settings/background", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        insertText(`![${file.name}](${data.url})`);
      } else {
        setUploadError(data.message || "Fehler beim Upload des Bildes.");
      }
    } catch (err) {
      console.error(err);
      setUploadError("Netzwerkfehler beim Upload des Bildes.");
    }
    e.target.value = "";
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadError("Das Dokument muss zwingend ein PDF sein.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Das Dokument darf maximal 5 MB groß sein.");
      e.target.value = "";
      return;
    }

    setUploadError(null);

    const formData = new FormData();
    formData.append("document", file);
    try {
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        insertText(`[${file.name}](${data.url})`);
      } else {
        setUploadError(data.message || "Fehler beim Upload des Dokuments.");
      }
    } catch (err) {
      console.error(err);
      setUploadError("Netzwerkfehler beim Upload des Dokuments.");
    }
    e.target.value = "";
  };

  const handleLinkSubmit = () => {
    if (linkData.url) {
      insertText(`[${linkData.text || "Link"}](${linkData.url})`);
    }
    setShowLinkPrompt(false);
    setLinkData({ text: "", url: "" });
  };

  const EMOJIS = [
    "⚽",
    "🏆",
    "🥇",
    "🥈",
    "🥉",
    "🏟️",
    "⏱️",
    "⚠️",
    "⭐",
    "🔥",
    "💪",
    "🎉",
    "👍",
    "👏",
    "😀",
    "😎",
  ];

  return (
    <div className="border border-gray-200 dark:border-slate-600 rounded-xl overflow-visible shadow-sm relative z-10 w-full">
      <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-900 p-2 border-b border-gray-200 dark:border-slate-600 rounded-t-xl relative">
        <select
          onChange={(e) => {
            if (e.target.value) insertText(e.target.value);
            e.target.value = "";
          }}
          className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer border-r border-slate-300 pr-2 mr-1"
        >
          <option value="">Format...</option>
          <option value="">Text (Normal)</option>
          <option value="# ">Überschrift 1</option>
          <option value="## ">Überschrift 2</option>
          <option value="### ">Überschrift 3</option>
        </select>

        <button
          onClick={() => insertText("**", "**")}
          className="p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded transition"
          title="Fett"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertText("*", "*")}
          className="p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded transition"
          title="Kursiv"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-300 dark:bg-slate-600 mx-1"></div>

        <button
          onClick={() => insertText("\n* ")}
          className="p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded transition"
          title="Aufzählung"
        >
          <ListIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertText("\n1. ")}
          className="p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded transition"
          title="Nummerierte Liste"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-300 dark:bg-slate-600 mx-1"></div>

        <button
          onClick={() =>
            insertText('<div style="text-align: left;">\n', "\n</div>")
          }
          className="p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded transition"
          title="Links bündig"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() =>
            insertText('<div style="text-align: center;">\n', "\n</div>")
          }
          className="p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded transition"
          title="Zentriert"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() =>
            insertText('<div style="text-align: right;">\n', "\n</div>")
          }
          className="p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded transition"
          title="Rechts bündig"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-300 dark:bg-slate-600 mx-1"></div>

        <div
          className="relative flex items-center justify-center p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded transition"
          title="Textfarbe"
        >
          <Palette className="w-4 h-4 absolute pointer-events-none" />
          <input
            type="color"
            className="w-5 h-5 opacity-0 cursor-pointer"
            onChange={(e) =>
              insertText(`<span style="color: ${e.target.value}">`, "</span>")
            }
          />
        </div>
        <div
          className="relative flex items-center justify-center p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded transition"
          title="Hervorhebung"
        >
          <Highlighter className="w-4 h-4 absolute pointer-events-none" />
          <input
            type="color"
            className="w-5 h-5 opacity-0 cursor-pointer"
            onChange={(e) =>
              insertText(
                `<span style="background-color: ${e.target.value}">`,
                "</span>",
              )
            }
          />
        </div>

        <div className="w-px h-5 bg-gray-300 dark:bg-slate-600 mx-1"></div>

        <div className="relative">
          <button
            onClick={() => setShowLinkPrompt(!showLinkPrompt)}
            className="p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded transition"
            title="Link einfügen"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          {showLinkPrompt && (
            <div className="absolute top-10 left-0 z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-3 rounded-lg shadow-xl flex flex-col gap-2 w-64">
              <input
                type="text"
                placeholder="Anzeigetext"
                value={linkData.text}
                onChange={(e) =>
                  setLinkData({ ...linkData, text: e.target.value })
                }
                className="border border-gray-200 p-1.5 text-sm rounded-md dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
              <input
                type="url"
                placeholder="https://..."
                value={linkData.url}
                onChange={(e) =>
                  setLinkData({ ...linkData, url: e.target.value })
                }
                className="border border-gray-200 p-1.5 text-sm rounded-md dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
              <div className="flex justify-end gap-2 mt-1">
                <button
                  onClick={() => setShowLinkPrompt(false)}
                  className="text-xs font-semibold bg-gray-200 text-slate-700 px-3 py-1.5 rounded-md hover:bg-gray-300"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleLinkSubmit}
                  className="text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700"
                >
                  Einfügen
                </button>
              </div>
            </div>
          )}
        </div>

        <label
          className="p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded transition cursor-pointer"
          title="Bild hochladen"
        >
          <ImageIcon className="w-4 h-4" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>

        <label
          className="p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded transition cursor-pointer"
          title="PDF hochladen"
        >
          <FileText className="w-4 h-4" />
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleDocUpload}
          />
        </label>

        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded transition"
            title="Emoji einfügen"
          >
            <Smile className="w-4 h-4" />
          </button>
          {showEmojiPicker && (
            <div className="absolute top-10 right-0 sm:left-0 z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-2 rounded-lg shadow-xl grid grid-cols-4 gap-2 w-48">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    insertText(e);
                    setShowEmojiPicker(false);
                  }}
                  className="text-xl hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border-b border-gray-200 dark:border-slate-600 flex justify-between items-center">
          <span>{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="hover:text-red-800 dark:hover:text-red-200"
          >
            ✕
          </button>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full h-64 p-4 bg-white dark:bg-slate-800 focus:outline-none focus:ring-0 resize-y font-mono text-sm dark:text-slate-200"
        placeholder={placeholder}
      />

      <div className="flex justify-end gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-600 rounded-b-xl">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-200 hover:bg-gray-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 transition"
        >
          {t.cancel}
        </button>
        <button
          onClick={() => onSave(value)}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition"
        >
          {t.save}
        </button>
      </div>
    </div>
  );
};
