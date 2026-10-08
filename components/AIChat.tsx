"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Download,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  AI_MODEL_LABEL,
  AI_MODEL_SIZE_MB,
  AI_SYSTEM_PROMPT,
  beginGeneration,
  chatCompletion,
  getEngine,
  hasWebAssembly,
  isEngineReady,
  stopGeneration,
  type Wllama,
  type WllamaChatMessage,
} from "../lib/ai-engine";
import { useKeyboardHeight } from "../lib/useKeyboard";

/* ------------------------------------------------------------------ */
/*  Aegis AI — on-device chat. The SmolLM2-360M GGUF downloads once    */
/*  (~218MB), caches in the browser, then runs fully offline on the    */
/*  phone's CPU via wllama (llama.cpp → WASM). No WebGPU, no API      */
/*  keys, no server, no fake responses.                               */
/* ------------------------------------------------------------------ */

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

type Phase = "checking" | "downloading" | "ready" | "error";

const LS_KEY = "aegis-ai-chat-v1";

/* Module-level so the react-hooks/purity rule doesn't flag Date.now()
   inside the component body. */
function makeMsg(role: ChatMsg["role"], content: string): ChatMsg {
  return { role, content, ts: Date.now() };
}

function loadHistory(): ChatMsg[] {  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMsg[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
    );
  } catch {
    return [];
  }
}

export default function AIChat() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>(loadHistory);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const engineRef = useRef<Wllama | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const kb = useKeyboardHeight();

  /* Lazily boot the engine on first open. */
  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      if (!hasWebAssembly()) {
        setErrorMsg(
          "This browser doesn't support WebAssembly, which the on-device engine needs."
        );
        setPhase("error");
        return;
      }
      if (isEngineReady()) {
        try {
          engineRef.current = await getEngine(() => {});
          if (!cancelled) setPhase("ready");
        } catch (e) {
          if (!cancelled) {
            setErrorMsg(e instanceof Error ? e.message : "Engine failed to start.");
            setPhase("error");
          }
        }
        return;
      }
      setPhase("downloading");
      try {
        const engine = await getEngine((fraction) => {
          if (!cancelled) setProgress(fraction);
        });
        engineRef.current = engine;
        if (!cancelled) setPhase("ready");
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(
            e instanceof Error ? e.message : "The model could not be loaded."
          );
          setPhase("error");
        }
      }
    };
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Persist chat history. */
  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(messages));
    } catch {
      /* storage full or unavailable — chat still works for the session */
    }
  }, [messages]);

  /* Keep the latest message in view. */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming, phase]);

  const send = async (raw: string) => {
    const content = raw.trim();
    const wllama = engineRef.current;
    if (!content || streaming || phase !== "ready" || !wllama) return;
    const userMsg = makeMsg("user", content);
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setMessages((m) => [...m, makeMsg("assistant", "")]);
    const signal = beginGeneration();
    try {
      const chatMessages: WllamaChatMessage[] = [
        { role: "system", content: AI_SYSTEM_PROMPT },
        ...next.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];
      const full = await chatCompletion(
        wllama,
        chatMessages,
        (snapshot) => {
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { ...copy[copy.length - 1], content: snapshot };
            return copy;
          });
        },
        signal
      );
      if (!full.trim()) throw new Error("empty response");
    } catch (e) {
      const aborted =
        e instanceof Error &&
        (e.name === "AbortError" || e.name === "WllamaAbortError");
      if (!aborted) {
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last && last.role === "assistant" && !last.content.trim()) {
            copy[copy.length - 1] = {
              ...last,
              content: "Couldn't generate a reply — try again.",
            };
          }
          return copy;
        });
      }
    } finally {
      setStreaming(false);
    }
  };

  const retryBoot = () => {
    setErrorMsg("");
    setProgress(0);
    setPhase("checking");
    // Re-run the boot effect.
    if (!hasWebAssembly()) {
      setErrorMsg(
        "This browser doesn't support WebAssembly, which the on-device engine needs."
      );
      setPhase("error");
      return;
    }
    setPhase("downloading");
    getEngine((fraction) => setProgress(fraction))
      .then((engine) => {
        engineRef.current = engine;
        setPhase("ready");
      })
      .catch((e: unknown) => {
        setErrorMsg(e instanceof Error ? e.message : "The model could not be loaded.");
        setPhase("error");
      });
  };

  const clearChat = () => {
    setMessages([]);
    try {
      window.localStorage.removeItem(LS_KEY);
    } catch {
      /* noop */
    }
  };

  const pct = Math.round(progress * 100);
  const mbDone = Math.round(progress * AI_MODEL_SIZE_MB);

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-ink-600 px-4 py-3">
        <span
          className="logo-mark flex h-8 w-8 items-center justify-center rounded-lg text-mist-100"
          aria-hidden
        >
          <Sparkles size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-mist-100">Aegis AI</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-600">
            On-device · {AI_MODEL_LABEL}
          </p>
        </div>
        {messages.length > 0 && phase === "ready" && (
          <button
            onClick={clearChat}
            aria-label="Clear chat history"
            className="rounded-lg p-2 text-mist-600 transition hover:bg-ink-800 hover:text-mist-300"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* body */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {phase === "checking" && (
          <Centered>
            <PulseDots />
            <p className="mt-4 text-sm text-mist-500">Waking up the on-device engine…</p>
          </Centered>
        )}

        {phase === "downloading" && (
          <Centered>
            <span className="logo-mark flex h-12 w-12 items-center justify-center rounded-2xl text-mist-100">
              <Download size={22} aria-hidden />
            </span>
            <p className="mt-4 text-sm font-medium text-mist-100">
              Downloading the AI model
            </p>
            <p className="mt-1 font-mono text-xs text-mist-500">
              ~{mbDone} / ~{AI_MODEL_SIZE_MB} MB · {pct}%
            </p>
            <div
              className="mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-ink-700"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Model download progress"
            >
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${pct}%`, background: "var(--brand-gradient)" }}
              />
            </div>
            <p className="mt-3 max-w-xs text-center text-[13px] leading-relaxed text-mist-500">
              One-time download — after this, Aegis AI works with zero
              connection. Keep this tab open.
            </p>
          </Centered>
        )}

        {phase === "error" && (
          <Centered>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-ink-600 bg-ink-800 text-mist-400">
              <TriangleAlert size={22} aria-hidden />
            </span>
            <p className="mt-4 max-w-xs text-center text-sm font-medium text-mist-100">
              The model couldn&apos;t load
            </p>
            <p className="mt-1.5 max-w-xs break-words text-center font-mono text-[11px] leading-relaxed text-mist-600">
              {errorMsg || "Unknown error."}
            </p>
            <button
              onClick={retryBoot}
              className="mt-4 flex items-center gap-2 rounded-lg border border-ink-600 px-4 py-2 text-sm font-medium text-mist-300 transition hover:border-mist-600 hover:text-mist-100"
            >
              <RotateCcw size={14} /> Try again
            </button>
          </Centered>
        )}

        {phase === "ready" && (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-5">
            {messages.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="logo-mark flex h-12 w-12 items-center justify-center rounded-2xl text-mist-100">
                  <Sparkles size={22} aria-hidden />
                </span>
                <p className="mt-4 text-[15px] font-semibold text-mist-100">
                  Ask anything
                </p>
                <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-mist-500">
                  A small model running entirely on this phone. No account, no
                  API key, no cloud.
                </p>
                <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-mist-600">
                  Running on your phone&apos;s CPU — slower than GPU, but works
                  on any phone, fully offline after download.
                </p>
                <div className="mt-6 grid w-full gap-2">
                  {[
                    "Explain quantum computing simply",
                    "Write a polite follow-up email",
                    "Give me a 3-day gym plan",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-xl border border-ink-600 bg-ink-900 px-4 py-3 text-left text-[13px] text-mist-300 transition hover:border-ink-600 hover:bg-ink-800 hover:text-mist-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={`${m.ts}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                      m.role === "user"
                        ? "text-mist-100"
                        : "border border-ink-600 bg-ink-900 text-mist-300"
                    }`}
                    style={
                      m.role === "user"
                        ? { background: "var(--accent-soft)", border: "1px solid rgba(255,87,87,0.25)" }
                        : undefined
                    }
                  >
                    {m.content ? (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    ) : (
                      <PulseDots small />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* input bar — lifts above the Android keyboard */}
      <div
        className="shrink-0 border-t border-ink-600 bg-ink-950/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur"
        style={
          kb > 0
            ? { transform: `translateY(${-kb}px)`, transition: "transform 0.22s ease-out" }
            : { transition: "transform 0.22s ease-out" }
        }
      >
        <div className="mx-auto flex w-full max-w-2xl items-end gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send(input);
            }}
            placeholder={
              phase === "ready" ? "Message Aegis AI…" : "Waiting for the model…"
            }
            disabled={phase !== "ready" || streaming}
            aria-label="Message Aegis AI"
            className="h-11 flex-1 rounded-xl border border-ink-600 bg-ink-800 px-4 text-[14px] text-mist-100 placeholder:text-mist-600 focus:border-ink-600 focus:outline-none disabled:opacity-50"
          />
          {streaming ? (
            <button
              onClick={() => stopGeneration()}
              aria-label="Stop generating"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-950 transition active:scale-95"
              style={{ background: "var(--brand-gradient)" }}
            >
              <Square size={16} className="fill-current" aria-hidden />
            </button>
          ) : (
            <button
              onClick={() => send(input)}
              disabled={phase !== "ready" || !input.trim()}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-950 transition active:scale-95 disabled:opacity-30"
              style={{ background: "var(--brand-gradient)" }}
            >
              <ArrowUp size={18} aria-hidden />
            </button>
          )}
        </div>
        <p className="mx-auto mt-2 flex w-full max-w-2xl items-center justify-center gap-1.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-mist-600">
          <ShieldCheck size={11} aria-hidden />
          On-device. Your words never leave this phone.
        </p>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12">
      {children}
    </div>
  );
}

function PulseDots({ small = false }: { small?: boolean }) {
  return (
    <span className="flex items-center gap-1" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={`rounded-full bg-mist-500 ${small ? "h-1.5 w-1.5" : "h-2 w-2"}`}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

/** Re-exported for the page-key registry. */
export const AI_PAGE_KEY = "ai";
export { AI_MODEL_LABEL };
