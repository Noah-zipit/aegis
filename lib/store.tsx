"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* ---------------- types ---------------- */

export interface TabState {
  id: string;
  title: string;
  url: string;
  pageKey: string;
  pinned: boolean;
  dot: string;
  stack: string[];
  idx: number;
}

export interface Space {
  id: string;
  name: string;
  color: string;
  tabs: TabState[];
  activeTabId: string | null;
}

export interface HistoryEntry {
  id: string;
  title: string;
  url: string;
  pageKey: string;
  ts: number;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  pageKey: string;
  folder: string;
  ts: number;
}

export interface DownloadItem {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: "downloading" | "done" | "cancelled";
  ts: number;
}

export interface Settings {
  accent: string;
  searchEngine: string;
  adBlock: boolean;
  trackerBlock: boolean;
  noPrefetch: boolean;
  httpsOnly: boolean;
}

export interface PrivacyStats {
  trackers: number;
  ads: number;
  dataMB: number;
  batteryMin: number;
}

export type ViewKey =
  | "history"
  | "bookmarks"
  | "downloads"
  | "privacy"
  | "about"
  | "settings";

export interface Toast {
  id: number;
  message: string;
}

/* ---------------- page-key helpers ----------------
   pageKey encodes what a tab shows:
   "newtab" | "demo:<site>" | "search:<query>" | "view:<key>"
   Real external sites are simulated in this prototype — real
   websites send X-Frame-Options / CSP headers that block iframes,
   so the prototype renders built-in demo pages instead. */

export function metaForPageKey(pageKey: string): {
  title: string;
  url: string;
  dot: string;
} {
  if (pageKey === "newtab")
    return { title: "New Tab", url: "aegis:newtab", dot: "#8e8e99" };
  if (pageKey.startsWith("demo:")) {
    const site = pageKey.slice(5);
    if (site === "meridian")
      return {
        title: "The quiet rebellion against the 250MB browser — The Meridian",
        url: "https://meridian.press/quiet-rebellion",
        dot: "#ff5757",
      };
    if (site === "aura")
      return {
        title: "Aura One — Wireless Headphones — Aura Audio",
        url: "https://aura.audio/products/aura-one",
        dot: "#4cc9b0",
      };
    if (site === "foundry")
      return {
        title: "Foundry — Brand & Digital Studio",
        url: "https://foundry.studio",
        dot: "#6b9bd1",
      };
  }
  if (pageKey.startsWith("search:")) {
    const q = decodeURIComponent(pageKey.slice(7));
    return {
      title: `${q} — Aegis Search`,
      url: `aegis:search?q=${encodeURIComponent(q)}`,
      dot: "#8e8e99",
    };
  }
  if (pageKey.startsWith("view:")) {
    const v = pageKey.slice(5);
    const names: Record<string, string> = {
      history: "History",
      bookmarks: "Bookmarks",
      downloads: "Downloads",
      privacy: "Privacy Report",
      about: "About Aegis",
      settings: "Settings",
    };
    return { title: names[v] ?? v, url: `aegis:${v}`, dot: "#8e8e99" };
  }
  return { title: "New Tab", url: "aegis:newtab", dot: "#8e8e99" };
}

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/* Deterministic ids/timestamps for the initial (prerender-safe) state.
   Runtime-created items still use uid()/Date.now() inside event handlers. */
let initCounter = 0;
const initId = () => `init-${++initCounter}`;
const BASE_TS = 1760000000000;

const DOT_POOL = ["#ff5757", "#9c9c9d", "#6a6b6c", "#c9c9d1", "#434345"];

function makeTab(pageKey: string, dot?: string, deterministic = false): TabState {
  const meta = metaForPageKey(pageKey);
  const id = deterministic ? initId() : uid();
  return {
    id,
    title: meta.title,
    url: meta.url,
    pageKey,
    pinned: false,
    dot: dot ?? meta.dot,
    stack: [pageKey],
    idx: 0,
  };
}

/* ---------------- persisted state ---------------- */

interface Persisted {
  spaces: Space[];
  activeSpaceId: string;
  history: HistoryEntry[];
  bookmarks: Bookmark[];
  downloads: DownloadItem[];
  settings: Settings;
  stats: PrivacyStats;
  closedTabs: TabState[];
  archived: TabState[];
}

const DEFAULT_SETTINGS: Settings = {
  accent: "#ff5757",
  searchEngine: "Aegis",
  adBlock: true,
  trackerBlock: true,
  noPrefetch: true,
  httpsOnly: true,
};

function defaultSpaces(): Space[] {
  const t1 = makeTab("demo:meridian", undefined, true);
  const t2 = makeTab("newtab", undefined, true);
  return [
    {
      id: "personal",
      name: "Personal",
      color: "#ff5757",
      tabs: [t1, t2],
      activeTabId: t1.id,
    },
    { id: "work", name: "Work", color: "#9c9c9d", tabs: [], activeTabId: null },
    {
      id: "research",
      name: "Research",
      color: "#6a6b6c",
      tabs: [],
      activeTabId: null,
    },
  ];
}

function defaultPersisted(): Persisted {
  return {
    spaces: defaultSpaces(),
    activeSpaceId: "personal",
    history: [
      {
        id: initId(),
        title: metaForPageKey("demo:meridian").title,
        url: metaForPageKey("demo:meridian").url,
        pageKey: "demo:meridian",
        ts: BASE_TS - 1000 * 60 * 42,
      },
      {
        id: initId(),
        title: "Aura One — Wireless Headphones — Aura Audio",
        url: "https://aura.audio/products/aura-one",
        pageKey: "demo:aura",
        ts: BASE_TS - 1000 * 60 * 60 * 5,
      },
    ],
    bookmarks: [
      {
        id: initId(),
        title: "The quiet rebellion against the 250MB browser — The Meridian",
        url: "https://meridian.press/quiet-rebellion",
        pageKey: "demo:meridian",
        folder: "Reading list",
        ts: BASE_TS - 1000 * 60 * 60 * 26,
      },
    ],
    downloads: [],
    settings: DEFAULT_SETTINGS,
    stats: { trackers: 1284, ads: 862, dataMB: 214, batteryMin: 96 },
    closedTabs: [],
    archived: [],
  };
}

const LS_KEY = "aegis-prototype-v1";

function load(): Persisted {
  if (typeof window === "undefined") return defaultPersisted();
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return defaultPersisted();
    const parsed = JSON.parse(raw) as Persisted;
    if (!parsed.spaces || !parsed.settings) return defaultPersisted();
    return { ...defaultPersisted(), ...parsed };
  } catch {
    return defaultPersisted();
  }
}

/* ---------------- context ---------------- */

interface BrowserApi {
  state: Persisted;
  view: ViewKey | null;
  setView: (v: ViewKey | null) => void;
  commandOpen: boolean;
  setCommandOpen: (b: boolean) => void;
  overviewOpen: boolean;
  setOverviewOpen: (b: boolean) => void;
  shieldOpen: boolean;
  setShieldOpen: (b: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (b: boolean) => void;
  toasts: Toast[];
  toast: (message: string) => void;

  activeSpace: Space;
  activeTab: TabState | null;

  openTab: (pageKey: string, opts?: { pinned?: boolean; switchTo?: boolean }) => void;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  pinTab: (tabId: string) => void;
  navigate: (pageKey: string) => void;
  goBack: () => void;
  goForward: () => void;
  reorderTabs: (tabs: TabState[]) => void;
  restoreClosedTab: () => void;
  archiveTab: (tabId: string) => void;
  restoreArchived: (tabId: string) => void;
  closeAllTabs: () => void;
  switchSpace: (spaceId: string) => void;

  addHistory: (pageKey: string) => void;
  clearHistory: () => void;
  deleteHistoryItem: (id: string) => void;

  addBookmark: (title: string, url: string, pageKey: string, folder?: string) => void;
  removeBookmark: (id: string) => void;
  renameBookmark: (id: string, title: string) => void;
  isBookmarked: (url: string) => boolean;

  addDownload: (name: string, size: string) => void;
  cancelDownload: (id: string) => void;
  clearCompletedDownloads: () => void;

  updateSettings: (patch: Partial<Settings>) => void;
  bumpStats: () => void;
  resetAll: () => void;
}

const Ctx = createContext<BrowserApi | null>(null);

export function useBrowser(): BrowserApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBrowser outside provider");
  return ctx;
}

export function BrowserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(load);
  const [view, setView] = useState<ViewKey | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [shieldOpen, setShieldOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
      /* storage full — prototype keeps running in memory */
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--accent",
      state.settings.accent
    );
    const hex = state.settings.accent;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    document.documentElement.style.setProperty(
      "--accent-soft",
      `rgba(${r}, ${g}, ${b}, 0.12)`
    );
  }, [state.settings.accent]);

  // Ctrl/Cmd+K opens the command bar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setCommandOpen(false);
        setOverviewOpen(false);
        setShieldOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toast = useCallback((message: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, message }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 2600);
  }, []);

  const activeSpace: Space =
    state.spaces.find((s) => s.id === state.activeSpaceId) ?? state.spaces[0];
  const activeTab: TabState | null =
    activeSpace.tabs.find((t) => t.id === activeSpace.activeTabId) ?? null;

  const patchSpace = useCallback(
    (spaceId: string, fn: (s: Space) => Space) => {
      setState((st) => ({
        ...st,
        spaces: st.spaces.map((s) => (s.id === spaceId ? fn(s) : s)),
      }));
    },
    []
  );

  const addHistory = useCallback((pageKey: string) => {
    if (pageKey.startsWith("view:") || pageKey === "newtab") return;
    const meta = metaForPageKey(pageKey);
    setState((st) => ({
      ...st,
      history: [
        { id: uid(), title: meta.title, url: meta.url, pageKey, ts: Date.now() },
        ...st.history,
      ].slice(0, 300),
    }));
  }, []);

  const bumpStats = useCallback(() => {
    setState((st) => ({
      ...st,
      stats: {
        trackers: st.stats.trackers + 3 + Math.floor(Math.random() * 9),
        ads: st.stats.ads + 2 + Math.floor(Math.random() * 6),
        dataMB: Math.round((st.stats.dataMB + 0.4 + Math.random() * 1.8) * 10) / 10,
        batteryMin: st.stats.batteryMin + 1 + Math.floor(Math.random() * 3),
      },
    }));
  }, []);

  const openTab = useCallback(
    (pageKey: string, opts?: { pinned?: boolean; switchTo?: boolean }) => {
      const tab = makeTab(
        pageKey,
        opts?.pinned
          ? DOT_POOL[Math.floor(Math.random() * DOT_POOL.length)]
          : undefined
      );
      if (opts?.pinned) tab.pinned = true;
      const spaceId = activeSpace.id;
      patchSpace(spaceId, (s) => ({
        ...s,
        tabs: opts?.pinned
          ? [{ ...tab }, ...s.tabs]
          : [...s.tabs, { ...tab }],
        activeTabId: opts?.switchTo === false ? s.activeTabId : tab.id,
      }));
      setView(null);
      if (!pageKey.startsWith("view:")) {
        addHistory(pageKey);
        bumpStats();
      }
    },
    [activeSpace.id, patchSpace, addHistory, bumpStats]
  );

  const closeTab = useCallback(
    (tabId: string) => {
      const spaceId = activeSpace.id;
      const tab = activeSpace.tabs.find((t) => t.id === tabId);
      if (!tab) return;
      setState((st) => ({ ...st, closedTabs: [tab, ...st.closedTabs].slice(0, 20) }));
      patchSpace(spaceId, (s) => {
        const tabs = s.tabs.filter((t) => t.id !== tabId);
        let activeTabId = s.activeTabId;
        if (s.activeTabId === tabId) {
          const idx = s.tabs.findIndex((t) => t.id === tabId);
          const next = tabs[Math.min(idx, tabs.length - 1)];
          activeTabId = next ? next.id : null;
        }
        return { ...s, tabs, activeTabId };
      });
    },
    [activeSpace, patchSpace]
  );

  const switchTab = useCallback(
    (tabId: string) => {
      patchSpace(activeSpace.id, (s) => ({ ...s, activeTabId: tabId }));
      setView(null);
    },
    [activeSpace.id, patchSpace]
  );

  const pinTab = useCallback(
    (tabId: string) => {
      patchSpace(activeSpace.id, (s) => {
        const tab = s.tabs.find((t) => t.id === tabId);
        if (!tab) return s;
        const rest = s.tabs.filter((t) => t.id !== tabId);
        const updated = { ...tab, pinned: !tab.pinned };
        const pinned = rest.filter((t) => t.pinned);
        const unpinned = rest.filter((t) => !t.pinned);
        return {
          ...s,
          tabs: updated.pinned
            ? [...pinned, updated, ...unpinned]
            : [...pinned, ...unpinned, updated],
        };
      });
    },
    [activeSpace.id, patchSpace]
  );

  const navigate = useCallback(
    (pageKey: string) => {
      const tabId = activeTab?.id;
      if (!tabId) {
        openTab(pageKey);
        return;
      }
      const meta = metaForPageKey(pageKey);
      patchSpace(activeSpace.id, (s) => ({
        ...s,
        tabs: s.tabs.map((t) => {
          if (t.id !== tabId) return t;
          const stack = [...t.stack.slice(0, t.idx + 1), pageKey];
          return {
            ...t,
            title: meta.title,
            url: meta.url,
            pageKey,
            dot: meta.dot === "#8e8e99" ? t.dot : meta.dot,
            stack,
            idx: stack.length - 1,
          };
        }),
      }));
      setView(null);
      addHistory(pageKey);
      bumpStats();
    },
    [activeTab, activeSpace.id, patchSpace, openTab, addHistory, bumpStats]
  );

  const goBack = useCallback(() => {
    const tab = activeTab;
    if (!tab || tab.idx <= 0) return;
    const idx = tab.idx - 1;
    const pageKey = tab.stack[idx];
    const meta = metaForPageKey(pageKey);
    patchSpace(activeSpace.id, (s) => ({
      ...s,
      tabs: s.tabs.map((t) =>
        t.id === tab.id
          ? { ...t, idx, pageKey, title: meta.title, url: meta.url }
          : t
      ),
    }));
  }, [activeTab, activeSpace.id, patchSpace]);

  const goForward = useCallback(() => {
    const tab = activeTab;
    if (!tab || tab.idx >= tab.stack.length - 1) return;
    const idx = tab.idx + 1;
    const pageKey = tab.stack[idx];
    const meta = metaForPageKey(pageKey);
    patchSpace(activeSpace.id, (s) => ({
      ...s,
      tabs: s.tabs.map((t) =>
        t.id === tab.id
          ? { ...t, idx, pageKey, title: meta.title, url: meta.url }
          : t
      ),
    }));
  }, [activeTab, activeSpace.id, patchSpace]);

  const reorderTabs = useCallback(
    (tabs: TabState[]) => {
      patchSpace(activeSpace.id, (s) => ({ ...s, tabs }));
    },
    [activeSpace.id, patchSpace]
  );

  const restoreClosedTab = useCallback(() => {
    setState((st) => {
      const [tab, ...rest] = st.closedTabs;
      if (!tab) return st;
      return {
        ...st,
        closedTabs: rest,
        spaces: st.spaces.map((s) =>
          s.id === st.activeSpaceId
            ? { ...s, tabs: [...s.tabs, tab], activeTabId: tab.id }
            : s
        ),
      };
    });
    setView(null);
  }, []);

  const archiveTab = useCallback(
    (tabId: string) => {
      const tab = activeSpace.tabs.find((t) => t.id === tabId);
      if (!tab) return;
      setState((st) => ({ ...st, archived: [tab, ...st.archived] }));
      closeTab(tabId);
      setState((st) => ({ ...st, closedTabs: st.closedTabs.filter((t) => t.id !== tabId) }));
    },
    [activeSpace, closeTab]
  );

  const restoreArchived = useCallback(
    (tabId: string) => {
      setState((st) => {
        const tab = st.archived.find((t) => t.id === tabId);
        if (!tab) return st;
        return {
          ...st,
          archived: st.archived.filter((t) => t.id !== tabId),
          spaces: st.spaces.map((s) =>
            s.id === st.activeSpaceId
              ? { ...s, tabs: [...s.tabs, tab], activeTabId: tab.id }
              : s
          ),
        };
      });
      setView(null);
    },
    []
  );

  const closeAllTabs = useCallback(() => {
    setState((st) => ({
      ...st,
      closedTabs: [...activeSpace.tabs, ...st.closedTabs].slice(0, 20),
      spaces: st.spaces.map((s) =>
        s.id === activeSpace.id ? { ...s, tabs: [], activeTabId: null } : s
      ),
    }));
  }, [activeSpace]);

  const switchSpace = useCallback((spaceId: string) => {
    setState((st) => ({ ...st, activeSpaceId: spaceId }));
    setView(null);
  }, []);

  const clearHistory = useCallback(() => {
    setState((st) => ({ ...st, history: [] }));
  }, []);

  const deleteHistoryItem = useCallback((id: string) => {
    setState((st) => ({ ...st, history: st.history.filter((h) => h.id !== id) }));
  }, []);

  const addBookmark = useCallback(
    (title: string, url: string, pageKey: string, folder = "Reading list") => {
      setState((st) => ({
        ...st,
        bookmarks: [{ id: uid(), title, url, pageKey, folder, ts: Date.now() }, ...st.bookmarks],
      }));
    },
    []
  );

  const removeBookmark = useCallback((id: string) => {
    setState((st) => ({ ...st, bookmarks: st.bookmarks.filter((b) => b.id !== id) }));
  }, []);

  const renameBookmark = useCallback((id: string, title: string) => {
    setState((st) => ({
      ...st,
      bookmarks: st.bookmarks.map((b) => (b.id === id ? { ...b, title } : b)),
    }));
  }, []);

  const isBookmarked = useCallback(
    (url: string) => state.bookmarks.some((b) => b.url === url),
    [state.bookmarks]
  );

  const addDownload = useCallback(
    (name: string, size: string) => {
      const id = uid();
      setState((st) => ({
        ...st,
        downloads: [
          { id, name, size, progress: 0, status: "downloading", ts: Date.now() },
          ...st.downloads,
        ],
      }));
      const timer = setInterval(() => {
        setState((st) => {
          const dl = st.downloads.find((d) => d.id === id);
          if (!dl || dl.status !== "downloading") {
            clearInterval(timers.current[id]);
            return st;
          }
          const progress = Math.min(100, dl.progress + 4 + Math.random() * 9);
          return {
            ...st,
            downloads: st.downloads.map((d) =>
              d.id === id
                ? { ...d, progress, status: progress >= 100 ? "done" : "downloading" }
                : d
            ),
          };
        });
      }, 220);
      timers.current[id] = timer;
    },
    []
  );

  const cancelDownload = useCallback((id: string) => {
    clearInterval(timers.current[id]);
    setState((st) => ({
      ...st,
      downloads: st.downloads.map((d) =>
        d.id === id ? { ...d, status: "cancelled" } : d
      ),
    }));
  }, []);

  const clearCompletedDownloads = useCallback(() => {
    setState((st) => ({
      ...st,
      downloads: st.downloads.filter((d) => d.status === "downloading"),
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((st) => ({ ...st, settings: { ...st.settings, ...patch } }));
  }, []);

  const resetAll = useCallback(() => {
    Object.values(timers.current).forEach(clearInterval);
    const fresh = defaultPersisted();
    setState(fresh);
    setView(null);
  }, []);

  const api = useMemo<BrowserApi>(
    () => ({
      state,
      view,
      setView,
      commandOpen,
      setCommandOpen,
      overviewOpen,
      setOverviewOpen,
      shieldOpen,
      setShieldOpen,
      sidebarCollapsed,
      setSidebarCollapsed,
      toasts,
      toast,
      activeSpace,
      activeTab,
      openTab,
      closeTab,
      switchTab,
      pinTab,
      navigate,
      goBack,
      goForward,
      reorderTabs,
      restoreClosedTab,
      archiveTab,
      restoreArchived,
      closeAllTabs,
      switchSpace,
      addHistory,
      clearHistory,
      deleteHistoryItem,
      addBookmark,
      removeBookmark,
      renameBookmark,
      isBookmarked,
      addDownload,
      cancelDownload,
      clearCompletedDownloads,
      updateSettings,
      bumpStats,
      resetAll,
    }),
    [
      state, view, commandOpen, overviewOpen, shieldOpen, sidebarCollapsed,
      toasts, toast, activeSpace, activeTab, openTab, closeTab, switchTab,
      pinTab, navigate, goBack, goForward, reorderTabs, restoreClosedTab,
      archiveTab, restoreArchived, closeAllTabs, switchSpace, addHistory,
      clearHistory, deleteHistoryItem, addBookmark, removeBookmark,
      renameBookmark, isBookmarked, addDownload, cancelDownload,
      clearCompletedDownloads, updateSettings, bumpStats, resetAll,
    ]
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
