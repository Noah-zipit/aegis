"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  KeyRound,
  Loader2,
  RotateCw,
  SearchX,
} from "lucide-react";
import { useBrowser, searchUrl } from "../lib/store";
import { braveWebSearch, type BraveWebResult } from "../lib/brave";

const DOT_POOL = ["#ff5757", "#4cc9b0", "#6b9bd1", "#9c9c9d", "#c9c9d1"];

function dotForHost(host: string): string {
  let h = 0;
  for (let i = 0; i < host.length; i++) h = (h * 31 + host.charCodeAt(i)) >>> 0;
  return DOT_POOL[h % DOT_POOL.length];
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function ResultCard({ r }: { r: BraveWebResult }) {
  const { visitExternal } = useBrowser();
  const host = hostOf(r.url);
  return (
    <button
      onClick={() => visitExternal(r.url, r.title)}
      className="group block w-full rounded-xl border border-ink-600 bg-ink-900 p-4 text-left transition hover:border-mist-600"
    >
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: dotForHost(host) }}
          aria-hidden
        />
        <span className="truncate font-mono text-xs text-mist-500">{host}</span>
        <ExternalLink
          size={12}
          className="ml-auto shrink-0 text-mist-600 opacity-0 transition group-hover:opacity-100"
          aria-hidden
        />
      </div>
      <p className="mt-1.5 text-[15px] font-medium leading-snug text-mist-100 group-hover:underline">
        {r.title}
      </p>
      {r.description && (
        <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-mist-400">
          {r.description}
        </p>
      )}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3" aria-label="Loading results">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-ink-600 bg-ink-900 p-4"
        >
          <div className="h-3 w-32 rounded bg-ink-700" />
          <div className="mt-2 h-4 w-3/4 rounded bg-ink-700" />
          <div className="mt-2 h-3 w-full rounded bg-ink-700" />
        </div>
      ))}
    </div>
  );
}

export default function SearchResults({ query }: { query: string }) {
  const { state, visitExternal, setView } = useBrowser();
  const apiKey = state.settings.braveApiKey.trim();
  const [results, setResults] = useState<BraveWebResult[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  // NOTE: PageRenderer mounts this with key={pageKey}, so a new search always
  // starts from a clean "loading" state — the effect below only performs the
  // async fetch and never sets state synchronously.
  useEffect(() => {
    if (!apiKey) return; // no-key UI renders directly from apiKey
    let cancelled = false;
    braveWebSearch(query, apiKey, { count: 10, offset: 0 })
      .then(({ results: page }) => {
        if (cancelled) return;
        setResults(page);
        setOffset(0);
        setStatus("ready");
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setErrorMsg(e.message || "Search failed.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [query, apiKey, retryTick]);

  const loadMore = () => {
    if (loadingMore || !apiKey) return;
    setLoadingMore(true);
    const next = offset + 10;
    braveWebSearch(query, apiKey, { count: 10, offset: next })
      .then(({ results: page }) => {
        setResults((prev) => [...prev, ...page]);
        setOffset(next);
      })
      .catch(() => {
        /* keep existing results; the list simply stops growing */
      })
      .finally(() => setLoadingMore(false));
  };

  const openInGoogle = () => {
    visitExternal(searchUrl(query, "Google"), `${query} — Google`);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-600">
        Search results
      </p>
      <h2 className="mt-1 text-xl font-semibold text-mist-100">
        &ldquo;{query}&rdquo;
      </h2>
      <p className="mt-1 text-xs text-mist-600">
        Rendered inside Aegis · via Brave Search API
      </p>

      <div className="mt-6">
        {!apiKey ? (
          <div className="rounded-xl border border-ink-600 bg-ink-900 p-6 text-center">
            <KeyRound size={28} className="mx-auto text-mist-500" aria-hidden />
            <p className="mt-3 text-[15px] font-medium text-mist-100">
              In-app results need a Brave Search API key
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mist-400">
              Add your free key in Settings → Search (2,000 searches/month,
              free forever) and results will render right here, inside Aegis.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setView("settings")}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                style={{ background: "var(--brand-gradient)" }}
              >
                Add API key in Settings
              </button>
              <a
                href="https://brave.com/search/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-ink-600 px-4 py-2 text-sm text-mist-300 transition hover:border-mist-600 hover:text-mist-100"
              >
                Get a free key
              </a>
              <button
                onClick={openInGoogle}
                className="rounded-lg border border-ink-600 px-4 py-2 text-sm text-mist-300 transition hover:border-mist-600 hover:text-mist-100"
              >
                Open in Google instead
              </button>
            </div>
          </div>
        ) : (
          <>
            {status === "loading" && <Skeleton />}

            {status === "error" && (
          <div className="rounded-xl border border-ink-600 bg-ink-900 p-6 text-center">
            <SearchX size={28} className="mx-auto text-mist-500" aria-hidden />
            <p className="mt-3 text-[15px] font-medium text-mist-100">
              Couldn&apos;t reach Brave Search
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mist-400">
              {errorMsg} Your key may be wrong, expired, or out of quota —
              nothing was faked, these are the real results failing to load.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setRetryTick((t) => t + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                style={{ background: "var(--brand-gradient)" }}
              >
                <RotateCw size={14} aria-hidden /> Retry
              </button>
              <button
                onClick={() => setView("settings")}
                className="rounded-lg border border-ink-600 px-4 py-2 text-sm text-mist-300 transition hover:border-mist-600 hover:text-mist-100"
              >
                Check API key
              </button>
              <button
                onClick={openInGoogle}
                className="rounded-lg border border-ink-600 px-4 py-2 text-sm text-mist-300 transition hover:border-mist-600 hover:text-mist-100"
              >
                Open in Google instead
              </button>
            </div>
          </div>
        )}

        {status === "ready" && (
          <>
            {results.length === 0 ? (
              <div className="rounded-xl border border-ink-600 bg-ink-900 p-6 text-center">
                <SearchX size={28} className="mx-auto text-mist-500" aria-hidden />
                <p className="mt-3 text-[15px] font-medium text-mist-100">
                  No results for &ldquo;{query}&rdquo;
                </p>
                <p className="mt-2 text-sm text-mist-400">
                  Try different words, or open it in Google instead.
                </p>
                <button
                  onClick={openInGoogle}
                  className="mt-4 rounded-lg border border-ink-600 px-4 py-2 text-sm text-mist-300 transition hover:border-mist-600 hover:text-mist-100"
                >
                  Open in Google instead
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((r) => (
                  <ResultCard key={r.url} r={r} />
                ))}
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink-600 px-4 py-3 text-sm text-mist-300 transition hover:border-mist-600 hover:text-mist-100 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 size={16} className="animate-spin" aria-hidden />
                  ) : null}
                  {loadingMore ? "Loading…" : "More results"}
                </button>
              </div>
            )}
          </>
        )}
      </>
      )}
      </div>
    </div>
  );
}
