"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, X } from "lucide-react";
import { useBrowser } from "../lib/store";

export default function ShieldPanel({ align = "below" }: { align?: "below" | "above" }) {
  const { shieldOpen, setShieldOpen, activeTab, state, updateSettings, toast } =
    useBrowser();
  const s = state.settings;

  const rows = [
    {
      key: "adBlock" as const,
      label: "Block ads",
      desc: "Strips ad scripts and banners before they load.",
      value: s.adBlock,
    },
    {
      key: "trackerBlock" as const,
      label: "Block trackers",
      desc: "Stops cross-site fingerprinting and analytics beacons.",
      value: s.trackerBlock,
    },
    {
      key: "noPrefetch" as const,
      label: "No page prefetching",
      desc: "Never loads pages you didn't ask for. Saves battery and data.",
      value: s.noPrefetch,
    },
    {
      key: "httpsOnly" as const,
      label: "HTTPS-only mode",
      desc: "Upgrades insecure connections automatically.",
      value: s.httpsOnly,
    },
  ];

  return (
    <AnimatePresence>
      {shieldOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={`absolute z-50 w-80 overflow-hidden rounded-2xl border border-ink-600 bg-ink-850 ${
            align === "below" ? "right-2 top-full mt-1.5 md:right-3" : "bottom-full mb-1.5 right-2"
          }`}
          role="dialog"
          aria-label="Privacy shield for this site"
        >
          <div className="flex items-center justify-between border-b border-ink-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} style={{ color: "var(--accent)" }} aria-hidden />
              <p className="text-sm font-semibold text-mist-100">Shield is up</p>
            </div>
            <button
              onClick={() => setShieldOpen(false)}
              aria-label="Close shield panel"
              className="rounded p-1 text-mist-500 hover:bg-ink-700 hover:text-mist-100"
            >
              <X size={15} />
            </button>
          </div>
          <p className="truncate px-4 pt-3 font-mono text-xs text-mist-500">
            {activeTab?.url ?? "aegis:newtab"}
          </p>
          <div className="grid grid-cols-2 gap-2 px-4 py-3">
            <div className="rounded-xl bg-ink-800 p-3 text-center">
              <p className="text-xl font-semibold text-mist-100">
                {7 + ((activeTab?.id.length ?? 3) % 5)}
              </p>
              <p className="text-[11px] text-mist-500">trackers blocked</p>
            </div>
            <div className="rounded-xl bg-ink-800 p-3 text-center">
              <p className="text-xl font-semibold text-mist-100">
                {4 + ((activeTab?.id.length ?? 2) % 4)}
              </p>
              <p className="text-[11px] text-mist-500">ads blocked</p>
            </div>
          </div>
          <div className="space-y-1 px-2 pb-2">
            {rows.map((r) => (
              <button
                key={r.key}
                onClick={() => {
                  updateSettings({ [r.key]: !r.value });
                  toast(`${r.label} ${!r.value ? "enabled" : "disabled"}`);
                }}
                aria-pressed={r.value}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-ink-800"
              >
                <span>
                  <span className="block text-[13px] font-medium text-mist-100">
                    {r.label}
                  </span>
                  <span className="block text-xs text-mist-500">{r.desc}</span>
                </span>
                <span
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    r.value ? "" : "bg-ink-600"
                  }`}
                  style={r.value ? { background: "var(--accent)" } : undefined}
                  aria-hidden
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                      r.value ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
