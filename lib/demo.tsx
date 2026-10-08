"use client";

import { motion } from "framer-motion";
import { Download, Bell, ArrowRight, ShieldCheck, Zap, Eye } from "lucide-react";
import { useBrowser } from "./store";
import SearchResults from "../components/SearchResults";
import AIChat from "../components/AIChat";

/* ------------------------------------------------------------------ */
/*  Simulated websites. In this prototype real external sites are NOT  */
/*  loaded in iframes — real sites send X-Frame-Options / CSP headers  */
/*  that block embedding. These built-in demo pages stand in for them. */
/* ------------------------------------------------------------------ */

export function MeridianArticle() {
  const { addDownload, toast } = useBrowser();
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-2xl px-6 py-12"
    >
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-mist-500">
        The Meridian — Technology
      </p>
      <h1 className="mt-4 text-3xl font-semibold leading-tight text-mist-100 md:text-4xl">
        The quiet rebellion against the 250MB browser
      </h1>
      <div className="mt-4 flex items-center gap-3 text-sm text-mist-500">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-mist-300">
          MK
        </span>
        <span>Mara Kessler</span>
        <span aria-hidden>·</span>
        <span>8 min read</span>
      </div>
      <div className="my-8 h-px bg-ink-700" />
      <div className="space-y-5 text-[15px] leading-relaxed text-mist-300">
        <p>
          Somewhere along the way, the web browser — the single most-used
          application on every phone — became the heaviest thing on it. The
          average flagship browser install now ships at a quarter of a
          gigabyte, spawns a process per tab, and treats your battery like a
          suggestion.
        </p>
        <p>
          Users noticed. In benchmark after benchmark, the default browser
          ranks among the worst offenders for battery drain on Android, with
          page preloading and background sync quietly burning through charge
          while the phone sits in a pocket. Memory tells the same story:
          heavy research sessions can push well past what a mid-range phone
          can comfortably hold, and tabs start reloading — losing your place,
          your form data, your patience.
        </p>
        <h2 className="pt-2 text-xl font-semibold text-mist-100">
          The indie answer
        </h2>
        <p>
          A small wave of independent browsers is answering with a different
          philosophy: do less, beautifully. One developer&apos;s two-megabyte
          browser proved the point years ago — millions of downloads for an
          app a fraction of Chrome&apos;s size, with ad-blocking the giant
          still refuses to ship on mobile.
        </p>
        <p>
          The newest entrants go further. Tracker blocking is table stakes
          now; the differentiator is what a browser refuses to do. No
          prefetching pages you never asked for. No phoning home with
          telemetry. No account required to sync nothing to nobody.
        </p>
        <h2 className="pt-2 text-xl font-semibold text-mist-100">
          What comes next
        </h2>
        <p>
          The most interesting prototypes pair that restraint with on-device
          intelligence — summarising the page you&apos;re reading without the
          page ever leaving your phone. If the last decade was the browser
          getting bigger, the next one might finally be about it getting
          smaller — and smarter about what it keeps to itself.
        </p>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <button
          onClick={() => {
            addDownload("meridian-quiet-rebellion.pdf", "2.4 MB");
            toast("Downloading article as PDF");
          }}
          className="flex items-center gap-2 rounded-lg bg-ink-700 px-4 py-2.5 text-sm font-medium text-mist-100 transition hover:bg-ink-600"
        >
          <Download size={16} /> Save as PDF
        </button>
        <button
          onClick={() => toast("You will be notified of new Technology stories")}
          className="flex items-center gap-2 rounded-lg border border-ink-600 px-4 py-2.5 text-sm font-medium text-mist-300 transition hover:border-mist-600 hover:text-mist-100"
        >
          <Bell size={16} /> Follow topic
        </button>
      </div>
    </motion.article>
  );
}

export function AuraProduct() {
  const { addDownload, toast } = useBrowser();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-4xl px-6 py-12"
    >
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-mist-500">
        Aura Audio
      </p>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-xl bg-ink-800">
          <div className="relative">
            <div
              className="h-44 w-44 rounded-full border-[10px] border-ink-600"
              aria-hidden
            />
            <div
              className="absolute inset-0 flex items-center justify-center"
              aria-hidden
            >
              <div className="h-20 w-20 rounded-full bg-ink-700" />
            </div>
            <span className="sr-only">
              Product render of the Aura One wireless headphones
            </span>
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-mist-100">Aura One</h1>
          <p className="mt-2 text-sm text-mist-500">
            Wireless over-ear headphones
          </p>
          <p className="mt-4 text-2xl font-semibold text-mist-100">$289</p>
          <p className="mt-4 text-[15px] leading-relaxed text-mist-300">
            Forty hours of listening, studio-tuned 40mm drivers, and memory
            foam that forgets it&apos;s there. No app required, no account,
            no firmware nagging — it just plays.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-mist-300">
            {[
              "40-hour battery, 10-min charge = 5 hours",
              "Adaptive noise cancelling",
              "Multipoint Bluetooth 5.4",
              "Folds flat, 254g",
            ].map((s) => (
              <li key={s} className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--accent)" }}
                  aria-hidden
                />
                {s}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => toast("Aura One added to your bag")}
              className="flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-ink-950 transition hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              Add to bag <ArrowRight size={16} />
            </button>
            <button
              onClick={() => {
                addDownload("aura-one-spec-sheet.pdf", "1.1 MB");
                toast("Downloading spec sheet");
              }}
              className="flex items-center gap-2 rounded-lg border border-ink-600 px-5 py-3 text-sm font-medium text-mist-300 transition hover:border-mist-600 hover:text-mist-100"
            >
              <Download size={16} /> Spec sheet
            </button>
          </div>
        </div>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Zap,
            title: "Instant pairing",
            body: "Open the case near your phone and it simply connects. Every time.",
          },
          {
            icon: ShieldCheck,
            title: "Private by design",
            body: "No companion app phoning home. Your listening stays yours.",
          },
          {
            icon: Eye,
            title: "Hear everything",
            body: "A soundstage wide enough to place every instrument in the room.",
          },
        ].map((f) => (
          <div key={f.title} className="rounded-xl bg-ink-800 p-6">
            <f.icon size={20} style={{ color: "var(--accent)" }} />
            <h3 className="mt-3 font-semibold text-mist-100">{f.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-mist-500">
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function FoundryStudio() {
  const { toast } = useBrowser();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-4xl px-6 py-12"
    >
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-mist-500">
        Foundry — Brand & Digital Studio
      </p>
      <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-mist-100 md:text-5xl">
        We make companies impossible to ignore.
      </h1>
      <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-mist-500">
        Identity, websites, and interfaces for teams that would rather be
        remembered than merely seen.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {[
          { name: "Halcyon Bank", tag: "Identity / Web", tone: "#ff5757" },
          { name: "Northwind Air", tag: "Brand / Campaign", tone: "#4cc9b0" },
          { name: "Kiln Coffee", tag: "Packaging / Web", tone: "#6b9bd1" },
          { name: "Vesper Hotels", tag: "Digital / Motion", tone: "#d17a6b" },
        ].map((p) => (
          <button
            key={p.name}
            onClick={() => toast(`${p.name} case study opens in the full site`)}
            className="group rounded-xl bg-ink-800 p-6 text-left transition hover:bg-ink-750"
          >
            <div
              className="h-28 rounded-xl"
              style={{ background: `${p.tone}1f` }}
              aria-hidden
            />
            <h3 className="mt-4 font-semibold text-mist-100">{p.name}</h3>
            <p className="text-sm text-mist-500">{p.tag}</p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/* Registry: pageKey -> rendered component */
export function PageRenderer({ pageKey }: { pageKey: string }) {
  if (pageKey === "newtab") return null; // handled by NewTab component
  if (pageKey === "ai") return <AIChat key="ai" />;
  if (pageKey === "demo:meridian") return <MeridianArticle />;
  if (pageKey === "demo:aura") return <AuraProduct />;
  if (pageKey === "demo:foundry") return <FoundryStudio />;
  if (pageKey.startsWith("search:"))
    return (
      <SearchResults
        key={pageKey}
        query={decodeURIComponent(pageKey.slice(7))}
      />
    );
  return null;
}
