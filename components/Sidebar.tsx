"use client";

import { AnimatePresence, motion, Reorder } from "framer-motion";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  History,
  Pin,
  Plus,
  ShieldCheck,
  Trash2,
  X,
  Info,
  Download as DownloadIcon,
  Bookmark as BookmarkIcon,
  Settings as SettingsIcon,
} from "lucide-react";
import { useBrowser, type TabState } from "../lib/store";

function TabRow({
  tab,
  active,
  onSelect,
  onClose,
  onPin,
  onArchive,
}: {
  tab: TabState;
  active: boolean;
  onSelect: () => void;
  onClose: () => void;
  onPin: () => void;
  onArchive: () => void;
}) {
  return (
    <Reorder.Item
      value={tab}
      id={tab.id}
      className="group relative"
      whileDrag={{ scale: 1.02 }}
    >
      <div
        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${
          active
            ? "bg-ink-700 text-mist-100"
            : "text-mist-500 hover:bg-ink-800 hover:text-mist-300"
        }`}
      >
        <button
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-2.5"
          aria-label={`Open tab: ${tab.title}`}
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: tab.dot }}
            aria-hidden
          />
          <span className="truncate">{tab.title}</span>
        </button>
        <span className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
          <button
            onClick={onPin}
            aria-label={tab.pinned ? "Unpin tab" : "Pin tab"}
            title={tab.pinned ? "Unpin" : "Pin"}
            className="rounded p-1 text-mist-500 hover:bg-ink-600 hover:text-mist-100"
          >
            <Pin size={13} className={tab.pinned ? "fill-current" : ""} />
          </button>
          <button
            onClick={onArchive}
            aria-label="Archive tab"
            title="Archive"
            className="rounded p-1 text-mist-500 hover:bg-ink-600 hover:text-mist-100"
          >
            <Archive size={13} />
          </button>
          <button
            onClick={onClose}
            aria-label="Close tab"
            title="Close"
            className="rounded p-1 text-mist-500 hover:bg-ink-600 hover:text-mist-100"
          >
            <X size={13} />
          </button>
        </span>
      </div>
    </Reorder.Item>
  );
}

const VIEW_LINKS = [
  { key: "history", label: "History", icon: History },
  { key: "bookmarks", label: "Bookmarks", icon: BookmarkIcon },
  { key: "downloads", label: "Downloads", icon: DownloadIcon },
  { key: "privacy", label: "Privacy Report", icon: ShieldCheck },
  { key: "settings", label: "Settings", icon: SettingsIcon },
  { key: "about", label: "About Aegis", icon: Info },
] as const;

export default function Sidebar() {
  const {
    state,
    activeSpace,
    activeTab,
    view,
    setView,
    openTab,
    closeTab,
    switchTab,
    pinTab,
    reorderTabs,
    archiveTab,
    closeAllTabs,
    restoreArchived,
    switchSpace,
    sidebarCollapsed,
    setSidebarCollapsed,
    toast,
  } = useBrowser();

  const pinned = activeSpace.tabs.filter((t) => t.pinned);
  const unpinned = activeSpace.tabs.filter((t) => !t.pinned);

  if (sidebarCollapsed) {
    return (
      <div className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-ink-800 bg-ink-900 py-3">
        <button
          onClick={() => setSidebarCollapsed(false)}
          aria-label="Expand sidebar"
          className="rounded-lg p-2.5 text-mist-500 transition hover:bg-ink-800 hover:text-mist-100"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => openTab("newtab")}
          aria-label="New tab"
          className="rounded-lg p-2.5 text-mist-500 transition hover:bg-ink-800 hover:text-mist-100"
        >
          <Plus size={18} />
        </button>
        <div
          className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-ink-950"
          style={{ background: "var(--accent)" }}
          aria-hidden
        >
          A
        </div>
      </div>
    );
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex w-60 shrink-0 flex-col border-r border-ink-800 bg-ink-900"
      aria-label="Browser sidebar"
    >
      {/* brand */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-ink-950"
            style={{ background: "var(--accent)" }}
            aria-hidden
          >
            A
          </div>
          <div>
            <p className="text-sm font-semibold leading-none text-mist-100">
              Aegis
            </p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-mist-600">
              Prototype v0
            </p>
          </div>
        </div>
        <button
          onClick={() => setSidebarCollapsed(true)}
          aria-label="Collapse sidebar"
          className="rounded-lg p-1.5 text-mist-500 transition hover:bg-ink-800 hover:text-mist-100"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* spaces */}
      <div className="px-3 pt-1">
        <p className="px-1 font-mono text-[10px] uppercase tracking-[0.18em] text-mist-600">
          Spaces
        </p>
        <div className="mt-1.5 flex gap-1.5">
          {state.spaces.map((s) => {
            const isActive = s.id === activeSpace.id;
            return (
              <button
                key={s.id}
                onClick={() => switchSpace(s.id)}
                aria-label={`Switch to ${s.name} space`}
                aria-pressed={isActive}
                className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium transition ${
                  isActive
                    ? "text-mist-100"
                    : "text-mist-500 hover:bg-ink-800 hover:text-mist-300"
                }`}
                style={isActive ? { background: `${s.color}26` } : undefined}
              >
                <span
                  className="mx-auto mb-1 block h-1.5 w-1.5 rounded-full"
                  style={{ background: s.color }}
                  aria-hidden
                />
                {s.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* tabs */}
      <div className="mt-3 flex-1 overflow-y-auto px-3">
        <div className="flex items-center justify-between px-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-600">
            Tabs · {activeSpace.name}
          </p>
          <button
            onClick={() => openTab("newtab")}
            aria-label="New tab"
            className="rounded p-1 text-mist-500 transition hover:bg-ink-800 hover:text-mist-100"
          >
            <Plus size={14} />
          </button>
        </div>

        {pinned.length > 0 && (
          <div className="mt-1.5">
            <Reorder.Group
              axis="y"
              values={pinned}
              onReorder={(vals) =>
                reorderTabs([
                  ...vals,
                  ...activeSpace.tabs.filter((t) => !t.pinned),
                ])
              }
              className="space-y-0.5"
            >
              {pinned.map((t) => (
                <TabRow
                  key={t.id}
                  tab={t}
                  active={t.id === activeTab?.id && view === null}
                  onSelect={() => switchTab(t.id)}
                  onClose={() => closeTab(t.id)}
                  onPin={() => pinTab(t.id)}
                  onArchive={() => archiveTab(t.id)}
                />
              ))}
            </Reorder.Group>
          </div>
        )}

        <Reorder.Group
          axis="y"
          values={unpinned}
          onReorder={(vals) =>
            reorderTabs([...activeSpace.tabs.filter((t) => t.pinned), ...vals])
          }
          className="mt-0.5 space-y-0.5"
        >
          <AnimatePresence initial={false}>
            {unpinned.map((t) => (
              <TabRow
                key={t.id}
                tab={t}
                active={t.id === activeTab?.id && view === null}
                onSelect={() => switchTab(t.id)}
                onClose={() => closeTab(t.id)}
                onPin={() => pinTab(t.id)}
                onArchive={() => archiveTab(t.id)}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>

        {activeSpace.tabs.length === 0 && (
          <button
            onClick={() => openTab("newtab")}
            className="mt-2 w-full rounded-lg border border-dashed border-ink-600 px-3 py-4 text-sm text-mist-500 transition hover:border-mist-600 hover:text-mist-300"
          >
            No open tabs — start one
          </button>
        )}

        {activeSpace.tabs.length > 0 && (
          <button
            onClick={() => {
              closeAllTabs();
              toast("All tabs closed — restore any from the command bar");
            }}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs text-mist-600 transition hover:bg-ink-800 hover:text-mist-300"
          >
            <Trash2 size={13} /> Close all tabs
          </button>
        )}

        {state.archived.length > 0 && (
          <div className="mt-3">
            <p className="px-1 font-mono text-[10px] uppercase tracking-[0.18em] text-mist-600">
              Archived
            </p>
            <div className="mt-1 space-y-0.5">
              {state.archived.slice(0, 5).map((t) => (
                <button
                  key={t.id}
                  onClick={() => restoreArchived(t.id)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs text-mist-500 transition hover:bg-ink-800 hover:text-mist-300"
                >
                  <Archive size={12} />
                  <span className="truncate">{t.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* library links */}
      <div className="border-t border-ink-800 px-3 py-3">
        <div className="grid grid-cols-3 gap-1">
          {VIEW_LINKS.map((l) => (
            <button
              key={l.key}
              onClick={() => setView(l.key)}
              aria-label={l.label}
              aria-pressed={view === l.key}
              title={l.label}
              className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] transition ${
                view === l.key
                  ? "text-mist-100"
                  : "text-mist-500 hover:bg-ink-800 hover:text-mist-300"
              }`}
              style={view === l.key ? { background: "var(--accent-soft)" } : undefined}
            >
              <l.icon size={16} />
              {l.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>
    </motion.aside>
  );
}
