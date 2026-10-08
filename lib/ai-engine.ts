"use client";

import type {
  MLCEngineInterface,
  InitProgressReport,
} from "@mlc-ai/web-llm";

/* ------------------------------------------------------------------ */
/*  On-device AI engine (WebLLM). Lazy singleton: the @mlc-ai/web-llm   */
/*  bundle is dynamic-imported only on first AI open, so initial page  */
/*  load is unaffected. The model downloads once (~300MB), caches in   */
/*  the browser's Cache Storage, and then runs fully offline on        */
/*  WebGPU. No API keys, no server, nothing leaves the device.         */
/* ------------------------------------------------------------------ */

export const AI_MODEL_ID = "SmolLM2-360M-Instruct-q4f16_1";
/** Approximate one-time download size, shown honestly in the UI. */
export const AI_MODEL_SIZE_MB = 300;

export const AI_SYSTEM_PROMPT =
  "You are Aegis AI, a helpful on-device assistant inside the Aegis browser. " +
  "Keep answers short, plain, and useful. No markdown headings — simple formatting only.";

let enginePromise: Promise<MLCEngineInterface> | null = null;
let engineReady = false;

export function hasWebGPU(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

/** True once the model has fully downloaded and the engine is warm. */
export function isEngineReady(): boolean {
  return engineReady;
}

export function getEngine(
  onProgress: (report: InitProgressReport) => void
): Promise<MLCEngineInterface> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
      const engine = await CreateMLCEngine(AI_MODEL_ID, {
        initProgressCallback: onProgress,
        logLevel: "SILENT",
      });
      engineReady = true;
      return engine;
    })().catch((err: unknown) => {
      // Allow a later retry instead of caching the failure forever.
      enginePromise = null;
      throw err;
    });
  } else {
    // Re-attach this caller's progress listener (engine may already be warm).
    enginePromise.then(
      (e) => e.setInitProgressCallback(onProgress),
      () => {}
    );
  }
  return enginePromise;
}

export async function stopGeneration(
  engine: MLCEngineInterface | null
): Promise<void> {
  if (!engine) return;
  try {
    await engine.interruptGenerate();
  } catch {
    /* already finished — nothing to stop */
  }
}

export type { MLCEngineInterface, InitProgressReport };
