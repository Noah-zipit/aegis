"use client";

import { useEffect, useState } from "react";

/**
 * Returns the on-screen keyboard height in CSS px (0 when closed).
 *
 * Uses window.visualViewport resize events. Only reports while the user is
 * actively typing in a text field, and ignores small resizes (collapsing
 * URL bar, etc.) below the 120px threshold.
 *
 * Note: with `interactive-widget=resizes-content` in the viewport meta, the
 * layout viewport already shrinks when the keyboard opens, so this diff is
 * ~0 and any JS lift applied from it is a harmless no-op. On browsers that
 * ignore the meta tag, this is the fallback that lifts the toolbar above
 * the keyboard. The two layers never double-apply.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const isTyping = () => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
    };

    const update = () => {
      if (!isTyping()) {
        setHeight(0);
        return;
      }
      const diff = window.innerHeight - vv.height;
      setHeight(diff > 120 ? Math.round(diff) : 0);
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
    };
  }, []);

  return height;
}
