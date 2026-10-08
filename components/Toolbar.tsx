"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  LayoutGrid,
  MoreVertical,
  RotateCw,
  Share2,
  ShieldCheck,
  Search,
  X,
  Globe,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useBrowser } from "../lib/store";
import ShieldPanel from "./ShieldPanel";

const DEMO_HOSTS = [
  { host: "meridian.press", pageKey: "demo:meridian", label: "The Meridian — demo article" },
  { host: "aura.audio", pageKey: "demo:aura", label: "Aura Audio — demo product page" },
  { host: "foundry.studio", pageKey: "demo:foundry", label: "Foundry — demo studio page" },
];

const VIEW_NAMES: Record<string, string> = {
  history: "History",
  bookmarks: "Bookmarks",
  downloads: "Downloads",
  privacy: "Privacy Report",
  about: "About Aegis",
  settings: "Settings",
};

function resolveInput(raw: string): string {
  const q = raw.trim();
  if (!q) return "newtab";
  const lower = q.toLowerCase();
  if (["history", "bookmarks", "downloads", "privacy", "about", "settings"].includes(lower))
    return `view:${lower}`;
  for (const d of DEMO_HOSTS) {
    if (lower.includes(d.host)) return d.pageKey;
  }
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(lower) && !lower.includes(" ")) {
    // Looks like a URL. Only our demo hosts resolve in the prototype;
    // anything else becomes a search so nothing dead-ends.
    return `search:${encodeURIComponent(q)}`;
  }
  return `search:${encodeURIComponent(q)}`;
}

function AddressBar({ mobile = false }: { mobile?: boolean }) {
  const { activeTab, navigate, openTab, state, setCommandOpen } = useBrowser();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Reset the input when switching tabs (adjust-during-render pattern —
  // only resets on tab change, never while the user is typing).
  const [prevTabId, setPrevTabId] = useState<string | undefined>(undefined);
  if (activeTab?.id !== prevTabId) {
    setPrevTabId(activeTab?.id);
    setValue(activeTab?.url ?? "");
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setFocused(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const q = value.trim().toLowerCase();
  const suggestions: { label: string; sub: string; pageKey: string; kind: string }[] = [];
  if (q.length > 0) {
    for (const d of DEMO_HOSTS) {
      if (d.host.includes(q) || d.label.toLowerCase().includes(q))
        suggestions.push({ label: d.label, sub: d.host, pageKey: d.pageKey, kind: "demo" });
    }
    state.history
      .filter(
        (h) =>
          h.title.toLowerCase().includes(q) || h.url.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .forEach((h) =>
        suggestions.push({ label: h.title, sub: h.url, pageKey: h.pageKey, kind: "history" })
      );
    state.bookmarks
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q)
      )
      .slice(0, 2)
      .forEach((b) =>
        suggestions.push({ label: b.title, sub: b.url, pageKey: b.pageKey, kind: "bookmark" })
      );
    if (q.length > 1)
      suggestions.push({
        label: `Search for "${value.trim()}"`,
        sub: `via ${state.settings.searchEngine}`,
        pageKey: `search:${encodeURIComponent(value.trim())}`,
        kind: "search",
      });
  }

  const go = (pageKey: string) => {
    setFocused(false);
    if (!activeTab) openTab(pageKey);
    else navigate(pageKey);
  };

  const submit = () => {
    const list = suggestions.slice(0, 7);
    if (focused && list[highlight]) go(list[highlight].pageKey);
    else go(resolveInput(value));
  };

  return (
    <div ref={wrapRef} className={`relative ${mobile ? "flex-1" : "w-full max-w-xl flex-1"}`}>
      <div
        className={`flex items-center gap-2 rounded-xl border bg-ink-800 px-3 transition ${
          focused ? "border-ink-600" : "border-transparent"
        }`}
      >
        <Search size={15} className="shrink-0 text-mist-600" aria-hidden />
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setHighlight(0);
          }}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, suggestions.slice(0, 7).length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            }
          }}
          placeholder="Search or enter address"
          aria-label="Address bar"
          className="h-10 w-full bg-transparent font-mono text-[13px] text-mist-100 placeholder:text-mist-600"
        />
        {value && (
          <button
            onClick={() => setValue("")}
            aria-label="Clear address bar"
            className="rounded p-1 text-mist-600 hover:text-mist-300"
          >
            <X size={14} />
          </button>
        )}
        {!mobile && (
          <button
            onClick={() => setCommandOpen(true)}
            aria-label="Open command bar"
            className="hidden shrink-0 items-center gap-1 rounded-md border border-ink-600 px-1.5 py-0.5 font-mono text-[10px] text-mist-500 transition hover:text-mist-300 md:flex"
          >
            ⌘K
          </button>
        )}
      </div>

      <AnimatePresence>
        {focused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-ink-600 bg-ink-850"
            role="listbox"
            aria-label="Address bar suggestions"
          >
            {suggestions.slice(0, 7).map((s, i) => (
              <button
                key={`${s.kind}-${i}`}
                onClick={() => go(s.pageKey)}
                onMouseEnter={() => setHighlight(i)}
                role="option"
                aria-selected={i === highlight}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                  i === highlight ? "bg-ink-700" : ""
                }`}
              >
                <Globe size={14} className="shrink-0 text-mist-600" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] text-mist-100">
                    {s.label}
                  </span>
                  <span className="block truncate font-mono text-[11px] text-mist-600">
                    {s.sub}
                  </span>
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuDropdown({ onClose }: { onClose: () => void }) {
  const {
    setView, openTab, clearHistory, toast, state, restoreClosedTab,
    setCommandOpen,
  } = useBrowser();
  const items = [
    { label: "New tab", fn: () => openTab("newtab") },
    { label: "Command bar", fn: () => setCommandOpen(true) },
    { label: "Restore closed tab", fn: () => { restoreClosedTab(); if (state.closedTabs.length === 0) toast("Nothing to restore"); } },
    { label: "History", fn: () => setView("history") },
    { label: "Downloads", fn: () => setView("downloads") },
    { label: "Privacy Report", fn: () => setView("privacy") },
    { label: "Settings", fn: () => setView("settings") },
    {
      label: "Clear browsing history",
      fn: () => { clearHistory(); toast("Browsing history cleared"); },
    },
    { label: "About Aegis", fn: () => setView("about") },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-ink-600 bg-ink-850 py-1.5"
      role="menu"
    >
      {items.map((it) => (
        <button
          key={it.label}
          onClick={() => { it.fn(); onClose(); }}
          role="menuitem"
          className="w-full px-4 py-2 text-left text-[13px] text-mist-300 transition hover:bg-ink-700 hover:text-mist-100"
        >
          {it.label}
        </button>
      ))}
    </motion.div>
  );
}

export function DesktopToolbar() {
  const {
    activeTab, goBack, goForward, setOverviewOpen, shieldOpen, setShieldOpen,
    toast, addBookmark, removeBookmark, isBookmarked, state,
  } = useBrowser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reloading, setReloading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const bookmarked = activeTab ? isBookmarked(activeTab.url) : false;
  const canBack = !!activeTab && activeTab.idx > 0;
  const canFwd = !!activeTab && activeTab.idx < activeTab.stack.length - 1;

  const reload = () => {
    if (!activeTab) return;
    setReloading(true);
    window.setTimeout(() => setReloading(false), 900);
    toast("Page reloaded");
  };

  const toggleBookmark = () => {
    if (!activeTab) return;
    if (bookmarked) {
      const b = state.bookmarks.find((x) => x.url === activeTab.url);
      if (b) removeBookmark(b.id);
      toast("Bookmark removed");
    } else {
      addBookmark(activeTab.title, activeTab.url, activeTab.pageKey);
      toast("Bookmark saved to Reading list");
    }
  };

  const share = async () => {
    if (!activeTab) return;
    try {
      await navigator.clipboard.writeText(activeTab.url);
      toast("Link copied to clipboard");
    } catch {
      toast("Could not access clipboard");
    }
  };

  const btn =
    "rounded-lg p-2 text-mist-500 transition hover:bg-ink-800 hover:text-mist-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-mist-500";

  return (
    <div className="relative hidden items-center gap-1 px-3 py-2 md:flex" role="toolbar" aria-label="Browser toolbar">
      <button onClick={goBack} disabled={!canBack} aria-label="Go back" className={btn}>
        <ArrowLeft size={17} />
      </button>
      <button onClick={goForward} disabled={!canFwd} aria-label="Go forward" className={btn}>
        <ArrowRight size={17} />
      </button>
      <button onClick={reload} aria-label="Reload page" className={btn}>
        <RotateCw size={16} className={reloading ? "animate-spin" : ""} />
      </button>
      <div className="mx-1 flex flex-1 justify-center">
        <AddressBar />
      </div>
      <button
        onClick={() => setShieldOpen(!shieldOpen)}
        aria-label="Site privacy shield"
        aria-pressed={shieldOpen}
        className={`${btn} ${shieldOpen ? "bg-ink-800 text-mist-100" : ""}`}
        title="Privacy shield for this site"
      >
        <ShieldCheck size={17} style={{ color: "var(--accent)" }} />
      </button>
      <button onClick={toggleBookmark} aria-label={bookmarked ? "Remove bookmark" : "Bookmark this page"} className={btn}>
        <Bookmark size={17} className={bookmarked ? "fill-current" : ""} style={bookmarked ? { color: "var(--accent)" } : undefined} />
      </button>
      <button onClick={share} aria-label="Share page" className={btn}>
        <Share2 size={17} />
      </button>
      <button onClick={() => setOverviewOpen(true)} aria-label="Tab overview" className={btn}>
        <LayoutGrid size={17} />
      </button>
      <div ref={menuRef} className="relative">
        <button onClick={() => setMenuOpen((o) => !o)} aria-label="Browser menu" aria-expanded={menuOpen} className={btn}>
          <MoreVertical size={17} />
        </button>
        <AnimatePresence>{menuOpen && <MenuDropdown onClose={() => setMenuOpen(false)} />}</AnimatePresence>
      </div>
      <ShieldPanel />
    </div>
  );
}

export function MobileToolbar() {
  const {
    activeTab, goBack, goForward, setOverviewOpen, openTab,
    shieldOpen, setShieldOpen, setCommandOpen, activeSpace,
  } = useBrowser();
  const canBack = !!activeTab && activeTab.idx > 0;
  const canFwd = !!activeTab && activeTab.idx < activeTab.stack.length - 1;
  const btn =
    "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-mist-300 transition active:bg-ink-800 disabled:opacity-30";

  return (
    <div className="relative border-t border-ink-600 bg-ink-900 px-2 pb-[env(safe-area-inset-bottom)] pt-1 md:hidden">
      <div className="mb-1 px-1">
        <AddressBar mobile />
      </div>
      <div className="flex items-center justify-between" role="toolbar" aria-label="Mobile browser toolbar">
        <button onClick={goBack} disabled={!canBack} aria-label="Go back" className={btn}>
          <ArrowLeft size={20} />
        </button>
        <button onClick={goForward} disabled={!canFwd} aria-label="Go forward" className={btn}>
          <ArrowRight size={20} />
        </button>
        <button
          onClick={() => setShieldOpen(!shieldOpen)}
          aria-label="Site privacy shield"
          className={btn}
        >
          <ShieldCheck size={20} style={{ color: "var(--accent)" }} />
        </button>
        <button
          onClick={() => openTab("newtab")}
          aria-label="New tab"
          className={btn}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-mist-500 text-[11px] font-semibold">
            {activeSpace.tabs.length}
          </span>
        </button>
        <button onClick={() => setOverviewOpen(true)} aria-label="Tab overview" className={btn}>
          <LayoutGrid size={20} />
        </button>
        <button onClick={() => setCommandOpen(true)} aria-label="Open command menu" className={btn}>
          <MoreVertical size={20} />
        </button>
      </div>
      <ShieldPanel align="above" />
    </div>
  );
}

export function ViewTopBar({ title }: { title: string }) {
  const { setView } = useBrowser();
  return (
    <div className="flex items-center gap-2 border-b border-ink-600 px-4 py-3">
      <button
        onClick={() => setView(null)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-mist-500 transition hover:bg-ink-800 hover:text-mist-100"
      >
        <ArrowLeft size={16} /> Browser
      </button>
      <h1 className="text-sm font-semibold text-mist-100">{title}</h1>
    </div>
  );
}

export { VIEW_NAMES };
