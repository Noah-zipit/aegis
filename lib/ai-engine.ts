"use client";

import type { Wllama, WllamaChatMessage } from "@wllama/wllama/esm/index.js";

/* ------------------------------------------------------------------ */
/*  On-device AI engine (wllama — llama.cpp compiled to WASM, CPU).     */
/*  Lazy singleton: @wllama/wllama is dynamic-imported only on first    */
/*  AI open, so initial page load is unaffected. The SmolLM2-360M      */
/*  GGUF downloads once (~218MB), caches in the browser's Cache        */
/*  Storage, then runs fully offline on the phone's CPU. No WebGPU,    */
/*  no API keys, no server — nothing leaves the device.                */
/* ------------------------------------------------------------------ */

/**
 * Verified 2026-10-08 via HTTP HEAD: 229,118,592 bytes.
 * GGUF carries the native ChatML chat template (tokenizer.chat_template).
 */
export const AI_MODEL_URL =
  "https://huggingface.co/QuantFactory/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct.Q4_0.gguf";
export const AI_MODEL_SIZE_MB = 218;
export const AI_MODEL_LABEL = "SmolLM2 360M · CPU";
/** Single-thread WASM runtime, served from our own public/ dir. */
export const AI_WASM_URL = "/wllama/wllama.wasm";

export const AI_SYSTEM_PROMPT =
  "You are Aegis AI, a helpful on-device assistant inside the Aegis browser. " +
  "Keep answers short, plain, and useful. No markdown headings — simple formatting only.";

let enginePromise: Promise<Wllama> | null = null;
let engineReady = false;

/**
 * WebAssembly is universal — this is the only capability gate.
 * No WebGPU required.
 */
export function hasWebAssembly(): boolean {
  return typeof WebAssembly !== "undefined";
}

/** True once the model has fully downloaded and the engine is warm. */
export function isEngineReady(): boolean {
  return engineReady;
}

export function getEngine(
  onProgress: (fraction: number) => void
): Promise<Wllama> {
  if (!enginePromise) {
    enginePromise = (async () => {
      // NOTE: deep import — the package's root "main" entry is missing
      // from the published tarball; esm/index.js is the real entry.
      const { Wllama } = await import("@wllama/wllama/esm/index.js");
      const wllama = new Wllama(
        { default: AI_WASM_URL },
        { suppressNativeLog: true, allowOffline: true }
      );
      await wllama.loadModelFromUrl(AI_MODEL_URL, {
        // Single-thread: the site ships no COOP/COEP headers,
        // so SharedArrayBuffer (multi-thread) is unavailable.
        n_threads: 1,
        n_ctx: 2048,
        useCache: true,
        progressCallback: ({ loaded, total }) =>
          onProgress(total > 0 ? loaded / total : 0),
      });
      engineReady = true;
      return wllama;
    })().catch((err: unknown) => {
      // Allow a later retry instead of caching the failure forever.
      enginePromise = null;
      throw err;
    });
  }
  return enginePromise;
}

/* ---------------- generation with abort ---------------- */

let currentAbort: AbortController | null = null;

/** Begins a generation, aborting any in-flight one. Returns its signal. */
export function beginGeneration(): AbortSignal {
  currentAbort?.abort();
  currentAbort = new AbortController();
  return currentAbort.signal;
}

/** Stops the in-flight generation, if any. */
export function stopGeneration(): void {
  currentAbort?.abort();
  currentAbort = null;
}

/**
 * Streaming chat completion. Calls onSnapshot with the full text so far
 * on every token. Resolves with the final text.
 * Throws WllamaAbortError when stopped via stopGeneration().
 */
export async function chatCompletion(
  wllama: Wllama,
  messages: WllamaChatMessage[],
  onSnapshot: (fullText: string) => void,
  signal: AbortSignal
): Promise<string> {
  let full = "";
  await wllama.createChatCompletion({
    messages,
    max_tokens: 512,
    temperature: 0.7,
    abortSignal: signal,
    stream: true,
    onData: (chunk) => {
      const t = chunk.choices[0]?.delta?.content ?? "";
      if (t) {
        full += t;
        onSnapshot(full);
      }
    },
  });
  return full;
}

export type { Wllama, WllamaChatMessage };
