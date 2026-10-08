"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  Download,
  History,
  Info,
  Plus,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Command,
  Layers,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBrowser, type ViewKey } from "../lib/store";

interface Action {
  id: string;
  label: string;
  hint?: string;
  icon: React.ElementType;
  disabled?: boolean;
  run: () => void;
}

export default function CommandBar() {
  const {
    commandOpen, setCommandOpen, openTab, setView, clearHistory,
    restoreClosedTab, state, toast, closeTab, activeTab,
  } = useBrowser();
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (commandOpen) {
      const t = window.setTimeout(() => {
        setQuery("");
        setHighlight(0);
        inputRef.current?.focus();
      }, 40);
      return () => window.clearTimeout(t);
    }
  }, [commandOpen]);

  const goView = (v: ViewKey) => () => {
    setView(v);
    setCommandOpen(false);
  };

  const actions: Action[] = useMemo(
    () => [
      {
        id: "ai",
        label: "Aegis AI — on-device chat",
        hint: "Offline",
        icon: Sparkles,
        run: () => { openTab("ai"); setCommandOpen(false); },
      },
      { id: "newtab", label: "New tab", icon: Plus, run: () => { openTab("newtab"); setCommandOpen(false); } },
      { id: "history", label: "Go to History", icon: History, run: goView("history") },
      { id: "bookmarks", label: "Go to Bookmarks", icon: Bookmark, run: goView("bookmarks") },
      { id: "downloads", label: "Go to Downloads", icon: Download, run: goView("downloads") },
      { id: "privacy", label: "Go to Privacy Report", icon: ShieldCheck, run: goView("privacy") },
      { id: "settings", label: "Go to Settings", icon: Settings, run: goView("settings") },
      { id: "about", label: "About Aegis", icon: Info, run: goView("about") },
      {
        id: "restore", label: "Restore closed tab", icon: RotateCcw,
        run: () => {
          if (state.closedTabs.length === 0) toast("Nothing to restore");
          else restoreClosedTab();
          setCommandOpen(false);
        },
      },
      {
        id: "closetab", label: "Close current tab", icon: Trash2,
        run: () => {
          if (activeTab) closeTab(activeTab.id);
          setCommandOpen(false);
        },
      },
      {
        id: "clearhist", label: "Clear browsing history", icon: Trash2,
        run: () => { clearHistory(); toast("Browsing history cleared"); setCommandOpen(false); },
      },
      {
        id: "spaces", label: "Switch space…", hint: "use the sidebar", icon: Layers,
        run: () => { toast("Pick a space from the sidebar"); setCommandOpen(false); },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.closedTabs.length, activeTab?.id]
  );

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {commandOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/60 px-4 pt-[18vh]"
          onClick={() => setCommandOpen(false)}
          role="dialog"
          aria-label="Command bar"
        >
          <motion.div
            initial={{ scale: 0.96, y: -8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: -8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 480, damping: 38 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-ink-600 bg-ink-850"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 border-b border-ink-600 px-4">
              <Command size={16} className="text-mist-600" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlight((h) => Math.min(h + 1, filtered.length - 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlight((h) => Math.max(h - 1, 0));
                  }
                  if (e.key === "Enter" && filtered[highlight] && !filtered[highlight].disabled) {
                    filtered[highlight].run();
                  }
                }}
                placeholder="Type a command…"
                aria-label="Command search"
                className="h-13 w-full bg-transparent py-4 text-[15px] text-mist-100 placeholder:text-mist-600"
              />
            </div>
            <div className="max-h-80 overflow-y-auto py-1.5" role="listbox">
              {filtered.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => !a.disabled && a.run()}
                  disabled={a.disabled}
                  onMouseEnter={() => setHighlight(i)}
                  role="option"
                  aria-selected={i === highlight}
                  aria-disabled={a.disabled}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                    i === highlight && !a.disabled ? "bg-ink-700" : ""
                  } ${a.disabled ? "cursor-not-allowed opacity-45" : ""}`}
                >
                  <a.icon size={16} className="shrink-0 text-mist-500" aria-hidden />
                  <span className="flex-1 text-sm text-mist-100">{a.label}</span>
                  {a.hint && (
                    <span className="rounded-md border border-ink-600 px-1.5 py-0.5 font-mono text-[10px] text-mist-500">
                      {a.hint}
                    </span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-mist-600">
                  No commands match “{query}”.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
