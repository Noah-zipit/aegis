"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useBrowser } from "../lib/store";

export default function TabOverview() {
  const {
    overviewOpen, setOverviewOpen, activeSpace, activeTab,
    switchTab, closeTab, openTab,
  } = useBrowser();

  return (
    <AnimatePresence>
      {overviewOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[70] bg-black/70 p-4 pt-16 md:p-10 md:pt-20"
          onClick={() => setOverviewOpen(false)}
          role="dialog"
          aria-label="Tab overview"
        >
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mx-auto max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-mist-100">
                {activeSpace.name} · {activeSpace.tabs.length} tabs
              </h2>
              <button
                onClick={() => setOverviewOpen(false)}
                aria-label="Close tab overview"
                className="rounded-lg p-2 text-mist-500 hover:bg-ink-800 hover:text-mist-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {activeSpace.tabs.map((t, i) => (
                <motion.button
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  onClick={() => {
                    switchTab(t.id);
                    setOverviewOpen(false);
                  }}
                  className={`group relative aspect-[4/3] rounded-2xl border p-3 text-left transition ${
                    t.id === activeTab?.id
                      ? "border-ink-600 bg-ink-800"
                      : "border-ink-800 bg-ink-900 hover:border-ink-600"
                  }`}
                >
                  <span
                    className="mb-2 block h-2 w-2 rounded-full"
                    style={{ background: t.dot }}
                    aria-hidden
                  />
                  <span className="line-clamp-2 block text-[13px] font-medium text-mist-100">
                    {t.title}
                  </span>
                  <span className="mt-1 block truncate font-mono text-[11px] text-mist-600">
                    {t.url}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Close tab ${t.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(t.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        closeTab(t.id);
                      }
                    }}
                    className="absolute right-2 top-2 rounded p-1 text-mist-600 opacity-0 transition group-hover:opacity-100 hover:bg-ink-700 hover:text-mist-100"
                  >
                    <X size={14} />
                  </span>
                </motion.button>
              ))}
              <button
                onClick={() => {
                  openTab("newtab");
                  setOverviewOpen(false);
                }}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-600 text-mist-500 transition hover:border-mist-600 hover:text-mist-300"
              >
                <Plus size={20} />
                <span className="text-sm">New tab</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
