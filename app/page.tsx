"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { BrowserProvider, useBrowser, type ViewKey } from "../lib/store";
import { PageRenderer } from "../lib/demo";
import Sidebar from "../components/Sidebar";
import { DesktopToolbar, MobileToolbar, ViewTopBar, VIEW_NAMES } from "../components/Toolbar";
import CommandBar from "../components/CommandBar";
import TabOverview from "../components/TabOverview";
import NewTab from "../components/NewTab";
import {
  HistoryView,
  BookmarksView,
  DownloadsView,
  PrivacyView,
  AboutView,
  SettingsView,
} from "../components/views";
import { Menu } from "lucide-react";
import { ShieldMark } from "../components/ShieldMark";

function Toasts() {
  const { toasts } = useBrowser();
  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-8" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-ink-600 bg-ink-800 px-4 py-2.5 text-sm text-mist-100"
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 md:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
            className="fixed bottom-0 left-0 top-0 z-[61] w-72 md:hidden [&>aside]:h-full [&>aside]:w-full"
          >
            <Sidebar />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Content() {
  const { view, activeTab } = useBrowser();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const renderView = (v: ViewKey) => {
    switch (v) {
      case "history": return <HistoryView />;
      case "bookmarks": return <BookmarksView />;
      case "downloads": return <DownloadsView />;
      case "privacy": return <PrivacyView />;
      case "about": return <AboutView />;
      case "settings": return <SettingsView />;
    }
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-ink-950">
      {/* desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* mobile top strip */}
        <div className="flex items-center gap-1 border-b border-ink-600 px-2 py-1.5 md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg p-2.5 text-mist-300 transition active:bg-ink-800"
          >
            <Menu size={20} />
          </button>
          <div
            className="logo-mark flex h-7 w-7 items-center justify-center rounded-lg"
            aria-hidden
          >
            <ShieldMark size={17} />
          </div>
          <p className="text-sm font-semibold text-mist-100">Aegis</p>
        </div>

        {view === null ? (
          <>
            <DesktopToolbar />
            <main className="min-h-0 flex-1 p-0 md:p-2 md:pl-0" aria-label="Page content">
              <div className="h-full overflow-y-auto bg-ink-950 md:rounded-xl md:border md:border-ink-600 md:bg-ink-900">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab ? activeTab.pageKey + activeTab.idx : "empty"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="min-h-full"
                  >
                    {activeTab ? (
                      activeTab.pageKey === "newtab" ? (
                        <NewTab />
                      ) : (
                        <PageRenderer pageKey={activeTab.pageKey} />
                      )
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                        <p className="text-lg font-semibold text-mist-100">No tabs open</p>
                        <p className="mt-1 text-sm text-mist-500">
                          Open a tab from the sidebar to start browsing.
                        </p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>
            <MobileToolbar />
          </>
        ) : (
          <>
            <ViewTopBar title={VIEW_NAMES[view]} />
            <main className="min-h-0 flex-1 overflow-y-auto" aria-label={VIEW_NAMES[view]}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {renderView(view)}
                </motion.div>
              </AnimatePresence>
            </main>
          </>
        )}
      </div>

      <CommandBar />
      <TabOverview />
      <Toasts />
    </div>
  );
}

export default function Page() {
  return (
    <BrowserProvider>
      <Content />
    </BrowserProvider>
  );
}
