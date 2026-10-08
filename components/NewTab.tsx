"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useBrowser } from "../lib/store";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const t0 = window.setTimeout(() => setNow(new Date()), 0);
    const t = setInterval(() => setNow(new Date()), 10000);
    return () => {
      window.clearTimeout(t0);
      clearInterval(t);
    };
  }, []);
  return now;
}

const QUICK_LINKS = [
  { label: "The Meridian", sub: "meridian.press", pageKey: "demo:meridian", dot: "#ff5757" },
  { label: "Aura Audio", sub: "aura.audio", pageKey: "demo:aura", dot: "#4cc9b0" },
  { label: "Foundry", sub: "foundry.studio", pageKey: "demo:foundry", dot: "#6b9bd1" },
];

export default function NewTab() {
  const { openTab, setView, state } = useBrowser();
  const now = useClock();
  const time = now
    ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--:--";
  const date = now
    ? now.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "";
  const recent = state.history.slice(0, 4);

  return (
    <div className="noise-bg flex h-full flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex w-full max-w-md flex-col items-center"
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-mist-600">
          {date}
        </p>
        <p className="mt-2 text-6xl font-semibold tabular-nums text-mist-100">
          {time}
        </p>

        <div className="mt-10 grid w-full grid-cols-3 gap-2.5">
          {QUICK_LINKS.map((l, i) => (
            <motion.button
              key={l.pageKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              onClick={() => openTab(l.pageKey)}
              className="rounded-xl border border-ink-600 bg-ink-900/80 p-4 text-left transition hover:border-ink-600 hover:bg-ink-800"
            >
              <span
                className="mb-2.5 block h-2 w-2 rounded-full"
                style={{ background: l.dot }}
                aria-hidden
              />
              <span className="block truncate text-[13px] font-medium text-mist-100">
                {l.label}
              </span>
              <span className="block truncate font-mono text-[11px] text-mist-600">
                {l.sub}
              </span>
            </motion.button>
          ))}
        </div>

        {recent.length > 0 && (
          <div className="mt-8 w-full">
            <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-mist-600">
              <Clock size={12} /> Recently visited
            </p>
            <div className="space-y-1">
              {recent.map((h) => (
                <button
                  key={h.id}
                  onClick={() => openTab(h.pageKey)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-ink-800"
                >
                  <span className="truncate text-[13px] text-mist-300">
                    {h.title}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-mist-600">
                    {new Date(h.ts).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setView("privacy")}
          className="mt-8 text-[13px] text-mist-600 transition hover:text-mist-300"
        >
          Shield is up — see what Aegis blocked today
        </button>
      </motion.div>
    </div>
  );
}
