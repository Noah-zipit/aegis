"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  Bookmark,
  Download as DownloadIcon,
  FileText,
  FolderPlus,
  History as HistoryIcon,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  X,
  ExternalLink,
  Zap,
  Eye,
  Battery,
  Database,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useBrowser, type ViewKey } from "../lib/store";

/* ---------------- shared bits ---------------- */

function Empty({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center">
      <div className="rounded-2xl bg-ink-800 p-4">
        <Icon size={24} className="text-mist-500" aria-hidden />
      </div>
      <h3 className="mt-4 font-semibold text-mist-100">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-mist-500">{body}</p>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-transparent bg-ink-800 px-3 transition focus-within:border-ink-600">
      <Search size={15} className="shrink-0 text-mist-600" aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full bg-transparent text-sm text-mist-100 placeholder:text-mist-600"
      />
      {value && (
        <button onClick={() => onChange("")} aria-label="Clear search" className="rounded p-1 text-mist-600 hover:text-mist-300">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/* ---------------- history ---------------- */

export function HistoryView() {
  const { state, openTab, clearHistory, deleteHistoryItem, toast } = useBrowser();
  const [q, setQ] = useState("");

  const filtered = state.history.filter(
    (h) =>
      h.title.toLowerCase().includes(q.toLowerCase()) ||
      h.url.toLowerCase().includes(q.toLowerCase())
  );

  const groups: { label: string; items: typeof filtered }[] = [];
  const now = new Date();
  const day = (ts: number) => {
    const d = new Date(ts);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diff = Math.round((today - itemDay) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  };
  for (const h of filtered) {
    const label = day(h.ts);
    const g = groups.find((x) => x.label === label);
    if (g) g.items.push(h);
    else groups.push({ label, items: [h] });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-mist-100">History</h2>
        {state.history.length > 0 && (
          <button
            onClick={() => { clearHistory(); toast("Browsing history cleared"); }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] text-mist-500 transition hover:bg-ink-800 hover:text-mist-100"
          >
            <Trash2 size={14} /> Clear all
          </button>
        )}
      </div>
      <div className="mt-4">
        <SearchInput value={q} onChange={setQ} placeholder="Search history" />
      </div>
      {groups.length === 0 ? (
        <Empty icon={HistoryIcon} title="No history" body={q ? "Nothing matches your search." : "Pages you visit will appear here, grouped by day."} />
      ) : (
        groups.map((g) => (
          <div key={g.label} className="mt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-600">{g.label}</p>
            <div className="mt-2 overflow-hidden rounded-xl border border-ink-800">
              {g.items.map((h, i) => (
                <div
                  key={h.id}
                  className={`group flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-ink-800" : ""} transition hover:bg-ink-800`}
                >
                  <button onClick={() => openTab(h.pageKey)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm text-mist-100">{h.title}</span>
                    <span className="block truncate font-mono text-xs text-mist-600">{h.url}</span>
                  </button>
                  <span className="shrink-0 font-mono text-[11px] text-mist-600">
                    {new Date(h.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <button
                    onClick={() => deleteHistoryItem(h.id)}
                    aria-label={`Delete ${h.title} from history`}
                    className="shrink-0 rounded p-1.5 text-mist-600 opacity-0 transition group-hover:opacity-100 hover:bg-ink-700 hover:text-mist-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ---------------- bookmarks ---------------- */

export function BookmarksView() {
  const { state, openTab, removeBookmark, renameBookmark, toast } = useBrowser();
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const filtered = state.bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(q.toLowerCase()) ||
      b.url.toLowerCase().includes(q.toLowerCase())
  );
  const folders = [...new Set(filtered.map((b) => b.folder))];

  const commitRename = (id: string) => {
    if (editValue.trim()) {
      renameBookmark(id, editValue.trim());
      toast("Bookmark renamed");
    }
    setEditingId(null);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <h2 className="text-xl font-semibold text-mist-100">Bookmarks</h2>
      <div className="mt-4">
        <SearchInput value={q} onChange={setQ} placeholder="Search bookmarks" />
      </div>
      {filtered.length === 0 ? (
        <Empty icon={Bookmark} title="No bookmarks" body="Tap the bookmark icon in the toolbar on any page to save it here." />
      ) : (
        folders.map((f) => (
          <div key={f} className="mt-6">
            <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-mist-600">
              <FolderPlus size={12} /> {f}
            </p>
            <div className="mt-2 grid gap-2">
              {filtered
                .filter((b) => b.folder === f)
                .map((b) => (
                  <div key={b.id} className="group flex items-center gap-3 rounded-xl border border-ink-800 px-4 py-3 transition hover:border-ink-600">
                    <button onClick={() => openTab(b.pageKey)} className="min-w-0 flex-1 text-left">
                      {editingId === b.id ? (
                        <input
                          value={editValue}
                          autoFocus
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename(b.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          onBlur={() => commitRename(b.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Bookmark title"
                          className="w-full rounded border border-ink-600 bg-ink-900 px-2 py-1 text-sm text-mist-100"
                        />
                      ) : (
                        <>
                          <span className="block truncate text-sm font-medium text-mist-100">{b.title}</span>
                          <span className="block truncate font-mono text-xs text-mist-600">{b.url}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => { setEditingId(b.id); setEditValue(b.title); }}
                      aria-label={`Rename ${b.title}`}
                      className="shrink-0 rounded p-1.5 text-mist-600 opacity-0 transition group-hover:opacity-100 hover:bg-ink-700 hover:text-mist-100"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => { removeBookmark(b.id); toast("Bookmark removed"); }}
                      aria-label={`Delete ${b.title}`}
                      className="shrink-0 rounded p-1.5 text-mist-600 opacity-0 transition group-hover:opacity-100 hover:bg-ink-700 hover:text-mist-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ---------------- downloads ---------------- */

export function DownloadsView() {
  const { state, cancelDownload, clearCompletedDownloads, toast } = useBrowser();
  const active = state.downloads.filter((d) => d.status === "downloading");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-mist-100">Downloads</h2>
        {state.downloads.some((d) => d.status !== "downloading") && (
          <button
            onClick={() => { clearCompletedDownloads(); toast("Cleared finished downloads"); }}
            className="rounded-lg px-3 py-2 text-[13px] text-mist-500 transition hover:bg-ink-800 hover:text-mist-100"
          >
            Clear finished
          </button>
        )}
      </div>
      {state.downloads.length === 0 ? (
        <Empty icon={DownloadIcon} title="No downloads" body="Files you download while browsing will appear here with live progress." />
      ) : (
        <div className="mt-4 space-y-2">
          <AnimatePresence initial={false}>
            {state.downloads.map((d) => (
              <motion.div
                key={d.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-ink-800 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText size={18} className="shrink-0 text-mist-500" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-mist-100">{d.name}</p>
                      <p className="font-mono text-xs text-mist-600">
                        {d.size} ·{" "}
                        {d.status === "done" ? "Complete" : d.status === "cancelled" ? "Cancelled" : `${Math.round(d.progress)}%`}
                      </p>
                    </div>
                  </div>
                  {d.status === "downloading" ? (
                    <button
                      onClick={() => cancelDownload(d.id)}
                      aria-label={`Cancel download of ${d.name}`}
                      className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs text-mist-500 transition hover:bg-ink-800 hover:text-mist-100"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => toast("Files open in the system viewer on a real device")}
                      className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-mist-500 transition hover:bg-ink-800 hover:text-mist-100"
                    >
                      <ExternalLink size={13} /> Open
                    </button>
                  )}
                </div>
                {d.status === "downloading" && (
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink-700" role="progressbar" aria-valuenow={Math.round(d.progress)} aria-valuemin={0} aria-valuemax={100} aria-label={`Download progress for ${d.name}`}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "var(--accent)" }}
                      animate={{ width: `${d.progress}%` }}
                      transition={{ ease: "linear", duration: 0.2 }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {active.length > 0 && (
            <p className="pt-1 text-center font-mono text-xs text-mist-600">
              Simulated downloads — the real APK writes to device storage
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- privacy ---------------- */

function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toFixed(decimals)}
    </span>
  );
}

const BLOCKED_SAMPLE = [
  { name: "doubleclick.net", type: "Ad network", count: 214 },
  { name: "googletagmanager.com", type: "Tracker", count: 186 },
  { name: "facebook.net", type: "Tracker", count: 142 },
  { name: "hotjar.com", type: "Session recorder", count: 88 },
  { name: "criteo.com", type: "Ad network", count: 64 },
];

export function PrivacyView() {
  const { state, updateSettings, setView, toast } = useBrowser();
  const s = state.settings;
  const st = state.stats;

  const toggles = [
    { key: "adBlock" as const, label: "Block ads", desc: "Strips ad scripts and banners before they render." },
    { key: "trackerBlock" as const, label: "Block trackers", desc: "Stops fingerprinting, beacons, and cross-site cookies." },
    { key: "noPrefetch" as const, label: "No page prefetching", desc: "The single biggest battery saver. Pages load only when you ask." },
    { key: "httpsOnly" as const, label: "HTTPS-only mode", desc: "Insecure connections are upgraded or blocked." },
  ];

  const cards = [
    { icon: Eye, label: "Trackers blocked", value: <CountUp value={st.trackers} />, sub: "all time" },
    { icon: Zap, label: "Ads blocked", value: <CountUp value={st.ads} />, sub: "all time" },
    { icon: Database, label: "Data saved", value: <><CountUp value={st.dataMB} decimals={1} /> MB</>, sub: "never downloaded" },
    { icon: Battery, label: "Battery saved", value: <><CountUp value={st.batteryMin} /> min</>, sub: "of screen time" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <div className="flex items-center gap-2.5">
        <ShieldCheck size={22} style={{ color: "var(--accent)" }} aria-hidden />
        <h2 className="text-xl font-semibold text-mist-100">Privacy Report</h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-mist-500">
        Everything Aegis refused on your behalf. No account, no telemetry —
        these numbers never leave this device.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2.5">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-ink-800 bg-ink-900 p-4"
          >
            <c.icon size={17} className="text-mist-500" aria-hidden />
            <p className="mt-2.5 text-2xl font-semibold text-mist-100">{c.value}</p>
            <p className="text-[13px] text-mist-300">{c.label}</p>
            <p className="font-mono text-[11px] text-mist-600">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      <h3 className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-mist-600">
        Protection
      </h3>
      <div className="mt-2 overflow-hidden rounded-2xl border border-ink-800">
        {toggles.map((t, i) => (
          <button
            key={t.key}
            onClick={() => {
              updateSettings({ [t.key]: !s[t.key] });
              toast(`${t.label} ${!s[t.key] ? "enabled" : "disabled"}`);
            }}
            aria-pressed={s[t.key]}
            className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-ink-800 ${i > 0 ? "border-t border-ink-800" : ""}`}
          >
            <span>
              <span className="block text-sm font-medium text-mist-100">{t.label}</span>
              <span className="block text-[13px] text-mist-500">{t.desc}</span>
            </span>
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${s[t.key] ? "" : "bg-ink-600"}`}
              style={s[t.key] ? { background: "var(--accent)" } : undefined}
              aria-hidden
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${s[t.key] ? "left-[22px]" : "left-0.5"}`} />
            </span>
          </button>
        ))}
      </div>

      <h3 className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-mist-600">
        Most blocked domains
      </h3>
      <div className="mt-2 overflow-hidden rounded-2xl border border-ink-800">
        {BLOCKED_SAMPLE.map((b, i) => (
          <div key={b.name} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-ink-800" : ""}`}>
            <div>
              <p className="font-mono text-[13px] text-mist-100">{b.name}</p>
              <p className="text-xs text-mist-600">{b.type}</p>
            </div>
            <p className="font-mono text-[13px] text-mist-500">{b.count}×</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => setView("about")}
        className="mt-6 w-full rounded-xl border border-ink-700 px-4 py-3 text-sm text-mist-300 transition hover:border-mist-600 hover:text-mist-100"
      >
        Why Aegis exists — read the story
      </button>
    </div>
  );
}

/* ---------------- about ---------------- */

export function AboutView() {
  const { toast } = useBrowser();
  const openGitHub = () => {
    window.open("https://github.com/Noah-zipit/aegis", "_blank", "noopener");
  };
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-ink-950"
        style={{ background: "var(--accent)" }}
        aria-hidden
      >
        A
      </div>
      <h2 className="mt-5 text-2xl font-semibold text-mist-100">Aegis</h2>
      <p className="font-mono text-xs text-mist-600">Prototype v0 · UI/UX preview</p>

      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-mist-300">
        <p>
          Aegis is a lightweight, privacy-first browser for Android — named
          for the shield of Zeus. It exists because the modern mobile browser
          got it backwards: a quarter-gigabyte install, a process per tab,
          prefetching pages you never asked for, and an ad business riding
          shotgun.
        </p>
        <p>Aegis refuses all of that. The design principles:</p>
        <ul className="space-y-2">
          {[
            ["Small", "A ~15MB install. The engine is the system WebView — already on your phone, already updated."],
            ["Private", "Tracker and ad blocking built in, not bolted on. Zero telemetry, zero account."],
            ["Thrifty", "No page prefetching, frozen background tabs. Your battery is not a resource to mine."],
            ["Yours", "On-device AI that reads the page you're on — in airplane mode. Nothing leaves the phone."],
          ].map(([t, b]) => (
            <li key={t} className="flex gap-3">
              <span className="font-semibold text-mist-100">{t}.</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <p className="text-mist-500">
          This page is a clickable UI prototype of the browser&apos;s
          interface. The real APK — Kotlin, WebView, embedded on-device
          inference — is being built next.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-2.5 text-center">
        {[
          ["~15 MB", "install size"],
          ["0", "trackers phoned home"],
          ["100%", "on-device AI"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-2xl border border-ink-800 bg-ink-900 p-4">
            <p className="text-xl font-semibold text-mist-100">{v}</p>
            <p className="mt-0.5 text-xs text-mist-500">{l}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={openGitHub}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:opacity-90"
          style={{ background: "var(--accent)" }}
        >
          <ExternalLink size={15} /> GitHub repository
        </button>
        <button
          onClick={() => toast("Aegis is MIT licensed — fork it, improve it")}
          className="rounded-lg border border-ink-600 px-4 py-2.5 text-sm text-mist-300 transition hover:border-mist-600 hover:text-mist-100"
        >
          MIT License
        </button>
      </div>
      <p className="mt-8 font-mono text-xs text-mist-600">
        Built by Ashar Qaisar · Gujranwala, Pakistan
      </p>
    </div>
  );
}

/* ---------------- settings ---------------- */

const ACCENTS = [
  { name: "Amber", value: "#d9a441" },
  { name: "Teal", value: "#4cc9b0" },
  { name: "Steel", value: "#6b9bd1" },
  { name: "Clay", value: "#d17a6b" },
];

const ENGINES = ["Aegis", "DuckDuckGo", "Brave", "Google"];

export function SettingsView() {
  const { state, updateSettings, setView, resetAll, toast } = useBrowser();
  const s = state.settings;
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <h2 className="text-xl font-semibold text-mist-100">Settings</h2>

      <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-mist-600">
        Appearance
      </h3>
      <div className="mt-2 rounded-2xl border border-ink-800 p-4">
        <p className="text-sm font-medium text-mist-100">Accent color</p>
        <p className="text-[13px] text-mist-500">Dark minimal stays — pick the one highlight.</p>
        <div className="mt-3 flex gap-2.5">
          {ACCENTS.map((a) => (
            <button
              key={a.value}
              onClick={() => { updateSettings({ accent: a.value }); toast(`Accent: ${a.name}`); }}
              aria-label={`Accent color ${a.name}`}
              aria-pressed={s.accent === a.value}
              title={a.name}
              className={`h-10 w-10 rounded-full transition ${s.accent === a.value ? "ring-2 ring-mist-100 ring-offset-2 ring-offset-ink-900" : "hover:scale-105"}`}
              style={{ background: a.value }}
            />
          ))}
        </div>
      </div>

      <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-mist-600">
        Search
      </h3>
      <div className="mt-2 rounded-2xl border border-ink-800 p-4">
        <p className="text-sm font-medium text-mist-100">Default search engine</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {ENGINES.map((e) => (
            <button
              key={e}
              onClick={() => { updateSettings({ searchEngine: e }); toast(`Search engine: ${e}`); }}
              aria-pressed={s.searchEngine === e}
              className={`rounded-xl border px-4 py-2.5 text-sm transition ${
                s.searchEngine === e
                  ? "border-transparent font-medium text-mist-100"
                  : "border-ink-700 text-mist-500 hover:border-ink-600 hover:text-mist-300"
              }`}
              style={s.searchEngine === e ? { background: "var(--accent-soft)", color: "var(--accent)" } : undefined}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-mist-600">
        Privacy
      </h3>
      <div className="mt-2 rounded-2xl border border-ink-800 p-4">
        <p className="text-sm text-mist-500">
          Tracker blocking, ad blocking, prefetching and HTTPS-only are
          managed in the Privacy Report.
        </p>
        <button
          onClick={() => setView("privacy")}
          className="mt-3 rounded-lg border border-ink-600 px-4 py-2 text-sm text-mist-300 transition hover:border-mist-600 hover:text-mist-100"
        >
          Open Privacy Report
        </button>
      </div>

      <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-mist-600">
        Prototype
      </h3>
      <div className="mt-2 rounded-2xl border border-ink-800 p-4">
        <p className="text-sm font-medium text-mist-100">Reset prototype data</p>
        <p className="text-[13px] text-mist-500">Clears tabs, history, bookmarks, downloads and stats stored in this browser.</p>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="mt-3 rounded-lg border border-red-900 px-4 py-2 text-sm text-red-400 transition hover:border-red-700"
          >
            Reset everything
          </button>
        ) : (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => { resetAll(); setConfirmReset(false); toast("Prototype reset"); }}
              className="rounded-lg bg-red-900/40 border border-red-800 px-4 py-2 text-sm text-red-300 transition hover:bg-red-900/60"
            >
              Yes, reset
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="rounded-lg border border-ink-600 px-4 py-2 text-sm text-mist-300 transition hover:text-mist-100"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => setView("about" as ViewKey)}
        className="mt-6 w-full rounded-xl border border-ink-700 px-4 py-3 text-sm text-mist-300 transition hover:border-mist-600 hover:text-mist-100"
      >
        About Aegis
      </button>
    </div>
  );
}
